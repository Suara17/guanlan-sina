import sys
import types

from app.services.chroma_vector_store_service import ChromaVectorStoreService


def test_chroma_vector_store_service_get_retriever_uses_search_kwargs(monkeypatch):
    captured: dict[str, object] = {}

    class StubStore:
        def as_retriever(self, *, search_kwargs):
            captured["search_kwargs"] = search_kwargs
            return "stub-retriever"

    monkeypatch.setattr(
        ChromaVectorStoreService,
        "_get_store",
        lambda self: StubStore(),
    )

    service = ChromaVectorStoreService(
        persist_directory=r"C:\Users\forzr\.codex\memories\langchain-test",
        collection_name="langchain-test",
    )
    retriever = service.get_retriever(top_k=4, filters={"line_type_primary": "SMT"})

    assert retriever == "stub-retriever"
    assert captured["search_kwargs"] == {"k": 4, "filter": {"line_type_primary": "SMT"}}


def test_chroma_vector_store_service_openai_embedding_uses_new_fields(monkeypatch):
    captured: dict[str, object] = {}

    class StubOpenAIEmbeddings:
        def __init__(self, *, model, api_key, base_url=None):
            captured["model"] = model
            captured["api_key"] = api_key
            captured["base_url"] = base_url

    module = types.ModuleType("langchain_openai")
    module.OpenAIEmbeddings = StubOpenAIEmbeddings
    monkeypatch.setitem(sys.modules, "langchain_openai", module)
    monkeypatch.setattr(
        "app.services.chroma_vector_store_service.settings.EMBEDDING_PROVIDER",
        "openai",
    )
    monkeypatch.setattr(
        "app.services.chroma_vector_store_service.settings.EMBEDDING_MODEL",
        "text-embedding-test",
    )
    monkeypatch.setattr(
        "app.services.chroma_vector_store_service.settings.EMBEDDING_API_KEY",
        "new-embedding-key",
    )
    monkeypatch.setattr(
        "app.services.chroma_vector_store_service.settings.EMBEDDING_BASE_URL",
        "https://embedding.example/v1",
    )
    monkeypatch.setattr("app.services.chroma_vector_store_service.settings.OPENAI_API_KEY", "old-key")
    monkeypatch.setattr(
        "app.services.chroma_vector_store_service.settings.OPENAI_BASE_URL",
        "https://old.example/v1",
    )

    embedding_function = ChromaVectorStoreService._build_embedding_function()

    assert embedding_function is not None
    assert captured == {
        "model": "text-embedding-test",
        "api_key": "new-embedding-key",
        "base_url": "https://embedding.example/v1",
    }
