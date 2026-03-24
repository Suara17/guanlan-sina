from fastapi.testclient import TestClient

from app.api.deps import get_knowledge_qa_service
from app.main import app
from app.services.knowledge_qa_models import (
    QACitation,
    QADebugInfo,
    QARequest,
    QAResponse,
    QARouteDecision,
    QAStructuredAnswer,
)
from app.services.knowledge_qa_service import KnowledgeQAService
from app.services.qa_answer_service import QAAnswerService
from app.services.qa_fusion_service import QAFusionService
from app.services.qa_router import RouteDecision
from app.services.retrievers.base import RetrievalResult


def _assert_no_metadata_headers(answer: str) -> None:
    lines = [line.strip() for line in answer.splitlines()]
    assert "问题：" not in lines
    assert "请求路由：" not in lines
    assert "实际执行：" not in lines


class StubKnowledgeQAService:
    def ask(self, request: QARequest) -> QAResponse:
        return QAResponse(
            answer=(
                f"问题：{request.question}\n\n"
                "结论：\n- 建议先执行 setup check。\n\n"
                "使用来源：\n- D1\n\n"
                "缺失信息：\n- 缺少当前设备报警码。\n\n"
                "置信度：\n- 0.76"
            ),
            route=QARouteDecision(mode="graph", reasons=["test override"]),
            citations=[],
            warnings=[],
            graph_hits=[{"sequence": request.sequence}],
            document_hits=[],
            debug=QADebugInfo(
                requested_route="graph",
                executed_modes=["graph"],
                graph_hit_count=1,
                document_hit_count=0,
                warnings_count=0,
                timing_ms={"total": 1.2},
            ),
        )


class StubQARouter:
    def route(self, *args, **kwargs) -> RouteDecision:
        _ = args, kwargs
        return RouteDecision(mode="hybrid", reasons=["test override"])


class StubRetriever:
    def __init__(self, *, name: str, source_type: str) -> None:
        self.name = name
        self._source_type = source_type

    @property
    def is_available(self) -> bool:
        return True

    def retrieve(self, request: QARequest) -> RetrievalResult:
        sequence = request.sequence or 3
        return RetrievalResult(
            hits=[{"sequence": sequence, "rank_score": 0.9, "retriever": self.name}],
            citations=[
                QACitation(
                    source_type=self._source_type,
                    title=f"{self.name} source",
                    snippet="stub snippet",
                    score=0.9,
                    metadata={"retriever": self.name, "sequence": sequence},
                )
            ],
        )


class StubLangChainRAGService:
    def generate_grounded_answer(self, **kwargs):
        _ = kwargs
        return QAStructuredAnswer(
            conclusion=["建议先执行 setup check。"],
            evidence=["[D1] 用户手册要求核对钢网与轨道参数。"],
            suggestions=["复核 conveyor calibration。"],
            risks=["当前没有图谱事实交叉验证。"],
            confidence=0.76,
            used_sources=["D1", "G1"],
            missing_information=["缺少当前设备报警码。"],
        )


def test_ask_knowledge_qa_returns_contract():
    app.dependency_overrides[get_knowledge_qa_service] = StubKnowledgeQAService
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/knowledge-qa/ask",
                json={
                    "question": "SMT产线异常3的原因是什么？",
                    "line_type": "SMT",
                    "sequence": 3,
                    "top_k": 5,
                },
            )
    finally:
        app.dependency_overrides.pop(get_knowledge_qa_service, None)

    assert response.status_code == 200
    payload = response.json()
    assert payload["route"]["mode"] == "graph"
    assert "使用来源：" in payload["answer"]
    assert "缺失信息：" in payload["answer"]
    assert "置信度：" in payload["answer"]
    assert payload["graph_hits"] == [{"sequence": 3}]
    assert payload["debug"]["executed_modes"] == ["graph"]


def test_ask_knowledge_qa_formats_structured_answer_from_real_service_chain():
    service = KnowledgeQAService(
        qa_router=StubQARouter(),
        answer_service=QAAnswerService(langchain_rag_service=StubLangChainRAGService()),
        fusion_service=QAFusionService(),
        graph_retriever=StubRetriever(name="graph", source_type="graph"),
        keyword_retriever=StubRetriever(name="keyword", source_type="document"),
        vector_retriever=StubRetriever(name="vector", source_type="document"),
    )
    app.dependency_overrides[get_knowledge_qa_service] = lambda: service
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/knowledge-qa/ask",
                json={
                    "question": "SMT产线异常3的原因是什么？",
                    "line_type": "SMT",
                    "sequence": 3,
                    "top_k": 5,
                },
            )
    finally:
        app.dependency_overrides.pop(get_knowledge_qa_service, None)

    assert response.status_code == 200
    payload = response.json()
    assert payload["route"]["mode"] == "hybrid"
    assert "使用来源：" in payload["answer"]
    assert "缺失信息：" not in payload["answer"]
    assert "置信度：" in payload["answer"]
    assert "- 0.76" in payload["answer"]
    _assert_no_metadata_headers(payload["answer"])
    assert payload["debug"]["executed_modes"] == ["graph", "keyword", "vector"]


def test_answer_service_hides_timeout_and_empty_retrieval_warnings_in_answer():
    answer = QAAnswerService().build_answer(
        question="贴装精度下降怎么处理？",
        route=QARouteDecision(mode="hybrid", reasons=[]),
        executed_modes=["graph", "keyword", "vector"],
        graph_citations=[],
        document_citations=[],
        citation_groups=None,
        warnings=[
            "图谱检索超时，已跳过该来源。",
            "向量检索未命中相关语义片段。",
            "模型判断仅能覆盖常见场景，请结合现场点检确认。",
        ],
        document_retriever=None,
    )

    assert "图谱检索超时" not in answer
    assert "未命中相关语义片段" not in answer
    assert "已检索到3条相关信息" in answer
    assert "模型判断仅能覆盖常见场景" in answer
    _assert_no_metadata_headers(answer)


def test_ask_knowledge_qa_validates_payload():
    app.dependency_overrides[get_knowledge_qa_service] = StubKnowledgeQAService
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/knowledge-qa/ask",
                json={"question": "", "top_k": 20},
            )
    finally:
        app.dependency_overrides.pop(get_knowledge_qa_service, None)

    assert response.status_code == 422
