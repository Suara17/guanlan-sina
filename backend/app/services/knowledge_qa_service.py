import logging
from concurrent.futures import ThreadPoolExecutor, wait
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
from app.services.retrievers import (
    BaseRetriever,
    GraphRetriever,
    KeywordRetriever,
    RetrievalResult,
    VectorRetriever,
)

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
            selected_node_label=request.selected_node_label,
            selected_node_description=request.selected_node_description,
            selected_node_type=request.selected_node_type,
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

        retriever_results = self._run_retrievers(executed_modes, request)
        timing_ms.update(retriever_results["timing_ms"])
        warnings.extend(retriever_results["warnings"])

        if route.mode in {"document", "hybrid"}:
            if "keyword" not in executed_modes and not self.keyword_retriever.is_available:
                warnings.append("关键词检索未启用，已跳过文本匹配检索。")
            if "vector" not in executed_modes and not self.vector_retriever.is_available:
                warnings.append("向量检索未启用，已跳过语义召回。")

        graph_result = retriever_results["results"].get("graph", RetrievalResult())
        graph_hits = graph_result.hits
        graph_citations = graph_result.citations

        keyword_result = retriever_results["results"].get("keyword", RetrievalResult())
        vector_result = retriever_results["results"].get("vector", RetrievalResult())
        document_hits.extend(keyword_result.hits)
        document_hits.extend(vector_result.hits)
        document_citations.extend(keyword_result.citations)
        document_citations.extend(vector_result.citations)

        if (
            route.mode in {"document", "hybrid"}
            and "keyword" not in executed_modes
            and "vector" not in executed_modes
        ):
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
        document_retriever = None
        if route.mode in {"document", "hybrid"} and hasattr(
            self.vector_retriever, "get_langchain_retriever"
        ):
            document_retriever = self.vector_retriever.get_langchain_retriever(request)
        answer = self.answer_service.build_answer(
            question=request.question,
            route=route_decision,
            executed_modes=executed_modes,
            graph_citations=answer_graph_citations,
            document_citations=answer_document_citations,
            citation_groups=citation_groups,
            warnings=warnings,
            document_retriever=document_retriever,
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

    def _run_retrievers(
        self, executed_modes: list[str], request: QARequest
    ) -> dict[str, Any]:
        results: dict[str, RetrievalResult] = {}
        warnings: list[str] = []
        timing_ms: dict[str, float] = {}

        retriever_specs = self._build_retriever_specs(executed_modes)
        available_specs = [spec for spec in retriever_specs if spec["retriever"].is_available]

        for spec in retriever_specs:
            if not spec["retriever"].is_available:
                warnings.append(spec["unavailable_warning"])

        if not available_specs:
            return {"results": results, "warnings": warnings, "timing_ms": timing_ms}

        max_workers = min(
            max(settings.QA_RETRIEVER_MAX_WORKERS, 1),
            len(available_specs),
        )
        timeout_seconds = max(settings.QA_RETRIEVER_TIMEOUT_MS, 1) / 1000

        executor = ThreadPoolExecutor(max_workers=max_workers)
        try:
            future_map = {
                executor.submit(self._execute_retriever, spec["retriever"], request): spec
                for spec in available_specs
            }
            done, not_done = wait(future_map, timeout=timeout_seconds)

            for future in done:
                spec = future_map[future]
                name = spec["name"]
                try:
                    payload = future.result()
                except Exception:
                    logger.exception("knowledge_qa %s retrieval failed", name)
                    warnings.append(spec["failure_warning"])
                    continue

                timing_ms[f"{name}_retrieval"] = payload["elapsed_ms"]
                result = payload["result"]
                results[name] = result
                if not result.citations:
                    warnings.append(spec["empty_warning"])

            for future in not_done:
                spec = future_map[future]
                future.cancel()
                timing_ms[f"{spec['name']}_retrieval"] = round(
                    settings.QA_RETRIEVER_TIMEOUT_MS, 2
                )
                warnings.append(spec["timeout_warning"])
        finally:
            executor.shutdown(wait=False, cancel_futures=True)

        return {"results": results, "warnings": warnings, "timing_ms": timing_ms}

    def _build_retriever_specs(self, executed_modes: list[str]) -> list[dict[str, Any]]:
        retrievers: list[dict[str, Any]] = []
        if "graph" in executed_modes:
            retrievers.append(
                {
                    "name": "graph",
                    "retriever": self.graph_retriever,
                    "unavailable_warning": "图谱检索未启用，已跳过结构化检索。",
                    "empty_warning": "图谱检索未命中相关事实。",
                    "failure_warning": "图谱检索失败，已降级为其他可用来源。",
                    "timeout_warning": "图谱检索超时，已跳过该来源。",
                }
            )
        if "keyword" in executed_modes:
            retrievers.append(
                {
                    "name": "keyword",
                    "retriever": self.keyword_retriever,
                    "unavailable_warning": "关键词检索未启用，已跳过文本匹配检索。",
                    "empty_warning": "关键词检索未命中相关文本事实。",
                    "failure_warning": "关键词检索失败，当前仅返回其他可用来源。",
                    "timeout_warning": "关键词检索超时，已跳过该来源。",
                }
            )
        if "vector" in executed_modes:
            retrievers.append(
                {
                    "name": "vector",
                    "retriever": self.vector_retriever,
                    "unavailable_warning": "向量检索未启用，已跳过语义召回。",
                    "empty_warning": "向量检索未命中相关语义片段。",
                    "failure_warning": "向量检索失败，当前仅返回其他可用来源。",
                    "timeout_warning": "向量检索超时，已跳过该来源。",
                }
            )
        return retrievers

    @staticmethod
    def _execute_retriever(
        retriever: BaseRetriever, request: QARequest
    ) -> dict[str, Any]:
        started_at = perf_counter()
        result = retriever.retrieve(request)
        return {
            "result": result,
            "elapsed_ms": round((perf_counter() - started_at) * 1000, 2),
        }

    @staticmethod
    def _elapsed_ms(start: float) -> float:
        return round((perf_counter() - start) * 1000, 2)
