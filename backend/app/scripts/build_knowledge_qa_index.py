import argparse
import json
import re
import sys
from dataclasses import asdict
from pathlib import Path
from time import sleep
from typing import Any


project_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(project_root))

from app.core.config import settings
from app.services.document_chunker import DocumentChunk, DocumentChunker, DocumentPage
from app.services.embedding_service import EmbeddingService


SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md"}
DEFAULT_INCLUDE_KEYWORDS = [
    "smt",
    "spi",
    "aoi",
    "reflow",
    "solder",
    "stencil",
    "void",
    "defect",
    "troubleshooting",
    "profil",
    "wave",
]
DEFAULT_EXCLUDE_KEYWORDS = [
    "brochure",
    "case_study",
    "case study",
    "dataset",
    "arxiv",
    "university_of_florida",
    "taxonomy",
    "academic",
    "cyclegan",
    "yolov",
    "deep learning",
    "apple supplier code",
    "regulated substances",
    "datasheet",
    "quick_reference",
    "product_comparison",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build knowledge QA document index")
    parser.add_argument(
        "--source-dir",
        default=str(project_root.parent / "docs" / "知识图谱" / "downloads"),
        help="Directory containing source documents",
    )
    parser.add_argument(
        "--output-dir",
        default=str(project_root / "app" / "data" / "knowledge_qa"),
        help="Directory to write chunks.jsonl and manifest.json",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Limit the number of processed files, 0 means no limit",
    )
    parser.add_argument(
        "--include-pattern",
        default="*",
        help="Glob pattern used inside source-dir",
    )
    parser.add_argument(
        "--with-embeddings",
        action="store_true",
        help="Generate embeddings.jsonl if embedding config is available",
    )
    parser.add_argument(
        "--include-keywords",
        nargs="*",
        default=DEFAULT_INCLUDE_KEYWORDS,
        help="Only keep files whose normalized names contain at least one keyword",
    )
    parser.add_argument(
        "--exclude-keywords",
        nargs="*",
        default=DEFAULT_EXCLUDE_KEYWORDS,
        help="Skip files whose normalized names contain any keyword",
    )
    parser.add_argument(
        "--min-page-chars",
        type=int,
        default=80,
        help="Skip PDF pages whose cleaned extracted text is below this threshold",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source_dir = Path(args.source_dir).resolve()
    output_dir = Path(args.output_dir).resolve()

    if not source_dir.exists():
        print(f"Source directory does not exist: {source_dir}")
        return 1

    output_dir.mkdir(parents=True, exist_ok=True)
    chunker = DocumentChunker()
    files = collect_source_files(
        source_dir=source_dir,
        include_pattern=args.include_pattern,
        limit=args.limit,
        include_keywords=args.include_keywords,
        exclude_keywords=args.exclude_keywords,
    )
    if not files:
        print("No supported documents found.")
        return 1

    all_chunk_records: list[dict[str, Any]] = []
    processed_files: list[dict[str, Any]] = []

    for file_path in files:
        try:
            pages = load_document_pages(
                file_path=file_path,
                chunker=chunker,
                min_page_chars=args.min_page_chars,
            )
            if not pages:
                print(f"Skipped {file_path.name}: no usable text pages")
                continue
            document_id = slugify_document_id(file_path)
            chunks = chunker.chunk_pages(document_id=document_id, pages=pages)
            if not chunks:
                print(f"Skipped {file_path.name}: no chunks generated")
                continue
            chunk_records = [
                chunk_to_record(chunk=chunk, file_path=file_path, source_dir=source_dir)
                for chunk in chunks
            ]
            all_chunk_records.extend(chunk_records)
            processed_files.append(
                {
                    "document_id": document_id,
                    "source_file": file_path.relative_to(source_dir.parent).as_posix(),
                    "file_type": file_path.suffix.lstrip(".").lower(),
                    "chunk_count": len(chunk_records),
                    "page_count": len(pages),
                }
            )
            print(f"Indexed {file_path.name}: {len(chunk_records)} chunks")
        except Exception as exc:
            print(f"Failed to index {file_path.name}: {exc}")

    write_jsonl(output_dir / "chunks.jsonl", all_chunk_records)

    embeddings_enabled = False
    embedding_output = output_dir / "embeddings.jsonl"
    if args.with_embeddings:
        embeddings_enabled = maybe_write_embeddings(
            output_path=embedding_output,
            chunk_records=all_chunk_records,
        )

    manifest = {
        "source_dir": str(source_dir),
        "output_dir": str(output_dir),
        "document_count": len(processed_files),
        "chunk_count": len(all_chunk_records),
        "embeddings_enabled": embeddings_enabled,
        "embedding_provider": settings.EMBEDDING_PROVIDER,
        "embedding_model": settings.EMBEDDING_MODEL,
        "files": processed_files,
    }
    write_json(output_dir / "manifest.json", manifest)

    print(
        f"Completed index build: documents={manifest['document_count']} "
        f"chunks={manifest['chunk_count']} embeddings={manifest['embeddings_enabled']}"
    )
    return 0


def collect_source_files(
    *,
    source_dir: Path,
    include_pattern: str,
    limit: int,
    include_keywords: list[str] | None = None,
    exclude_keywords: list[str] | None = None,
) -> list[Path]:
    files = sorted(
        file_path
        for file_path in source_dir.rglob(include_pattern)
        if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_EXTENSIONS
    )
    deduped_files: list[Path] = []
    seen_names: set[str] = set()
    for file_path in files:
        normalized_name = normalize_file_name(file_path)
        if normalized_name in seen_names:
            continue
        if include_keywords and not any(keyword in normalized_name for keyword in include_keywords):
            continue
        if exclude_keywords and any(keyword in normalized_name for keyword in exclude_keywords):
            continue
        seen_names.add(normalized_name)
        deduped_files.append(file_path)
    if limit > 0:
        return deduped_files[:limit]
    return deduped_files


def load_document_pages(
    *,
    file_path: Path,
    chunker: DocumentChunker,
    min_page_chars: int,
) -> list[DocumentPage]:
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        pages = chunker.load_pdf_pages(file_path)
        return normalize_pdf_pages(pages, chunker=chunker, min_page_chars=min_page_chars)
    text = file_path.read_text(encoding="utf-8")
    cleaned_text = chunker.clean_text(text)
    if len(cleaned_text) < min_page_chars:
        return []
    return [DocumentPage(page=1, text=cleaned_text, section=extract_title_hint(file_path, cleaned_text))]


def extract_title_hint(file_path: Path, text: str) -> str | None:
    for line in text.splitlines():
        normalized = line.strip()
        if normalized:
            return normalized[:120]
    return file_path.stem


def slugify_document_id(file_path: Path) -> str:
    stem = file_path.stem.lower()
    normalized = re.sub(r"[\s\[\]\(\)（）]+", "_", stem)
    normalized = re.sub(r"[^a-z0-9_\u4e00-\u9fff-]+", "_", normalized)
    normalized = re.sub(r"_+", "_", normalized).strip("_")
    return normalized or "document"


def normalize_file_name(file_path: Path) -> str:
    normalized = file_path.stem.lower()
    normalized = re.sub(r"\s*\(\d+\)$", "", normalized)
    normalized = normalized.replace("–", "-")
    normalized = normalized.replace("__", "_")
    return normalized


def normalize_pdf_pages(
    pages: list[DocumentPage],
    *,
    chunker: DocumentChunker,
    min_page_chars: int,
) -> list[DocumentPage]:
    repeated_lines = find_repeated_lines(pages)
    normalized_pages: list[DocumentPage] = []
    for page in pages:
        cleaned_text = strip_repeated_lines(page.text, repeated_lines)
        cleaned_text = chunker.clean_text(cleaned_text)
        if len(cleaned_text) < min_page_chars:
            continue
        if should_skip_page(cleaned_text):
            continue
        normalized_pages.append(
            DocumentPage(page=page.page, text=cleaned_text, section=page.section)
        )
    return normalized_pages


def find_repeated_lines(pages: list[DocumentPage]) -> set[str]:
    line_counts: dict[str, int] = {}
    min_repeat_count = max(3, len(pages) // 5) if pages else 3
    for page in pages:
        seen_in_page: set[str] = set()
        for raw_line in page.text.splitlines():
            line = normalize_line(raw_line)
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
        if looks_like_header_or_footer(line):
            repeated.add(line)
    return repeated


def strip_repeated_lines(text: str, repeated_lines: set[str]) -> str:
    kept_lines: list[str] = []
    for raw_line in text.splitlines():
        normalized = normalize_line(raw_line)
        if normalized and normalized in repeated_lines:
            continue
        kept_lines.append(raw_line)
    return "\n".join(kept_lines)


def normalize_line(line: str) -> str:
    normalized = " ".join(line.strip().split())
    normalized = re.sub(r"page\s+\d+\s*(of\s+\d+)?", "page", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"\b\d+\b", "#", normalized)
    return normalized.lower()


def looks_like_header_or_footer(line: str) -> bool:
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


def should_skip_page(text: str) -> bool:
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

    # Skip likely reference pages dominated by citations.
    citation_markers = normalized.count("[") + normalized.count("doi") + normalized.count(" et al")
    if citation_markers >= 6 and len(normalized) < 2500:
        return True

    return False


def chunk_to_record(
    *,
    chunk: DocumentChunk,
    file_path: Path,
    source_dir: Path,
) -> dict[str, Any]:
    record = asdict(chunk)
    record.update(
        {
            "source_file": file_path.relative_to(source_dir.parent).as_posix(),
            "title": file_path.stem,
            "file_type": file_path.suffix.lstrip(".").lower(),
        }
    )
    return record


def maybe_write_embeddings(
    *,
    output_path: Path,
    chunk_records: list[dict[str, Any]],
) -> bool:
    try:
        from app.core.config import settings
    except Exception:
        return False

    embedding_records: list[dict[str, Any]] = []
    texts = [record["text"] for record in chunk_records]
    if not texts:
        write_jsonl(output_path, embedding_records)
        return True

    embedding_service = EmbeddingService()
    batch_size = max(settings.EMBEDDING_BATCH_SIZE, 1)
    for start in range(0, len(chunk_records), batch_size):
        batch_records = chunk_records[start : start + batch_size]
        batch_texts = [record["text"] for record in batch_records]
        vectors = embedding_service.embed_documents(batch_texts)
        if vectors is None or len(vectors) != len(batch_records):
            return False

        for record, vector in zip(batch_records, vectors, strict=False):
            embedding_records.append(
                {
                    "chunk_id": record["chunk_id"],
                    "document_id": record["document_id"],
                    "embedding_provider": settings.EMBEDDING_PROVIDER,
                    "embedding_model": settings.EMBEDDING_MODEL,
                    "vector": vector,
                }
            )
        if settings.EMBEDDING_REQUEST_INTERVAL_SECONDS > 0 and start + batch_size < len(chunk_records):
            sleep(settings.EMBEDDING_REQUEST_INTERVAL_SECONDS)

    write_jsonl(output_path, embedding_records)
    return True


def write_jsonl(path: Path, records: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as file:
        for record in records:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")


def write_json(path: Path, payload: dict[str, Any]) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    raise SystemExit(main())
