from collections.abc import Generator
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session

from app.models import TokenPayload, User
from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.services.langchain_service import LangChainService
from app.services.knowledge_qa_service import KnowledgeQAService
from app.services.neo4j_service import Neo4jService
from app.services.qa_answer_service import QAAnswerService
from app.services.qa_fusion_service import QAFusionService
from app.services.qa_router import QARouter
from app.services.document_index_service import DocumentIndexService
from app.services.retrievers import GraphRetriever, KeywordRetriever, VectorRetriever

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_neo4j_service() -> Neo4jService:
    """获取 Neo4j 服务实例"""
    if not settings.neo4j_enabled:
        raise HTTPException(status_code=503, detail="Neo4j service not configured")

    return Neo4jService(
        uri=settings.NEO4J_URI,
        user=settings.NEO4J_USER,
        password=settings.NEO4J_PASSWORD,
        database=settings.NEO4J_DATABASE,
    )


def get_knowledge_qa_service() -> KnowledgeQAService:
    """获取统一知识问答服务"""
    if not settings.KNOWLEDGE_QA_ENABLED:
        raise HTTPException(status_code=503, detail="Knowledge QA service disabled")

    neo4j_service = None
    langchain_service = LangChainService.from_settings()

    if settings.neo4j_enabled:
        neo4j_service = Neo4jService(
            uri=settings.NEO4J_URI,
            user=settings.NEO4J_USER,
            password=settings.NEO4J_PASSWORD,
            database=settings.NEO4J_DATABASE,
        )

    if neo4j_service is None:
        raise HTTPException(
            status_code=503, detail="Knowledge QA dependencies not configured"
        )

    return KnowledgeQAService(
        qa_router=QARouter(),
        answer_service=QAAnswerService(langchain_service=langchain_service),
        fusion_service=QAFusionService(),
        graph_retriever=GraphRetriever(neo4j_service),
        keyword_retriever=KeywordRetriever(DocumentIndexService()),
        vector_retriever=VectorRetriever(DocumentIndexService()),
    )
