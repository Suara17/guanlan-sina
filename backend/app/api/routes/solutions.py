import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import SessionDep
from app.models import (
    Anomaly,
    Diagnosis,
    Solution,
    WorkOrder,
)

router = APIRouter()


@router.post("/{id}/select", response_model=WorkOrder)
def select_solution(
    *,
    session: SessionDep,
    id: uuid.UUID,
) -> Any:
    """
    Select a solution and create a work order.
    """
    solution = session.get(Solution, id)
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    # Check if work order already exists
    statement = select(WorkOrder).where(WorkOrder.solution_id == id)
    existing_work_order = session.exec(statement).first()
    if existing_work_order:
        return existing_work_order

    # Create Work Order
    work_order = WorkOrder(
        solution_id=id,
        order_type=solution.solution_type or "Maintenance",
        instructions=solution.description,
        estimated_duration_hours=solution.estimated_downtime_hours,
        status="pending",
    )
    session.add(work_order)

    # Update Anomaly Status
    # Traverse back to Anomaly: Solution -> Diagnosis -> Anomaly
    if solution.diagnosis_id:
        diagnosis = session.get(Diagnosis, solution.diagnosis_id)
        if diagnosis and diagnosis.anomaly_id:
            anomaly = session.get(Anomaly, diagnosis.anomaly_id)
            if anomaly:
                anomaly.status = "in_progress"
                session.add(anomaly)

    session.commit()
    session.refresh(work_order)

    return work_order
