import json
from pathlib import Path
from typing import Any


DEFAULT_INDEX_DIR = Path(__file__).resolve().parents[1] / "data" / "knowledge_qa"
DEFAULT_CHUNKS_PATH = DEFAULT_INDEX_DIR / "chunks.jsonl"
DEFAULT_EMBEDDINGS_PATH = DEFAULT_INDEX_DIR / "embeddings.jsonl"


class DocumentIndexService:
    def __init__(
        self,
        *,
        chunks_path: Path | None = None,
        embeddings_path: Path | None = None,
    ) -> None:
        self.chunks_path = chunks_path or DEFAULT_CHUNKS_PATH
        self.embeddings_path = embeddings_path or DEFAULT_EMBEDDINGS_PATH
        self._chunks_cache: list[dict[str, Any]] | None = None
        self._embeddings_cache: list[dict[str, Any]] | None = None

    @property
    def chunks_available(self) -> bool:
        return self.chunks_path.exists() and self.chunks_path.is_file()

    @property
    def embeddings_available(self) -> bool:
        return self.embeddings_path.exists() and self.embeddings_path.is_file()

    def get_chunks(self) -> list[dict[str, Any]]:
        if self._chunks_cache is None:
            self._chunks_cache = self._load_jsonl(self.chunks_path)
        return self._chunks_cache

    def get_embeddings(self) -> list[dict[str, Any]]:
        if self._embeddings_cache is None:
            self._embeddings_cache = self._load_jsonl(self.embeddings_path)
        return self._embeddings_cache

    @staticmethod
    def _load_jsonl(path: Path) -> list[dict[str, Any]]:
        if not path.exists():
            return []

        records: list[dict[str, Any]] = []
        with path.open("r", encoding="utf-8") as file:
            for line in file:
                normalized = line.strip()
                if not normalized:
                    continue
                payload = json.loads(normalized)
                if isinstance(payload, dict):
                    records.append(payload)
        return records
