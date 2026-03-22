from app.services.knowledge_qa_models import QARequest
from app.services.retrievers import KeywordRetriever


class StubNeo4jService:
    def get_all_anomalies(self):
        return [
            {
                "sequence": 3,
                "name": "异常-3",
                "phenomenon": "贴片偏移",
                "severity": "HIGH",
                "line_type": "SMT",
                "causes": [{"description": "吸嘴磨损"}],
                "solutions": [{"method": "更换吸嘴并重新校准"}],
            },
            {
                "sequence": 7,
                "name": "异常-7",
                "phenomenon": "焊点虚焊",
                "severity": "MEDIUM",
                "line_type": "SMT",
                "causes": [{"description": "温度曲线异常"}],
                "solutions": [{"method": "检查回流焊温度曲线"}],
            },
        ]


def test_keyword_retriever_returns_ranked_text_hits():
    retriever = KeywordRetriever(StubNeo4jService())

    result = retriever.retrieve(
        QARequest(question="SMT贴片偏移怎么处理", line_type="SMT", top_k=3)
    )

    assert len(result.hits) == 1
    assert result.hits[0]["sequence"] == 3
    assert "贴片偏移" in result.hits[0]["matched_terms"]
    assert result.citations[0].metadata["retriever"] == "keyword"
