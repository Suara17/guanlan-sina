from app.services.knowledge_qa_models import QACitation
from app.services.qa_fusion_service import QAFusionService


def test_fusion_service_normalizes_scores_and_orders_sources():
    service = QAFusionService(max_citations=5)

    citations = service.merge_citations(
        graph_citations=[
            QACitation(
                source_type="graph",
                title="SMT 异常 3",
                snippet="图谱事实",
                score=1.0,
                metadata={
                    "retriever": "graph",
                    "line_type": "SMT",
                    "sequence": 3,
                    "phenomenon": "贴片偏移",
                },
            )
        ],
        document_citations=[
            QACitation(
                source_type="document",
                title="关键词匹配异常 3",
                snippet="文本补充",
                score=9.0,
                metadata={
                    "retriever": "keyword",
                    "line_type": "SMT",
                    "sequence": 3,
                    "phenomenon": "贴片偏移",
                },
            ),
            QACitation(
                source_type="document",
                title="向量召回异常 7",
                snippet="文本补充 7",
                score=0.95,
                metadata={
                    "retriever": "vector",
                    "line_type": "SMT",
                    "sequence": 7,
                    "phenomenon": "虚焊",
                },
            ),
        ],
    )

    assert len(citations) == 3
    assert citations[0].source_type == "graph"
    assert citations[1].metadata["retriever"] == "vector"
    assert citations[2].metadata["retriever"] == "keyword"


def test_fusion_service_trims_hits_by_score():
    service = QAFusionService()

    hits = service.trim_hits(
        [
            {"sequence": 3, "rank_score": 0.92},
            {"sequence": 7, "rank_score": 0.45},
            {"sequence": 9, "rank_score": 0.81},
        ],
        top_k=2,
        sort_field="rank_score",
    )

    assert [hit["sequence"] for hit in hits] == [3, 9]


def test_fusion_service_exposes_normalized_score_rules():
    service = QAFusionService()

    assert service._normalize_score(1.0, retriever="graph") == 1.0
    assert service._normalize_score(9.0, retriever="keyword") == 0.75
    assert service._normalize_score(0.6, retriever="vector") == 0.6


def test_fusion_service_builds_grouped_context():
    service = QAFusionService()

    groups = service.build_citation_groups(
        citations=[
            QACitation(
                source_type="graph",
                title="SMT 异常 3",
                snippet="图谱事实",
                score=1.0,
                metadata={"retriever": "graph", "sequence": 3},
            ),
            QACitation(
                source_type="document",
                title="关键词匹配异常 3",
                snippet="关键词补充",
                score=0.8,
                metadata={"retriever": "keyword", "sequence": 3},
            ),
            QACitation(
                source_type="document",
                title="向量召回异常 7",
                snippet="向量补充",
                score=0.7,
                metadata={"retriever": "vector", "sequence": 7},
            ),
        ]
    )

    assert len(groups["graph"]) == 1
    assert len(groups["keyword"]) == 1
    assert len(groups["vector"]) == 1
