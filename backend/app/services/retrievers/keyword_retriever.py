import re
from typing import Any

from app.services.document_index_service import DocumentIndexService
from app.services.knowledge_qa_models import QACitation, QARequest
from app.services.retrievers.base import BaseRetriever, RetrievalResult


class KeywordRetriever(BaseRetriever):
    name = "keyword"

    def __init__(self, document_index_service: DocumentIndexService | None = None) -> None:
        self.document_index_service = document_index_service or DocumentIndexService()

    @property
    def is_available(self) -> bool:
        return self.document_index_service.chunks_available

    def retrieve(self, request: QARequest) -> RetrievalResult:
        if not self.is_available:
            return RetrievalResult()

        keywords = self._extract_keywords(request.question)
        if request.line_type:
            normalized_line_type = request.line_type.lower().strip()
            keywords = [keyword for keyword in keywords if keyword != normalized_line_type]
        chunks = self.document_index_service.get_chunks()
        ranked_items: list[tuple[float, dict[str, Any], list[str]]] = []

        for chunk in chunks:
            if request.line_type and not self._matches_line_type(chunk, request.line_type):
                continue

            searchable_text = self._build_searchable_text(chunk)
            matched_terms: list[str] = []
            score = 0.0
            keyword_match_count = 0
            matched_sequence = False

            for keyword in keywords:
                if keyword and keyword in searchable_text:
                    keyword_match_count += 1
                    matched_terms.append(keyword)
                    score += min(len(keyword), 6) * 1.2
                    if keyword in str(chunk.get("title", "")).lower():
                        score += 1.5
                    if keyword in str(chunk.get("section", "")).lower():
                        score += 1.2
                    if keyword in {str(item).lower() for item in chunk.get("keywords", [])}:
                        score += 1.0

            if request.sequence is not None and request.sequence == self._extract_sequence(chunk):
                matched_sequence = True
                matched_terms.append(f"sequence:{request.sequence}")
                score += 8.0

            if request.line_type and self._matches_line_type(chunk, request.line_type):
                matched_terms.append(f"line_type:{request.line_type}")
                score += 3.0

            if keyword_match_count == 0 and not matched_sequence:
                continue

            if score <= 0:
                continue

            ranked_items.append((score, chunk, self._unique_non_empty(matched_terms)))

        ranked_items.sort(
            key=lambda item: (
                item[0],
                int(item[1].get("page") or 0),
            ),
            reverse=True,
        )
        selected_items = ranked_items[: request.top_k]

        hits: list[dict[str, Any]] = []
        citations: list[QACitation] = []
        for score, chunk, matched_terms in selected_items:
            hit = {
                "document_id": chunk.get("document_id"),
                "chunk_id": chunk.get("chunk_id"),
                "title": chunk.get("title"),
                "page": chunk.get("page"),
                "section": chunk.get("section"),
                "source_file": chunk.get("source_file"),
                "matched_terms": matched_terms,
                "match_score": round(score, 2),
                "rank_score": round(score, 2),
                "text_preview": chunk.get("text_preview"),
            }
            hits.append(hit)

            citations.append(
                QACitation(
                    source_type="document",
                    title=str(chunk.get("title") or chunk.get("document_id") or "文档片段"),
                    snippet=self._truncate(str(chunk.get("text_preview") or chunk.get("text") or "")),
                    score=round(score, 2),
                    metadata={
                        "retriever": self.name,
                        "matched_terms": matched_terms,
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

    @staticmethod
    def _build_searchable_text(chunk: dict[str, Any]) -> str:
        parts = [
            str(chunk.get("title", "")),
            str(chunk.get("section", "")),
            str(chunk.get("text", "")),
            str(chunk.get("text_preview", "")),
            " ".join(str(item) for item in chunk.get("keywords", [])),
            " ".join(str(item) for item in chunk.get("line_types", [])),
        ]
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
    def _truncate(text: str, limit: int = 220) -> str:
        normalized = " ".join(text.split())
        if len(normalized) <= limit:
            return normalized
        return f"{normalized[: limit - 3]}..."

    @staticmethod
    def _matches_line_type(chunk: dict[str, Any], line_type: str) -> bool:
        normalized_line_type = line_type.lower()
        line_types = [str(item).lower() for item in chunk.get("line_types", [])]
        if normalized_line_type in line_types:
            return True
        searchable_text = KeywordRetriever._build_searchable_text(chunk)
        return normalized_line_type in searchable_text

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
            match = re.search(r"(?:异常|sequence[:：\s-]*)(\d+)|(\d+)\s*号异常", str(candidate), re.IGNORECASE)
            if match:
                return int(match.group(1) or match.group(2))
        return None

    @staticmethod
    def _unique_non_empty(values: list[str]) -> list[str]:
        unique_values: list[str] = []
        for value in values:
            if value and value not in unique_values:
                unique_values.append(value)
        return unique_values
