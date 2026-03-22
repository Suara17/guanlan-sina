import math
import re
from typing import Any

from app.core.config import settings
from app.services.knowledge_qa_models import QACitation, QARequest
from app.services.neo4j_service import Neo4jService
from app.services.retrievers.base import BaseRetriever, RetrievalResult


class VectorRetriever(BaseRetriever):
    name = "vector"

    def __init__(self, neo4j_service: Neo4jService | None = None) -> None:
        self.neo4j_service = neo4j_service

    @property
    def is_available(self) -> bool:
        return self.neo4j_service is not None

    def retrieve(self, request: QARequest) -> RetrievalResult:
        if self.neo4j_service is None:
            return RetrievalResult()

        query_text = self._build_query_text(request)
        query_terms = self._extract_terms(query_text)
        anomalies = self.neo4j_service.get_all_anomalies()
        scored_items: list[tuple[float, dict[str, Any]]] = []

        query_embedding = self._embed_text(query_text)
        for anomaly in anomalies:
            if request.line_type and anomaly.get("line_type") != request.line_type:
                continue

            candidate_text = self._build_candidate_text(anomaly)
            candidate_terms = self._extract_terms(candidate_text)
            overlap_count = len(query_terms & candidate_terms)
            score = self._cosine_similarity(
                query_embedding,
                self._embed_text(candidate_text),
            )
            if overlap_count == 0 and request.sequence is None:
                continue
            score += min(overlap_count, 4) * 0.08
            if request.sequence is not None and anomaly.get("sequence") == request.sequence:
                score += 0.25
            if request.line_type and anomaly.get("line_type") == request.line_type:
                score += 0.05
            if score <= 0:
                continue
            scored_items.append((round(score, 4), anomaly))

        scored_items.sort(
            key=lambda item: (
                item[0],
                float(item[1].get("sequence") or 0),
            ),
            reverse=True,
        )

        hits: list[dict[str, Any]] = []
        citations: list[QACitation] = []
        for score, anomaly in scored_items[: request.top_k]:
            hit = {
                "sequence": anomaly.get("sequence"),
                "name": anomaly.get("name"),
                "line_type": anomaly.get("line_type"),
                "phenomenon": anomaly.get("phenomenon"),
                "severity": anomaly.get("severity"),
                "similarity_score": score,
                "rank_score": score,
                "causes": anomaly.get("causes", []),
                "solutions": anomaly.get("solutions", []),
            }
            hits.append(hit)
            citations.append(
                QACitation(
                    source_type="document",
                    title=f"向量召回异常 {anomaly.get('sequence')}",
                    snippet=self._truncate(self._build_candidate_text(anomaly)),
                    score=score,
                    metadata={
                        "retriever": self.name,
                        "sequence": anomaly.get("sequence"),
                        "line_type": anomaly.get("line_type"),
                        "phenomenon": anomaly.get("phenomenon"),
                    },
                )
            )

        return RetrievalResult(hits=hits, citations=citations)

    def _embed_text(self, text: str) -> list[float]:
        cloud_embedding = self._try_openai_embedding(text)
        if cloud_embedding is not None:
            return cloud_embedding
        return self._fallback_embedding(text)

    def _try_openai_embedding(self, text: str) -> list[float] | None:
        if not settings.OPENAI_API_KEY:
            return None
        try:
            from langchain_openai import OpenAIEmbeddings
        except ImportError:
            return None

        try:
            model = OpenAIEmbeddings(
                model=settings.EMBEDDING_MODEL,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL,
            )
            return list(model.embed_query(text))
        except Exception:
            return None

    @staticmethod
    def _fallback_embedding(text: str) -> list[float]:
        tokens = re.findall(r"[\u4e00-\u9fff]{1,2}|[a-z0-9_#-]+", text.lower())
        dimensions = [0.0] * 32
        for token in tokens:
            bucket = hash(token) % len(dimensions)
            dimensions[bucket] += 1.0

        norm = math.sqrt(sum(value * value for value in dimensions))
        if norm == 0:
            return dimensions
        return [value / norm for value in dimensions]

    @staticmethod
    def _cosine_similarity(left: list[float], right: list[float]) -> float:
        if not left or not right or len(left) != len(right):
            return 0.0
        return sum(a * b for a, b in zip(left, right, strict=False))

    @staticmethod
    def _build_query_text(request: QARequest) -> str:
        parts = [request.question]
        if request.line_type:
            parts.append(request.line_type)
        if request.sequence is not None:
            parts.append(f"异常 {request.sequence}")
        return " ".join(parts)

    @staticmethod
    def _build_candidate_text(anomaly: dict[str, Any]) -> str:
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
        return " ".join(part for part in parts if part)

    @staticmethod
    def _extract_terms(text: str) -> set[str]:
        normalized = text.lower()
        terms = set(re.findall(r"[\u4e00-\u9fff]{2,}|[a-z0-9_#-]+", normalized))
        return {term for term in terms if term.strip()}

    @staticmethod
    def _truncate(text: str, limit: int = 220) -> str:
        normalized = " ".join(text.split())
        if len(normalized) <= limit:
            return normalized
        return f"{normalized[: limit - 3]}..."
