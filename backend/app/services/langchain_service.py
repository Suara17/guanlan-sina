import logging
from collections.abc import Sequence
from typing import Literal

from app.core.config import settings
from app.services.knowledge_qa_models import QACitation, QARouteDecision

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
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
        )

    def generate_grounded_answer(
        self,
        *,
        question: str,
        route: QARouteDecision,
        executed_modes: Sequence[str],
        graph_citations: Sequence[QACitation],
        document_citations: Sequence[QACitation],
        citation_groups: dict[str, Sequence[QACitation]] | None,
        warnings: Sequence[str],
    ) -> str | None:
        try:
            from langchain_core.output_parsers import StrOutputParser
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_openai import ChatOpenAI
        except ImportError:
            logger.warning("LangChain packages are not installed, falling back to template answer")
            return None

        if self.provider != "openai":
            logger.warning("Unsupported LLM provider for LangChain service: %s", self.provider)
            return None

        graph_context = self._format_citation_context(graph_citations[:5], group_name="graph")
        document_context = self._format_citation_context(
            document_citations[:5], group_name="document"
        )
        grouped_context = self._format_grouped_context(citation_groups)
        warning_context = "\n".join(f"- {warning}" for warning in warnings)

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "你是工业知识问答助手。只能基于提供的图谱事实和检索片段作答，不允许编造。"
                    "如果文档检索为空，要明确说明当前没有可引用的 SOP/手册内容。"
                    "输出必须严格包含四段：`结论`、`依据`、`建议`、`风险/备注`。"
                    "`依据` 段中的每个要点都必须带来源标签，例如 `[G1]`、`[K1]`、`[V1]`。"
                    "若某条结论没有来源支撑，就不要写。"
                    "优先引用高分结果，先给结论，再给依据和建议。"
                    "输出简洁、可执行、面向工程人员。",
                ),
                (
                    "human",
                    "问题：{question}\n"
                    "请求路由：{route_mode}\n"
                    "实际执行：{executed_modes}\n\n"
                    "图谱事实：\n{graph_context}\n\n"
                    "文本片段：\n{document_context}\n\n"
                    "分组上下文：\n{grouped_context}\n\n"
                    "注意事项：\n{warning_context}\n",
                ),
            ]
        )
        llm = ChatOpenAI(
            model=self.model,
            temperature=self.temperature,
            api_key=self.api_key,
            base_url=self.base_url,
        )
        chain = prompt | llm | StrOutputParser()
        return chain.invoke(
            {
                "question": question,
                "route_mode": route.mode,
                "executed_modes": ", ".join(executed_modes) if executed_modes else "none",
                "graph_context": graph_context or "无",
                "document_context": document_context or "无",
                "grouped_context": grouped_context or "无",
                "warning_context": warning_context or "无",
            }
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
