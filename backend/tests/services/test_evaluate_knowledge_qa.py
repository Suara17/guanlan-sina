import json
from pathlib import Path

from app.scripts.evaluate_knowledge_qa import evaluate_cases


def test_evaluate_cases_reports_mode_statuses(tmp_path: Path):
    chunks_path = tmp_path / "chunks.jsonl"
    embeddings_path = tmp_path / "embeddings.jsonl"

    chunk_records = [
        {
            "document_id": "aoi-guide",
            "chunk_id": "aoi-guide:p01:c01",
            "source_file": "docs/知识图谱/downloads/siemens_aoi_false_call.pdf",
            "title": "Siemens AOI False Call Reduction",
            "page": 1,
            "section": "AOI False Call",
            "text": "AOI false call reduction guidance for SMT line.",
            "text_preview": "AOI false call reduction guidance for SMT line.",
            "keywords": ["aoi", "false call", "siemens"],
            "line_types": ["SMT"],
        },
        {
            "document_id": "spi-guide",
            "chunk_id": "spi-guide:p12:c01",
            "source_file": "docs/知识图谱/downloads/se300_spi_guide.pdf",
            "title": "SE 300 Solder Paste Inspection User Guide",
            "page": 12,
            "section": "SPI Setup",
            "text": "SPI setup and solder paste inspection workflow.",
            "text_preview": "SPI setup and solder paste inspection workflow.",
            "keywords": ["spi", "solder paste inspection", "se 300"],
            "line_types": ["SMT"],
        },
    ]
    with chunks_path.open("w", encoding="utf-8") as file:
        for record in chunk_records:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")

    embedding_records = [
        {
            "chunk_id": "aoi-guide:p01:c01",
            "document_id": "aoi-guide",
            "embedding_model": "test-model",
            "vector": [1.0, 0.0, 0.0],
        },
        {
            "chunk_id": "spi-guide:p12:c01",
            "document_id": "spi-guide",
            "embedding_model": "test-model",
            "vector": [0.0, 1.0, 0.0],
        },
    ]
    with embeddings_path.open("w", encoding="utf-8") as file:
        for record in embedding_records:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")

    report = evaluate_cases(
        chunks_path=chunks_path,
        embeddings_path=embeddings_path,
        top_k=2,
    )

    assert report["chunks_available"] is True
    assert report["embeddings_available"] is True
    assert report["chunk_count"] == 2
    assert report["embedding_count"] == 2
    assert report["summary"]["keyword"]["pass"] >= 1
    assert report["summary"]["vector"]["pass"] >= 1
    assert report["summary"]["fusion"]["pass"] >= 1
    case_ids = {case["id"] for case in report["cases"]}
    assert "aoi_false_call" in case_ids
    assert "spi_setup" in case_ids
