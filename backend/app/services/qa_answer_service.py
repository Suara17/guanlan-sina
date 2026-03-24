from collections.abc import Sequence
import re
from typing import Any

from app.services.knowledge_qa_models import (
    QACitation,
    QARouteDecision,
    QAStructuredAnswer,
)
from app.services.langchain_rag_service import LangChainRAGService
from app.services.langchain_service import LangChainService


class QAAnswerService:
    def __init__(
        self,
        langchain_service: LangChainService | None = None,
        langchain_rag_service: LangChainRAGService | None = None,
    ) -> None:
        self.langchain_service = langchain_service
        self.langchain_rag_service = langchain_rag_service

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
        document_retriever: Any | None = None,
    ) -> str:
        if self.langchain_rag_service is not None:
            generated_answer = self.langchain_rag_service.generate_grounded_answer(
                question=question,
                route=route,
                executed_modes=executed_modes,
                graph_citations=graph_citations,
                document_citations=document_citations,
                citation_groups=citation_groups,
                warnings=warnings,
                document_retriever=document_retriever,
            )
        elif self.langchain_service is not None:
            generated_answer = self.langchain_service.generate_grounded_answer(
                question=question,
                route=route,
                executed_modes=executed_modes,
                graph_citations=graph_citations,
                document_citations=document_citations,
                citation_groups=citation_groups,
                warnings=warnings,
                document_retriever=document_retriever,
            )
        else:
            generated_answer = None

        if generated_answer:
            if not self._should_accept_generated_answer(question, generated_answer):
                generated_answer = None
        if generated_answer:
            if isinstance(generated_answer, str):
                return generated_answer
            return self._format_structured_answer(
                question=question,
                route=route,
                executed_modes=executed_modes,
                answer=generated_answer,
                warnings=warnings,
            )

        fast_fallback = self._build_fast_fallback_answer(
            question=question,
            route=route,
            executed_modes=executed_modes,
            graph_citations=graph_citations,
            document_citations=document_citations,
            warnings=warnings,
        )
        if fast_fallback is not None:
            return fast_fallback

        sections: list[str] = [
            f"问题：{question}",
            f"请求路由：{route.mode}。",
            f"实际执行：{', '.join(executed_modes) if executed_modes else 'none'}。",
        ]

        if graph_citations:
            graph_lines = [
                self._format_citation_line(citation, index=index, default_prefix="G")
                for index, citation in enumerate(graph_citations[:3], start=1)
            ]
            sections.append("依据：\n" + "\n".join(graph_lines))
            if not document_citations:
                sections.append("风险/备注：\n- 当前回答仅基于知识图谱事实生成，暂无 SOP、手册或工单片段可供引用。")

        if document_citations:
            sections.extend(self._build_document_sections(citation_groups, document_citations))

        if not graph_citations and not document_citations:
            sections.append("结论：\n- 当前未检索到可用信息。")
            sections.append(
                "建议：\n- 建议补充异常编号、产线类型，或明确 SOP/手册/工单关键词后重试。"
            )

        if warnings:
            warning_lines = [f"- {warning}" for warning in warnings]
            sections.append("风险/备注：\n" + "\n".join(warning_lines))

        return "\n\n".join(sections)

    @staticmethod
    def _should_accept_generated_answer(
        question: str,
        generated_answer: str | QAStructuredAnswer,
    ) -> bool:
        if not QAAnswerService._contains_cjk(question):
            return True
        if isinstance(generated_answer, str):
            return QAAnswerService._contains_cjk(generated_answer)

        parts = [
            *generated_answer.conclusion,
            *generated_answer.evidence,
            *generated_answer.suggestions,
            *generated_answer.risks,
            *generated_answer.missing_information,
        ]
        return QAAnswerService._contains_cjk("\n".join(parts))

    @staticmethod
    def _contains_cjk(text: str) -> bool:
        return bool(re.search(r"[\u4e00-\u9fff]", text))

    def _build_fast_fallback_answer(
        self,
        *,
        question: str,
        route: QARouteDecision,
        executed_modes: Sequence[str],
        graph_citations: Sequence[QACitation],
        document_citations: Sequence[QACitation],
        warnings: Sequence[str],
    ) -> str | None:
        if graph_citations or document_citations:
            return None

        structured_answer = self._infer_question_fallback(question)
        if structured_answer is None:
            return None

        return self._format_structured_answer(
            question=question,
            route=route,
            executed_modes=executed_modes,
            answer=structured_answer,
            warnings=warnings,
        )

    @staticmethod
    def _infer_question_fallback(question: str) -> QAStructuredAnswer | None:
        normalized_question = question.lower()
        if any(
            keyword in normalized_question
            for keyword in ("贴装精度", "贴装偏移", "贴片偏移", "精度下降", "贴装误差")
        ):
            return QAStructuredAnswer(
                conclusion=[
                    "贴装精度下降通常优先看 5 类问题：吸嘴/真空系统、视觉定位系统、供料器稳定性、PCB定位夹持、贴装头运动精度。",
                    "如果问题是突然出现，先怀疑吸嘴磨损堵塞、视觉标定漂移或供料器定位松动；如果是逐步变差，再重点看机械间隙、轨道夹持和长期未校准。",
                ],
                evidence=[
                    "“贴装精度下降”对应的是元件中心定位失稳，最常见故障链路就是取料姿态异常、识别基准漂移、放料坐标漂移这三段。",
                    "当前没有命中图谱事实时，最快的排查顺序应是先查吸嘴和视觉，再查供料器与PCB基准，最后查伺服和机械精度。",
                ],
                suggestions=[
                    "先做首轮快检：检查吸嘴磨损/堵塞、真空值、相机镜头污渍、Mark点识别和贴装头校准结果。",
                    "再查供料链路：核对供料器锁紧、来料姿态、元件吸取中心、飞达节距和抛料记录。",
                    "最后查设备精度链路：复核PCB定位销/轨道夹持、板弯、贴装坐标补偿、伺服报警和最近一次精度校准记录。",
                ],
                risks=[
                    "当前回答属于基于问题语义的快速排障结论，不是图谱命中后的精准归因。",
                ],
                confidence=0.42,
                missing_information=[
                    "缺少设备型号、异常发生批次、AOI偏移方向/X-Y-theta数据、吸嘴和视觉校准记录。",
                ],
            )

        return None

    @staticmethod
    def _format_structured_answer(
        *,
        question: str,
        route: QARouteDecision,
        executed_modes: Sequence[str],
        answer: QAStructuredAnswer,
        warnings: Sequence[str],
    ) -> str:
        sections: list[str] = [
            f"问题：{question}",
            f"请求路由：{route.mode}。",
            f"实际执行：{', '.join(executed_modes) if executed_modes else 'none'}。",
        ]

        if answer.conclusion:
            sections.append(
                "结论：\n" + "\n".join(f"- {item}" for item in answer.conclusion if item.strip())
            )
        if answer.evidence:
            sections.append(
                "依据：\n" + "\n".join(f"- {item}" for item in answer.evidence if item.strip())
            )
        if answer.suggestions:
            sections.append(
                "建议：\n" + "\n".join(f"- {item}" for item in answer.suggestions if item.strip())
            )
        if answer.used_sources:
            sections.append(
                "使用来源：\n"
                + "\n".join(f"- {item}" for item in answer.used_sources if item.strip())
            )
        if answer.missing_information:
            sections.append(
                "缺失信息：\n"
                + "\n".join(
                    f"- {item}" for item in answer.missing_information if item.strip()
                )
            )

        risk_items = [item for item in answer.risks if item.strip()]
        for warning in warnings:
            if warning not in risk_items:
                risk_items.append(warning)
        if risk_items:
            sections.append("风险/备注：\n" + "\n".join(f"- {item}" for item in risk_items))
        if answer.confidence is not None:
            sections.append(f"置信度：\n- {answer.confidence:.2f}")

        return "\n\n".join(sections)

    @staticmethod
    def _build_document_sections(
        citation_groups: dict[str, Sequence[QACitation]] | None,
        document_citations: Sequence[QACitation],
    ) -> list[str]:
        if not citation_groups:
            document_lines = [
                QAAnswerService._format_citation_line(
                    citation,
                    index=index,
                    default_prefix="D",
                )
                for index, citation in enumerate(document_citations[:3], start=1)
            ]
            return ["依据：\n" + "\n".join(document_lines)]

        sections: list[str] = []
        keyword_citations = citation_groups.get("keyword", [])
        vector_citations = citation_groups.get("vector", [])
        generic_citations = citation_groups.get("document", [])

        if keyword_citations:
            keyword_lines = [
                QAAnswerService._format_citation_line(
                    citation,
                    index=index,
                    default_prefix="K",
                )
                for index, citation in enumerate(keyword_citations[:3], start=1)
            ]
            sections.append("依据：\n" + "\n".join(keyword_lines))

        if vector_citations:
            vector_lines = [
                QAAnswerService._format_citation_line(
                    citation,
                    index=index,
                    default_prefix="V",
                )
                for index, citation in enumerate(vector_citations[:3], start=1)
            ]
            sections.append("依据：\n" + "\n".join(vector_lines))

        if generic_citations:
            generic_lines = [
                QAAnswerService._format_citation_line(
                    citation,
                    index=index,
                    default_prefix="D",
                )
                for index, citation in enumerate(generic_citations[:3], start=1)
            ]
            sections.append("依据：\n" + "\n".join(generic_lines))

        if not sections:
            document_lines = [
                QAAnswerService._format_citation_line(
                    citation,
                    index=index,
                    default_prefix="D",
                )
                for index, citation in enumerate(document_citations[:3], start=1)
            ]
            sections.append("依据：\n" + "\n".join(document_lines))

        return sections

    @staticmethod
    def _format_citation_line(
        citation: QACitation,
        *,
        index: int,
        default_prefix: str,
    ) -> str:
        metadata = citation.metadata or {}
        retriever = str(metadata.get("retriever") or "").lower()
        prefix_map = {"graph": "G", "keyword": "K", "vector": "V", "document": "D"}
        prefix = prefix_map.get(retriever, default_prefix)
        return f"- [{prefix}{index}] {citation.title}：{citation.snippet}"
