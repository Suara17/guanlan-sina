from pathlib import Path

from app.core.config import settings
from app.scripts.build_knowledge_qa_index import (
    chunk_to_record,
    collect_source_files,
    maybe_write_embeddings,
    slugify_document_id,
)
from app.services.document_chunker import DocumentChunk


def test_collect_source_files_filters_supported_extensions(tmp_path: Path):
    downloads_dir = tmp_path / "downloads"
    downloads_dir.mkdir()
    (downloads_dir / "guide.pdf").write_text("fake", encoding="utf-8")
    (downloads_dir / "notes.txt").write_text("hello", encoding="utf-8")
    (downloads_dir / "draft.md").write_text("# title", encoding="utf-8")
    (downloads_dir / "ignore.csv").write_text("a,b", encoding="utf-8")

    files = collect_source_files(
        source_dir=downloads_dir,
        include_pattern="*",
        limit=0,
    )

    assert [file.name for file in files] == ["draft.md", "guide.pdf", "notes.txt"]


def test_slugify_document_id_normalizes_file_name():
    file_path = Path(r"E:\repo\docs\知识图谱\downloads\04 [SMT排故] SMT Troubleshooting Guide 2017 (Alpha).pdf")

    document_id = slugify_document_id(file_path)

    assert document_id.startswith("04_")
    assert document_id.endswith("_smt_troubleshooting_guide_2017_alpha")


def test_chunk_to_record_includes_source_metadata(tmp_path: Path):
    source_root = tmp_path / "docs"
    downloads_dir = source_root / "downloads"
    downloads_dir.mkdir(parents=True)
    file_path = downloads_dir / "example.txt"
    file_path.write_text("content", encoding="utf-8")

    chunk = DocumentChunk(
        chunk_id="example:p1:c01",
        document_id="example",
        page=1,
        chunk_index=1,
        text="Process window should be controlled carefully.",
        text_preview="Process window should be controlled carefully.",
        section="Process Control",
        keywords=["process", "window"],
        tokens_estimate=6,
    )

    record = chunk_to_record(
        chunk=chunk,
        file_path=file_path,
        source_dir=downloads_dir,
    )

    assert record["source_file"] == "downloads/example.txt"
    assert record["title"] == "example"
    assert record["file_type"] == "txt"


def test_maybe_write_embeddings_uses_embedding_service(tmp_path: Path, monkeypatch):
    output_path = tmp_path / "embeddings.jsonl"
    chunk_records = [
        {
            "chunk_id": "doc:p1:c01",
            "document_id": "doc",
            "text": "贴片偏移与吸嘴磨损有关",
        },
        {
            "chunk_id": "doc:p1:c02",
            "document_id": "doc",
            "text": "虚焊常见原因包括温度曲线异常",
        },
    ]

    class StubEmbeddingService:
        def embed_documents(self, texts: list[str]):
            if texts == ["贴片偏移与吸嘴磨损有关"]:
                return [[0.1, 0.2, 0.3]]
            if texts == ["虚焊常见原因包括温度曲线异常"]:
                return [[0.4, 0.5, 0.6]]
            raise AssertionError(f"unexpected texts: {texts}")

    monkeypatch.setattr(
        "app.scripts.build_knowledge_qa_index.EmbeddingService",
        StubEmbeddingService,
    )
    monkeypatch.setattr(settings, "EMBEDDING_BATCH_SIZE", 1)

    enabled = maybe_write_embeddings(output_path=output_path, chunk_records=chunk_records)

    assert enabled is True
    lines = output_path.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 2
    assert '"embedding_model"' in lines[0]
