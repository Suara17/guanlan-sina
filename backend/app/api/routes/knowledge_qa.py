from fastapi import APIRouter, Depends

from app.api.deps import get_knowledge_qa_service
from app.services.knowledge_qa_models import QARequest, QAResponse
from app.services.knowledge_qa_service import KnowledgeQAService

router = APIRouter()


@router.post("/ask", response_model=QAResponse)
async def ask_knowledge_question(
    request: QARequest,
    knowledge_qa_service: KnowledgeQAService = Depends(get_knowledge_qa_service),
) -> QAResponse:
    """统一知识图谱与文档问答入口"""
    return knowledge_qa_service.ask(request)
