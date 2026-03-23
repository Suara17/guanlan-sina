import json
from pathlib import Path

from app.services.document_index_service import DocumentIndexService
from app.services.knowledge_qa_models import QARequest
from app.services.retrievers import KeywordRetriever


def test_keyword_retriever_returns_ranked_document_hits(tmp_path: Path):
    chunks_path = tmp_path / "chunks.jsonl"
    records = [
        {
            "document_id": "smt-guide",
            "chunk_id": "smt-guide:p12:c01",
            "source_file": "docs/知识图谱/downloads/smt-guide.pdf",
            "title": "SMT Troubleshooting Guide",
            "page": 12,
            "section": "Placement Offset",
            "text": "贴片偏移通常与吸嘴磨损、贴装坐标漂移和供料不稳定有关。",
            "text_preview": "贴片偏移通常与吸嘴磨损、贴装坐标漂移和供料不稳定有关。",
            "keywords": ["贴片偏移", "吸嘴磨损", "placement"],
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

    retriever = KeywordRetriever(DocumentIndexService(chunks_path=chunks_path))

    result = retriever.retrieve(
        QARequest(question="SMT贴片偏移怎么处理", line_type="SMT", top_k=3)
    )

    assert len(result.hits) == 1
    assert result.hits[0]["document_id"] == "smt-guide"
    assert result.hits[0]["chunk_id"] == "smt-guide:p12:c01"
    assert "贴片偏移" in result.hits[0]["matched_terms"]
    assert result.citations[0].metadata["retriever"] == "keyword"
    assert result.citations[0].metadata["page"] == 12
