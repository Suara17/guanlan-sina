import json
from pathlib import Path
from time import sleep

from app.services.document_index_service import DocumentIndexService
from app.services.knowledge_qa_models import QARequest
from app.services.knowledge_qa_service import KnowledgeQAService
from app.services.qa_answer_service import QAAnswerService
from app.services.qa_fusion_service import QAFusionService
from app.services.qa_router import QARouter
from app.services.retrievers.base import RetrievalResult
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


class SlowKeywordRetriever:
    name = "keyword"
    is_available = True

    def retrieve(self, request: QARequest):
        _ = request
        sleep(0.05)
        return RetrievalResult()


class FailingVectorRetriever:
    name = "vector"
    is_available = True

    def retrieve(self, request: QARequest):
        _ = request
        raise RuntimeError("boom")


def build_document_index_service(tmp_path: Path) -> DocumentIndexService:
    chunks_path = tmp_path / "chunks.jsonl"
    embeddings_path = tmp_path / "embeddings.jsonl"
    records = [
        {
            "document_id": "smt-guide",
            "chunk_id": "smt-guide:p12:c01",
            "source_file": "docs/知识图谱/downloads/smt-guide.pdf",
            "title": "SMT Troubleshooting Guide",
            "page": 12,
            "section": "Placement Offset",
            "text": "SMT 异常3 贴片偏移通常与吸嘴磨损、贴装坐标漂移和供料不稳定有关，建议重新校准。",
            "text_preview": "SMT 异常3 贴片偏移通常与吸嘴磨损、贴装坐标漂移和供料不稳定有关，建议重新校准。",
            "keywords": ["贴片偏移", "吸嘴磨损", "校准"],
            "line_types": ["SMT"],
        },
        {
            "document_id": "smt-sop",
            "chunk_id": "smt-sop:p08:c01",
            "source_file": "docs/知识图谱/downloads/smt-sop.pdf",
            "title": "SMT SOP",
            "page": 8,
            "section": "Corrective Actions",
            "text": "按照 SOP 应先检查吸嘴磨损，再校准贴装坐标，最后复核供料状态。",
            "text_preview": "按照 SOP 应先检查吸嘴磨损，再校准贴装坐标，最后复核供料状态。",
            "keywords": ["sop", "吸嘴磨损", "校准"],
            "line_types": ["SMT"],
        },
    ]
    with chunks_path.open("w", encoding="utf-8") as file:
        for record in records:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")
    embedding_records = [
        {
            "chunk_id": "smt-guide:p12:c01",
            "document_id": "smt-guide",
            "embedding_model": "test-model",
            "vector": [1.0, 0.0, 0.0],
        },
        {
            "chunk_id": "smt-sop:p08:c01",
            "document_id": "smt-sop",
            "embedding_model": "test-model",
            "vector": [0.92, 0.08, 0.0],
        },
    ]
    with embeddings_path.open("w", encoding="utf-8") as file:
        for record in embedding_records:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")
    return DocumentIndexService(chunks_path=chunks_path, embeddings_path=embeddings_path)


def test_knowledge_qa_service_returns_hybrid_response(tmp_path: Path):
    service = KnowledgeQAService(
        qa_router=QARouter(),
        answer_service=QAAnswerService(langchain_service=StubLangChainService()),
        fusion_service=QAFusionService(),
        graph_retriever=GraphRetriever(StubNeo4jService()),
        keyword_retriever=KeywordRetriever(build_document_index_service(tmp_path)),
        vector_retriever=VectorRetriever(build_document_index_service(tmp_path)),
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


def test_knowledge_qa_service_returns_template_answer_without_langchain(tmp_path: Path):
    service = KnowledgeQAService(
        qa_router=QARouter(),
        answer_service=QAAnswerService(),
        fusion_service=QAFusionService(),
        graph_retriever=GraphRetriever(StubNeo4jService()),
        keyword_retriever=KeywordRetriever(build_document_index_service(tmp_path)),
        vector_retriever=VectorRetriever(build_document_index_service(tmp_path)),
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
    assert "依据：" in response.answer
    assert "[K1]" in response.answer
    assert "[V1]" in response.answer


def test_knowledge_qa_service_falls_back_to_graph_when_document_unavailable(tmp_path: Path):
    service = KnowledgeQAService(
        qa_router=QARouter(),
        answer_service=QAAnswerService(),
        fusion_service=QAFusionService(),
        graph_retriever=GraphRetriever(StubNeo4jService()),
        keyword_retriever=KeywordRetriever(DocumentIndexService(chunks_path=tmp_path / "missing.jsonl")),
        vector_retriever=VectorRetriever(DocumentIndexService(chunks_path=tmp_path / "missing.jsonl")),
    )

    response = service.ask(QARequest(question="SOP流程是什么？"))

    assert response.route.mode == "document"
    assert len(response.graph_hits) == 1
    assert len(response.document_hits) == 0
    assert response.debug is not None
    assert response.debug.executed_modes == ["graph"]
    assert any("关键词检索未启用" in warning for warning in response.warnings)
    assert any("向量检索未启用" in warning for warning in response.warnings)


def test_knowledge_qa_service_returns_graph_summary_when_no_specific_hit():
    service = KnowledgeQAService(
        qa_router=QARouter(),
        answer_service=QAAnswerService(),
        fusion_service=QAFusionService(),
        graph_retriever=GraphRetriever(StubNeo4jService()),
        keyword_retriever=KeywordRetriever(DocumentIndexService(chunks_path=Path("__missing__.jsonl"))),
        vector_retriever=VectorRetriever(DocumentIndexService(chunks_path=Path("__missing__.jsonl"))),
    )

    response = service.ask(QARequest(question="最近都有哪些异常？", top_k=3))

    assert response.route.mode == "graph"
    assert len(response.graph_hits) == 1
    assert len(response.document_hits) == 0
    assert response.citations[0].source_type == "graph"
    assert response.debug is not None
    assert response.debug.graph_hit_count == 1


def test_knowledge_qa_service_isolates_retriever_timeout_and_failure(monkeypatch):
    monkeypatch.setattr("app.services.knowledge_qa_service.settings.QA_RETRIEVER_TIMEOUT_MS", 10)
    monkeypatch.setattr("app.services.knowledge_qa_service.settings.QA_RETRIEVER_MAX_WORKERS", 3)

    service = KnowledgeQAService(
        qa_router=QARouter(),
        answer_service=QAAnswerService(),
        fusion_service=QAFusionService(),
        graph_retriever=GraphRetriever(StubNeo4jService()),
        keyword_retriever=SlowKeywordRetriever(),
        vector_retriever=FailingVectorRetriever(),
    )

    response = service.ask(
        QARequest(question="SMT异常3需要按照SOP怎么处理？", line_type="SMT", sequence=3)
    )

    assert len(response.graph_hits) == 1
    assert any("关键词检索超时" in warning for warning in response.warnings)
    assert any("向量检索失败" in warning for warning in response.warnings)
    assert response.debug is not None
    assert response.debug.timing_ms["keyword_retrieval"] == 10
