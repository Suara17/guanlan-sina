import json
from pathlib import Path

from app.services.document_index_service import DocumentIndexService
from app.services.knowledge_qa_models import QARequest
from app.services.retrievers import VectorRetriever


def test_vector_retriever_returns_semantic_document_hits(tmp_path: Path):
    chunks_path = tmp_path / "chunks.jsonl"
    records = [
        {
            "document_id": "smt-guide",
            "chunk_id": "smt-guide:p12:c01",
            "source_file": "docs/知识图谱/downloads/smt-guide.pdf",
            "title": "SMT Troubleshooting Guide",
            "page": 12,
            "section": "Placement Offset",
            "text": "贴片偏移通常与吸嘴磨损、贴装坐标漂移和供料不稳定有关，建议重新校准设备。",
            "text_preview": "贴片偏移通常与吸嘴磨损、贴装坐标漂移和供料不稳定有关，建议重新校准设备。",
            "keywords": ["贴片偏移", "吸嘴磨损", "校准"],
            "line_types": ["SMT"],
        },
        {
            "document_id": "reflow-guide",
            "chunk_id": "reflow-guide:p05:c01",
            "source_file": "docs/知识图谱/downloads/reflow-guide.pdf",
            "title": "Reflow Process Guide",
            "page": 5,
            "section": "虚焊",
            "text": "虚焊常见原因包括温度曲线异常和助焊剂活性不足。",
            "text_preview": "虚焊常见原因包括温度曲线异常和助焊剂活性不足。",
            "keywords": ["虚焊", "回流焊"],
            "line_types": ["SMT"],
        },
    ]
    with chunks_path.open("w", encoding="utf-8") as file:
        for record in records:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")

    retriever = VectorRetriever(DocumentIndexService(chunks_path=chunks_path))

    result = retriever.retrieve(
        QARequest(question="贴片位置偏移怎么校准", line_type="SMT", top_k=3)
    )

    assert len(result.hits) >= 1
    assert result.hits[0]["document_id"] == "smt-guide"
    assert result.hits[0]["similarity_score"] > 0
    assert result.citations[0].metadata["retriever"] == "vector"
    assert result.citations[0].metadata["chunk_id"] == "smt-guide:p12:c01"


def test_vector_retriever_uses_embedding_service_when_embeddings_available(
    tmp_path: Path, monkeypatch
):
    chunks_path = tmp_path / "chunks.jsonl"
    embeddings_path = tmp_path / "embeddings.jsonl"
    records = [
        {
            "document_id": "smt-guide",
            "chunk_id": "smt-guide:p12:c01",
            "source_file": "docs/知识图谱/downloads/smt-guide.pdf",
            "title": "SMT Troubleshooting Guide",
            "page": 12,
            "section": "Placement Offset",
            "text": "贴片偏移通常与吸嘴磨损有关。",
            "text_preview": "贴片偏移通常与吸嘴磨损有关。",
            "keywords": ["贴片偏移", "吸嘴磨损"],
            "line_types": ["SMT"],
        },
        {
            "document_id": "reflow-guide",
            "chunk_id": "reflow-guide:p05:c01",
            "source_file": "docs/知识图谱/downloads/reflow-guide.pdf",
            "title": "Reflow Process Guide",
            "page": 5,
            "section": "虚焊",
            "text": "虚焊常见原因包括温度曲线异常。",
            "text_preview": "虚焊常见原因包括温度曲线异常。",
            "keywords": ["虚焊"],
            "line_types": ["SMT"],
        },
    ]
    vectors = [
        {
            "chunk_id": "smt-guide:p12:c01",
            "document_id": "smt-guide",
            "embedding_model": "test-model",
            "vector": [1.0, 0.0, 0.0],
        },
        {
            "chunk_id": "reflow-guide:p05:c01",
            "document_id": "reflow-guide",
            "embedding_model": "test-model",
            "vector": [0.0, 1.0, 0.0],
        },
    ]
    with chunks_path.open("w", encoding="utf-8") as file:
        for record in records:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")
    with embeddings_path.open("w", encoding="utf-8") as file:
        for record in vectors:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")

    class StubEmbeddingService:
        def embed_query(self, text: str):
            assert "贴片位置偏移" in text
            assert "placement offset" in text
            assert "calibration" in text
            return [1.0, 0.0, 0.0]

    monkeypatch.setattr(
        "app.services.retrievers.vector_retriever.EmbeddingService",
        StubEmbeddingService,
    )

    retriever = VectorRetriever(
        DocumentIndexService(chunks_path=chunks_path, embeddings_path=embeddings_path)
    )
    result = retriever.retrieve(
        QARequest(question="贴片位置偏移怎么校准", line_type="SMT", top_k=2)
    )

    assert result.hits[0]["document_id"] == "smt-guide"


def test_vector_retriever_expands_chinese_query_for_english_document(
    tmp_path: Path, monkeypatch
):
    chunks_path = tmp_path / "chunks.jsonl"
    embeddings_path = tmp_path / "embeddings.jsonl"
    records = [
        {
            "document_id": "placement-guide",
            "chunk_id": "placement-guide:p03:c01",
            "source_file": "docs/知识图谱/downloads/placement-guide.pdf",
            "title": "SMT Troubleshooting Guide",
            "page": 3,
            "section": "Placement Offset Calibration",
            "text": "Placement offset is usually corrected by nozzle inspection and placement calibration.",
            "text_preview": "Placement offset is usually corrected by nozzle inspection and placement calibration.",
            "keywords": ["placement offset", "calibration", "nozzle"],
            "line_types": ["SMT"],
        },
        {
            "document_id": "other-guide",
            "chunk_id": "other-guide:p01:c01",
            "source_file": "docs/知识图谱/downloads/other-guide.pdf",
            "title": "Stencil Design Guide",
            "page": 1,
            "section": "Stencil",
            "text": "Stencil design improves solder paste printing stability.",
            "text_preview": "Stencil design improves solder paste printing stability.",
            "keywords": ["stencil"],
            "line_types": ["SMT"],
        },
    ]
    vectors = [
        {
            "chunk_id": "placement-guide:p03:c01",
            "document_id": "placement-guide",
            "embedding_model": "test-model",
            "vector": [1.0, 0.0, 0.0],
        },
        {
            "chunk_id": "other-guide:p01:c01",
            "document_id": "other-guide",
            "embedding_model": "test-model",
            "vector": [0.0, 1.0, 0.0],
        },
    ]
    with chunks_path.open("w", encoding="utf-8") as file:
        for record in records:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")
    with embeddings_path.open("w", encoding="utf-8") as file:
        for record in vectors:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")

    class StubEmbeddingService:
        def embed_query(self, text: str):
            assert "placement offset" in text
            assert "pick and place offset" in text
            return [1.0, 0.0, 0.0]

    monkeypatch.setattr(
        "app.services.retrievers.vector_retriever.EmbeddingService",
        StubEmbeddingService,
    )

    retriever = VectorRetriever(
        DocumentIndexService(chunks_path=chunks_path, embeddings_path=embeddings_path)
    )
    result = retriever.retrieve(
        QARequest(question="SMT贴片偏移怎么排查和校准", line_type="SMT", top_k=2)
    )

    assert result.hits[0]["document_id"] == "placement-guide"
