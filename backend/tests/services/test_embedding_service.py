import sys
import types

from app.services.embedding_service import EmbeddingService


class StubOpenAIEmbeddings:
    last_init: dict[str, object] | None = None

    def __init__(self, *, model, api_key, base_url=None):
        type(self).last_init = {
            "model": model,
            "api_key": api_key,
            "base_url": base_url,
        }

    def embed_documents(self, texts):
        assert texts == ["hello world"]
        return [[1.0, 2.0]]

    def embed_query(self, text):
        assert text == "hello world"
        return [3.0, 4.0]


def _install_openai_stub(monkeypatch):
    module = types.ModuleType("langchain_openai")
    module.OpenAIEmbeddings = StubOpenAIEmbeddings
    monkeypatch.setitem(sys.modules, "langchain_openai", module)


def test_embedding_service_openai_uses_new_embedding_fields(monkeypatch):
    _install_openai_stub(monkeypatch)
    monkeypatch.setattr(
        "app.services.embedding_service.settings.EMBEDDING_PROVIDER",
        "openai",
    )
    monkeypatch.setattr(
        "app.services.embedding_service.settings.EMBEDDING_MODEL",
        "text-embedding-test",
    )
    monkeypatch.setattr(
        "app.services.embedding_service.settings.EMBEDDING_API_KEY",
        "new-embedding-key",
    )
    monkeypatch.setattr(
        "app.services.embedding_service.settings.EMBEDDING_BASE_URL",
        "https://embedding.example/v1",
    )
    monkeypatch.setattr("app.services.embedding_service.settings.OPENAI_API_KEY", "old-key")
    monkeypatch.setattr(
        "app.services.embedding_service.settings.OPENAI_BASE_URL",
        "https://old.example/v1",
    )

    service = EmbeddingService()
    vectors = service.embed_documents(["hello world"])
    query_vector = service.embed_query("hello world")

    assert vectors == [[1.0, 2.0]]
    assert query_vector == [3.0, 4.0]
    assert StubOpenAIEmbeddings.last_init == {
        "model": "text-embedding-test",
        "api_key": "new-embedding-key",
        "base_url": "https://embedding.example/v1",
    }


def test_embedding_service_openai_falls_back_to_openai_fields(monkeypatch):
    _install_openai_stub(monkeypatch)
    monkeypatch.setattr(
        "app.services.embedding_service.settings.EMBEDDING_PROVIDER",
        "openai",
    )
    monkeypatch.setattr(
        "app.services.embedding_service.settings.EMBEDDING_MODEL",
        "text-embedding-test",
    )
    monkeypatch.setattr("app.services.embedding_service.settings.EMBEDDING_API_KEY", "")
    monkeypatch.setattr("app.services.embedding_service.settings.EMBEDDING_BASE_URL", None)
    monkeypatch.setattr(
        "app.services.embedding_service.settings.OPENAI_API_KEY",
        "legacy-embedding-key",
    )
    monkeypatch.setattr(
        "app.services.embedding_service.settings.OPENAI_BASE_URL",
        "https://legacy-embedding.example/v1",
    )

    service = EmbeddingService()
    vectors = service.embed_query("hello world")

    assert vectors == [3.0, 4.0]
    assert StubOpenAIEmbeddings.last_init == {
        "model": "text-embedding-test",
        "api_key": "legacy-embedding-key",
        "base_url": "https://legacy-embedding.example/v1",
    }
