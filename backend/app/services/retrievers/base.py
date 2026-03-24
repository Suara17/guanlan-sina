from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

from app.services.knowledge_qa_models import QACitation, QARequest


@dataclass
class RetrievalResult:
    hits: list[dict[str, Any]] = field(default_factory=list)
    citations: list[QACitation] = field(default_factory=list)


class BaseRetriever(ABC):
    name: str

    @property
    @abstractmethod
    def is_available(self) -> bool:
        raise NotImplementedError

    @abstractmethod
    def retrieve(self, request: QARequest) -> RetrievalResult:
        raise NotImplementedError
