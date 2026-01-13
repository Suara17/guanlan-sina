from typing import Any

from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models import ProductionLine

router = APIRouter()


@router.get("/lines", response_model=list[ProductionLine])
def read_production_lines(
    session: SessionDep, _current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve production lines.
    """
    statement = select(ProductionLine).offset(skip).limit(limit)
    lines = session.exec(statement).all()
    return lines


@router.get("/overview")
def read_production_overview(session: SessionDep, _current_user: CurrentUser) -> Any:
    """
    Retrieve production overview statistics.
    """
    # For MVP, we calculate simple stats
    # total_target = sum of target_output of all lines

    lines = session.exec(select(ProductionLine)).all()
    # For now, use a default target output since the model doesn't have this field
    # In a real scenario, this would be a separate field or calculated from plans
    total_target = len(lines) * 100  # Default 100 units per line

    # Mocking actual and yield for now as we don't have actual_output field yet
    # In a real scenario, this would come from aggregating station outputs or a separate field
    total_actual = int(total_target * 0.95) if total_target > 0 else 0
    overall_yield = 0.95 if total_target > 0 else 0.0

    return {
        "total_target": total_target,
        "total_actual": total_actual,
        "overall_yield": overall_yield,
    }
