from app.services.langchain_service import LangChainService


def _build_service() -> LangChainService:
    return LangChainService(
        provider="openai",
        model="internlm/internlm2_5-7b-chat",
        temperature=0.1,
        api_key="test-key",
        base_url="https://example.com/v1",
    )


def test_extract_json_payload_accepts_plain_json_with_wrapped_text():
    service = _build_service()

    payload = service._extract_json_payload(
        '先给结论：{"conclusion":["后续贴装不良通常先查吸嘴磨损、真空波动和视觉偏移"],'
        '"evidence":["没有直接证据时可先按常见故障链路排查"],"suggestions":["先查吸嘴和相机"],'
        '"risks":["当前结论属于经验性判断"],"confidence":0.41,"used_sources":[],"missing_information":["缺少设备日志"]}'
    )

    assert payload is not None
    assert payload["conclusion"] == ["后续贴装不良通常先查吸嘴磨损、真空波动和视觉偏移"]


def test_extract_json_payload_accepts_generic_fenced_json():
    service = _build_service()

    payload = service._extract_json_payload(
        "```"
        '{"conclusion":["先查吸嘴状态"],"evidence":[],"suggestions":[],"risks":[],"confidence":0.33,'
        '"used_sources":[],"missing_information":[]}'
        "```"
    )

    assert payload is not None
    assert payload["conclusion"] == ["先查吸嘴状态"]


def test_normalize_structured_answer_accepts_chinese_confidence_alias_and_empty_strings():
    payload = LangChainService._normalize_structured_answer(
        {
            "conclusion": "先检查吸嘴和真空值。",
            "evidence": ["常见原因包括吸附不稳和视觉偏移。"],
            "suggestions": "先做首轮点检。",
            "risks": ["当前仍缺少现场日志。"],
            "confidence": "高",
            "used_sources": [],
            "missing_information": "无",
        }
    )

    assert payload is not None
    assert payload.confidence == 0.8
    assert payload.missing_information == []
