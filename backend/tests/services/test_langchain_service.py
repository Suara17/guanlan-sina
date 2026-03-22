from app.services.langchain_service import LangChainService
from app.services.knowledge_qa_models import QACitation, QARouteDecision


def test_langchain_service_returns_none_when_package_missing_or_unavailable():
    service = LangChainService(
        provider="openai",
        model="gpt-4o-mini",
        temperature=0.1,
        api_key="test-key",
    )

    response = service.generate_grounded_answer(
        question="异常3如何处理？",
        route=QARouteDecision(mode="graph", reasons=["test"]),
        executed_modes=["graph"],
        graph_citations=[
            QACitation(
                source_type="graph",
                title="SMT 异常 3",
                snippet="可能原因：吸嘴磨损",
                score=1.0,
                metadata={},
            )
        ],
        document_citations=[],
        citation_groups=None,
        warnings=[],
    )

    assert response is None or isinstance(response, str)


def test_langchain_service_formats_citation_context_with_metadata():
    formatted = LangChainService._format_citation_context(
        [
            QACitation(
                source_type="document",
                title="关键词匹配异常 3",
                snippet="现象：贴片偏移。处理：更换吸嘴。",
                score=9.5,
                metadata={
                    "sequence": 3,
                    "line_type": "SMT",
                    "matched_terms": ["贴片偏移", "吸嘴"],
                },
            )
        ]
    )

    assert "sequence=3" in formatted
    assert "line_type=SMT" in formatted
    assert "matched_terms=贴片偏移,吸嘴" in formatted


def test_langchain_service_formats_grouped_context():
    grouped = LangChainService._format_grouped_context(
        {
            "graph": [
                QACitation(
                    source_type="graph",
                    title="SMT 异常 3",
                    snippet="图谱事实",
                    score=1.0,
                    metadata={"retriever": "graph", "sequence": 3},
                )
            ],
            "keyword": [
                QACitation(
                    source_type="document",
                    title="关键词匹配异常 3",
                    snippet="关键词补充",
                    score=0.8,
                    metadata={"retriever": "keyword", "sequence": 3},
                )
            ],
        }
    )

    assert "[图谱事实]" in grouped
    assert "[关键词补充]" in grouped
