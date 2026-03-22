from fastapi.testclient import TestClient

from app.api.deps import get_knowledge_qa_service
from app.main import app
from app.services.knowledge_qa_models import (
    QADebugInfo,
    QARequest,
    QAResponse,
    QARouteDecision,
)


class StubKnowledgeQAService:
    def ask(self, request: QARequest) -> QAResponse:
        return QAResponse(
            answer=f"已收到问题：{request.question}",
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
    assert payload["answer"] == "已收到问题：SMT产线异常3的原因是什么？"
    assert payload["graph_hits"] == [{"sequence": 3}]
    assert payload["debug"]["executed_modes"] == ["graph"]


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
