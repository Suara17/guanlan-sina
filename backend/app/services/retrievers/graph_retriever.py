import re
from typing import Any

from app.services.knowledge_qa_models import QACitation, QARequest
from app.services.neo4j_service import Neo4jService
from app.services.retrievers.base import BaseRetriever, RetrievalResult

GRAPH_LIST_KEYWORDS: tuple[str, ...] = (
    "哪些异常",
    "所有异常",
    "异常列表",
    "最近异常",
    "全部异常",
)

GENERIC_QUESTION_PATTERNS: tuple[str, ...] = (
    "是什么",
    "什么原因",
    "原因是什么",
    "怎么办",
    "如何处理",
    "怎么处理",
    "怎么排查",
)

STOP_TERMS: tuple[str, ...] = (
    "请问",
    "一下",
    "一下子",
    "这个",
    "这个问题",
    "问题",
    "原因",
    "根因",
    "建议",
    "方案",
    "处理",
    "怎么",
    "如何",
    "为何",
    "什么",
    "是什么",
)


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

        normalized_question = self._normalize_question(request.question)
        selected_node_text = self._selected_node_text(request)
        if selected_node_text:
            results = self.neo4j_service.search_related_knowledge(
                selected_node_text, limit=request.top_k
            )
            if results:
                return self._build_related_hits(results)

        if request.sequence is not None or self._contains_any(
            request.question, ("异常", "原因", "根因", "编号", "序号")
        ):
            sequence = request.sequence or self._extract_sequence(request.question)
            if sequence is not None:
                results = self.neo4j_service.get_anomaly_analysis(sequence)
                return self._build_anomaly_hits(results, sequence)

        related_results = self._retrieve_by_question_terms(
            normalized_question,
            limit=request.top_k,
        )
        if related_results.hits or related_results.citations:
            return related_results

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

        if self._is_list_query(normalized_question):
            results = self.neo4j_service.get_all_anomalies()[: request.top_k]
            return self._build_all_anomaly_hits(results)

        return RetrievalResult()

    def _retrieve_by_question_terms(
        self,
        normalized_question: str,
        *,
        limit: int,
    ) -> RetrievalResult:
        search_terms = self._extract_search_terms(normalized_question)
        for term in search_terms:
            results = self.neo4j_service.search_related_knowledge(term, limit=limit)
            if results:
                return self._build_related_hits(results)
        return RetrievalResult()

    def _build_related_hits(self, results: list[dict[str, Any]]) -> RetrievalResult:
        grouped_hits: dict[int, dict[str, Any]] = {}
        sequence_order: list[int] = []

        for result in results:
            anomaly = result.get("a")
            if not anomaly:
                continue

            sequence = anomaly.get("sequence")
            if not isinstance(sequence, int):
                continue

            if sequence not in grouped_hits:
                grouped_hits[sequence] = {
                    "sequence": sequence,
                    "name": anomaly.get("name"),
                    "line_type": anomaly.get("line_type"),
                    "phenomenon": anomaly.get("phenomenon"),
                    "severity": anomaly.get("severity"),
                    "causes": [],
                    "solutions": [],
                    "match_score": float(result.get("match_score") or 0),
                }
                sequence_order.append(sequence)

            cause = result.get("c")
            if cause:
                description = cause.get("description")
                if description:
                    grouped_hits[sequence]["causes"].append(description)

            solution = result.get("s")
            if solution:
                method = solution.get("method")
                if method:
                    grouped_hits[sequence]["solutions"].append(method)

            grouped_hits[sequence]["match_score"] = max(
                grouped_hits[sequence]["match_score"],
                float(result.get("match_score") or 0),
            )

        hits: list[dict[str, Any]] = []
        citations: list[QACitation] = []
        for sequence in sequence_order:
            hit = grouped_hits[sequence]
            hit["causes"] = self._unique_non_empty(hit["causes"])
            hit["solutions"] = self._unique_non_empty(hit["solutions"])
            hits.append(hit)

            snippet_parts = [f"异常{sequence}现象：{hit.get('phenomenon', '未提供')}"]
            if hit["causes"]:
                snippet_parts.append(f"相关原因：{'；'.join(hit['causes'][:3])}")
            if hit["solutions"]:
                snippet_parts.append(f"相关处理：{'；'.join(hit['solutions'][:3])}")

            citations.append(
                QACitation(
                    source_type="graph",
                    title=f"{hit.get('line_type', '未知产线')} 异常 {sequence}",
                    snippet="。".join(snippet_parts),
                    score=round(min(hit["match_score"] / 3, 1.0), 2),
                    metadata=hit,
                )
            )

        return RetrievalResult(hits=hits, citations=citations)

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
    def _is_list_query(question: str) -> bool:
        return any(keyword in question for keyword in GRAPH_LIST_KEYWORDS)

    @classmethod
    def _extract_search_terms(cls, question: str) -> list[str]:
        candidate = question
        for pattern in GENERIC_QUESTION_PATTERNS:
            candidate = candidate.replace(pattern, " ")
        candidate = re.sub(r"[？?，,。.!！:：、/]+", " ", candidate)
        terms = [
            term.strip()
            for term in re.findall(r"[\u4e00-\u9fff]{2,}|[a-z0-9_#-]+", candidate)
        ]
        unique_terms: list[str] = []
        for term in terms:
            if len(term) < 2:
                continue
            if term in STOP_TERMS:
                continue
            if term not in unique_terms:
                unique_terms.append(term)

        joined = " ".join(unique_terms).strip()
        search_terms: list[str] = []
        if joined:
            search_terms.append(joined)
        search_terms.extend(unique_terms[:3])
        normalized_terms: list[str] = []
        for term in search_terms:
            compact = " ".join(term.split()).strip()
            if compact and compact not in normalized_terms:
                normalized_terms.append(compact)
        return normalized_terms

    @staticmethod
    def _normalize_question(question: str) -> str:
        return " ".join(question.lower().split())

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
    def _selected_node_text(request: QARequest) -> str | None:
        for value in (request.selected_node_description, request.selected_node_label):
            if value:
                normalized = " ".join(value.split()).strip()
                if normalized:
                    return normalized
        return None

    @staticmethod
    def _unique_non_empty(values: list[str]) -> list[str]:
        unique_values: list[str] = []
        for value in values:
            if value and value not in unique_values:
                unique_values.append(value)
        return unique_values
