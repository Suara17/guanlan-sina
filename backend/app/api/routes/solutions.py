import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import SQLModel, select

from app.api.deps import SessionDep, CurrentUser
from app.models import (
    Anomaly,
    Diagnosis,
    Solution,
    SolutionPublic,
    SolutionWithCost,
    WorkOrder,
)

router = APIRouter()


class AdoptSolutionRequest(SQLModel):
    assigned_to: str | None = None
    notes: str | None = None


class AdoptSolutionResponse(SQLModel):
    work_order_id: uuid.UUID
    status: str
    redirect_url: str
    solution: SolutionPublic


@router.get("/", response_model=list[SolutionWithCost])
def get_solutions_by_anomaly(
    *,
    session: SessionDep,
    anomaly_id: uuid.UUID | None = None,
) -> Any:
    query = select(Solution)
    if anomaly_id:
        query = query.where(Solution.anomaly_id == anomaly_id)
    solutions = session.exec(query).all()

    result = []
    for sol in solutions:
        sol_with_cost = SolutionWithCost.model_validate(sol)
        sol_with_cost.cost_matrix = {
            "repair_cost": sol.repair_cost,
            "delivery_impact_cost": sol.delivery_impact_cost,
            "quality_risk_cost": sol.quality_risk_cost,
            "downtime_cost": sol.downtime_cost,
            "total_expected_loss": sol.total_expected_loss,
        }
        result.append(sol_with_cost)

    return result


@router.get("/{id}", response_model=SolutionWithCost)
def get_solution(
    *,
    session: SessionDep,
    id: uuid.UUID,
) -> Any:
    solution = session.get(Solution, id)
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    sol_with_cost = SolutionWithCost.model_validate(solution)
    sol_with_cost.cost_matrix = {
        "repair_cost": solution.repair_cost,
        "delivery_impact_cost": solution.delivery_impact_cost,
        "quality_risk_cost": solution.quality_risk_cost,
        "downtime_cost": solution.downtime_cost,
        "total_expected_loss": solution.total_expected_loss,
    }

    return sol_with_cost


@router.post("/{id}/adopt", response_model=AdoptSolutionResponse)
def adopt_solution(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    request: AdoptSolutionRequest | None = None,
) -> Any:
    solution = session.get(Solution, id)
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    statement = select(WorkOrder).where(WorkOrder.solution_id == id)
    existing_work_order = session.exec(statement).first()
    if existing_work_order:
        return AdoptSolutionResponse(
            work_order_id=existing_work_order.id,
            status=existing_work_order.status,
            redirect_url=f"/app/zhixing?order_id={existing_work_order.id}",
            solution=SolutionPublic.model_validate(solution),
        )

    work_order = WorkOrder(
        solution_id=id,
        order_type=solution.solution_type or "Maintenance",
        instructions=solution.description,
        estimated_duration_hours=solution.implementation_time_hours,
        status="pending",
        responsible_person=request.assigned_to if request else None,
        notes=request.notes if request else None,
    )
    session.add(work_order)

    if solution.diagnosis_id:
        diagnosis = session.get(Diagnosis, solution.diagnosis_id)
        if diagnosis and diagnosis.anomaly_id:
            anomaly = session.get(Anomaly, diagnosis.anomaly_id)
            if anomaly:
                anomaly.status = "in_progress"
                anomaly.solution_id = id
                session.add(anomaly)
    elif solution.anomaly_id:
        anomaly = session.get(Anomaly, solution.anomaly_id)
        if anomaly:
            anomaly.status = "in_progress"
            anomaly.solution_id = id
            session.add(anomaly)

    session.commit()
    session.refresh(work_order)

    return AdoptSolutionResponse(
        work_order_id=work_order.id,
        status=work_order.status,
        redirect_url=f"/app/zhixing?order_id={work_order.id}",
        solution=SolutionPublic.model_validate(solution),
    )


@router.post("/{id}/select", response_model=WorkOrder)
def select_solution(
    *,
    session: SessionDep,
    id: uuid.UUID,
) -> Any:
    solution = session.get(Solution, id)
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    statement = select(WorkOrder).where(WorkOrder.solution_id == id)
    existing_work_order = session.exec(statement).first()
    if existing_work_order:
        return existing_work_order

    work_order = WorkOrder(
        solution_id=id,
        order_type=solution.solution_type or "Maintenance",
        instructions=solution.description,
        estimated_duration_hours=solution.implementation_time_hours,
        status="pending",
    )
    session.add(work_order)

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
