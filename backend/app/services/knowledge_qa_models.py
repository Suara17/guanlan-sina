from typing import Any, Literal

from pydantic import BaseModel, Field


class QARequest(BaseModel):
    question: str = Field(min_length=1)
    line_type: str | None = None
    sequence: int | None = None
    top_k: int = Field(default=5, ge=1, le=10)


class QARouteDecision(BaseModel):
    mode: Literal["graph", "document", "hybrid"]
    reasons: list[str] = Field(default_factory=list)


class QACitation(BaseModel):
    source_type: Literal["graph", "document"]
    title: str
    snippet: str
    score: float | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class QADebugInfo(BaseModel):
    requested_route: str
    executed_modes: list[str] = Field(default_factory=list)
    graph_hit_count: int = 0
    document_hit_count: int = 0
    warnings_count: int = 0
    timing_ms: dict[str, float] = Field(default_factory=dict)


class QAResponse(BaseModel):
    answer: str
    route: QARouteDecision
    citations: list[QACitation] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    graph_hits: list[dict[str, Any]] = Field(default_factory=list)
    document_hits: list[dict[str, Any]] = Field(default_factory=list)
    debug: QADebugInfo | None = None
