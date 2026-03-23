from app.services.knowledge_qa_models import QARouteDecision, QAStructuredAnswer
from app.services.qa_answer_service import QAAnswerService


class StubLangChainRAGService:
    def generate_grounded_answer(self, **kwargs):
        _ = kwargs
        return QAStructuredAnswer(
            conclusion=["建议先执行 setup check。"],
            evidence=["[D1] 用户手册要求核对钢网与轨道参数。"],
            suggestions=["复核 conveyor calibration。"],
            risks=["当前没有图谱事实交叉验证。"],
            confidence=0.76,
            used_sources=["D1"],
            missing_information=["缺少当前设备报警码。"],
        )


def test_qa_answer_service_formats_structured_answer_and_appends_warnings():
    service = QAAnswerService(langchain_rag_service=StubLangChainRAGService())

    answer = service.build_answer(
        question="SPI设备手册里的 setup check 怎么做？",
        route=QARouteDecision(mode="document", reasons=["test"]),
        executed_modes=["vector"],
        graph_citations=[],
        document_citations=[],
        citation_groups=None,
        warnings=["向量检索结果仅覆盖手册片段。"],
        document_retriever="stub-retriever",
    )

    assert "结论：" in answer
    assert "- 建议先执行 setup check。" in answer
    assert "依据：" in answer
    assert "[D1] 用户手册要求核对钢网与轨道参数。" in answer
    assert "风险/备注：" in answer
    assert "当前没有图谱事实交叉验证。" in answer
    assert "向量检索结果仅覆盖手册片段。" in answer
    assert "使用来源：" in answer
    assert "- D1" in answer
    assert "缺失信息：" in answer
    assert "缺少当前设备报警码。" in answer
    assert "置信度：" in answer
    assert "- 0.76" in answer
