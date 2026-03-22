import re
from typing import Any

from app.services.knowledge_qa_models import QACitation, QARequest
from app.services.neo4j_service import Neo4jService
from app.services.retrievers.base import BaseRetriever, RetrievalResult


class KeywordRetriever(BaseRetriever):
    name = "keyword"

    def __init__(self, neo4j_service: Neo4jService | None = None) -> None:
        self.neo4j_service = neo4j_service

    @property
    def is_available(self) -> bool:
        return self.neo4j_service is not None

    def retrieve(self, request: QARequest) -> RetrievalResult:
        if self.neo4j_service is None:
            return RetrievalResult()

        keywords = self._extract_keywords(request.question)
        anomalies = self.neo4j_service.get_all_anomalies()
        ranked_items: list[tuple[float, dict[str, Any], list[str]]] = []

        for anomaly in anomalies:
            if request.line_type and anomaly.get("line_type") != request.line_type:
                continue

            searchable_text = self._build_searchable_text(anomaly)
            matched_terms: list[str] = []
            score = 0.0

            for keyword in keywords:
                if keyword and keyword in searchable_text:
                    matched_terms.append(keyword)
                    score += min(len(keyword), 6)

            if request.sequence is not None and anomaly.get("sequence") == request.sequence:
                matched_terms.append(f"sequence:{request.sequence}")
                score += 8.0

            if request.line_type and anomaly.get("line_type") == request.line_type:
                matched_terms.append(f"line_type:{request.line_type}")
                score += 3.0

            if score <= 0:
                continue

            ranked_items.append((score, anomaly, self._unique_non_empty(matched_terms)))

        ranked_items.sort(
            key=lambda item: (
                item[0],
                item[1].get("sequence", 0),
            ),
            reverse=True,
        )
        selected_items = ranked_items[: request.top_k]

        hits: list[dict[str, Any]] = []
        citations: list[QACitation] = []
        for score, anomaly, matched_terms in selected_items:
            hit = {
                "sequence": anomaly.get("sequence"),
                "name": anomaly.get("name"),
                "line_type": anomaly.get("line_type"),
                "phenomenon": anomaly.get("phenomenon"),
                "severity": anomaly.get("severity"),
                "matched_terms": matched_terms,
                "match_score": round(score, 2),
                "rank_score": round(score, 2),
                "causes": anomaly.get("causes", []),
                "solutions": anomaly.get("solutions", []),
            }
            hits.append(hit)

            snippet_parts = [
                f"现象：{anomaly.get('phenomenon', '未提供')}",
            ]
            cause_text = self._join_field_values(anomaly.get("causes", []), "description")
            solution_text = self._join_field_values(anomaly.get("solutions", []), "method")
            if cause_text:
                snippet_parts.append(f"原因：{cause_text}")
            if solution_text:
                snippet_parts.append(f"处理：{solution_text}")

            citations.append(
                QACitation(
                    source_type="document",
                    title=f"关键词匹配异常 {anomaly.get('sequence')}",
                    snippet=self._truncate("。".join(snippet_parts)),
                    score=round(score, 2),
                    metadata={
                        "retriever": self.name,
                        "matched_terms": matched_terms,
                        "line_type": anomaly.get("line_type"),
                        "sequence": anomaly.get("sequence"),
                    },
                )
            )

        return RetrievalResult(hits=hits, citations=citations)

    @staticmethod
    def _build_searchable_text(anomaly: dict[str, Any]) -> str:
        parts = [
            str(anomaly.get("name", "")),
            str(anomaly.get("line_type", "")),
            str(anomaly.get("phenomenon", "")),
        ]
        parts.extend(
            str(cause.get("description", ""))
            for cause in anomaly.get("causes", [])
            if isinstance(cause, dict)
        )
        parts.extend(
            str(solution.get("method", ""))
            for solution in anomaly.get("solutions", [])
            if isinstance(solution, dict)
        )
        normalized = " ".join(parts).lower()
        return normalized

    @staticmethod
    def _extract_keywords(question: str) -> list[str]:
        normalized = question.lower()
        removable_phrases = (
            "最近都有哪些",
            "都有哪些",
            "有哪些",
            "这条",
            "当前",
            "请问",
            "一下",
            "需要",
            "如何",
            "怎么",
            "怎样",
            "什么",
            "是否",
            "进行",
            "处理",
            "原因",
            "分析",
            "按照",
            "相关",
            "sop",
            "流程",
            "手册",
            "工单",
            "异常",
        )
        for phrase in removable_phrases:
            normalized = normalized.replace(phrase, " ")

        stopwords = {
            "这个",
            "一下子",
            "最近",
        }
        raw_tokens = re.findall(r"[\u4e00-\u9fff]{2,}|[a-z0-9_#-]+", normalized)
        keywords: list[str] = []

        for token in raw_tokens:
            cleaned = token.strip()
            if not cleaned or cleaned in stopwords:
                continue
            keywords.append(cleaned)

            if re.fullmatch(r"[\u4e00-\u9fff]{4,}", cleaned):
                for size in (4, 3, 2):
                    keywords.extend(
                        cleaned[index : index + size]
                        for index in range(0, len(cleaned) - size + 1)
                    )

        return KeywordRetriever._unique_non_empty(keywords)

    @staticmethod
    def _join_field_values(items: list[dict[str, Any]], field: str, limit: int = 2) -> str:
        values = [
            str(item.get(field, ""))
            for item in items
            if isinstance(item, dict) and item.get(field)
        ]
        return "；".join(KeywordRetriever._unique_non_empty(values)[:limit])

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
