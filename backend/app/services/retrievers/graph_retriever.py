import re
from typing import Any

from app.services.knowledge_qa_models import QACitation, QARequest
from app.services.neo4j_service import Neo4jService
from app.services.retrievers.base import BaseRetriever, RetrievalResult


class GraphRetriever(BaseRetriever):
    name = "graph"

    def __init__(self, neo4j_service: Neo4jService | None = None) -> None:
        self.neo4j_service = neo4j_service

    @property
    def is_available(self) -> bool:
        return self.neo4j_service is not None

    def retrieve(self, request: QARequest) -> RetrievalResult:
        if self.neo4j_service is None:
            return RetrievalResult()

        if request.sequence is not None or self._contains_any(
            request.question, ("异常", "原因", "根因", "编号", "序号")
        ):
            sequence = request.sequence or self._extract_sequence(request.question)
            if sequence is not None:
                results = self.neo4j_service.get_anomaly_analysis(sequence)
                return self._build_anomaly_hits(results, sequence)

        if self._contains_any(request.question, ("相似", "类似")):
            results = self.neo4j_service.find_similar_anomalies(
                request.question, request.top_k
            )
            return self._build_similar_hits(results)

        if request.line_type and self._contains_any(
            request.question, ("方案", "建议", "处理")
        ):
            results = self.neo4j_service.recommend_solutions(request.line_type)
            return self._build_solution_hits(results, request.line_type)

        if request.line_type and self._contains_any(request.question, ("健康", "状态")):
            result = self.neo4j_service.analyze_line_health(request.line_type)
            return self._build_health_hits(result, request.line_type)

        results = self.neo4j_service.get_all_anomalies()[: request.top_k]
        return self._build_all_anomaly_hits(results)

    def _build_anomaly_hits(
        self, results: list[dict[str, Any]], sequence: int
    ) -> RetrievalResult:
        if not results:
            return RetrievalResult()

        anomaly = results[0]["a"]
        causes = []
        solutions = []
        for result in results:
            cause = result.get("c")
            solution = result.get("s")
            if cause:
                causes.append(cause.get("description", ""))
            if solution:
                solutions.append(solution.get("method", ""))

        hit = {
            "sequence": anomaly["sequence"],
            "name": anomaly.get("name"),
            "line_type": anomaly.get("line_type"),
            "phenomenon": anomaly.get("phenomenon"),
            "severity": anomaly.get("severity"),
            "causes": self._unique_non_empty(causes),
            "solutions": self._unique_non_empty(solutions),
        }
        snippet_parts = [
            f"异常{sequence}现象：{anomaly.get('phenomenon', '未提供')}",
        ]
        if hit["causes"]:
            snippet_parts.append(f"可能原因：{'；'.join(hit['causes'][:3])}")
        if hit["solutions"]:
            snippet_parts.append(f"建议处理：{'；'.join(hit['solutions'][:3])}")
        snippet = "。".join(snippet_parts)
        citation = QACitation(
            source_type="graph",
            title=f"{anomaly.get('line_type', '未知产线')} 异常 {sequence}",
            snippet=snippet,
            score=1.0,
            metadata=hit,
        )
        return RetrievalResult(hits=[hit], citations=[citation])

    def _build_similar_hits(self, results: list[dict[str, Any]]) -> RetrievalResult:
        hits: list[dict[str, Any]] = []
        citations: list[QACitation] = []
        for result in results:
            anomaly = result.get("a")
            if not anomaly:
                continue
            hit = {
                "sequence": anomaly.get("sequence"),
                "phenomenon": anomaly.get("phenomenon"),
                "line_type": anomaly.get("line_type"),
            }
            hits.append(hit)
            citations.append(
                QACitation(
                    source_type="graph",
                    title=f"相似异常 {anomaly.get('sequence')}",
                    snippet=self._truncate(anomaly.get("phenomenon", "")),
                    score=0.8,
                    metadata=hit,
                )
            )
        return RetrievalResult(hits=hits, citations=citations)

    def _build_solution_hits(
        self, results: list[dict[str, Any]], line_type: str
    ) -> RetrievalResult:
        hits: list[dict[str, Any]] = []
        citations: list[QACitation] = []
        for result in results[:5]:
            solution = result.get("s")
            if not solution:
                continue
            hit = {
                "method": solution.get("method"),
                "type": solution.get("type"),
                "priority": result.get("priority"),
                "success_rate": result.get("success_rate"),
                "usage_count": result.get("usage_count"),
            }
            hits.append(hit)
            citations.append(
                QACitation(
                    source_type="graph",
                    title=f"{line_type} 方案推荐",
                    snippet=self._truncate(solution.get("method", "")),
                    score=float(result.get("success_rate") or 0),
                    metadata=hit,
                )
            )
        return RetrievalResult(hits=hits, citations=citations)

    def _build_health_hits(self, result: dict[str, Any], line_type: str) -> RetrievalResult:
        if not result:
            return RetrievalResult()
        hit = {
            "line_type": line_type,
            "total_anomalies": result.get("total_anomalies", 0),
            "high_severity_count": result.get("high_severity_count", 0),
            "high_severity_ratio": result.get("high_severity_ratio", 0),
            "unique_causes": result.get("unique_causes", 0),
        }
        snippet = (
            f"{line_type} 当前异常总数 {hit['total_anomalies']}，"
            f"高严重度异常 {hit['high_severity_count']}，"
            f"高严重度占比 {hit['high_severity_ratio']}。"
        )
        citation = QACitation(
            source_type="graph",
            title=f"{line_type} 产线健康分析",
            snippet=snippet,
            score=1.0,
            metadata=hit,
        )
        return RetrievalResult(hits=[hit], citations=[citation])

    def _build_all_anomaly_hits(self, results: list[dict[str, Any]]) -> RetrievalResult:
        citations = [
            QACitation(
                source_type="graph",
                title=f"{item.get('line_type', '未知产线')} 异常 {item.get('sequence')}",
                snippet=self._truncate(item.get("phenomenon", "")),
                score=0.6,
                metadata=item,
            )
            for item in results
        ]
        return RetrievalResult(hits=results, citations=citations)

    @staticmethod
    def _contains_any(text: str, keywords: tuple[str, ...]) -> bool:
        normalized_text = text.lower()
        return any(keyword in normalized_text for keyword in keywords)

    @staticmethod
    def _extract_sequence(question: str) -> int | None:
        patterns = (
            r"(?:异常|序号|编号)[#：:\s-]*(\d+)",
            r"(\d+)\s*号异常",
        )
        for pattern in patterns:
            match = re.search(pattern, question)
            if match:
                return int(match.group(1))
        return None

    @staticmethod
    def _truncate(text: str, limit: int = 220) -> str:
        normalized = " ".join(text.split())
        if len(normalized) <= limit:
            return normalized
        return f"{normalized[: limit - 3]}..."

    @staticmethod
    def _unique_non_empty(values: list[str]) -> list[str]:
        unique_values: list[str] = []
        for value in values:
            if value and value not in unique_values:
                unique_values.append(value)
        return unique_values
