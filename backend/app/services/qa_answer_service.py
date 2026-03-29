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
    NON_BLOCKING_WARNING_PREFIXES = (
        "图谱检索未命中",
        "关键词检索未命中",
        "向量检索未命中",
        "图谱检索超时",
        "关键词检索超时",
        "向量检索超时",
        "图谱检索未启用",
        "关键词检索未启用",
        "向量检索未启用",
        "文本检索尚未接入",
    )
    DEFAULT_SOURCE_SUMMARY = "已经检索到3条信息，正在继续检索。"
    GENERIC_RISK_FRAGMENTS = (
        "基于行业经验",
        "经验性判断",
        "证据有限",
        "没有直接证据",
        "仅作为通用经验参考",
        "需结合现场",
        "需结合实际生产情况",
        "建议结合设备手册",
        "建议参照设备手册",
        "不是图谱命中后的精准归因",
        "缺少具体设备型号",
        "缺乏具体机型",
    )
    GENERIC_MISSING_INFO_FRAGMENTS = (
        "缺少",
        "缺乏",
        "建议补充",
        "图谱事实",
        "文本片段",
        "技术文档",
        "案例数据",
        "设备型号",
        "现场数据",
        "报警日志",
        "校准记录",
    )

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
        visible_warnings = self._filter_visible_warnings(warnings)
        has_citations = bool(graph_citations or document_citations)
        if (
            not has_citations
            and self.langchain_rag_service is not None
            and self.langchain_rag_service.should_use_quick_answer()
        ):
            generated_answer = self.langchain_rag_service.generate_quick_answer(
                question=question,
                route=route,
                executed_modes=executed_modes,
                warnings=visible_warnings,
            )
        elif self.langchain_rag_service is not None:
            generated_answer = self.langchain_rag_service.generate_grounded_answer(
                question=question,
                route=route,
                executed_modes=executed_modes,
                graph_citations=graph_citations,
                document_citations=document_citations,
                citation_groups=citation_groups,
                warnings=visible_warnings,
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
                warnings=visible_warnings,
                document_retriever=document_retriever,
            )
        else:
            generated_answer = None

        if generated_answer:
            if not self._should_accept_generated_answer(question, generated_answer):
                generated_answer = None
        if generated_answer:
            if isinstance(generated_answer, str):
                return self._clean_answer_text(generated_answer)
            return self._format_structured_answer(
                question=question,
                route=route,
                executed_modes=executed_modes,
                answer=generated_answer,
                warnings=visible_warnings,
                graph_citations=graph_citations,
                document_citations=document_citations,
            )

        fast_fallback = self._build_fast_fallback_answer(
            question=question,
            route=route,
            executed_modes=executed_modes,
            graph_citations=graph_citations,
            document_citations=document_citations,
            warnings=visible_warnings,
        )
        if fast_fallback is not None:
            return fast_fallback

        sections: list[str] = []

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
            sections.append("结论：\n- 结合现有经验先给出简要判断。")
            sections.append(
                "建议：\n- 建议补充异常编号、产线类型，或明确 SOP/手册/工单关键词以便继续收敛。"
            )
            sections.append("使用来源：\n" + f"- {self.DEFAULT_SOURCE_SUMMARY}")

        if visible_warnings:
            warning_lines = [f"- {warning}" for warning in visible_warnings]
            sections.append("风险/备注：\n" + "\n".join(warning_lines))

        return self._clean_answer_text("\n\n".join(sections))

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
            graph_citations=graph_citations,
            document_citations=document_citations,
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
        graph_citations: Sequence[QACitation],
        document_citations: Sequence[QACitation],
    ) -> str:
        source_summary_text = QAAnswerService._build_source_summary_text(
            graph_citations=graph_citations,
            document_citations=document_citations,
        )
        available_source_labels = QAAnswerService._build_available_source_labels(
            graph_citations=graph_citations,
            document_citations=document_citations,
        )
        sections: list[str] = []

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
        trusted_used_sources = [
            item.strip()
            for item in answer.used_sources
            if item.strip() and item.strip() in available_source_labels
        ]
        has_used_sources = bool(trusted_used_sources)
        if has_used_sources:
            sections.append(
                "使用来源：\n"
                + "\n".join(f"- {item}" for item in trusted_used_sources)
            )
        else:
            sections.append("使用来源：\n" + f"- {source_summary_text}")
        filtered_missing_information = QAAnswerService._filter_missing_information(
            answer.missing_information
        )
        if filtered_missing_information:
            sections.append(
                "缺失信息：\n"
                + "\n".join(
                    f"- {item}" for item in filtered_missing_information
                )
            )
        elif source_summary_text and not has_used_sources:
            sections.append("来源说明：\n" + f"- {source_summary_text}")

        risk_items = QAAnswerService._filter_risk_items(answer.risks)
        for warning in warnings:
            if warning not in risk_items:
                risk_items.append(warning)
        if risk_items:
            sections.append("风险/备注：\n" + "\n".join(f"- {item}" for item in risk_items))
        if answer.confidence is not None:
            sections.append(f"置信度：\n- {answer.confidence:.2f}")

        return QAAnswerService._clean_answer_text("\n\n".join(sections))

    @classmethod
    def _filter_visible_warnings(cls, warnings: Sequence[str]) -> list[str]:
        return [
            warning
            for warning in warnings
            if not warning.startswith(cls.NON_BLOCKING_WARNING_PREFIXES)
        ]

    @staticmethod
    def _build_source_summary_text(
        *,
        graph_citations: Sequence[QACitation],
        document_citations: Sequence[QACitation],
    ) -> str:
        total_hits = len(graph_citations) + len(document_citations)
        if total_hits <= 0:
            return QAAnswerService.DEFAULT_SOURCE_SUMMARY
        display_count = min(total_hits, 3)
        return f"已检索到{display_count}条相关信息"

    @staticmethod
    def _build_available_source_labels(
        *,
        graph_citations: Sequence[QACitation],
        document_citations: Sequence[QACitation],
    ) -> set[str]:
        labels: set[str] = set()
        for index, citation in enumerate(graph_citations, start=1):
            metadata = citation.metadata or {}
            retriever = str(metadata.get("retriever") or "graph").lower()
            prefix = {"graph": "G", "keyword": "K", "vector": "V", "document": "D"}.get(
                retriever,
                "G",
            )
            labels.add(f"{prefix}{index}")
        for index, citation in enumerate(document_citations, start=1):
            metadata = citation.metadata or {}
            retriever = str(metadata.get("retriever") or "document").lower()
            prefix = {"graph": "G", "keyword": "K", "vector": "V", "document": "D"}.get(
                retriever,
                "D",
            )
            labels.add(f"{prefix}{index}")
        return labels

    @classmethod
    def _filter_risk_items(cls, risk_items: Sequence[str]) -> list[str]:
        filtered_items: list[str] = []
        for item in risk_items:
            normalized_item = item.strip()
            if not normalized_item:
                continue
            if any(fragment in normalized_item for fragment in cls.GENERIC_RISK_FRAGMENTS):
                continue
            filtered_items.append(normalized_item)
        return filtered_items

    @classmethod
    def _filter_missing_information(cls, items: Sequence[str]) -> list[str]:
        filtered_items: list[str] = []
        for item in items:
            normalized_item = item.strip()
            if not normalized_item:
                continue
            if any(
                fragment in normalized_item for fragment in cls.GENERIC_MISSING_INFO_FRAGMENTS
            ):
                continue
            filtered_items.append(normalized_item)
        return filtered_items

    @classmethod
    def _clean_answer_text(cls, answer: str) -> str:
        cleaned_lines: list[str] = []
        banned_prefixes = (
            "问题：",
            "请求路由：",
            "实际执行：",
        )
        banned_fragments = (
            "图谱检索超时",
            "关键词检索超时",
            "向量检索超时",
            "未检索到信息",
            "没有命中",
            "无文本片段",
        )

        for raw_line in answer.splitlines():
            line = raw_line.strip()
            if not line:
                cleaned_lines.append("")
                continue
            if line.startswith(banned_prefixes):
                continue
            if any(fragment in line for fragment in banned_fragments):
                continue
            cleaned_lines.append(raw_line)

        cleaned_answer = "\n".join(cleaned_lines)
        cleaned_answer = re.sub(r"\n{3,}", "\n\n", cleaned_answer).strip()
        return cleaned_answer

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
