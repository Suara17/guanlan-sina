import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, select

from app.api.deps import CurrentUser, SessionDep
from app.models import CaseLibrary, CaseLibraryBase, Message

router = APIRouter()


@router.get("/", response_model=list[CaseLibrary])
def read_cases(
    session: SessionDep,
    _current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
) -> Any:
    """
    Retrieve cases from the library.
    """
    query = select(CaseLibrary)

    if search:
        # Simple case-insensitive search on problem description or lessons learned
        query = query.where(
            col(CaseLibrary.problem_description).ilike(f"%{search}%")
            | col(CaseLibrary.lessons_learned).ilike(f"%{search}%")
        )

    query = query.offset(skip).limit(limit)
    return session.exec(query).all()


@router.get("/{id}", response_model=CaseLibrary)
def read_case(session: SessionDep, _current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get a specific case by ID.
    """
    case_item = session.get(CaseLibrary, id)
    if not case_item:
        raise HTTPException(status_code=404, detail="Case not found")
    return case_item


@router.post("/", response_model=CaseLibrary)
def create_case(
    *, session: SessionDep, _current_user: CurrentUser, case_in: CaseLibraryBase
) -> Any:
    """
    Create a new case in the library.
    """
    case_item = CaseLibrary.model_validate(case_in)
    session.add(case_item)
    session.commit()
    session.refresh(case_item)
    return case_item


@router.patch("/{id}", response_model=CaseLibrary)
def update_case(
    *,
    session: SessionDep,
    _current_user: CurrentUser,
    id: uuid.UUID,
    case_in: CaseLibraryBase,
) -> Any:
    """
    Update a case.
    """
    case_item = session.get(CaseLibrary, id)
    if not case_item:
        raise HTTPException(status_code=404, detail="Case not found")

    update_data = case_in.model_dump(exclude_unset=True)
    case_item.sqlmodel_update(update_data)
    session.add(case_item)
    session.commit()
    session.refresh(case_item)
    return case_item


@router.delete("/{id}", response_model=Message)
def delete_case(session: SessionDep, _current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Delete a case.
    """
    case_item = session.get(CaseLibrary, id)
    if not case_item:
        raise HTTPException(status_code=404, detail="Case not found")
    session.delete(case_item)
    session.commit()
    return Message(message="Case deleted successfully")
