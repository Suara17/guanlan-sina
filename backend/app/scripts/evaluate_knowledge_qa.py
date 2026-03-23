import argparse
import json
import sys
from pathlib import Path
from typing import Any

project_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(project_root))

from app.services.document_index_service import (
    DEFAULT_CHUNKS_PATH,
    DEFAULT_EMBEDDINGS_PATH,
    DocumentIndexService,
)
from app.services.knowledge_qa_models import QARequest
from app.services.qa_fusion_service import QAFusionService
from app.services.retrievers import KeywordRetriever, VectorRetriever


DEFAULT_REPORT_PATH = (
    Path(__file__).resolve().parents[1] / "data" / "knowledge_qa" / "evaluation_report.json"
)

DEFAULT_CASES: list[dict[str, Any]] = [
    {
        "id": "aoi_false_call",
        "question": "AOI误报降低有哪些思路？",
        "line_type": "SMT",
        "expected_terms": ["aoi", "false call", "false-call", "siemens"],
        "note": "期望命中 AOI false call reduction 相关白皮书或指南。",
    },
    {
        "id": "spi_setup",
        "question": "SPI设备手册里焊膏检测通常怎么设置和检查？",
        "line_type": "SMT",
        "expected_terms": ["spi", "solder paste inspection", "se 300"],
        "note": "期望命中 SPI 设备手册正文，而不是泛宣传材料。",
    },
    {
        "id": "solder_joint_troubleshooting",
        "question": "虚焊按照排故手册通常怎么处理？",
        "line_type": "SMT",
        "expected_terms": ["troubleshooting", "alpha", "solder", "guide"],
        "note": "期望命中排故指南正文，而不是联系方式、封底或版权页。",
    },
    {
        "id": "reflow_voiding_profile",
        "question": "回流焊空洞怎么优化温度曲线？",
        "line_type": "SMT",
        "expected_terms": ["reflow", "void", "kic", "profile"],
        "note": "期望命中回流焊/温度曲线/空洞控制相关正文。",
    },
    {
        "id": "placement_offset",
        "question": "SMT贴片偏移怎么排查和校准？",
        "line_type": "SMT",
        "expected_terms": ["placement", "offset", "pick", "calibration", "校准"],
        "note": "当前已知弱项，用来观察是否仍被泛化工艺文档吞掉。",
    },
]


def evaluate_cases(
    *,
    chunks_path: Path,
    embeddings_path: Path,
    top_k: int,
) -> dict[str, Any]:
    index_service = DocumentIndexService(
        chunks_path=chunks_path,
        embeddings_path=embeddings_path,
    )
    keyword_retriever = KeywordRetriever(index_service)
    vector_retriever = VectorRetriever(index_service)
    fusion_service = QAFusionService(max_citations=top_k)

    report_cases: list[dict[str, Any]] = []
    for case in DEFAULT_CASES:
        request = QARequest(
            question=case["question"],
            line_type=case.get("line_type"),
            sequence=case.get("sequence"),
            top_k=top_k,
        )
        keyword_result = keyword_retriever.retrieve(request)
        vector_result = vector_retriever.retrieve(request)
        fusion_citations = fusion_service.merge_citations(
            graph_citations=[],
            document_citations=[
                *keyword_result.citations,
                *vector_result.citations,
            ],
        )
        fusion_groups = fusion_service.build_citation_groups(citations=fusion_citations)
        report_cases.append(
            {
                "id": case["id"],
                "question": case["question"],
                "line_type": case.get("line_type"),
                "sequence": case.get("sequence"),
                "expected_terms": case["expected_terms"],
                "note": case["note"],
                "keyword": _mode_report(
                    hits=keyword_result.hits,
                    expected_terms=case["expected_terms"],
                    top_k=top_k,
                ),
                "vector": _mode_report(
                    hits=vector_result.hits,
                    expected_terms=case["expected_terms"],
                    top_k=top_k,
                ),
                "fusion": _citation_mode_report(
                    citations=fusion_citations,
                    expected_terms=case["expected_terms"],
                    top_k=top_k,
                    groups=fusion_groups,
                ),
            }
        )

    return {
        "chunks_path": str(chunks_path),
        "embeddings_path": str(embeddings_path),
        "chunks_available": index_service.chunks_available,
        "embeddings_available": index_service.embeddings_available,
        "chunk_count": len(index_service.get_chunks()),
        "embedding_count": len(index_service.get_embeddings()),
        "top_k": top_k,
        "cases": report_cases,
        "summary": _summarize_cases(report_cases),
    }


def _mode_report(
    *,
    hits: list[dict[str, Any]],
    expected_terms: list[str],
    top_k: int,
) -> dict[str, Any]:
    top_hits = hits[:top_k]
    return {
        "status": _judge_status(
            texts=[_flatten_hit_text(hit) for hit in top_hits],
            expected_terms=expected_terms,
        ),
        "top_hits": [_serialize_hit(hit) for hit in top_hits],
    }


def _citation_mode_report(
    *,
    citations: list[Any],
    expected_terms: list[str],
    top_k: int,
    groups: dict[str, list[Any]],
) -> dict[str, Any]:
    top_citations = citations[:top_k]
    return {
        "status": _judge_status(
            texts=[_flatten_citation_text(citation) for citation in top_citations],
            expected_terms=expected_terms,
        ),
        "top_hits": [_serialize_citation(citation) for citation in top_citations],
        "groups": {
            key: len(value)
            for key, value in groups.items()
            if value
        },
    }


def _judge_status(*, texts: list[str], expected_terms: list[str]) -> str:
    normalized_terms = [term.lower() for term in expected_terms]
    for text in texts[:1]:
        if any(term in text for term in normalized_terms):
            return "pass"
    for text in texts:
        if any(term in text for term in normalized_terms):
            return "partial"
    return "fail"


def _flatten_hit_text(hit: dict[str, Any]) -> str:
    parts = [
        str(hit.get("title") or ""),
        str(hit.get("section") or ""),
        str(hit.get("source_file") or ""),
        str(hit.get("text_preview") or ""),
    ]
    return " ".join(parts).lower()


def _flatten_citation_text(citation: Any) -> str:
    metadata = citation.metadata or {}
    parts = [
        str(citation.title or ""),
        str(citation.snippet or ""),
        str(metadata.get("section") or ""),
        str(metadata.get("source_file") or ""),
    ]
    return " ".join(parts).lower()


def _serialize_hit(hit: dict[str, Any]) -> dict[str, Any]:
    return {
        "title": hit.get("title"),
        "page": hit.get("page"),
        "section": hit.get("section"),
        "chunk_id": hit.get("chunk_id"),
        "score": hit.get("rank_score") or hit.get("match_score") or hit.get("similarity_score"),
        "source_file": hit.get("source_file"),
        "text_preview": hit.get("text_preview"),
    }


def _serialize_citation(citation: Any) -> dict[str, Any]:
    metadata = citation.metadata or {}
    return {
        "retriever": metadata.get("retriever"),
        "title": citation.title,
        "score": citation.score,
        "page": metadata.get("page"),
        "section": metadata.get("section"),
        "chunk_id": metadata.get("chunk_id"),
        "source_file": metadata.get("source_file"),
        "snippet": citation.snippet,
    }


def _summarize_cases(cases: list[dict[str, Any]]) -> dict[str, Any]:
    summary: dict[str, dict[str, int]] = {
        "keyword": {"pass": 0, "partial": 0, "fail": 0},
        "vector": {"pass": 0, "partial": 0, "fail": 0},
        "fusion": {"pass": 0, "partial": 0, "fail": 0},
    }
    for case in cases:
        for mode in ("keyword", "vector", "fusion"):
            status = str(case[mode]["status"])
            summary[mode][status] += 1
    return summary


def _print_summary(report: dict[str, Any]) -> None:
    _safe_print("Knowledge QA Regression Report")
    _safe_print(
        f"chunks={report['chunk_count']} embeddings={report['embedding_count']} top_k={report['top_k']}"
    )
    for mode in ("keyword", "vector", "fusion"):
        mode_summary = report["summary"][mode]
        _safe_print(
            f"{mode}: pass={mode_summary['pass']} partial={mode_summary['partial']} fail={mode_summary['fail']}"
        )
    _safe_print("")
    for case in report["cases"]:
        _safe_print(f"[{case['id']}] {case['question']}")
        _safe_print(
            f"  keyword={case['keyword']['status']} vector={case['vector']['status']} fusion={case['fusion']['status']}"
        )
        for mode in ("keyword", "vector", "fusion"):
            top_hits = case[mode]["top_hits"]
            if not top_hits:
                _safe_print(f"  {mode}: no hits")
                continue
            for index, hit in enumerate(top_hits[:2], start=1):
                title = hit.get("title") or "N/A"
                section = hit.get("section") or "N/A"
                score = hit.get("score")
                page = hit.get("page")
                _safe_print(
                    f"  {mode}#{index}: title={title} page={page} section={section} score={score}"
                )
        _safe_print("")


def _safe_print(message: str) -> None:
    try:
        print(message)
    except UnicodeEncodeError:
        normalized = message.encode("gbk", errors="replace").decode("gbk", errors="replace")
        print(normalized)


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate document keyword/vector retrieval quality.")
    parser.add_argument("--chunks-path", type=Path, default=DEFAULT_CHUNKS_PATH)
    parser.add_argument("--embeddings-path", type=Path, default=DEFAULT_EMBEDDINGS_PATH)
    parser.add_argument("--output-path", type=Path, default=DEFAULT_REPORT_PATH)
    parser.add_argument("--top-k", type=int, default=3)
    args = parser.parse_args()

    report = evaluate_cases(
        chunks_path=args.chunks_path,
        embeddings_path=args.embeddings_path,
        top_k=args.top_k,
    )
    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    args.output_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    _print_summary(report)
    print(f"report_written={args.output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
