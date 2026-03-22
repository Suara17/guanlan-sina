from app.services.knowledge_qa_models import QARequest
from app.services.knowledge_qa_service import KnowledgeQAService
from app.services.qa_answer_service import QAAnswerService
from app.services.qa_fusion_service import QAFusionService
from app.services.qa_router import QARouter
from app.services.retrievers import GraphRetriever, KeywordRetriever, VectorRetriever


class StubNeo4jService:
    def get_anomaly_analysis(self, sequence: int):
        return [
            {
                "a": {
                    "sequence": sequence,
                    "name": f"异常-{sequence}",
                    "phenomenon": "贴片偏移",
                    "severity": "HIGH",
                    "line_type": "SMT",
                },
                "c": {"description": "吸嘴磨损", "type": "直接原因", "confidence": 0.8},
                "s": {
                    "method": "更换吸嘴并重新校准",
                    "type": "长期解决办法",
                    "priority": 10,
                    "success_rate": 0.95,
                },
            }
        ]

    def find_similar_anomalies(self, phenomenon: str, limit: int = 10):
        return []

    def recommend_solutions(self, line_type: str, severity: str | None = None):
        return [
            {
                "s": {
                    "method": "检查吸嘴、校准贴装坐标",
                    "type": "长期解决办法",
                    "cost_level": "LOW",
                },
                "priority": 9,
                "success_rate": 0.88,
                "usage_count": 4,
            }
        ]

    def analyze_line_health(self, line_type: str):
        return {}

    def get_all_anomalies(self):
        return [
            {
                "sequence": 1,
                "name": "异常-1",
                "phenomenon": "上料错位",
                "severity": "HIGH",
                "line_type": "SMT",
            }
        ]


class StubLangChainService:
    def generate_grounded_answer(self, **kwargs):
        question = kwargs["question"]
        return f"LangChain grounded answer for: {question}"


def test_knowledge_qa_service_returns_hybrid_response():
    service = KnowledgeQAService(
        qa_router=QARouter(),
        answer_service=QAAnswerService(langchain_service=StubLangChainService()),
        fusion_service=QAFusionService(),
        graph_retriever=GraphRetriever(StubNeo4jService()),
        keyword_retriever=KeywordRetriever(StubNeo4jService()),
        vector_retriever=VectorRetriever(StubNeo4jService()),
    )

    response = service.ask(
        QARequest(
            question="SMT异常3需要按照SOP怎么处理？",
            line_type="SMT",
            sequence=3,
            top_k=3,
        )
    )

    assert response.route.mode == "hybrid"
    assert len(response.graph_hits) == 1
    assert len(response.document_hits) >= 2
    assert len(response.citations) >= 3
    assert "LangChain grounded answer" in response.answer
    assert response.debug is not None
    assert response.debug.executed_modes == ["graph", "keyword", "vector"]


def test_knowledge_qa_service_returns_template_answer_without_langchain():
    service = KnowledgeQAService(
        qa_router=QARouter(),
        answer_service=QAAnswerService(),
        fusion_service=QAFusionService(),
        graph_retriever=GraphRetriever(StubNeo4jService()),
        keyword_retriever=KeywordRetriever(StubNeo4jService()),
        vector_retriever=VectorRetriever(StubNeo4jService()),
    )

    response = service.ask(
        QARequest(
            question="SMT异常3需要按照SOP怎么处理？",
            line_type="SMT",
            sequence=3,
        )
    )

    assert response.route.mode == "hybrid"
    assert len(response.graph_hits) == 1
    assert len(response.document_hits) >= 2
    assert "关键词检索补充" in response.answer
    assert "向量召回补充" in response.answer


def test_knowledge_qa_service_falls_back_to_graph_when_document_unavailable():
    service = KnowledgeQAService(
        qa_router=QARouter(),
        answer_service=QAAnswerService(),
        fusion_service=QAFusionService(),
        graph_retriever=GraphRetriever(StubNeo4jService()),
        keyword_retriever=KeywordRetriever(StubNeo4jService()),
        vector_retriever=VectorRetriever(StubNeo4jService()),
    )

    response = service.ask(QARequest(question="SOP流程是什么？"))

    assert response.route.mode == "document"
    assert len(response.graph_hits) == 0
    assert len(response.document_hits) == 0
    assert response.debug is not None
    assert response.debug.executed_modes == ["keyword", "vector"]
    assert any("关键词检索未命中" in warning for warning in response.warnings)
    assert any("向量检索未命中" in warning for warning in response.warnings)


def test_knowledge_qa_service_returns_graph_summary_when_no_specific_hit():
    service = KnowledgeQAService(
        qa_router=QARouter(),
        answer_service=QAAnswerService(),
        fusion_service=QAFusionService(),
        graph_retriever=GraphRetriever(StubNeo4jService()),
        keyword_retriever=KeywordRetriever(StubNeo4jService()),
        vector_retriever=VectorRetriever(StubNeo4jService()),
    )

    response = service.ask(QARequest(question="最近都有哪些异常？", top_k=3))

    assert response.route.mode == "graph"
    assert len(response.graph_hits) == 1
    assert len(response.document_hits) == 0
    assert response.citations[0].source_type == "graph"
    assert response.debug is not None
    assert response.debug.graph_hit_count == 1
