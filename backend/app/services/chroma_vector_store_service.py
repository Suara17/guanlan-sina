from collections.abc import Sequence
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.services.embedding_service import EmbeddingService


class ChromaVectorStoreService:
    def __init__(
        self,
        *,
        persist_directory: str | Path | None = None,
        collection_name: str | None = None,
    ) -> None:
        self.persist_directory = self._resolve_persist_directory(persist_directory)
        self.collection_name = collection_name or settings.CHROMA_COLLECTION_NAME

    @property
    def is_available(self) -> bool:
        return self._dependencies_available()

    @property
    def has_data(self) -> bool:
        if not self.persist_directory.exists():
            return False
        collection = self._get_collection()
        if collection is None:
            return False
        try:
            return int(collection.count()) > 0
        except Exception:
            return False

    def reset_collection(self) -> bool:
        store = self._get_store()
        if store is None:
            return False
        client = getattr(store, "_client", None)
        if client is None:
            return False
        try:
            client.delete_collection(self.collection_name)
        except Exception:
            return False
        return True

    def upsert_chunks(
        self,
        chunk_records: Sequence[dict[str, Any]],
        *,
        batch_size: int | None = None,
    ) -> bool:
        store = self._get_store()
        if store is None:
            return False
        normalized_records = [record for record in chunk_records if self._valid_chunk_record(record)]
        if not normalized_records:
            return True

        write_batch_size = max(batch_size or settings.EMBEDDING_BATCH_SIZE, 1)
        for start in range(0, len(normalized_records), write_batch_size):
            batch = normalized_records[start : start + write_batch_size]
            ids = [str(record["chunk_id"]) for record in batch]
            texts = [str(record["text"]) for record in batch]
            metadatas = [self._build_metadata(record) for record in batch]
            try:
                store.add_texts(texts=texts, metadatas=metadatas, ids=ids)
            except Exception:
                return False
        return True

    def similarity_search(
        self,
        query_text: str,
        *,
        top_k: int,
        filters: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        store = self._get_store()
        if store is None:
            return []
        try:
            results = store.similarity_search_with_relevance_scores(
                query=query_text,
                k=max(top_k, 1),
                filter=filters,
            )
        except Exception:
            return []

        payloads: list[dict[str, Any]] = []
        for document, score in results:
            metadata = dict(document.metadata or {})
            payloads.append(
                {
                    "chunk_id": metadata.get("chunk_id"),
                    "document_id": metadata.get("document_id"),
                    "title": metadata.get("title"),
                    "page": metadata.get("page"),
                    "section": metadata.get("section"),
                    "source_file": metadata.get("source_file"),
                    "file_type": metadata.get("file_type"),
                    "line_types": self._split_pipe_string(metadata.get("line_types")),
                    "keywords": self._split_pipe_string(metadata.get("keywords")),
                    "text": document.page_content,
                    "text_preview": metadata.get("text_preview"),
                    "similarity_score": round(float(score), 4),
                }
            )
        return payloads

    def get_retriever(
        self,
        *,
        top_k: int,
        filters: dict[str, Any] | None = None,
    ) -> Any | None:
        store = self._get_store()
        if store is None:
            return None
        search_kwargs: dict[str, Any] = {"k": max(top_k, 1)}
        if filters:
            search_kwargs["filter"] = filters
        try:
            return store.as_retriever(search_kwargs=search_kwargs)
        except Exception:
            return None

    def _get_collection(self) -> Any | None:
        store = self._get_store()
        if store is None:
            return None
        return getattr(store, "_collection", None)

    def _get_store(self) -> Any | None:
        if not self._dependencies_available():
            return None
        embedding_function = self._build_embedding_function()
        if embedding_function is None:
            return None
        try:
            from langchain_chroma import Chroma
        except ImportError:
            return None

        self.persist_directory.mkdir(parents=True, exist_ok=True)
        try:
            return Chroma(
                collection_name=self.collection_name,
                persist_directory=str(self.persist_directory),
                embedding_function=embedding_function,
            )
        except Exception:
            return None

    @staticmethod
    def _resolve_persist_directory(path: str | Path | None) -> Path:
        if path is None:
            return Path(__file__).resolve().parents[2] / settings.CHROMA_PERSIST_DIR
        candidate = Path(path)
        if candidate.is_absolute():
            return candidate
        return Path(__file__).resolve().parents[2] / candidate

    @staticmethod
    def _dependencies_available() -> bool:
        try:
            import chromadb  # noqa: F401
            import langchain_chroma  # noqa: F401
        except ImportError:
            return False
        return True

    @staticmethod
    def _build_embedding_function() -> Any | None:
        provider = settings.EMBEDDING_PROVIDER.lower().strip()
        try:
            if provider == "openai":
                from langchain_openai import OpenAIEmbeddings

                if not settings.embedding_api_key:
                    return None

                return OpenAIEmbeddings(
                    model=settings.EMBEDDING_MODEL,
                    api_key=settings.embedding_api_key,
                    base_url=settings.embedding_base_url,
                )
            if provider == "voyage":
                from langchain_voyageai import VoyageAIEmbeddings

                return VoyageAIEmbeddings(
                    model=settings.EMBEDDING_MODEL,
                    api_key=settings.VOYAGE_API_KEY,
                    batch_size=settings.EMBEDDING_BATCH_SIZE,
                )
            if provider == "huggingface_local":
                from langchain_huggingface import HuggingFaceEmbeddings

                local_model_path = EmbeddingService._resolve_local_model_path(
                    settings.EMBEDDING_MODEL
                )
                model_kwargs = {
                    "device": settings.EMBEDDING_DEVICE,
                    "trust_remote_code": EmbeddingService._should_trust_remote_code(
                        settings.EMBEDDING_MODEL
                    ),
                }
                if local_model_path is not None:
                    model_kwargs["local_files_only"] = True
                encode_kwargs = {"normalize_embeddings": True}
                return HuggingFaceEmbeddings(
                    model_name=str(local_model_path or settings.EMBEDDING_MODEL),
                    model_kwargs=model_kwargs,
                    encode_kwargs=encode_kwargs,
                )
        except Exception:
            return None
        return None

    @staticmethod
    def _build_metadata(record: dict[str, Any]) -> dict[str, Any]:
        return {
            "chunk_id": str(record.get("chunk_id") or ""),
            "document_id": str(record.get("document_id") or ""),
            "title": str(record.get("title") or ""),
            "source_file": str(record.get("source_file") or ""),
            "page": int(record.get("page") or 0),
            "section": str(record.get("section") or ""),
            "file_type": str(record.get("file_type") or ""),
            "text_preview": str(record.get("text_preview") or ""),
            "line_type_primary": ChromaVectorStoreService._first_string(record.get("line_types")),
            "line_types": ChromaVectorStoreService._join_string_list(record.get("line_types")),
            "keywords": ChromaVectorStoreService._join_string_list(record.get("keywords")),
        }

    @staticmethod
    def _normalize_string_list(value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item) for item in value if str(item).strip()]

    @classmethod
    def _join_string_list(cls, value: Any) -> str:
        return "|".join(cls._normalize_string_list(value))

    @staticmethod
    def _split_pipe_string(value: Any) -> list[str]:
        if not isinstance(value, str) or not value.strip():
            return []
        return [item for item in value.split("|") if item]

    @staticmethod
    def _first_string(value: Any) -> str:
        if not isinstance(value, list):
            return ""
        for item in value:
            normalized = str(item).strip()
            if normalized:
                return normalized
        return ""

    @staticmethod
    def _valid_chunk_record(record: dict[str, Any]) -> bool:
        return bool(record.get("chunk_id")) and bool(record.get("text"))
