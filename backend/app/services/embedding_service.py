from collections.abc import Sequence
from pathlib import Path
from typing import cast

from app.core.config import settings


class EmbeddingService:
    _local_model_cache: dict[tuple[str, str], object] = {}

    def embed_documents(self, texts: Sequence[str]) -> list[list[float]] | None:
        if not texts:
            return []
        provider = settings.EMBEDDING_PROVIDER.lower().strip()
        if provider == "voyage":
            return self._embed_documents_voyage(texts)
        if provider == "huggingface_local":
            return self._embed_documents_huggingface_local(texts)
        if provider == "openai":
            return self._embed_documents_openai(texts)
        return None

    def embed_query(self, text: str) -> list[float] | None:
        provider = settings.EMBEDDING_PROVIDER.lower().strip()
        if provider == "voyage":
            return self._embed_query_voyage(text)
        if provider == "huggingface_local":
            return self._embed_query_huggingface_local(text)
        if provider == "openai":
            return self._embed_query_openai(text)
        return None

    def _embed_documents_voyage(self, texts: Sequence[str]) -> list[list[float]] | None:
        if not settings.VOYAGE_API_KEY:
            return None
        try:
            from langchain_voyageai import VoyageAIEmbeddings
        except ImportError:
            return None

        try:
            model = VoyageAIEmbeddings(
                model=settings.EMBEDDING_MODEL,
                api_key=settings.VOYAGE_API_KEY,
                batch_size=settings.EMBEDDING_BATCH_SIZE,
            )
            vectors = model.embed_documents(list(texts))
        except Exception:
            return None
        return [[float(value) for value in vector] for vector in vectors]

    def _embed_query_voyage(self, text: str) -> list[float] | None:
        if not settings.VOYAGE_API_KEY:
            return None
        try:
            from langchain_voyageai import VoyageAIEmbeddings
        except ImportError:
            return None

        try:
            model = VoyageAIEmbeddings(
                model=settings.EMBEDDING_MODEL,
                api_key=settings.VOYAGE_API_KEY,
                batch_size=settings.EMBEDDING_BATCH_SIZE,
            )
            vector = model.embed_query(text)
        except Exception:
            return None
        return [float(value) for value in vector]

    def _embed_documents_openai(self, texts: Sequence[str]) -> list[list[float]] | None:
        if not settings.OPENAI_API_KEY:
            return None
        try:
            from langchain_openai import OpenAIEmbeddings
        except ImportError:
            return None

        try:
            model = OpenAIEmbeddings(
                model=settings.EMBEDDING_MODEL,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL,
            )
            vectors = model.embed_documents(list(texts))
        except Exception:
            return None
        return [[float(value) for value in vector] for vector in vectors]

    def _embed_query_openai(self, text: str) -> list[float] | None:
        if not settings.OPENAI_API_KEY:
            return None
        try:
            from langchain_openai import OpenAIEmbeddings
        except ImportError:
            return None

        try:
            model = OpenAIEmbeddings(
                model=settings.EMBEDDING_MODEL,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL,
            )
            vector = model.embed_query(text)
        except Exception:
            return None
        return [float(value) for value in vector]

    def _embed_documents_huggingface_local(
        self, texts: Sequence[str]
    ) -> list[list[float]] | None:
        model = self._load_huggingface_local_model()
        if model is None:
            return None
        vectors = model.encode(
            list(texts),
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        return [[float(value) for value in vector] for vector in vectors.tolist()]

    def _embed_query_huggingface_local(self, text: str) -> list[float] | None:
        model = self._load_huggingface_local_model()
        if model is None:
            return None
        vector = model.encode(
            text,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        return [float(value) for value in vector.tolist()]

    @classmethod
    def _load_huggingface_local_model(cls) -> object | None:
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError:
            return None

        cache_key = (settings.EMBEDDING_MODEL, settings.EMBEDDING_DEVICE)
        cached_model = cls._local_model_cache.get(cache_key)
        if cached_model is not None:
            return cached_model

        model_path = cls._resolve_local_model_path(settings.EMBEDDING_MODEL)
        try:
            model = SentenceTransformer(
                str(model_path or settings.EMBEDDING_MODEL),
                device=settings.EMBEDDING_DEVICE,
                trust_remote_code=cls._should_trust_remote_code(settings.EMBEDDING_MODEL),
                local_files_only=model_path is not None,
            )
        except Exception:
            return None
        cls._local_model_cache[cache_key] = cast(object, model)
        return cls._local_model_cache[cache_key]

    @staticmethod
    def _should_trust_remote_code(model_name: str) -> bool:
        normalized = model_name.lower().strip()
        return normalized.startswith("jinaai/jina-embeddings-v2")

    @staticmethod
    def _resolve_local_model_path(model_name: str) -> Path | None:
        normalized_name = model_name.strip().replace("/", "--")
        base_dir = Path.home() / ".cache" / "huggingface" / "hub" / f"models--{normalized_name}"
        refs_path = base_dir / "refs" / "main"
        snapshots_dir = base_dir / "snapshots"
        if refs_path.exists():
            revision = refs_path.read_text(encoding="utf-8").strip()
            snapshot_path = snapshots_dir / revision
            if snapshot_path.exists():
                return snapshot_path
        if snapshots_dir.exists():
            snapshot_candidates = sorted(
                (path for path in snapshots_dir.iterdir() if path.is_dir()),
                key=lambda path: path.name,
                reverse=True,
            )
            if snapshot_candidates:
                return snapshot_candidates[0]
        return None
