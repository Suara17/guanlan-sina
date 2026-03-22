from app.services.knowledge_qa_models import QARequest
from app.services.retrievers import GraphRetriever


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
                "c": {"description": "吸嘴磨损"},
                "s": {"method": "更换吸嘴并重新校准"},
            }
        ]

    def find_similar_anomalies(self, phenomenon: str, limit: int = 10):
        _ = (phenomenon, limit)
        return []

    def recommend_solutions(self, line_type: str, severity: str | None = None):
        _ = (line_type, severity)
        return []

    def analyze_line_health(self, line_type: str):
        _ = line_type
        return {}

    def get_all_anomalies(self):
        return []


def test_graph_retriever_builds_anomaly_hit_from_sequence():
    retriever = GraphRetriever(StubNeo4jService())

    result = retriever.retrieve(QARequest(question="请分析异常3的原因", sequence=3))

    assert len(result.hits) == 1
    assert result.hits[0]["sequence"] == 3
    assert result.hits[0]["causes"] == ["吸嘴磨损"]
    assert result.citations[0].source_type == "graph"
