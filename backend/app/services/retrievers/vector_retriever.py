import math
import re
from typing import Any

from app.services.document_index_service import DocumentIndexService
from app.services.embedding_service import EmbeddingService
from app.services.knowledge_qa_models import QACitation, QARequest
from app.services.retrievers.base import BaseRetriever, RetrievalResult


class VectorRetriever(BaseRetriever):
    name = "vector"

    def __init__(self, document_index_service: DocumentIndexService | None = None) -> None:
        self.document_index_service = document_index_service or DocumentIndexService()

    @property
    def is_available(self) -> bool:
        return self.document_index_service.chunks_available

    def retrieve(self, request: QARequest) -> RetrievalResult:
        if not self.is_available:
            return RetrievalResult()

        query_text = self._build_query_text(request)
        query_terms = self._extract_terms(query_text)
        chunks = self.document_index_service.get_chunks()
        embedding_map = self._get_embedding_map()
        scored_items: list[tuple[float, dict[str, Any]]] = []

        query_embedding = self._embed_text(query_text)
        for chunk in chunks:
            if request.line_type and not self._matches_line_type(chunk, request.line_type):
                continue

            candidate_text = self._build_candidate_text(chunk)
            candidate_terms = self._extract_terms(candidate_text)
            overlap_count = len(query_terms & candidate_terms)
            candidate_embedding = embedding_map.get(chunk.get("chunk_id"))
            if candidate_embedding is None or len(candidate_embedding) != len(query_embedding):
                candidate_embedding = self._fallback_embedding(candidate_text)
            score = self._cosine_similarity(
                query_embedding,
                candidate_embedding,
            )
            if overlap_count == 0 and request.sequence is None:
                continue
            score += min(overlap_count, 4) * 0.08
            if request.sequence is not None and self._extract_sequence(chunk) == request.sequence:
                score += 0.25
            if request.line_type and self._matches_line_type(chunk, request.line_type):
                score += 0.05
            if score <= 0:
                continue
            scored_items.append((round(score, 4), chunk))

        scored_items.sort(
            key=lambda item: (
                item[0],
                float(item[1].get("page") or 0),
            ),
            reverse=True,
        )

        hits: list[dict[str, Any]] = []
        citations: list[QACitation] = []
        for score, chunk in scored_items[: request.top_k]:
            hit = {
                "document_id": chunk.get("document_id"),
                "chunk_id": chunk.get("chunk_id"),
                "title": chunk.get("title"),
                "page": chunk.get("page"),
                "section": chunk.get("section"),
                "source_file": chunk.get("source_file"),
                "similarity_score": score,
                "rank_score": score,
                "text_preview": chunk.get("text_preview"),
            }
            hits.append(hit)
            citations.append(
                QACitation(
                    source_type="document",
                    title=str(chunk.get("title") or chunk.get("document_id") or "文档片段"),
                    snippet=self._truncate(self._build_candidate_text(chunk)),
                    score=score,
                    metadata={
                        "retriever": self.name,
                        "document_id": chunk.get("document_id"),
                        "chunk_id": chunk.get("chunk_id"),
                        "source_file": chunk.get("source_file"),
                        "title": chunk.get("title"),
                        "page": chunk.get("page"),
                        "section": chunk.get("section"),
                    },
                )
            )

        return RetrievalResult(hits=hits, citations=citations)

    def _embed_text(self, text: str) -> list[float]:
        model_embedding = EmbeddingService().embed_query(text)
        if model_embedding is not None:
            return model_embedding
        return self._fallback_embedding(text)

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
    def _build_candidate_text(chunk: dict[str, Any]) -> str:
        parts = [
            str(chunk.get("title", "")),
            str(chunk.get("section", "")),
            str(chunk.get("text", "")),
            str(chunk.get("text_preview", "")),
            " ".join(str(item) for item in chunk.get("keywords", [])),
            " ".join(str(item) for item in chunk.get("line_types", [])),
        ]
        return " ".join(part for part in parts if part)

    def _get_embedding_map(self) -> dict[str, list[float]]:
        if not self.document_index_service.embeddings_available:
            return {}

        embedding_map: dict[str, list[float]] = {}
        for record in self.document_index_service.get_embeddings():
            chunk_id = record.get("chunk_id")
            vector = record.get("vector")
            if isinstance(chunk_id, str) and isinstance(vector, list):
                embedding_map[chunk_id] = [float(value) for value in vector]
        return embedding_map

    @staticmethod
    def _extract_terms(text: str) -> set[str]:
        normalized = text.lower()
        terms = set(re.findall(r"[\u4e00-\u9fff]{2,}|[a-z0-9_#-]+", normalized))
        return {term for term in terms if term.strip()}

    @staticmethod
    def _matches_line_type(chunk: dict[str, Any], line_type: str) -> bool:
        normalized_line_type = line_type.lower()
        line_types = [str(item).lower() for item in chunk.get("line_types", [])]
        if normalized_line_type in line_types:
            return True
        return normalized_line_type in VectorRetriever._build_candidate_text(chunk).lower()

    @staticmethod
    def _extract_sequence(chunk: dict[str, Any]) -> int | None:
        metadata_candidates = (
            chunk.get("sequence"),
            chunk.get("chunk_id"),
            chunk.get("text_preview"),
            chunk.get("text"),
        )
        for candidate in metadata_candidates:
            if candidate is None:
                continue
            match = re.search(
                r"(?:异常|sequence[:：\s-]*)(\d+)|(\d+)\s*号异常",
                str(candidate),
                re.IGNORECASE,
            )
            if match:
                return int(match.group(1) or match.group(2))
        return None

    @staticmethod
    def _truncate(text: str, limit: int = 220) -> str:
        normalized = " ".join(text.split())
        if len(normalized) <= limit:
            return normalized
        return f"{normalized[: limit - 3]}..."
