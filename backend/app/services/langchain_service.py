import json
import logging
import re
from collections.abc import Sequence
from typing import Any, Literal

import httpx

from app.core.config import settings
from app.services.knowledge_qa_models import QACitation, QAStructuredAnswer

logger = logging.getLogger(__name__)


class LangChainService:
    def __init__(
        self,
        *,
        provider: str,
        model: str,
        temperature: float,
        api_key: str,
        base_url: str | None = None,
    ) -> None:
        self.provider = provider
        self.model = model
        self.temperature = temperature
        self.api_key = api_key
        self.base_url = base_url

    @classmethod
    def from_settings(cls) -> "LangChainService | None":
        if not settings.LANGCHAIN_ENABLED or not settings.langchain_llm_configured:
            return None
        return cls(
            provider=settings.LLM_PROVIDER,
            model=settings.LLM_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
        )

    def generate_grounded_answer(self, **kwargs: Any) -> QAStructuredAnswer | None:
        from app.services.langchain_rag_service import LangChainRAGService

        return LangChainRAGService(self).generate_grounded_answer(**kwargs)

    def generate_document_rag_answer(self, **kwargs: Any) -> QAStructuredAnswer | None:
        from app.services.langchain_rag_service import LangChainRAGService

        return LangChainRAGService(self).generate_document_rag_answer(**kwargs)

    def generate_structured_answer(self, *, messages: list[dict[str, str]]) -> QAStructuredAnswer | None:
        if self.provider != "openai":
            logger.warning("Unsupported LLM provider for LangChain service: %s", self.provider)
            return None

        payload = self._build_payload(messages=messages, structured_output=True)

        try:
            timeout = httpx.Timeout(
                timeout=settings.LLM_REQUEST_TIMEOUT_SECONDS,
                connect=min(settings.LLM_REQUEST_TIMEOUT_SECONDS, 5.0),
            )
            with httpx.Client(timeout=timeout, trust_env=False) as client:
                response = self._post_chat_completion(client=client, payload=payload)
        except Exception:
            logger.exception("Failed to request OpenAI-compatible structured answer")
            return None

        try:
            content = response.json()["choices"][0]["message"]["content"]
        except Exception:
            logger.exception("Failed to parse OpenAI-compatible response payload")
            return None

        parsed_payload = self._extract_json_payload(content)
        if parsed_payload is None:
            logger.warning(
                "OpenAI-compatible response did not contain valid JSON. model=%s preview=%s",
                self.model,
                self._preview_content(content),
            )
            return None
        return self._normalize_structured_answer(parsed_payload)

    def generate_text_answer(self, *, messages: list[dict[str, str]]) -> str | None:
        if self.provider != "openai":
            logger.warning("Unsupported LLM provider for LangChain service: %s", self.provider)
            return None

        payload = self._build_payload(messages=messages, structured_output=False)

        try:
            timeout = httpx.Timeout(
                timeout=settings.LLM_REQUEST_TIMEOUT_SECONDS,
                connect=min(settings.LLM_REQUEST_TIMEOUT_SECONDS, 5.0),
            )
            with httpx.Client(timeout=timeout, trust_env=False) as client:
                response = self._post_chat_completion(client=client, payload=payload)
        except Exception:
            logger.exception("Failed to request OpenAI-compatible text answer")
            return None

        try:
            content = response.json()["choices"][0]["message"]["content"]
        except Exception:
            logger.exception("Failed to parse OpenAI-compatible text response payload")
            return None

        return self._extract_text_payload(content)

    def _build_payload(
        self,
        *,
        messages: list[dict[str, str]],
        structured_output: bool,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
        }
        if structured_output:
            payload["response_format"] = {"type": "json_object"}
        if self.model.startswith("gpt-5"):
            payload.pop("temperature", None)
        return payload

    def _post_chat_completion(
        self,
        *,
        client: httpx.Client,
        payload: dict[str, Any],
    ) -> httpx.Response:
        try:
            response = client.post(
                self._chat_completions_url(),
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            return response
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code != 400 or "response_format" not in payload:
                logger.warning(
                    "Upstream chat completion failed. status=%s model=%s body=%s",
                    exc.response.status_code,
                    self.model,
                    self._preview_content(exc.response.text),
                )
                raise
            logger.warning(
                "Structured output was rejected by upstream model; retrying without response_format"
            )
            fallback_payload = self._build_payload(
                messages=payload["messages"],
                structured_output=False,
            )
            response = client.post(
                self._chat_completions_url(),
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=fallback_payload,
            )
            response.raise_for_status()
            return response

    def _chat_completions_url(self) -> str:
        base_url = (self.base_url or "").rstrip("/")
        if not base_url:
            raise ValueError("LLM base URL is not configured")
        return f"{base_url}/chat/completions"

    @staticmethod
    def _extract_json_payload(content: Any) -> dict[str, Any] | None:
        if isinstance(content, list):
            content = "".join(
                str(item.get("text") or "")
                for item in content
                if isinstance(item, dict)
            )
        if not isinstance(content, str):
            return None

        normalized = content.strip()
        try:
            parsed = json.loads(normalized)
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            pass

        fenced_match = re.search(r"```json\s*(\{.*?\})\s*```", normalized, re.DOTALL)
        if fenced_match:
            try:
                parsed = json.loads(fenced_match.group(1))
                return parsed if isinstance(parsed, dict) else None
            except json.JSONDecodeError:
                return None

        generic_fenced_match = re.search(r"```\s*(\{.*?\})\s*```", normalized, re.DOTALL)
        if generic_fenced_match:
            try:
                parsed = json.loads(generic_fenced_match.group(1))
                return parsed if isinstance(parsed, dict) else None
            except json.JSONDecodeError:
                return None

        decoder = json.JSONDecoder()
        for match in re.finditer(r"\{", normalized):
            try:
                parsed, end_index = decoder.raw_decode(normalized[match.start() :])
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                trailing = normalized[match.start() + end_index :].strip()
                if not trailing or trailing.startswith("```"):
                    return parsed
        return None

    @staticmethod
    def _extract_text_payload(content: Any) -> str | None:
        if isinstance(content, list):
            content = "".join(
                str(item.get("text") or "")
                for item in content
                if isinstance(item, dict)
            )
        if not isinstance(content, str):
            return None
        normalized = content.strip()
        return normalized or None

    @staticmethod
    def _preview_content(content: Any, *, limit: int = 240) -> str:
        text = str(content or "").strip().replace("\r", " ").replace("\n", " ")
        if len(text) <= limit:
            return text
        return f"{text[: limit - 3]}..."

    @staticmethod
    def _normalize_structured_answer(payload: Any) -> QAStructuredAnswer | None:
        if payload is None:
            return None
        if isinstance(payload, QAStructuredAnswer):
            return payload
        if isinstance(payload, dict):
            try:
                normalized_payload = dict(payload)
                for key in (
                    "conclusion",
                    "evidence",
                    "suggestions",
                    "risks",
                    "used_sources",
                    "missing_information",
                ):
                    value = normalized_payload.get(key)
                    if isinstance(value, str):
                        stripped_value = value.strip()
                        normalized_payload[key] = [] if stripped_value in {"", "无", "暂无", "none", "null"} else [stripped_value]
                normalized_payload["confidence"] = LangChainService._normalize_confidence_value(
                    normalized_payload.get("confidence")
                )
                return QAStructuredAnswer.model_validate(normalized_payload)
            except Exception:
                return None
        return None

    @staticmethod
    def _normalize_confidence_value(value: Any) -> float | None:
        if value is None:
            return None
        if isinstance(value, bool):
            return 1.0 if value else 0.0
        if isinstance(value, (int, float)):
            return max(0.0, min(float(value), 1.0))
        if isinstance(value, str):
            normalized = value.strip().lower()
            if not normalized or normalized in {"无", "暂无", "none", "null"}:
                return None
            confidence_aliases = {
                "高": 0.8,
                "较高": 0.75,
                "中高": 0.7,
                "中": 0.6,
                "一般": 0.5,
                "中低": 0.45,
                "较低": 0.35,
                "低": 0.25,
            }
            if normalized in confidence_aliases:
                return confidence_aliases[normalized]
            percentage_match = re.fullmatch(r"(\d+(?:\.\d+)?)\s*%", normalized)
            if percentage_match:
                return max(0.0, min(float(percentage_match.group(1)) / 100.0, 1.0))
            try:
                return max(0.0, min(float(normalized), 1.0))
            except ValueError:
                return None
        return None

    @staticmethod
    def _has_structured_content(answer: QAStructuredAnswer) -> bool:
        return any(
            (
                answer.conclusion,
                answer.evidence,
                answer.suggestions,
                answer.risks,
                answer.used_sources,
                answer.missing_information,
                answer.confidence is not None,
            )
        )

    @staticmethod
    def _format_citation_context(
        citations: Sequence[QACitation],
        *,
        group_name: Literal["graph", "document", "keyword", "vector"],
    ) -> str:
        lines: list[str] = []
        for index, citation in enumerate(citations, start=1):
            metadata = citation.metadata or {}
            extras: list[str] = []
            if metadata.get("sequence") is not None:
                extras.append(f"sequence={metadata['sequence']}")
            if metadata.get("line_type"):
                extras.append(f"line_type={metadata['line_type']}")
            if metadata.get("matched_terms"):
                extras.append(
                    "matched_terms=" + ",".join(str(term) for term in metadata["matched_terms"][:4])
                )
            if citation.score is not None:
                extras.append(f"score={citation.score}")

            source_label = LangChainService._source_label(
                citation, index=index, fallback_group=group_name
            )
            extra_text = f" ({'; '.join(extras)})" if extras else ""
            lines.append(
                f"- [{source_label}] {citation.title}{extra_text}: {citation.snippet}"
            )

        return "\n".join(lines)

    @classmethod
    def _format_grouped_context(
        cls, citation_groups: dict[str, Sequence[QACitation]] | None
    ) -> str:
        if not citation_groups:
            return ""

        section_titles = {
            "graph": "图谱事实",
            "keyword": "关键词补充",
            "vector": "向量召回",
            "document": "其他文本",
        }
        sections: list[str] = []
        for group_name in ("graph", "keyword", "vector", "document"):
            citations = citation_groups.get(group_name, [])
            if not citations:
                continue
            sections.append(
                f"[{section_titles[group_name]}]\n"
                f"{cls._format_citation_context(citations, group_name=group_name)}"
            )
        return "\n\n".join(sections)

    @staticmethod
    def _source_label(
        citation: QACitation,
        *,
        index: int,
        fallback_group: Literal["graph", "document", "keyword", "vector"],
    ) -> str:
        metadata = citation.metadata or {}
        retriever = str(metadata.get("retriever") or fallback_group)
        prefix_map = {
            "graph": "G",
            "keyword": "K",
            "vector": "V",
            "document": "D",
        }
        prefix = prefix_map.get(retriever, "D")
        return f"{prefix}{index}"
