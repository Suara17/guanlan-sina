import httpx

from app.services.knowledge_qa_models import (
    QACitation,
    QARouteDecision,
    QAStructuredAnswer,
)
from app.services.langchain_rag_service import LangChainRAGService
from app.services.langchain_service import LangChainService


def test_langchain_service_returns_none_when_package_missing_or_unavailable(monkeypatch):
    service = LangChainService(
        provider="openai",
        model="gpt-4o-mini",
        temperature=0.1,
        api_key="test-key",
    )
    monkeypatch.setattr(
        service,
        "generate_structured_answer",
        lambda **kwargs: None,
    )

    response = service.generate_grounded_answer(
        question="异常3如何处理？",
        route=QARouteDecision(mode="graph", reasons=["test"]),
        executed_modes=["graph"],
        graph_citations=[
            QACitation(
                source_type="graph",
                title="SMT 异常 3",
                snippet="可能原因：吸嘴磨损",
                score=1.0,
                metadata={},
            )
        ],
        document_citations=[],
        citation_groups=None,
        warnings=[],
    )

    assert response is None or isinstance(response, str)


def test_langchain_service_formats_citation_context_with_metadata():
    formatted = LangChainService._format_citation_context(
        [
            QACitation(
                source_type="document",
                title="关键词匹配异常 3",
                snippet="现象：贴片偏移。处理：更换吸嘴。",
                score=9.5,
                metadata={
                    "sequence": 3,
                    "line_type": "SMT",
                    "matched_terms": ["贴片偏移", "吸嘴"],
                },
            )
        ],
        group_name="keyword",
    )

    assert "[K1]" in formatted
    assert "sequence=3" in formatted
    assert "line_type=SMT" in formatted
    assert "matched_terms=贴片偏移,吸嘴" in formatted


def test_langchain_service_formats_grouped_context():
    grouped = LangChainService._format_grouped_context(
        {
            "graph": [
                QACitation(
                    source_type="graph",
                    title="SMT 异常 3",
                    snippet="图谱事实",
                    score=1.0,
                    metadata={"retriever": "graph", "sequence": 3},
                )
            ],
            "keyword": [
                QACitation(
                    source_type="document",
                    title="关键词匹配异常 3",
                    snippet="关键词补充",
                    score=0.8,
                    metadata={"retriever": "keyword", "sequence": 3},
                )
            ],
        }
    )

    assert "[图谱事实]" in grouped
    assert "[关键词补充]" in grouped
    assert "[G1]" in grouped
    assert "[K1]" in grouped


def test_langchain_service_generate_grounded_answer_delegates_to_rag_service(monkeypatch):
    service = LangChainService(
        provider="openai",
        model="gpt-4o-mini",
        temperature=0.1,
        api_key="test-key",
    )
    expected = QAStructuredAnswer(conclusion=["来自文档链的结论"])

    monkeypatch.setattr(
        LangChainRAGService,
        "generate_grounded_answer",
        lambda self, **kwargs: expected,
    )

    response = service.generate_grounded_answer(
        question="SPI设备手册里的 setup check 怎么做？",
        route=QARouteDecision(mode="document", reasons=["test"]),
        executed_modes=["vector"],
        graph_citations=[],
        document_citations=[],
        citation_groups=None,
        warnings=[],
        document_retriever="stub-retriever",
    )

    assert response == expected


def test_langchain_service_generate_document_rag_answer_delegates_to_rag_service(monkeypatch):
    service = LangChainService(
        provider="openai",
        model="gpt-4o-mini",
        temperature=0.1,
        api_key="test-key",
    )

    monkeypatch.setattr(
        LangChainRAGService,
        "generate_document_rag_answer",
        lambda self, **kwargs: QAStructuredAnswer(
            conclusion=["先做 setup check。"],
            evidence=["[D1] 用户手册要求先检查钢网对位。"],
            suggestions=["复核 conveyor calibration。"],
            risks=["当前仅基于手册片段。"],
        ),
    )

    response = service.generate_document_rag_answer(
        question="SPI设备手册里的 setup check 怎么做？",
        route=QARouteDecision(mode="document", reasons=["test"]),
        executed_modes=["vector"],
        warnings=[],
        retriever="stub-retriever",
    )

    assert response is not None
    assert response.conclusion == ["先做 setup check。"]
    assert response.evidence == ["[D1] 用户手册要求先检查钢网对位。"]


def test_langchain_service_extracts_json_payload_from_fenced_block():
    payload = LangChainService._extract_json_payload(
        """```json
        {"conclusion":["OK"],"evidence":[],"suggestions":[],"risks":[]}
        ```"""
    )

    assert payload is not None
    assert payload["conclusion"] == ["OK"]


def test_langchain_service_normalizes_single_string_fields():
    answer = LangChainService._normalize_structured_answer(
        {
            "conclusion": "OK",
            "evidence": "[D1] 证据",
            "suggestions": [],
            "risks": "注意风险",
            "confidence": 0.5,
            "used_sources": "D1",
            "missing_information": "缺少参数",
        }
    )

    assert answer is not None
    assert answer.conclusion == ["OK"]
    assert answer.evidence == ["[D1] 证据"]
    assert answer.risks == ["注意风险"]
    assert answer.used_sources == ["D1"]
    assert answer.missing_information == ["缺少参数"]


def test_langchain_service_from_settings_uses_new_llm_fields(monkeypatch):
    monkeypatch.setattr("app.services.langchain_service.settings.LANGCHAIN_ENABLED", True)
    monkeypatch.setattr("app.services.langchain_service.settings.LLM_PROVIDER", "openai")
    monkeypatch.setattr("app.services.langchain_service.settings.LLM_MODEL", "test-llm")
    monkeypatch.setattr("app.services.langchain_service.settings.LLM_TEMPERATURE", 0.2)
    monkeypatch.setattr("app.services.langchain_service.settings.LLM_API_KEY", "new-llm-key")
    monkeypatch.setattr(
        "app.services.langchain_service.settings.LLM_BASE_URL",
        "https://llm.example/v1",
    )
    monkeypatch.setattr("app.services.langchain_service.settings.OPENAI_API_KEY", "old-llm-key")
    monkeypatch.setattr(
        "app.services.langchain_service.settings.OPENAI_BASE_URL",
        "https://old-llm.example/v1",
    )

    service = LangChainService.from_settings()

    assert service is not None
    assert service.api_key == "new-llm-key"
    assert service.base_url == "https://llm.example/v1"


def test_langchain_service_uses_configured_request_timeout(monkeypatch):
    service = LangChainService(
        provider="openai",
        model="gpt-4o-mini",
        temperature=0.1,
        api_key="test-key",
        base_url="https://llm.example/v1",
    )
    captured: dict[str, object] = {}

    class StubResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "choices": [
                    {
                        "message": {
                            "content": '{"conclusion":["OK"],"evidence":[],"suggestions":[],"risks":[],"used_sources":[],"missing_information":[],"confidence":0.5}'
                        }
                    }
                ]
            }

    class StubClient:
        def __init__(self, *, timeout, trust_env):
            captured["timeout"] = timeout
            captured["trust_env"] = trust_env

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, url, *, headers, json):
            captured["url"] = url
            captured["headers"] = headers
            captured["json"] = json
            return StubResponse()

    monkeypatch.setattr("app.services.langchain_service.settings.LLM_REQUEST_TIMEOUT_SECONDS", 9.0)
    monkeypatch.setattr("app.services.langchain_service.httpx.Client", StubClient)

    answer = service.generate_structured_answer(
        messages=[{"role": "user", "content": "test"}]
    )

    assert answer is not None
    assert captured["trust_env"] is False
    assert str(captured["timeout"]) == "Timeout(connect=5.0, read=9.0, write=9.0, pool=9.0)"


def test_langchain_service_retries_without_response_format_on_400(monkeypatch):
    service = LangChainService(
        provider="openai",
        model="openrouter/free",
        temperature=0.1,
        api_key="test-key",
        base_url="https://llm.example/v1",
    )
    captured_payloads: list[dict[str, object]] = []

    class StubResponse:
        def __init__(self, status_code, content):
            self.status_code = status_code
            self._content = content
            self.request = httpx.Request("POST", "https://llm.example/v1/chat/completions")

        def raise_for_status(self):
            if self.status_code >= 400:
                raise httpx.HTTPStatusError(
                    "bad request",
                    request=self.request,
                    response=self,
                )

        def json(self):
            return {
                "choices": [
                    {
                        "message": {
                            "content": self._content,
                        }
                    }
                ]
            }

    class StubClient:
        def __init__(self, *, timeout, trust_env):
            _ = timeout, trust_env

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, url, *, headers, json):
            _ = url, headers
            captured_payloads.append(json)
            if len(captured_payloads) == 1:
                return StubResponse(400, "")
            return StubResponse(
                200,
                '{"conclusion":["中文结论"],"evidence":[],"suggestions":[],"risks":[],"used_sources":[],"missing_information":[],"confidence":0.6}',
            )

    monkeypatch.setattr("app.services.langchain_service.httpx.Client", StubClient)

    answer = service.generate_structured_answer(
        messages=[{"role": "user", "content": "test"}]
    )

    assert answer is not None
    assert answer.conclusion == ["中文结论"]
    assert "response_format" in captured_payloads[0]
    assert "response_format" not in captured_payloads[1]
