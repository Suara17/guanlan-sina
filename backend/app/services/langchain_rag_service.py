import logging
from collections.abc import Sequence
from numbers import Real
from typing import Any

from app.services.knowledge_qa_models import (
    QACitation,
    QARouteDecision,
    QAStructuredAnswer,
)
from app.services.langchain_service import LangChainService

logger = logging.getLogger(__name__)


class LangChainRAGService:
    def __init__(self, langchain_service: LangChainService) -> None:
        self.langchain_service = langchain_service

    @classmethod
    def from_settings(cls) -> "LangChainRAGService | None":
        langchain_service = LangChainService.from_settings()
        if langchain_service is None:
            return None
        return cls(langchain_service)

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
        document_retriever: Any | None = None,
    ) -> QAStructuredAnswer | None:
        if document_retriever is not None and route.mode in {"document", "hybrid"}:
            rag_answer = self.generate_document_rag_answer(
                question=question,
                route=route,
                executed_modes=executed_modes,
                warnings=warnings,
                retriever=document_retriever,
            )
            if rag_answer is not None and self.langchain_service._has_structured_content(rag_answer):
                return rag_answer

        graph_context = self.langchain_service._format_citation_context(
            graph_citations[:5], group_name="graph"
        )
        document_context = self.langchain_service._format_citation_context(
            document_citations[:5], group_name="document"
        )
        grouped_context = self.langchain_service._format_grouped_context(citation_groups)
        warning_context = "\n".join(f"- {warning}" for warning in warnings)
        try:
            return self.langchain_service.generate_structured_answer(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "你是工业知识问答助手。只能基于提供的图谱事实和检索片段作答，不允许编造。"
                            "如果文档检索为空，要明确说明当前没有可引用的 SOP/手册内容。"
                            "你必须输出 JSON 对象，字段只有 conclusion、evidence、suggestions、risks、"
                            "confidence、used_sources、missing_information。"
                            "evidence 中的每个要点都必须带来源标签，例如 [G1]、[K1]、[V1]。"
                            "若某条结论没有来源支撑，就不要写。"
                            "confidence 取 0 到 1 之间的小数。used_sources 只写实际使用过的来源标签。"
                            "missing_information 只写当前回答仍缺什么信息。"
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"问题：{question}\n"
                            f"请求路由：{route.mode}\n"
                            f"实际执行：{', '.join(executed_modes) if executed_modes else 'none'}\n\n"
                            f"图谱事实：\n{graph_context or '无'}\n\n"
                            f"文本片段：\n{document_context or '无'}\n\n"
                            f"分组上下文：\n{grouped_context or '无'}\n\n"
                            f"注意事项：\n{warning_context or '无'}\n"
                        ),
                    },
                ]
            )
        except Exception:
            logger.exception("LangChain grounded answer generation failed")
            return None

    def generate_document_rag_answer(
        self,
        *,
        question: str,
        route: QARouteDecision,
        executed_modes: Sequence[str],
        warnings: Sequence[str],
        retriever: Any,
    ) -> QAStructuredAnswer | None:
        if retriever is None:
            return None

        try:
            filtered_retriever = self._build_filtered_retriever(
                retriever,
                max_documents=3 if route.mode == "hybrid" else 5,
            )
            documents = filtered_retriever.invoke(question)
            document_context = self._format_document_context(documents)
            return self.langchain_service.generate_structured_answer(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "你是工业文档问答助手，只能基于检索到的文档片段作答，不允许编造。"
                            "你必须输出 JSON 对象，字段只有 conclusion、evidence、suggestions、risks、"
                            "confidence、used_sources、missing_information。"
                            "evidence 中的每个要点都必须带来源标签，例如 [D1]。"
                            "confidence 取 0 到 1 之间的小数。used_sources 只写实际使用过的来源标签。"
                            "missing_information 只写当前回答仍缺什么信息。"
                            "如果检索文档不足以支撑回答，就在 risks 中明确说明。"
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"问题：{question}\n"
                            f"请求路由：{route.mode}\n"
                            f"实际执行：{', '.join(executed_modes) if executed_modes else 'none'}\n"
                            f"注意事项：\n{chr(10).join(f'- {warning}' for warning in warnings) or '无'}\n\n"
                            f"文档上下文：\n{document_context or '无'}"
                        ),
                    },
                ]
            )
        except Exception:
            logger.exception("LangChain document RAG generation failed")
            return None

    @staticmethod
    def _build_filtered_retriever(retriever: Any, *, max_documents: int) -> Any:
        return _FilteredRetriever(retriever=retriever, max_documents=max(max_documents, 1))

    @staticmethod
    def _filter_documents(documents: Any, *, max_documents: int) -> list[Any]:
        if not isinstance(documents, list):
            return []

        unique_documents: list[Any] = []
        seen_keys: set[str] = set()
        scored_documents: list[tuple[float, int, str, Any]] = []
        unscored_documents: list[tuple[int, str, Any]] = []
        for index, document in enumerate(documents):
            metadata = getattr(document, "metadata", {}) or {}
            key = _document_key(document, metadata)
            if not key:
                continue
            score = metadata.get("similarity_score")
            if isinstance(score, Real):
                scored_documents.append((float(score), index, key, document))
            else:
                unscored_documents.append((index, key, document))

        scored_documents.sort(key=lambda item: (-item[0], item[1]))
        unscored_documents.sort(key=lambda item: item[0])

        for _, _, key, document in scored_documents:
            if key in seen_keys:
                continue
            seen_keys.add(key)
            unique_documents.append(document)
            if len(unique_documents) >= max_documents:
                return unique_documents

        for _, key, document in unscored_documents:
            if key in seen_keys:
                continue
            seen_keys.add(key)
            unique_documents.append(document)
            if len(unique_documents) >= max_documents:
                return unique_documents

        return unique_documents[:max_documents]

    @staticmethod
    def _format_document_context(documents: list[Any]) -> str:
        lines: list[str] = []
        for index, document in enumerate(documents, start=1):
            metadata = getattr(document, "metadata", {}) or {}
            title = metadata.get("title") or metadata.get("document_id") or f"文档片段 {index}"
            page = metadata.get("page")
            page_text = f" page={page}" if page else ""
            snippet = " ".join(str(getattr(document, "page_content", "")).split())
            if len(snippet) > 240:
                snippet = f"{snippet[:237]}..."
            lines.append(f"- [D{index}] {title}{page_text}: {snippet}")
        return "\n".join(lines)


class _FilteredRetriever:
    def __init__(self, *, retriever: Any, max_documents: int) -> None:
        self.retriever = retriever
        self.max_documents = max_documents

    def invoke(self, query: Any) -> list[Any]:
        query_text = str(query or "")
        if not query_text:
            return []

        documents = self._retrieve_documents(query_text)
        return LangChainRAGService._filter_documents(
            documents,
            max_documents=self.max_documents,
        )

    def _retrieve_documents(self, query_text: str) -> list[Any]:
        retriever = self.retriever
        documents: Any = None
        if hasattr(retriever, "invoke"):
            try:
                documents = retriever.invoke(query_text)
            except TypeError:
                try:
                    documents = retriever.invoke({"input": query_text})
                except Exception:
                    documents = None
            except Exception:
                documents = None
        if documents is None and hasattr(retriever, "get_relevant_documents"):
            try:
                documents = retriever.get_relevant_documents(query_text)
            except Exception:
                documents = None
        return documents if isinstance(documents, list) else []


def _document_key(document: Any, metadata: dict[str, Any]) -> str:
    return str(
        metadata.get("chunk_id")
        or metadata.get("document_id")
        or getattr(document, "page_content", "")
    ).strip()
