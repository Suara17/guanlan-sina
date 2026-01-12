import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import SessionDep
from app.models import (
    Anomaly,
    Diagnosis,
    Solution,
)

router = APIRouter()


@router.get("/", response_model=list[Anomaly])
def read_anomalies(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
) -> Any:
    """
    Retrieve anomalies.
    """
    query = select(Anomaly)
    if status:
        query = query.where(Anomaly.status == status)
    query = query.offset(skip).limit(limit)
    anomalies = session.exec(query).all()
    return anomalies


@router.post("/{id}/diagnose", response_model=Diagnosis)
def trigger_diagnosis(
    *,
    session: SessionDep,
    id: uuid.UUID,
) -> Any:
    """
    Trigger diagnosis for an anomaly.
    """
    anomaly = session.get(Anomaly, id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    # Check if diagnosis already exists
    statement = select(Diagnosis).where(Diagnosis.anomaly_id == id)
    existing_diagnosis = session.exec(statement).first()

    if existing_diagnosis:
        return existing_diagnosis

    # Create new Diagnosis (Mock Logic)
    diagnosis = Diagnosis(
        anomaly_id=id,
        root_cause="Sensor Malfunction",
        confidence=0.85,
    )
    session.add(diagnosis)
    session.commit()
    session.refresh(diagnosis)

    # Create Solutions
    solution1 = Solution(
        diagnosis_id=diagnosis.id,
        title="Calibrate Sensor",
        description="Perform standard calibration procedure for the sensor.",
        roi_score=0.9,
    )
    solution2 = Solution(
        diagnosis_id=diagnosis.id,
        title="Replace Sensor",
        description="Replace the faulty sensor with a new unit.",
        roi_score=0.6,
    )
    session.add(solution1)
    session.add(solution2)

    # Update Anomaly status
    anomaly.status = "diagnosed"
    session.add(anomaly)

    session.commit()
    session.refresh(diagnosis)

    return diagnosis
