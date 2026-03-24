from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from app.core.config import settings
from app.services.neo4j_service import Neo4jService


def resolve_excel_path(excel_path: str) -> Path:
    candidate = Path(excel_path)
    if candidate.is_absolute():
        return candidate

    backend_root = Path(__file__).resolve().parents[2]
    repo_root = backend_root.parent
    return (repo_root / candidate).resolve()


def import_excel_to_neo4j(excel_path: str, clear_existing: bool) -> None:
    resolved_path = resolve_excel_path(excel_path)
    if not resolved_path.exists():
        raise FileNotFoundError(f"Excel file not found: {resolved_path}")

    records = pd.read_excel(resolved_path).to_dict("records")
    print(f"Loaded {len(records)} rows from {resolved_path}")

    neo4j_service = Neo4jService(
        uri=settings.NEO4J_URI,
        user=settings.NEO4J_USER,
        password=settings.NEO4J_PASSWORD,
        database=settings.NEO4J_DATABASE,
    )

    try:
        neo4j_service.execute_query("RETURN 1 as test")
        neo4j_service.create_indexes()

        if clear_existing:
            neo4j_service.clear_database()

        neo4j_service.create_knowledge_graph(records)

        stats = neo4j_service.execute_query(
            """
            MATCH (l:LineType)
            OPTIONAL MATCH (l)-[:HAS_ANOMALY]->(a:Anomaly)
            OPTIONAL MATCH (a)-[:CAUSED_BY]->(c:Cause)
            OPTIONAL MATCH (c)-[:SOLVED_BY]->(s:Solution)
            RETURN
                COUNT(DISTINCT l) as line_count,
                COUNT(DISTINCT a) as anomaly_count,
                COUNT(DISTINCT c) as cause_count,
                COUNT(DISTINCT s) as solution_count
            """
        )

        if stats:
            result = stats[0]
            print(
                "Neo4j import completed: "
                f"lines={result['line_count']}, "
                f"anomalies={result['anomaly_count']}, "
                f"causes={result['cause_count']}, "
                f"solutions={result['solution_count']}"
            )
    finally:
        neo4j_service.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import Excel data into local Neo4j.")
    parser.add_argument(
        "--excel-path",
        default="docs/知识图谱/data2.xlsx",
        help="Path to the Excel file, relative to the repository root by default.",
    )
    parser.add_argument(
        "--no-clear",
        action="store_true",
        help="Keep existing Neo4j data instead of clearing it before import.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    import_excel_to_neo4j(args.excel_path, clear_existing=not args.no_clear)


if __name__ == "__main__":
    main()
