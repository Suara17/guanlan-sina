from typing import Any

from app.services.knowledge_qa_models import QACitation


class QAFusionService:
    def __init__(self, *, max_citations: int = 6) -> None:
        self.max_citations = max_citations

    def merge_citations(
        self,
        *,
        graph_citations: list[QACitation],
        document_citations: list[QACitation],
    ) -> list[QACitation]:
        ranked_items = [
            self._ranked_item(citation, index=index)
            for index, citation in enumerate([*graph_citations, *document_citations])
        ]
        ranked_items.sort(
            key=lambda item: (
                item["rank_score"],
                item["source_priority"],
                -item["index"],
            ),
            reverse=True,
        )

        deduped: list[QACitation] = []
        seen_keys: set[str] = set()
        for item in ranked_items:
            citation = item["citation"]
            dedupe_key = self._dedupe_key(citation)
            if dedupe_key in seen_keys:
                continue
            seen_keys.add(dedupe_key)
            deduped.append(citation)
            if len(deduped) >= self.max_citations:
                break

        return deduped

    def trim_hits(
        self, hits: list[dict[str, Any]], *, top_k: int, sort_field: str | None = None
    ) -> list[dict[str, Any]]:
        if sort_field is None:
            return hits[:top_k]
        return sorted(
            hits,
            key=lambda item: (
                float(item.get(sort_field) or item.get("rank_score") or 0),
                float(item.get("sequence") or 0),
            ),
            reverse=True,
        )[:top_k]

    def select_context_citations(
        self,
        *,
        citations: list[QACitation],
        source_type: str,
        limit: int = 3,
    ) -> list[QACitation]:
        return [citation for citation in citations if citation.source_type == source_type][:limit]

    def build_citation_groups(
        self,
        *,
        citations: list[QACitation],
        per_group_limit: int = 3,
    ) -> dict[str, list[QACitation]]:
        grouped: dict[str, list[QACitation]] = {
            "graph": [],
            "keyword": [],
            "vector": [],
            "document": [],
        }
        for citation in citations:
            metadata = citation.metadata or {}
            retriever = str(metadata.get("retriever") or citation.source_type)
            if retriever == "graph":
                target_group = "graph"
            elif retriever == "keyword":
                target_group = "keyword"
            elif retriever == "vector":
                target_group = "vector"
            else:
                target_group = "document"

            if len(grouped[target_group]) < per_group_limit:
                grouped[target_group].append(citation)

        return grouped

    @staticmethod
    def _ranked_item(citation: QACitation, *, index: int) -> dict[str, Any]:
        metadata = citation.metadata or {}
        retriever = str(metadata.get("retriever") or citation.source_type)
        source_priority = 3 if citation.source_type == "graph" else 2
        raw_score = float(citation.score or 0)
        normalized_score = QAFusionService._normalize_score(raw_score, retriever=retriever)
        rank_score = round(normalized_score * QAFusionService._source_weight(retriever), 4)
        return {
            "citation": citation,
            "raw_score": round(raw_score, 4),
            "normalized_score": round(normalized_score, 4),
            "rank_score": rank_score,
            "source_priority": source_priority,
            "index": index,
        }

    @staticmethod
    def _normalize_score(score: float, *, retriever: str) -> float:
        if retriever == "graph":
            return min(max(score, 0.0), 1.0)
        if retriever == "keyword":
            return min(max(score / 12.0, 0.0), 1.0)
        if retriever == "vector":
            return min(max(score, 0.0), 1.0)
        return min(max(score, 0.0), 1.0)

    @staticmethod
    def _source_weight(retriever: str) -> float:
        if retriever == "graph":
            return 1.0
        if retriever == "keyword":
            return 0.92
        if retriever == "vector":
            return 0.88
        return 0.85

    @staticmethod
    def _dedupe_key(citation: QACitation) -> str:
        metadata = citation.metadata or {}
        sequence = metadata.get("sequence")
        line_type = metadata.get("line_type")
        phenomenon = metadata.get("phenomenon")
        if sequence is not None:
            return f"{citation.source_type}:{line_type}:{sequence}"
        if phenomenon:
            return f"{citation.source_type}:{line_type}:{phenomenon}"
        return f"{citation.source_type}:{citation.title}:{citation.snippet}"
