from app.core.config import Settings


def _build_settings(**overrides):
    base = {
        "PROJECT_NAME": "knowledge-qa",
        "POSTGRES_SERVER": "localhost",
        "POSTGRES_USER": "postgres",
        "POSTGRES_PASSWORD": "postgres",
        "POSTGRES_DB": "knowledge_qa",
        "FIRST_SUPERUSER": "admin@example.com",
        "FIRST_SUPERUSER_PASSWORD": "admin123",
        "SECRET_KEY": "not-the-default-secret",
    }
    base.update(overrides)
    return Settings(**base)


def test_settings_prefers_new_llm_fields_over_openai_compatibility():
    settings = _build_settings(
        LLM_API_KEY="new-llm-key",
        LLM_BASE_URL="https://llm.example/v1",
        OPENAI_API_KEY="old-llm-key",
        OPENAI_BASE_URL="https://old-llm.example/v1",
    )

    assert settings.llm_api_key == "new-llm-key"
    assert settings.llm_base_url == "https://llm.example/v1"
    assert settings.langchain_llm_configured is True


def test_settings_falls_back_to_openai_fields_for_embedding_compatibility():
    settings = _build_settings(
        EMBEDDING_API_KEY="",
        EMBEDDING_BASE_URL=None,
        OPENAI_API_KEY="legacy-embedding-key",
        OPENAI_BASE_URL="https://legacy-embedding.example/v1",
    )

    assert settings.embedding_api_key == "legacy-embedding-key"
    assert settings.embedding_base_url == "https://legacy-embedding.example/v1"
