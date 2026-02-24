import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import SessionDep
from app.models import (
    Anomaly,
    AnomalyDetail,
    AnomalyWithRootCause,
    Diagnosis,
    DiagnosisPublic,
    Solution,
    SolutionPublic,
    SolutionWithCost,
    Station,
)

router = APIRouter()

MOCK_ANOMALY_DATA: dict[str, dict[str, Any]] = {
    "smt-001": {
        "location": "SMT设备#5",
        "message": "贴装精度下降",
        "root_cause": "产线布局密度过大（间距<0.8m）形成热岛效应，阻碍自然对流散热",
        "root_cause_confidence": 0.92,
        "causation_chain": [
            {"step": 1, "description": "贴装精度下降", "type": "phenomenon"},
            {
                "step": 2,
                "description": "设备内部温升超过环境温度10℃，导致龙门架热膨胀产生15µm位移",
                "type": "direct_cause",
            },
            {
                "step": 3,
                "description": "产线布局密度过大（间距<0.8m）形成热岛效应",
                "type": "root_cause",
            },
        ],
    },
    "smt-002": {
        "location": "SMT设备#2",
        "message": "后续贴装不良",
        "root_cause": "冷却区有效长度（2米）与传送带速度不匹配，无法提供足够的热交换时间",
        "root_cause_confidence": 0.88,
        "causation_chain": [
            {"step": 1, "description": "后续贴装不良", "type": "phenomenon"},
            {
                "step": 2,
                "description": "PCB出炉温度超过50℃，在机械传输中发生位移",
                "type": "direct_cause",
            },
            {
                "step": 3,
                "description": "冷却区有效长度与传送带速度不匹配",
                "type": "root_cause",
            },
        ],
    },
    "pcb-003": {
        "location": "PCB设备#4",
        "message": "曝光精度下降",
        "root_cause": "传输距离过长（8米）且无环境温度控制，导致板面温度在进入曝光机前波动过大",
        "root_cause_confidence": 0.85,
        "causation_chain": [
            {"step": 1, "description": "曝光精度下降", "type": "phenomenon"},
            {
                "step": 2,
                "description": "PCB板在传输过程中发生非均匀热收缩",
                "type": "direct_cause",
            },
            {
                "step": 3,
                "description": "传输距离过长且无环境温度控制",
                "type": "root_cause",
            },
        ],
    },
    "3c-009": {
        "location": "3C设备#1",
        "message": "外壳开裂",
        "root_cause": "电批内部离合器磨损，导致扭力设定值失效（打滑或锁死）",
        "root_cause_confidence": 0.90,
        "causation_chain": [
            {"step": 1, "description": "外壳开裂", "type": "phenomenon"},
            {
                "step": 2,
                "description": "电批输出扭力超过外壳材料屈服极限",
                "type": "direct_cause",
            },
            {"step": 3, "description": "电批内部离合器磨损", "type": "root_cause"},
        ],
    },
}

MOCK_SOLUTIONS: dict[str, list[dict[str, Any]]] = {
    "smt-001": [
        {
            "id": "sol-smt-001-a",
            "title": "方案A：立即停机更换吸嘴",
            "description": "根因置信度 92%。更换备件库中的 N-204 型吸嘴。",
            "repair_cost": 2500.0,
            "delivery_impact_hours": 0.25,
            "delivery_impact_cost": 8000.0,
            "quality_risk_cost": 500.0,
            "downtime_cost": 12000.0,
            "total_expected_loss": 23000.0,
            "implementation_time_hours": 0.25,
            "success_rate": 0.92,
            "risk_level": "low",
            "recommended": True,
        },
        {
            "id": "sol-smt-001-b",
            "title": "方案B：调整气压参数补偿",
            "description": "临时提高真空发生器负压至 -85kPa，维持生产。",
            "repair_cost": 0.0,
            "delivery_impact_hours": 0.03,
            "delivery_impact_cost": 1000.0,
            "quality_risk_cost": 3000.0,
            "downtime_cost": 0.0,
            "total_expected_loss": 4000.0,
            "implementation_time_hours": 0.03,
            "success_rate": 0.75,
            "risk_level": "medium",
            "recommended": False,
        },
    ],
    "smt-002": [
        {
            "id": "sol-smt-002-a",
            "title": "方案A：增加临时冷气风刀",
            "description": "在出口处增加临时冷气风刀，加速冷却。",
            "repair_cost": 500.0,
            "delivery_impact_hours": 0.5,
            "delivery_impact_cost": 6000.0,
            "quality_risk_cost": 800.0,
            "downtime_cost": 8000.0,
            "total_expected_loss": 15300.0,
            "implementation_time_hours": 0.5,
            "success_rate": 0.88,
            "risk_level": "low",
            "recommended": True,
        },
        {
            "id": "sol-smt-002-b",
            "title": "方案B：降低传送带速度",
            "description": "降低传送带速度（牺牲部分产能）以保证冷却时间。",
            "repair_cost": 0.0,
            "delivery_impact_hours": 2.0,
            "delivery_impact_cost": 24000.0,
            "quality_risk_cost": 200.0,
            "downtime_cost": 0.0,
            "total_expected_loss": 24200.0,
            "implementation_time_hours": 0.1,
            "success_rate": 0.95,
            "risk_level": "medium",
            "recommended": False,
        },
    ],
    "pcb-003": [
        {
            "id": "sol-pcb-003-a",
            "title": "方案A：缩短传输时间加装保温罩",
            "description": "缩短传输时间，或在传输段加装保温罩。",
            "repair_cost": 3000.0,
            "delivery_impact_hours": 1.0,
            "delivery_impact_cost": 12000.0,
            "quality_risk_cost": 1000.0,
            "downtime_cost": 15000.0,
            "total_expected_loss": 31000.0,
            "implementation_time_hours": 1.0,
            "success_rate": 0.85,
            "risk_level": "low",
            "recommended": True,
        },
        {
            "id": "sol-pcb-003-b",
            "title": "方案B：增加板材温度调理缓存区",
            "description": "在曝光机入口增加板材温度调理缓存区。",
            "repair_cost": 15000.0,
            "delivery_impact_hours": 4.0,
            "delivery_impact_cost": 48000.0,
            "quality_risk_cost": 500.0,
            "downtime_cost": 60000.0,
            "total_expected_loss": 123500.0,
            "implementation_time_hours": 24.0,
            "success_rate": 0.98,
            "risk_level": "low",
            "recommended": False,
        },
    ],
    "3c-009": [
        {
            "id": "sol-3c-009-a",
            "title": "方案A：下调电批扭力并更换限力电批",
            "description": "下调电批扭力至3.5kgf.cm，更换限力电批。",
            "repair_cost": 800.0,
            "delivery_impact_hours": 0.5,
            "delivery_impact_cost": 4000.0,
            "quality_risk_cost": 200.0,
            "downtime_cost": 6000.0,
            "total_expected_loss": 11000.0,
            "implementation_time_hours": 0.5,
            "success_rate": 0.92,
            "risk_level": "low",
            "recommended": True,
        },
        {
            "id": "sol-3c-009-b",
            "title": "方案B：更换磨损离合器弹簧",
            "description": "更换磨损离合器弹簧，修复电批。",
            "repair_cost": 200.0,
            "delivery_impact_hours": 1.0,
            "delivery_impact_cost": 8000.0,
            "quality_risk_cost": 1500.0,
            "downtime_cost": 12000.0,
            "total_expected_loss": 21700.0,
            "implementation_time_hours": 1.0,
            "success_rate": 0.80,
            "risk_level": "medium",
            "recommended": False,
        },
    ],
}


@router.get("/", response_model=list[Anomaly])
def read_anomalies(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
) -> Any:
    query = select(Anomaly)
    if status:
        query = query.where(Anomaly.status == status)
    query = query.offset(skip).limit(limit)
    anomalies = session.exec(query).all()
    return anomalies


@router.get("/{id}", response_model=AnomalyDetail)
def get_anomaly_detail(
    *,
    session: SessionDep,
    id: uuid.UUID,
) -> Any:
    anomaly = session.get(Anomaly, id)
    if anomaly:
        station = session.get(Station, anomaly.station_id)
        location = f"{station.station_name if station else '未知位置'}"

        solutions_stmt = select(Solution).where(Solution.anomaly_id == id)
        solutions = session.exec(solutions_stmt).all()

        causation: list[dict[str, Any]] = []
        if anomaly.causation_chain:
            if isinstance(anomaly.causation_chain, list):
                causation = anomaly.causation_chain
            elif isinstance(anomaly.causation_chain, dict):
                causation = [anomaly.causation_chain]

        return AnomalyDetail(
            id=anomaly.id,
            line_id=anomaly.line_id,
            station_id=anomaly.station_id,
            defect_type=anomaly.defect_type,
            severity=anomaly.severity,
            detected_at=anomaly.detected_at,
            status=anomaly.status,
            root_cause=anomaly.root_cause,
            root_cause_confidence=anomaly.root_cause_confidence,
            causation_chain=causation,
            solutions=[SolutionPublic.model_validate(s) for s in solutions],
            location=location,
            message=anomaly.defect_type,
            created_at=anomaly.created_at,
        )

    str_id = str(id)
    if str_id in MOCK_ANOMALY_DATA:
        mock_data = MOCK_ANOMALY_DATA[str_id]
        return AnomalyDetail(
            id=id,
            line_id=uuid.uuid4(),
            station_id=uuid.uuid4(),
            defect_type=mock_data["message"],
            severity="error",
            detected_at=datetime.utcnow(),
            status="open",
            root_cause=mock_data["root_cause"],
            root_cause_confidence=mock_data["root_cause_confidence"],
            causation_chain=mock_data["causation_chain"],
            solutions=[],
            location=mock_data["location"],
            message=mock_data["message"],
            created_at=datetime.utcnow(),
        )

    raise HTTPException(status_code=404, detail="Anomaly not found")


@router.get("/{id}/analysis", response_model=AnomalyWithRootCause)
def get_anomaly_analysis(
    *,
    session: SessionDep,
    id: uuid.UUID,
) -> Any:
    anomaly = session.get(Anomaly, id)
    if anomaly and anomaly.root_cause:
        solutions_stmt = select(Solution).where(Solution.anomaly_id == id)
        solutions = session.exec(solutions_stmt).all()

        causation: list[dict[str, Any]] = []
        if anomaly.causation_chain:
            if isinstance(anomaly.causation_chain, list):
                causation = anomaly.causation_chain
            elif isinstance(anomaly.causation_chain, dict):
                causation = [anomaly.causation_chain]

        return AnomalyWithRootCause(
            id=anomaly.id,
            line_id=anomaly.line_id,
            station_id=anomaly.station_id,
            defect_type=anomaly.defect_type,
            severity=anomaly.severity,
            detected_at=anomaly.detected_at,
            status=anomaly.status,
            root_cause=anomaly.root_cause,
            root_cause_confidence=anomaly.root_cause_confidence,
            causation_chain=causation,
            solutions=[SolutionPublic.model_validate(s) for s in solutions],
        )

    str_id = str(id)
    if str_id in MOCK_ANOMALY_DATA:
        mock_data = MOCK_ANOMALY_DATA[str_id]
        return AnomalyWithRootCause(
            id=id,
            line_id=uuid.uuid4(),
            station_id=uuid.uuid4(),
            defect_type=mock_data["message"],
            severity="error",
            detected_at=datetime.utcnow(),
            status="open",
            root_cause=mock_data["root_cause"],
            root_cause_confidence=mock_data["root_cause_confidence"],
            causation_chain=mock_data["causation_chain"],
            solutions=[],
        )

    raise HTTPException(status_code=404, detail="Anomaly not found")


@router.post("/{id}/generate-solutions", response_model=list[SolutionWithCost])
def generate_solutions(
    *,
    session: SessionDep,
    id: uuid.UUID,
    include_cost_analysis: bool = True,
) -> Any:
    anomaly = session.get(Anomaly, id)
    if not anomaly:
        str_id = str(id)
        if str_id not in MOCK_SOLUTIONS:
            raise HTTPException(status_code=404, detail="Anomaly not found")

        mock_solutions = MOCK_SOLUTIONS[str_id]
        result = []
        for sol_data in mock_solutions:
            sol_id_str = sol_data.get("id", str(uuid.uuid4()))
            sol = SolutionWithCost(
                id=uuid.uuid4() if len(sol_id_str) != 36 else uuid.UUID(sol_id_str),
                anomaly_id=id,
                solution_name=str(sol_data.get("title", "")),
                description=str(sol_data.get("description", "")),
                solution_type="Maintenance",
                repair_cost=float(sol_data.get("repair_cost", 0)),
                delivery_impact_hours=float(sol_data.get("delivery_impact_hours", 0)),
                delivery_impact_cost=float(sol_data.get("delivery_impact_cost", 0)),
                quality_risk_cost=float(sol_data.get("quality_risk_cost", 0)),
                downtime_cost=float(sol_data.get("downtime_cost", 0)),
                total_expected_loss=float(sol_data.get("total_expected_loss", 0)),
                implementation_time_hours=float(
                    sol_data.get("implementation_time_hours", 0)
                ),
                success_rate=float(sol_data.get("success_rate", 0)),
                risk_level=str(sol_data.get("risk_level", "low")),
                recommended=bool(sol_data.get("recommended", False)),
                diagnosis_id=None,
                cost_matrix={
                    "repair_cost": float(sol_data.get("repair_cost", 0)),
                    "delivery_impact_cost": float(
                        sol_data.get("delivery_impact_cost", 0)
                    ),
                    "quality_risk_cost": float(sol_data.get("quality_risk_cost", 0)),
                    "downtime_cost": float(sol_data.get("downtime_cost", 0)),
                    "total_expected_loss": float(
                        sol_data.get("total_expected_loss", 0)
                    ),
                }
                if include_cost_analysis
                else None,
            )
            result.append(sol)
        return result

    solutions_stmt = select(Solution).where(Solution.anomaly_id == id)
    existing_solutions = session.exec(solutions_stmt).all()

    if existing_solutions:
        result = []
        for sol in existing_solutions:
            sol_public = SolutionWithCost.model_validate(sol)
            if include_cost_analysis:
                sol_public.cost_matrix = {
                    "repair_cost": sol.repair_cost,
                    "delivery_impact_cost": sol.delivery_impact_cost,
                    "quality_risk_cost": sol.quality_risk_cost,
                    "downtime_cost": sol.downtime_cost,
                    "total_expected_loss": sol.total_expected_loss,
                }
            result.append(sol_public)
        return result

    new_solutions = []
    default_solutions = [
        {
            "name": "标准维修方案",
            "desc": "按照标准流程进行设备维修",
            "repair": 5000.0,
            "delivery_hours": 2.0,
            "delivery_cost": 16000.0,
            "quality_cost": 1000.0,
            "downtime": 20000.0,
            "impl_hours": 2.0,
            "success": 0.90,
            "risk": "low",
            "recommended": True,
        },
        {
            "name": "快速临时方案",
            "desc": "临时调整参数维持生产，后续再进行维修",
            "repair": 500.0,
            "delivery_hours": 0.5,
            "delivery_cost": 4000.0,
            "quality_cost": 3000.0,
            "downtime": 5000.0,
            "impl_hours": 0.5,
            "success": 0.75,
            "risk": "medium",
            "recommended": False,
        },
    ]

    for sol_data in default_solutions:
        total_loss = (
            sol_data["repair"]
            + sol_data["delivery_cost"]
            + sol_data["quality_cost"]
            + sol_data["downtime"]
        )
        solution = Solution(
            anomaly_id=id,
            solution_name=sol_data["name"],
            description=sol_data["desc"],
            solution_type="Maintenance",
            repair_cost=sol_data["repair"],
            delivery_impact_hours=sol_data["delivery_hours"],
            delivery_impact_cost=sol_data["delivery_cost"],
            quality_risk_cost=sol_data["quality_cost"],
            downtime_cost=sol_data["downtime"],
            total_expected_loss=total_loss,
            implementation_time_hours=sol_data["impl_hours"],
            success_rate=sol_data["success"],
            risk_level=sol_data["risk"],
            recommended=sol_data["recommended"],
            estimated_downtime_hours=sol_data["impl_hours"],
        )
        session.add(solution)
        new_solutions.append(solution)

    anomaly.status = "diagnosed"
    session.add(anomaly)
    session.commit()

    result = []
    for sol in new_solutions:
        session.refresh(sol)
        sol_public = SolutionWithCost.model_validate(sol)
        if include_cost_analysis:
            sol_public.cost_matrix = {
                "repair_cost": sol.repair_cost,
                "delivery_impact_cost": sol.delivery_impact_cost,
                "quality_risk_cost": sol.quality_risk_cost,
                "downtime_cost": sol.downtime_cost,
                "total_expected_loss": sol.total_expected_loss,
            }
        result.append(sol_public)

    return result


@router.post("/{id}/diagnose", response_model=DiagnosisPublic)
def trigger_diagnosis(
    *,
    session: SessionDep,
    id: uuid.UUID,
) -> Any:
    anomaly = session.get(Anomaly, id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    statement = select(Diagnosis).where(Diagnosis.anomaly_id == id)
    existing_diagnosis = session.exec(statement).first()

    if existing_diagnosis:
        return existing_diagnosis

    diagnosis = Diagnosis(
        anomaly_id=id,
        root_cause="Sensor Malfunction",
        confidence=0.85,
    )
    session.add(diagnosis)
    session.commit()
    session.refresh(diagnosis)

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
        repair_cost=500.0,
        delivery_impact_hours=0.5,
        delivery_impact_cost=4000.0,
        quality_risk_cost=200.0,
        downtime_cost=3000.0,
        total_expected_loss=7700.0,
        implementation_time_hours=0.5,
        risk_level="low",
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
        repair_cost=2000.0,
        delivery_impact_hours=2.0,
        delivery_impact_cost=16000.0,
        quality_risk_cost=100.0,
        downtime_cost=15000.0,
        total_expected_loss=33100.0,
        implementation_time_hours=2.0,
        risk_level="low",
    )
    session.add(solution1)
    session.add(solution2)

    anomaly.status = "diagnosed"
    session.add(anomaly)

    session.commit()
    session.refresh(diagnosis)

    return diagnosis
