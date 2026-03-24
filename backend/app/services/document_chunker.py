from dataclasses import dataclass, field
from pathlib import Path
import re
from typing import Any


HEADING_PREFIXES = (
    "chapter",
    "section",
    "part",
    "appendix",
    "步骤",
    "第",
)

HEADING_PATTERN = re.compile(r"^(?:\d+(?:\.\d+)*[\).]?\s+)?[A-Z][A-Z0-9 /_-]{2,}$")
LIST_ITEM_PATTERN = re.compile(r"^(?:[-*•]|\d+[\).])\s+")


@dataclass(frozen=True)
class DocumentPage:
    page: int
    text: str
    section: str | None = None


@dataclass(frozen=True)
class DocumentChunk:
    chunk_id: str
    document_id: str
    page: int
    chunk_index: int
    text: str
    text_preview: str
    section: str | None = None
    keywords: list[str] = field(default_factory=list)
    tokens_estimate: int = 0


class DocumentChunker:
    def __init__(
        self,
        *,
        target_chars: int = 700,
        max_chars: int = 1000,
        overlap_chars: int = 120,
        min_chunk_chars: int = 120,
        preview_chars: int = 180,
    ) -> None:
        self.target_chars = target_chars
        self.max_chars = max_chars
        self.overlap_chars = overlap_chars
        self.min_chunk_chars = min_chunk_chars
        self.preview_chars = preview_chars

    def load_pdf_pages(self, pdf_path: str | Path) -> list[DocumentPage]:
        try:
            from langchain_community.document_loaders import PyPDFLoader
        except ImportError as exc:
            raise RuntimeError("LangChain PDF loader is not available") from exc

        loader = PyPDFLoader(str(pdf_path))
        documents = loader.load()
        pages: list[DocumentPage] = []
        for index, document in enumerate(documents, start=1):
            metadata = document.metadata or {}
            page_number = int(metadata.get("page") or index - 1) + 1
            pages.append(
                DocumentPage(
                    page=page_number,
                    text=document.page_content,
                    section=self._extract_section_hint(metadata),
                )
            )
        return pages

    def chunk_text(
        self,
        *,
        document_id: str,
        text: str,
        page: int = 1,
        section: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> list[DocumentChunk]:
        _ = metadata
        return self.chunk_pages(
            document_id=document_id,
            pages=[DocumentPage(page=page, text=text, section=section)],
        )

    def clean_text(self, text: str) -> str:
        normalized = text.replace("\r\n", "\n").replace("\r", "\n")
        normalized = re.sub(r"[ \t]+", " ", normalized)
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)

        cleaned_lines: list[str] = []
        previous_line = ""
        for raw_line in normalized.split("\n"):
            line = raw_line.strip()
            if not line:
                if cleaned_lines and cleaned_lines[-1] != "":
                    cleaned_lines.append("")
                previous_line = ""
                continue
            if self._is_noise_line(line):
                continue
            if (
                cleaned_lines
                and cleaned_lines[-1] != ""
                and self._should_merge_with_previous(previous_line, line)
            ):
                cleaned_lines[-1] = f"{cleaned_lines[-1]} {line}"
            else:
                cleaned_lines.append(line)
            previous_line = line

        while cleaned_lines and cleaned_lines[-1] == "":
            cleaned_lines.pop()

        return "\n".join(cleaned_lines)

    def chunk_pages(
        self,
        *,
        document_id: str,
        pages: list[DocumentPage],
    ) -> list[DocumentChunk]:
        chunks: list[DocumentChunk] = []
        section_hint: str | None = None

        for page in pages:
            cleaned_text = self.clean_text(page.text)
            if not cleaned_text:
                continue
            page_section = page.section or section_hint
            paragraphs = self._split_paragraphs(cleaned_text)
            page_chunks, section_hint = self._build_page_chunks(
                document_id=document_id,
                page=page.page,
                paragraphs=paragraphs,
                section_hint=page_section,
            )
            chunks.extend(page_chunks)

        return chunks

    def _build_page_chunks(
        self,
        *,
        document_id: str,
        page: int,
        paragraphs: list[str],
        section_hint: str | None,
    ) -> tuple[list[DocumentChunk], str | None]:
        chunks: list[DocumentChunk] = []
        current_lines: list[str] = []
        current_section = section_hint
        chunk_index = 1

        for paragraph in paragraphs:
            if self._is_heading(paragraph):
                current_section = paragraph
                if current_lines:
                    chunks.append(
                        self._build_chunk(
                            document_id=document_id,
                            page=page,
                            chunk_index=chunk_index,
                            section=current_section,
                            text="\n".join(current_lines),
                        )
                    )
                    chunk_index += 1
                    current_lines = []
                continue

            candidate_lines = [*current_lines, paragraph]
            candidate_text = "\n\n".join(candidate_lines)
            if len(candidate_text) <= self.target_chars:
                current_lines = candidate_lines
                continue

            if current_lines:
                chunks.append(
                    self._build_chunk(
                        document_id=document_id,
                        page=page,
                        chunk_index=chunk_index,
                        section=current_section,
                        text="\n\n".join(current_lines),
                    )
                )
                chunk_index += 1
                current_lines = []

            if len(paragraph) <= self.max_chars:
                current_lines = [paragraph]
                continue

            for fragment in self._split_long_text(paragraph):
                chunks.append(
                    self._build_chunk(
                        document_id=document_id,
                        page=page,
                        chunk_index=chunk_index,
                        section=current_section,
                        text=fragment,
                    )
                )
                chunk_index += 1

        if current_lines:
            chunks.append(
                self._build_chunk(
                    document_id=document_id,
                    page=page,
                    chunk_index=chunk_index,
                    section=current_section,
                    text="\n\n".join(current_lines),
                )
            )

        merged_chunks = self._merge_small_chunks(chunks)
        return merged_chunks, current_section

    def _merge_small_chunks(self, chunks: list[DocumentChunk]) -> list[DocumentChunk]:
        if not chunks:
            return []

        merged: list[DocumentChunk] = []
        buffer_chunk: DocumentChunk | None = None

        for chunk in chunks:
            if buffer_chunk is None:
                buffer_chunk = chunk
                continue

            if (
                len(buffer_chunk.text) < self.min_chunk_chars
                and len(buffer_chunk.text) + len(chunk.text) + 2 <= self.max_chars
                and buffer_chunk.page == chunk.page
                and buffer_chunk.section == chunk.section
            ):
                buffer_chunk = self._build_chunk(
                    document_id=buffer_chunk.document_id,
                    page=buffer_chunk.page,
                    chunk_index=buffer_chunk.chunk_index,
                    section=buffer_chunk.section,
                    text=f"{buffer_chunk.text}\n\n{chunk.text}",
                )
                continue

            merged.append(buffer_chunk)
            buffer_chunk = chunk

        if buffer_chunk is not None:
            merged.append(buffer_chunk)

        return [
            self._build_chunk(
                document_id=chunk.document_id,
                page=chunk.page,
                chunk_index=index,
                section=chunk.section,
                text=chunk.text,
            )
            for index, chunk in enumerate(merged, start=1)
        ]

    def _build_chunk(
        self,
        *,
        document_id: str,
        page: int,
        chunk_index: int,
        section: str | None,
        text: str,
    ) -> DocumentChunk:
        normalized_text = text.strip()
        preview = normalized_text[: self.preview_chars].strip()
        if len(normalized_text) > self.preview_chars:
            preview = f"{preview}..."
        return DocumentChunk(
            chunk_id=f"{document_id}:p{page}:c{chunk_index:02d}",
            document_id=document_id,
            page=page,
            chunk_index=chunk_index,
            text=normalized_text,
            text_preview=preview,
            section=section,
            keywords=self._extract_keywords(normalized_text),
            tokens_estimate=max(1, len(re.findall(r"\S+", normalized_text))),
        )

    def _split_paragraphs(self, text: str) -> list[str]:
        splitter = self._get_langchain_splitter()
        if splitter is not None:
            paragraphs = [
                paragraph.strip()
                for paragraph in splitter.split_text(text)
                if paragraph.strip()
            ]
            if paragraphs:
                return paragraphs

        paragraphs = [paragraph.strip() for paragraph in text.split("\n\n")]
        return [paragraph for paragraph in paragraphs if paragraph]

    def _split_long_text(self, text: str) -> list[str]:
        words = text.split()
        if len(words) <= 1:
            return self._split_by_window(text)

        chunks: list[str] = []
        current_words: list[str] = []
        current_length = 0
        overlap_word_count = max(1, self.overlap_chars // 12)

        for word in words:
            added_length = len(word) + (1 if current_words else 0)
            if current_words and current_length + added_length > self.max_chars:
                chunks.append(" ".join(current_words))
                current_words = current_words[-overlap_word_count:]
                current_length = len(" ".join(current_words))
            current_words.append(word)
            current_length += added_length

        if current_words:
            chunks.append(" ".join(current_words))

        return [chunk.strip() for chunk in chunks if chunk.strip()]

    def _split_by_window(self, text: str) -> list[str]:
        normalized = text.strip()
        if len(normalized) <= self.max_chars:
            return [normalized]

        step = max(1, self.max_chars - self.overlap_chars)
        chunks = []
        for start in range(0, len(normalized), step):
            chunk = normalized[start : start + self.max_chars].strip()
            if chunk:
                chunks.append(chunk)
            if start + self.max_chars >= len(normalized):
                break
        return chunks

    def _extract_keywords(self, text: str, *, limit: int = 12) -> list[str]:
        tokens = re.findall(r"[\u4e00-\u9fff]{2,}|[a-z0-9][a-z0-9_-]{1,}", text.lower())
        keywords: list[str] = []
        stopwords = {
            "the",
            "and",
            "for",
            "with",
            "that",
            "this",
            "from",
            "into",
            "进行",
            "以及",
            "相关",
            "说明",
            "要求",
        }
        for token in tokens:
            if token in stopwords or token.isdigit():
                continue
            if token not in keywords:
                keywords.append(token)
            if len(keywords) >= limit:
                break
        return keywords

    def _get_langchain_splitter(self) -> Any | None:
        try:
            from langchain_text_splitters import RecursiveCharacterTextSplitter
        except ImportError:
            try:
                from langchain.text_splitter import RecursiveCharacterTextSplitter
            except ImportError:
                return None

        return RecursiveCharacterTextSplitter(
            chunk_size=self.target_chars,
            chunk_overlap=min(self.overlap_chars, max(0, self.target_chars // 3)),
            separators=["\n\n", "\n", ". ", "。", "；", ";", " "],
            length_function=len,
        )

    @staticmethod
    def _extract_section_hint(metadata: dict[str, Any]) -> str | None:
        for key in ("section", "title", "heading"):
            value = metadata.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        return None

    @staticmethod
    def _is_noise_line(line: str) -> bool:
        lowered = line.lower()
        if re.fullmatch(r"page\s+\d+(?:\s+of\s+\d+)?", lowered):
            return True
        if re.fullmatch(r"\d+\s*/\s*\d+", lowered):
            return True
        return False

    @staticmethod
    def _should_merge_with_previous(previous_line: str, current_line: str) -> bool:
        if not previous_line:
            return False
        if previous_line.endswith((".", ":", ";", "?", "!", "。", "：", "；")):
            return False
        if LIST_ITEM_PATTERN.match(current_line):
            return False
        if DocumentChunker._is_heading(current_line):
            return False
        return True

    @staticmethod
    def _is_heading(text: str) -> bool:
        stripped = text.strip()
        lowered = stripped.lower()
        if any(lowered.startswith(prefix) for prefix in HEADING_PREFIXES):
            return True
        if HEADING_PATTERN.fullmatch(stripped):
            return True
        if len(stripped) <= 40 and stripped.endswith(":"):
            return True
        return False
