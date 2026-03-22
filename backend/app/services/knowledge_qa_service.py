import logging
from time import perf_counter
from typing import Any

from app.core.config import settings
from app.services.knowledge_qa_models import (
    QACitation,
    QADebugInfo,
    QARequest,
    QAResponse,
    QARouteDecision,
)
from app.services.qa_answer_service import QAAnswerService
from app.services.qa_fusion_service import QAFusionService
from app.services.qa_router import QARouter
from app.services.retrievers import GraphRetriever, KeywordRetriever, VectorRetriever

logger = logging.getLogger(__name__)


class KnowledgeQAService:
    def __init__(
        self,
        *,
        qa_router: QARouter,
        answer_service: QAAnswerService,
        fusion_service: QAFusionService | None = None,
        graph_retriever: GraphRetriever | None = None,
        keyword_retriever: KeywordRetriever | None = None,
        vector_retriever: VectorRetriever | None = None,
    ) -> None:
        self.qa_router = qa_router
        self.answer_service = answer_service
        self.fusion_service = fusion_service or QAFusionService()
        self.graph_retriever = graph_retriever or GraphRetriever()
        self.keyword_retriever = keyword_retriever or KeywordRetriever()
        self.vector_retriever = vector_retriever or VectorRetriever()

    def ask(self, request: QARequest) -> QAResponse:
        total_start = perf_counter()
        route = self.qa_router.route(
            request.question,
            line_type=request.line_type,
            sequence=request.sequence,
        )
        route_decision = QARouteDecision(mode=route.mode, reasons=route.reasons)
        executed_modes = self._determine_execution_modes(route.mode)
        warnings: list[str] = []
        graph_hits: list[dict[str, Any]] = []
        document_hits: list[dict[str, Any]] = []
        graph_citations: list[QACitation] = []
        document_citations: list[QACitation] = []
        timing_ms: dict[str, float] = {}

        logger.info(
            "knowledge_qa ask requested_route=%s executed_modes=%s question=%s",
            route.mode,
            executed_modes,
            request.question[:80],
        )

        if "graph" in executed_modes:
            if not self.graph_retriever.is_available:
                warnings.append("图谱检索未启用，已跳过结构化检索。")
            else:
                graph_start = perf_counter()
                try:
                    graph_result = self.graph_retriever.retrieve(request)
                    graph_hits = graph_result.hits
                    graph_citations = graph_result.citations
                    if not graph_citations:
                        warnings.append("图谱检索未命中相关事实。")
                except Exception:
                    logger.exception("knowledge_qa graph retrieval failed")
                    warnings.append("图谱检索失败，已降级为其他可用来源。")
                finally:
                    timing_ms["graph_retrieval"] = self._elapsed_ms(graph_start)

        if "keyword" in executed_modes:
            keyword_start = perf_counter()
            try:
                keyword_result = self.keyword_retriever.retrieve(request)
                document_hits.extend(keyword_result.hits)
                document_citations.extend(keyword_result.citations)
                if not keyword_result.citations:
                    warnings.append("关键词检索未命中相关文本事实。")
            except Exception:
                logger.exception("knowledge_qa keyword retrieval failed")
                warnings.append("关键词检索失败，当前仅返回其他可用来源。")
            finally:
                timing_ms["keyword_retrieval"] = self._elapsed_ms(keyword_start)

        if "vector" in executed_modes:
            vector_start = perf_counter()
            try:
                vector_result = self.vector_retriever.retrieve(request)
                document_hits.extend(vector_result.hits)
                document_citations.extend(vector_result.citations)
                if not vector_result.citations:
                    warnings.append("向量检索未命中相关语义片段。")
            except Exception:
                logger.exception("knowledge_qa vector retrieval failed")
                warnings.append("向量检索失败，当前仅返回其他可用来源。")
            finally:
                timing_ms["vector_retrieval"] = self._elapsed_ms(vector_start)

        if route.mode in {"document", "hybrid"} and "keyword" not in executed_modes and "vector" not in executed_modes:
            warnings.append("文本检索尚未接入，已自动退回知识图谱检索。")

        graph_hits = self.fusion_service.trim_hits(graph_hits, top_k=request.top_k)
        document_hits = self.fusion_service.trim_hits(
            document_hits,
            top_k=request.top_k,
            sort_field="rank_score",
        )
        citations = self.fusion_service.merge_citations(
            graph_citations=graph_citations,
            document_citations=document_citations,
        )
        citation_groups = self.fusion_service.build_citation_groups(citations=citations)
        answer_graph_citations = self.fusion_service.select_context_citations(
            citations=citations,
            source_type="graph",
        )
        answer_document_citations = self.fusion_service.select_context_citations(
            citations=citations,
            source_type="document",
        )
        answer = self.answer_service.build_answer(
            question=request.question,
            route=route_decision,
            executed_modes=executed_modes,
            graph_citations=answer_graph_citations,
            document_citations=answer_document_citations,
            citation_groups=citation_groups,
            warnings=warnings,
        )
        timing_ms["total"] = self._elapsed_ms(total_start)
        debug = None
        if settings.ENVIRONMENT == "local":
            debug = QADebugInfo(
                requested_route=route.mode,
                executed_modes=executed_modes,
                graph_hit_count=len(graph_hits),
                document_hit_count=len(document_hits),
                warnings_count=len(warnings),
                timing_ms=timing_ms,
            )

        logger.info(
            "knowledge_qa completed requested_route=%s executed_modes=%s graph_hits=%s document_hits=%s warnings=%s total_ms=%.2f",
            route.mode,
            executed_modes,
            len(graph_hits),
            len(document_hits),
            len(warnings),
            timing_ms["total"],
        )

        return QAResponse(
            answer=answer,
            route=route_decision,
            citations=citations,
            warnings=warnings,
            graph_hits=graph_hits,
            document_hits=document_hits,
            debug=debug,
        )

    def _determine_execution_modes(self, requested_mode: str) -> list[str]:
        graph_available = self.graph_retriever.is_available
        keyword_available = self.keyword_retriever.is_available
        vector_available = self.vector_retriever.is_available

        if requested_mode == "graph":
            return ["graph"] if graph_available else []
        if requested_mode == "document":
            modes: list[str] = []
            if keyword_available:
                modes.append("keyword")
            if vector_available:
                modes.append("vector")
            if modes:
                return modes
            return ["graph"] if graph_available else []
        if requested_mode == "hybrid":
            modes: list[str] = []
            if graph_available:
                modes.append("graph")
            if keyword_available:
                modes.append("keyword")
            if vector_available:
                modes.append("vector")
            return modes
        return []

    @staticmethod
    def _elapsed_ms(start: float) -> float:
        return round((perf_counter() - start) * 1000, 2)
