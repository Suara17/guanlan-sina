from typing import Any

from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models import ProductionLine, ProductionPlan

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
    # Fetch all lines with their current plans
    lines = session.exec(select(ProductionLine)).all()

    total_target = 0
    total_actual = 0
    line_stats = []

    for line in lines:
        target = 0
        actual = 0

        # Try to find current plan
        # Note: In a real app with high load, we should eager load plans or use a join
        if line.current_plan_id:
            # We assume current_plan_id points to a valid plan
            # We could also look up plans by line_id and status='in_progress'
            plan = session.get(ProductionPlan, line.current_plan_id)
            if plan:
                target = plan.planned_quantity
                actual = plan.actual_quantity

        total_target += target
        total_actual += actual

        line_stats.append(
            {
                "name": line.line_name,
                "target": target,
                "actual": actual,
                "status": line.current_status,
            }
        )

    # Calculate overall yield (here simplified as actual/target, but could be based on QualityMetrics)
    overall_yield = (total_actual / total_target) if total_target > 0 else 0.0

    return {
        "total_target": total_target,
        "total_actual": total_actual,
        "overall_yield": overall_yield,
        "line_stats": line_stats,
    }
