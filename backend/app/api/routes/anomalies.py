import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import SessionDep
from app.models import (
    Anomaly,
    Diagnosis,
    DiagnosisPublic,
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


@router.post("/{id}/diagnose", response_model=DiagnosisPublic)
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
        anomaly_id=id,
        diagnosis_id=diagnosis.id,
        solution_name="Calibrate Sensor",
        description="Perform standard calibration procedure for the sensor.",
        roi=0.9,
        solution_type="Maintenance",
        estimated_downtime_hours=0.5,
        success_rate=0.95,
        expected_loss=100.0,
        recommended=True,
    )
    solution2 = Solution(
        anomaly_id=id,
        diagnosis_id=diagnosis.id,
        solution_name="Replace Sensor",
        description="Replace the faulty sensor with a new unit.",
        roi=0.6,
        solution_type="Replacement",
        estimated_downtime_hours=2.0,
        success_rate=0.99,
        expected_loss=500.0,
        recommended=False,
    )
    session.add(solution1)
    session.add(solution2)

    # Update Anomaly status
    anomaly.status = "diagnosed"
    session.add(anomaly)

    session.commit()
    session.refresh(diagnosis)

    return diagnosis
