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
            logger.warning("OpenAI-compatible response did not contain valid JSON")
            return None
        return self._normalize_structured_answer(parsed_payload)

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
        return None

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
                        normalized_payload[key] = [value]
                return QAStructuredAnswer.model_validate(normalized_payload)
            except Exception:
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
