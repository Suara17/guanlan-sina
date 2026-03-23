from dataclasses import dataclass


GRAPH_KEYWORDS = (
    "异常",
    "原因",
    "根因",
    "方案",
    "建议",
    "处理",
    "产线",
    "序号",
    "编号",
    "相似",
)

DOCUMENT_KEYWORDS = (
    "sop",
    "作业指导书",
    "流程",
    "规范",
    "点检",
    "手册",
    "工单",
)


@dataclass(frozen=True)
class RouteDecision:
    mode: str
    reasons: list[str]


class QARouter:
    def route(
        self,
        question: str,
        *,
        line_type: str | None = None,
        sequence: int | None = None,
        selected_node_label: str | None = None,
        selected_node_description: str | None = None,
        selected_node_type: str | None = None,
    ) -> RouteDecision:
        normalized_question = question.lower()
        graph_hits = [
            keyword for keyword in GRAPH_KEYWORDS if keyword in normalized_question
        ]
        document_hits = [
            keyword for keyword in DOCUMENT_KEYWORDS if keyword in normalized_question
        ]
        reasons: list[str] = []
        has_selected_node_context = any(
            value
            for value in (
                selected_node_label,
                selected_node_description,
                selected_node_type,
            )
        )

        if sequence is not None:
            reasons.append("sequence parameter provided")
        if line_type:
            reasons.append("line_type parameter provided")
        if has_selected_node_context:
            reasons.append("selected node context provided")
        if graph_hits:
            reasons.append(f"graph keywords matched: {', '.join(graph_hits)}")
        if document_hits:
            reasons.append(f"document keywords matched: {', '.join(document_hits)}")

        has_structured_context = (
            sequence is not None or bool(line_type) or has_selected_node_context
        )
        if (graph_hits and document_hits) or (document_hits and has_structured_context):
            return RouteDecision(mode="hybrid", reasons=reasons or ["mixed signals"])
        if graph_hits or has_structured_context:
            return RouteDecision(mode="graph", reasons=reasons or ["structured context"])
        if document_hits:
            return RouteDecision(mode="document", reasons=reasons)
        return RouteDecision(mode="hybrid", reasons=["no explicit route keyword matched"])
