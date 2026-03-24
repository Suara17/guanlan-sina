from __future__ import annotations

import hashlib
import re
from pathlib import Path
from typing import Any

from app.services.document_chunker import DocumentChunker, DocumentPage

try:
    from langchain_core.documents import Document
except ImportError:  # pragma: no cover - fallback for import-time safety
    Document = Any  # type: ignore[assignment]

try:
    from langchain_community.document_loaders import PyPDFLoader
except ImportError:  # pragma: no cover - fallback for import-time safety
    PyPDFLoader = None  # type: ignore[assignment]


class LangChainDocumentIngestionService:
    INGESTION_VERSION = "langchain_ingestion_v1"

    def __init__(self, *, chunker: DocumentChunker | None = None) -> None:
        self.chunker = chunker or DocumentChunker()

    def load_documents(
        self,
        file_path: Path,
        *,
        min_page_chars: int = 80,
        source_dir: Path | None = None,
    ) -> list[Document]:
        suffix = file_path.suffix.lower()
        if suffix == ".pdf":
            return self._load_pdf_documents(
                file_path=file_path,
                min_page_chars=min_page_chars,
                source_dir=source_dir,
            )
        if suffix in {".txt", ".md"}:
            return self._load_text_documents(
                file_path=file_path,
                min_page_chars=min_page_chars,
                source_dir=source_dir,
            )
        return []

    def load_pages(
        self,
        file_path: Path,
        *,
        min_page_chars: int = 80,
        source_dir: Path | None = None,
    ) -> list[DocumentPage]:
        return self.to_document_pages(
            self.load_documents(
                file_path,
                min_page_chars=min_page_chars,
                source_dir=source_dir,
            )
        )

    def to_document_pages(self, documents: list[Document]) -> list[DocumentPage]:
        pages: list[DocumentPage] = []
        for index, document in enumerate(documents, start=1):
            metadata = dict(getattr(document, "metadata", {}) or {})
            page_number = int(metadata.get("page") or index)
            pages.append(
                DocumentPage(
                    page=page_number,
                    text=str(getattr(document, "page_content", "")),
                    section=self._section_from_metadata(metadata),
                )
            )
        return pages

    def build_document_metadata(
        self,
        *,
        file_path: Path,
        source_dir: Path | None = None,
        page: int | None = None,
        section: str | None = None,
        title: str | None = None,
    ) -> dict[str, Any]:
        metadata: dict[str, Any] = {
            "document_id": self.slugify_document_id(file_path),
            "source_file": self._relative_source_file(file_path, source_dir),
            "file_type": file_path.suffix.lstrip(".").lower(),
            "title": title or file_path.stem,
            "document_hash": self.document_hash(file_path),
            "ingestion_version": self.INGESTION_VERSION,
        }
        if page is not None:
            metadata["page"] = page
        if section:
            metadata["section"] = section
        return metadata

    def document_hash(self, file_path: Path) -> str:
        digest = hashlib.sha256()
        with file_path.open("rb") as file:
            for chunk in iter(lambda: file.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()

    def _load_pdf_documents(
        self,
        *,
        file_path: Path,
        min_page_chars: int,
        source_dir: Path | None,
    ) -> list[Document]:
        if PyPDFLoader is None:
            raise RuntimeError("LangChain PDF loader is not available")

        documents = PyPDFLoader(str(file_path)).load()
        repeated_lines = self._find_repeated_lines([str(doc.page_content or "") for doc in documents])
        normalized_documents: list[Document] = []
        for index, document in enumerate(documents, start=1):
            metadata = dict(getattr(document, "metadata", {}) or {})
            page_number = int(metadata.get("page") or index)
            cleaned_text = self._clean_page_text(
                str(getattr(document, "page_content", "")),
                repeated_lines=repeated_lines,
            )
            if len(cleaned_text) < min_page_chars:
                continue
            if self._should_skip_page(cleaned_text):
                continue
            normalized_documents.append(
                Document(
                    page_content=cleaned_text,
                    metadata=self.build_document_metadata(
                        file_path=file_path,
                        source_dir=source_dir,
                        page=page_number,
                        section=self._section_from_metadata(metadata),
                        title=metadata.get("title") if isinstance(metadata.get("title"), str) else file_path.stem,
                    ),
                )
            )
        return normalized_documents

    def _load_text_documents(
        self,
        *,
        file_path: Path,
        min_page_chars: int,
        source_dir: Path | None,
    ) -> list[Document]:
        text = file_path.read_text(encoding="utf-8")
        cleaned_text = self.chunker.clean_text(text)
        if len(cleaned_text) < min_page_chars:
            return []
        title = self._extract_title_hint(file_path, cleaned_text)
        return [
            Document(
                page_content=cleaned_text,
                metadata=self.build_document_metadata(
                    file_path=file_path,
                    source_dir=source_dir,
                    page=1,
                    section=title,
                    title=title,
                ),
            )
        ]

    def _clean_page_text(self, text: str, *, repeated_lines: set[str]) -> str:
        kept_lines: list[str] = []
        for raw_line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
            normalized = self._normalize_line(raw_line)
            if normalized and normalized in repeated_lines:
                continue
            kept_lines.append(raw_line)
        cleaned_text = "\n".join(kept_lines)
        return self.chunker.clean_text(cleaned_text)

    def _find_repeated_lines(self, page_texts: list[str]) -> set[str]:
        line_counts: dict[str, int] = {}
        min_repeat_count = max(3, len(page_texts) // 5) if page_texts else 3
        for text in page_texts:
            seen_in_page: set[str] = set()
            for raw_line in text.splitlines():
                line = self._normalize_line(raw_line)
                if not line or line in seen_in_page:
                    continue
                seen_in_page.add(line)
                line_counts[line] = line_counts.get(line, 0) + 1

        repeated: set[str] = set()
        for line, count in line_counts.items():
            if count < min_repeat_count:
                continue
            if len(line) > 140:
                continue
            if self._looks_like_header_or_footer(line):
                repeated.add(line)
        return repeated

    @staticmethod
    def _normalize_line(line: str) -> str:
        normalized = " ".join(line.strip().split())
        normalized = re.sub(r"page\s+\d+\s*(of\s+\d+)?", "page", normalized, flags=re.IGNORECASE)
        normalized = re.sub(r"\b\d+\b", "#", normalized)
        return normalized.lower()

    @staticmethod
    def _looks_like_header_or_footer(line: str) -> bool:
        patterns = (
            "page",
            "www.",
            "http",
            "copyright",
            "user operation guide",
            "operation manual",
            "help guide",
            "revision",
            "r1.",
        )
        return any(pattern in line for pattern in patterns)

    @staticmethod
    def _should_skip_page(text: str) -> bool:
        normalized = " ".join(text.lower().split())
        skip_patterns = (
            "copyright and disclaimer",
            "copyright notice",
            "all rights reserved",
            "global headquarters",
            "european headquarters",
            "about siemens",
            "about the author",
            "references:",
            "reference:",
            "table of contents",
            "contents",
            "contact customer service",
            "trademarks can be found here",
        )
        if any(pattern in normalized for pattern in skip_patterns):
            return True
        citation_markers = normalized.count("[") + normalized.count("doi") + normalized.count(" et al")
        return citation_markers >= 6 and len(normalized) < 2500

    @staticmethod
    def _extract_title_hint(file_path: Path, text: str) -> str:
        for line in text.splitlines():
            normalized = line.strip()
            if normalized:
                return normalized[:120]
        return file_path.stem

    @classmethod
    def slugify_document_id(cls, file_path: Path) -> str:
        stem = file_path.stem.lower()
        normalized = re.sub(r"[\s\[\]\(\)（）]+", "_", stem)
        normalized = re.sub(r"[^a-z0-9_\u4e00-\u9fff-]+", "_", normalized)
        normalized = re.sub(r"_+", "_", normalized).strip("_")
        return normalized or "document"

    @staticmethod
    def _relative_source_file(file_path: Path, source_dir: Path | None) -> str:
        if source_dir is None:
            return file_path.as_posix()
        try:
            return file_path.relative_to(source_dir.parent).as_posix()
        except ValueError:
            return file_path.as_posix()

    @staticmethod
    def _section_from_metadata(metadata: dict[str, Any]) -> str | None:
        for key in ("section", "title", "heading"):
            value = metadata.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        return None
