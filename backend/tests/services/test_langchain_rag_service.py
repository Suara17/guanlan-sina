from app.services.knowledge_qa_models import QARouteDecision, QAStructuredAnswer
from app.services.langchain_rag_service import LangChainRAGService
from app.services.langchain_service import LangChainService


def _build_langchain_service() -> LangChainService:
    return LangChainService(
        provider="openai",
        model="gpt-4o-mini",
        temperature=0.1,
        api_key="test-key",
    )


def test_langchain_rag_service_generates_document_rag_answer_from_chain(monkeypatch):
    service = LangChainRAGService(_build_langchain_service())

    class StubDocument:
        def __init__(self, page_content, metadata):
            self.page_content = page_content
            self.metadata = metadata

    class StubRetriever:
        def invoke(self, query):
            assert query == "SPI设备手册里的 setup check 怎么做？"
            return [
                StubDocument(
                    "用户手册要求先检查钢网对位。",
                    {"title": "SPI User Guide", "chunk_id": "c1", "page": 8},
                )
            ]

    monkeypatch.setattr(
        service.langchain_service,
        "generate_structured_answer",
        lambda **kwargs: QAStructuredAnswer(
            conclusion=["先做 setup check。"],
            evidence=["[D1] 用户手册要求先检查钢网对位。"],
            suggestions=["复核 conveyor calibration。"],
            risks=["当前仅基于手册片段。"],
            confidence=0.82,
            used_sources=["D1"],
            missing_information=["缺少设备当前报警码。"],
        ),
    )

    response = service.generate_document_rag_answer(
        question="SPI设备手册里的 setup check 怎么做？",
        route=QARouteDecision(mode="document", reasons=["test"]),
        executed_modes=["vector"],
        warnings=[],
        retriever=StubRetriever(),
    )

    assert response is not None
    assert response.conclusion == ["先做 setup check。"]
    assert response.evidence == ["[D1] 用户手册要求先检查钢网对位。"]
    assert response.confidence == 0.82
    assert response.used_sources == ["D1"]


def test_langchain_rag_service_prefers_document_chain_for_hybrid_route(monkeypatch):
    service = LangChainRAGService(_build_langchain_service())
    expected = QAStructuredAnswer(conclusion=["来自混合路由文档链的结论"], used_sources=["D1"])

    monkeypatch.setattr(
        service,
        "generate_document_rag_answer",
        lambda **kwargs: expected,
    )

    response = service.generate_grounded_answer(
        question="SPI设备手册里的 setup check 怎么做？",
        route=QARouteDecision(mode="hybrid", reasons=["test"]),
        executed_modes=["graph", "vector"],
        graph_citations=[],
        document_citations=[],
        citation_groups=None,
        warnings=[],
        document_retriever="stub-retriever",
    )

    assert response == expected


def test_langchain_rag_service_uses_smaller_document_window_for_hybrid_route(monkeypatch):
    service = LangChainRAGService(_build_langchain_service())
    captured: dict[str, int] = {}

    class StubRetriever:
        def invoke(self, query):
            _ = query
            return []

    def build_filtered_retriever(retriever, *, max_documents):
        _ = retriever
        captured["max_documents"] = max_documents
        return StubRetriever()

    monkeypatch.setattr(service, "_build_filtered_retriever", build_filtered_retriever)
    monkeypatch.setattr(
        service.langchain_service,
        "generate_structured_answer",
        lambda **kwargs: QAStructuredAnswer(
            conclusion=["hybrid"],
            evidence=["[D1] 文档片段"],
        ),
    )

    response = service.generate_document_rag_answer(
        question="SPI设备手册里的 setup check 怎么做？",
        route=QARouteDecision(mode="hybrid", reasons=["test"]),
        executed_modes=["graph", "vector"],
        warnings=[],
        retriever=StubRetriever(),
    )

    assert response is not None
    assert captured["max_documents"] == 3


def test_langchain_rag_service_formats_document_context():
    class StubDocument:
        def __init__(self, page_content, metadata):
            self.page_content = page_content
            self.metadata = metadata

    context = LangChainRAGService._format_document_context(
        [
            StubDocument(
                "这是第一段文档内容",
                {"title": "SPI User Guide", "page": 8},
            )
        ]
    )

    assert "[D1]" in context
    assert "SPI User Guide" in context
    assert "page=8" in context


def test_langchain_rag_service_filters_documents_by_score_and_deduplicates():
    class StubDocument:
        def __init__(self, page_content, metadata):
            self.page_content = page_content
            self.metadata = metadata

    documents = [
        StubDocument("dup low", {"chunk_id": "c1", "similarity_score": 0.4, "page": 2}),
        StubDocument("dup high", {"chunk_id": "c1", "similarity_score": 0.9, "page": 3}),
        StubDocument("best", {"chunk_id": "c2", "similarity_score": 0.95, "page": 1}),
        StubDocument("mid", {"chunk_id": "c3", "similarity_score": 0.7, "page": 5}),
    ]

    filtered = LangChainRAGService._filter_documents(documents, max_documents=2)

    assert len(filtered) == 2
    assert filtered[0].page_content == "best"
    assert filtered[1].page_content == "dup high"


def test_langchain_rag_service_prefers_document_chain_for_document_route(monkeypatch):
    service = LangChainRAGService(_build_langchain_service())
    expected = QAStructuredAnswer(conclusion=["来自文档链的结论"])

    monkeypatch.setattr(
        service,
        "generate_document_rag_answer",
        lambda **kwargs: expected,
    )

    response = service.generate_grounded_answer(
        question="SPI设备手册里的 setup check 怎么做？",
        route=QARouteDecision(mode="document", reasons=["test"]),
        executed_modes=["vector"],
        graph_citations=[],
        document_citations=[],
        citation_groups=None,
        warnings=[],
        document_retriever="stub-retriever",
    )

    assert response == expected
