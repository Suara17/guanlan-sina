from app.services.qa_router import QARouter


def test_route_graph_question_with_sequence():
    router = QARouter()

    decision = router.route("SMT产线异常3的原因是什么？", sequence=3)

    assert decision.mode == "graph"
    assert "sequence parameter provided" in decision.reasons


def test_route_document_question():
    router = QARouter()

    decision = router.route("这条异常的SOP处理流程是什么？")

    assert decision.mode == "document"
    assert any("document keywords matched" in reason for reason in decision.reasons)


def test_route_hybrid_question():
    router = QARouter()

    decision = router.route("SMT异常3需要按照SOP怎么处理？", line_type="SMT", sequence=3)

    assert decision.mode == "hybrid"
