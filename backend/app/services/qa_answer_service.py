from collections.abc import Sequence

from app.services.langchain_service import LangChainService
from app.services.knowledge_qa_models import QACitation, QARouteDecision


class QAAnswerService:
    def __init__(self, langchain_service: LangChainService | None = None) -> None:
        self.langchain_service = langchain_service

    def build_answer(
        self,
        *,
        question: str,
        route: QARouteDecision,
        executed_modes: Sequence[str],
        graph_citations: Sequence[QACitation],
        document_citations: Sequence[QACitation],
        citation_groups: dict[str, Sequence[QACitation]] | None = None,
        warnings: Sequence[str],
    ) -> str:
        if self.langchain_service is not None:
            generated_answer = self.langchain_service.generate_grounded_answer(
                question=question,
                route=route,
                executed_modes=executed_modes,
                graph_citations=graph_citations,
                document_citations=document_citations,
                citation_groups=citation_groups,
                warnings=warnings,
            )
            if generated_answer:
                return generated_answer

        sections: list[str] = [
            f"问题：{question}",
            f"请求路由：{route.mode}。",
            f"实际执行：{', '.join(executed_modes) if executed_modes else 'none'}。",
        ]

        if graph_citations:
            graph_lines = [
                f"- {citation.title}：{citation.snippet}"
                for citation in graph_citations[:3]
            ]
            sections.append("已确认的图谱事实：\n" + "\n".join(graph_lines))
            if not document_citations:
                sections.append("当前回答仅基于知识图谱事实生成，暂无 SOP、手册或工单片段可供引用。")

        if document_citations:
            sections.extend(self._build_document_sections(citation_groups, document_citations))

        if not graph_citations and not document_citations:
            sections.append(
                "当前未检索到可用信息，建议补充异常编号、产线类型，或明确 SOP/手册/工单关键词后重试。"
            )

        if warnings:
            warning_lines = [f"- {warning}" for warning in warnings]
            sections.append("注意事项：\n" + "\n".join(warning_lines))

        return "\n\n".join(sections)

    @staticmethod
    def _build_document_sections(
        citation_groups: dict[str, Sequence[QACitation]] | None,
        document_citations: Sequence[QACitation],
    ) -> list[str]:
        if not citation_groups:
            document_lines = [
                f"- {citation.title}：{citation.snippet}"
                for citation in document_citations[:3]
            ]
            return ["文本检索补充：\n" + "\n".join(document_lines)]

        sections: list[str] = []
        keyword_citations = citation_groups.get("keyword", [])
        vector_citations = citation_groups.get("vector", [])
        generic_citations = citation_groups.get("document", [])

        if keyword_citations:
            keyword_lines = [
                f"- {citation.title}：{citation.snippet}"
                for citation in keyword_citations[:3]
            ]
            sections.append("关键词检索补充：\n" + "\n".join(keyword_lines))

        if vector_citations:
            vector_lines = [
                f"- {citation.title}：{citation.snippet}"
                for citation in vector_citations[:3]
            ]
            sections.append("向量召回补充：\n" + "\n".join(vector_lines))

        if generic_citations:
            generic_lines = [
                f"- {citation.title}：{citation.snippet}"
                for citation in generic_citations[:3]
            ]
            sections.append("其他文本检索补充：\n" + "\n".join(generic_lines))

        if not sections:
            document_lines = [
                f"- {citation.title}：{citation.snippet}"
                for citation in document_citations[:3]
            ]
            sections.append("文本检索补充：\n" + "\n".join(document_lines))

        return sections
