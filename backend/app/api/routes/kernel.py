import uuid
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import SQLModel, select

from app.api.deps import CurrentUser, SessionDep
from app.models import ProductionLine, Station

router = APIRouter()


class KernelDiscoveredDevice(SQLModel):
    device_id: str
    name: str
    ip: str
    device_type: str
    protocol: str
    match_status: str
    connectivity_status: str
    last_communication_at: str | None = None


class ScanJobCreateResponse(SQLModel):
    scan_job_id: str
    started_at: str
    status: str


class ScanJobStatusResponse(SQLModel):
    scan_job_id: str
    status: str
    progress: int
    discovered_count: int
    discovered_devices: list[KernelDiscoveredDevice]
    started_at: str
    updated_at: str


class TopologyStation(SQLModel):
    station_id: str
    station_name: str
    station_type: str | None = None


class TopologyLine(SQLModel):
    line_id: str
    line_name: str
    factory_id: str
    stations: list[TopologyStation]


class KernelBindingItem(SQLModel):
    device_id: str
    line_id: str
    station_id: str


class BatchBindingRequest(SQLModel):
    scan_job_id: str
    bindings: list[KernelBindingItem]


class BatchBindingResponse(SQLModel):
    scan_job_id: str
    success_count: int
    failed_count: int
    failed_reasons: list[str]


class KernelDiagnosisResponse(SQLModel):
    scan_job_id: str
    discovered_count: int
    bound_count: int
    unbound_device_ids: list[str]
    failed_device_ids: list[str]
    summary_status: str
    summary: str
    recommendations: list[str]
    redirect_recommendations: list[str]


SCAN_JOB_TIMESTAMPS: dict[str, datetime] = {}
SCAN_JOB_BINDINGS: dict[str, list[KernelBindingItem]] = {}
SCAN_JOB_FAILED_DEVICES: dict[str, list[str]] = {}


def _all_discovered_devices() -> list[KernelDiscoveredDevice]:
    now = datetime.utcnow()
    return [
        KernelDiscoveredDevice(
            device_id="KD-001",
            name="Siemens PLC S7-1200",
            ip="192.168.0.101",
            device_type="PLC",
            protocol="Modbus TCP",
            match_status="matched",
            connectivity_status="online",
            last_communication_at=(now - timedelta(seconds=15)).isoformat(),
        ),
        KernelDiscoveredDevice(
            device_id="KD-002",
            name="Hikvision Camera A4",
            ip="192.168.0.105",
            device_type="Camera",
            protocol="OPC UA",
            match_status="matched",
            connectivity_status="online",
            last_communication_at=(now - timedelta(seconds=22)).isoformat(),
        ),
        KernelDiscoveredDevice(
            device_id="KD-003",
            name="Temp Sensor Array",
            ip="192.168.0.112",
            device_type="IoT",
            protocol="Modbus RTU Gateway",
            match_status="matched",
            connectivity_status="online",
            last_communication_at=(now - timedelta(seconds=8)).isoformat(),
        ),
    ]


def _scan_snapshot(started_at: datetime) -> tuple[str, int, list[KernelDiscoveredDevice]]:
    elapsed_seconds = (datetime.utcnow() - started_at).total_seconds()
    devices = _all_discovered_devices()

    if elapsed_seconds < 1.5:
        return "running", 25, []
    if elapsed_seconds < 3.0:
        return "running", 55, devices[:1]
    if elapsed_seconds < 4.5:
        return "running", 80, devices[:2]
    return "completed", 100, devices


@router.post("/scan-jobs", response_model=ScanJobCreateResponse)
def create_scan_job(_current_user: CurrentUser) -> Any:
    scan_job_id = str(uuid.uuid4())
    started_at = datetime.utcnow()

    SCAN_JOB_TIMESTAMPS[scan_job_id] = started_at
    SCAN_JOB_BINDINGS[scan_job_id] = []
    SCAN_JOB_FAILED_DEVICES[scan_job_id] = []

    return {
        "scan_job_id": scan_job_id,
        "started_at": started_at.isoformat(),
        "status": "running",
    }


@router.get("/scan-jobs/{scan_job_id}", response_model=ScanJobStatusResponse)
def get_scan_job_status(scan_job_id: str, _current_user: CurrentUser) -> Any:
    started_at = SCAN_JOB_TIMESTAMPS.get(scan_job_id)
    if not started_at:
        raise HTTPException(status_code=404, detail="scan job not found")

    status, progress, discovered_devices = _scan_snapshot(started_at)

    return {
        "scan_job_id": scan_job_id,
        "status": status,
        "progress": progress,
        "discovered_count": len(discovered_devices),
        "discovered_devices": discovered_devices,
        "started_at": started_at.isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/topology", response_model=list[TopologyLine])
def get_topology(session: SessionDep, _current_user: CurrentUser) -> Any:
    lines = session.exec(select(ProductionLine)).all()
    stations = session.exec(select(Station)).all()

    station_map: dict[str, list[Station]] = {}
    for station in stations:
        key = str(station.line_id)
        station_map.setdefault(key, []).append(station)

    topology: list[TopologyLine] = []
    for line in lines:
        line_id = str(line.id)
        line_stations = station_map.get(line_id, [])
        sorted_stations = sorted(
            line_stations,
            key=lambda s: (s.sequence_order if s.sequence_order is not None else 9999, s.station_name),
        )
        topology.append(
            TopologyLine(
                line_id=line_id,
                line_name=line.line_name,
                factory_id=str(line.factory_id),
                stations=[
                    TopologyStation(
                        station_id=str(station.id),
                        station_name=station.station_name,
                        station_type=station.station_type,
                    )
                    for station in sorted_stations
                ],
            )
        )

    topology.sort(key=lambda l: l.line_name)
    return topology


@router.post("/bindings:batch", response_model=BatchBindingResponse)
def batch_bind_devices(
    request: BatchBindingRequest,
    session: SessionDep,
    _current_user: CurrentUser,
) -> Any:
    started_at = SCAN_JOB_TIMESTAMPS.get(request.scan_job_id)
    if not started_at:
        raise HTTPException(status_code=404, detail="scan job not found")

    scan_status, _, _ = _scan_snapshot(started_at)
    if scan_status != "completed":
        raise HTTPException(status_code=400, detail="scan job is still running")

    if not request.bindings:
        raise HTTPException(status_code=400, detail="bindings cannot be empty")

    deduplicated_by_device: dict[str, KernelBindingItem] = {}
    for item in request.bindings:
        deduplicated_by_device[item.device_id] = item

    effective_bindings = list(deduplicated_by_device.values())
    all_stations = session.exec(select(Station)).all()
    station_lookup = {str(station.id): station for station in all_stations}
    line_lookup = {str(line.id): line for line in session.exec(select(ProductionLine)).all()}

    failed_reasons: list[str] = []
    successful_bindings: list[KernelBindingItem] = []

    for item in effective_bindings:
        line = line_lookup.get(item.line_id)
        station = station_lookup.get(item.station_id)

        if not line:
            failed_reasons.append(f"设备 {item.device_id}: 产线不存在")
            continue
        if not station:
            failed_reasons.append(f"设备 {item.device_id}: 工位不存在")
            continue
        if str(station.line_id) != item.line_id:
            failed_reasons.append(f"设备 {item.device_id}: 工位不属于所选产线")
            continue

        # 先在全工位去除该设备，确保单设备唯一绑定
        for any_station in all_stations:
            if item.device_id in any_station.equipment_ids:
                any_station.equipment_ids = [
                    equipment_id
                    for equipment_id in any_station.equipment_ids
                    if equipment_id != item.device_id
                ]
                session.add(any_station)

        if item.device_id not in station.equipment_ids:
            station.equipment_ids = [*station.equipment_ids, item.device_id]
            session.add(station)

        successful_bindings.append(item)

    session.commit()

    SCAN_JOB_BINDINGS[request.scan_job_id] = successful_bindings
    SCAN_JOB_FAILED_DEVICES[request.scan_job_id] = [
        reason.split(":")[0].replace("设备 ", "") for reason in failed_reasons
    ]

    return {
        "scan_job_id": request.scan_job_id,
        "success_count": len(successful_bindings),
        "failed_count": len(failed_reasons),
        "failed_reasons": failed_reasons,
    }


@router.get("/diagnosis-reports/{scan_job_id}", response_model=KernelDiagnosisResponse)
def get_kernel_diagnosis_report(scan_job_id: str, _current_user: CurrentUser) -> Any:
    started_at = SCAN_JOB_TIMESTAMPS.get(scan_job_id)
    if not started_at:
        raise HTTPException(status_code=404, detail="scan job not found")

    _, _, discovered_devices = _scan_snapshot(started_at)
    discovered_ids = {device.device_id for device in discovered_devices}
    bound_ids = {item.device_id for item in SCAN_JOB_BINDINGS.get(scan_job_id, [])}
    failed_ids = list(dict.fromkeys(SCAN_JOB_FAILED_DEVICES.get(scan_job_id, [])))
    unbound_ids = sorted(list(discovered_ids - bound_ids))

    discovered_count = len(discovered_ids)
    bound_count = len(bound_ids)

    if discovered_count == 0:
        summary_status = "none_found"
        summary = "未发现可接入设备，请检查网络与网段配置。"
        recommendations = [
            "确认设备与网关在同一网段。",
            "确认防火墙或交换机未阻断扫描端口。",
            "检查设备电源和通信模块状态。",
        ]
    elif bound_count < discovered_count:
        summary_status = "partial_success"
        summary = "部分设备连接/绑定失败，请处理后重试。"
        recommendations = [
            "优先处理未绑定设备的产线/工位映射。",
            "检查协议配置和设备通信参数。",
            "修复后重新执行批量绑定。",
        ]
    else:
        summary_status = "success"
        summary = "设备接入成功，已完成产线拓扑关联。"
        recommendations = [
            "前往实时监控页面确认设备在线状态。",
            "在生产可视化中核对工位接入标识。",
            "如需优化，继续前往场景编排配置自动化流程。",
        ]

    return {
        "scan_job_id": scan_job_id,
        "discovered_count": discovered_count,
        "bound_count": bound_count,
        "unbound_device_ids": unbound_ids,
        "failed_device_ids": failed_ids,
        "summary_status": summary_status,
        "summary": summary,
        "recommendations": recommendations,
        "redirect_recommendations": ["/app/", "/app/huntian"],
    }

