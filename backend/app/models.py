import uuid
from datetime import datetime

from pydantic import EmailStr
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlmodel import Field, Relationship, SQLModel

# --- User & Auth ---


class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    username: str = Field(unique=True, index=True, max_length=100)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    role: str | None = Field(default=None, max_length=50)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    username: str = Field(max_length=100)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class UserUpdate(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    username: str | None = Field(default=None, max_length=100)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    role: str | None = Field(default=None, max_length=50)
    is_active: bool | None = None


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class User(UserBase, table=True):
    __tablename__ = "users"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    factory_ids: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))
    line_ids: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))
    permissions: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: datetime | None = Field(default=None)
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# --- Items (Legacy/Template) ---


class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


class ItemCreate(ItemBase):
    pass


class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


class Item(ItemBase, table=True):
    __tablename__ = "items"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="users.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# --- Production Management ---


class ProductionLineBase(SQLModel):
    line_name: str = Field(max_length=100)
    factory_id: uuid.UUID
    status: str = Field(default="active", max_length=20)
    current_status: str = Field(default="idle", max_length=20)


class ProductionLine(ProductionLineBase, table=True):
    __tablename__ = "production_lines"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    current_plan_id: uuid.UUID | None = Field(
        default=None, foreign_key="production_plans.id"
    )
    bottleneck_station_id: uuid.UUID | None = Field(
        default=None, foreign_key="stations.id"
    )
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    stations: list["Station"] = Relationship(
        back_populates="line",
        cascade_delete=True,
        sa_relationship_kwargs={"primaryjoin": "ProductionLine.id == Station.line_id"},
    )
    plans: list["ProductionPlan"] = Relationship(
        back_populates="line",
        cascade_delete=True,
        sa_relationship_kwargs={
            "primaryjoin": "ProductionLine.id == ProductionPlan.line_id"
        },
    )


class StationBase(SQLModel):
    station_name: str = Field(max_length=100)
    line_id: uuid.UUID = Field(foreign_key="production_lines.id")
    station_type: str | None = Field(default=None, max_length=50)
    sequence_order: int | None = Field(default=None)
    current_cycle_time: float | None = Field(default=None)
    wip_quantity: int = Field(default=0)


class Station(StationBase, table=True):
    __tablename__ = "stations"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    equipment_ids: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    line: ProductionLine = Relationship(
        back_populates="stations",
        sa_relationship_kwargs={"primaryjoin": "Station.line_id == ProductionLine.id"},
    )
    records: list["ProductionRecord"] = Relationship(
        back_populates="station", cascade_delete=True
    )


class ProductionPlanBase(SQLModel):
    line_id: uuid.UUID = Field(foreign_key="production_lines.id")
    product_name: str | None = Field(default=None, max_length=200)
    planned_quantity: int
    actual_quantity: int = Field(default=0)
    start_time: datetime
    estimated_completion_time: datetime | None = Field(default=None)
    actual_completion_time: datetime | None = Field(default=None)
    status: str = Field(default="planned", max_length=20)


class ProductionPlan(ProductionPlanBase, table=True):
    __tablename__ = "production_plans"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    product_id: uuid.UUID | None = Field(default=None)
    created_by: uuid.UUID | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    line: ProductionLine = Relationship(
        back_populates="plans",
        sa_relationship_kwargs={
            "primaryjoin": "ProductionPlan.line_id == ProductionLine.id"
        },
    )


class ProductionRecordBase(SQLModel):
    plan_id: uuid.UUID = Field(foreign_key="production_plans.id")
    line_id: uuid.UUID = Field(foreign_key="production_lines.id")
    station_id: uuid.UUID = Field(foreign_key="stations.id")
    product_id: uuid.UUID | None = Field(default=None)
    batch_id: str | None = Field(default=None, max_length=50)
    quantity: int = Field(default=1)
    quality_status: str | None = Field(default=None, max_length=20)
    defect_type: str | None = Field(default=None, max_length=100)
    cycle_time: float | None = Field(default=None)


class ProductionRecord(ProductionRecordBase, table=True):
    __tablename__ = "production_records"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

    station: Station = Relationship(back_populates="records")


class QualityMetricBase(SQLModel):
    plan_id: uuid.UUID = Field(foreign_key="production_plans.id")
    line_id: uuid.UUID = Field(foreign_key="production_lines.id")
    station_id: uuid.UUID | None = Field(default=None, foreign_key="stations.id")
    total_produced: int = Field(default=0)
    good_quantity: int = Field(default=0)
    defect_quantity: int = Field(default=0)
    rework_quantity: int = Field(default=0)
    yield_rate: float | None = Field(default=None)
    defect_rate: float | None = Field(default=None)


class QualityMetric(QualityMetricBase, table=True):
    __tablename__ = "quality_metrics"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class DefectDetailBase(SQLModel):
    record_id: uuid.UUID = Field(foreign_key="production_records.id")
    plan_id: uuid.UUID = Field(foreign_key="production_plans.id")
    line_id: uuid.UUID = Field(foreign_key="production_lines.id")
    station_id: uuid.UUID = Field(foreign_key="stations.id")
    defect_type: str = Field(max_length=100)
    severity: str = Field(max_length=20)
    defect_image_url: str | None = Field(default=None)
    confidence: float | None = Field(default=None)


class DefectDetail(DefectDetailBase, table=True):
    __tablename__ = "defect_details"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    detected_at: datetime = Field(default_factory=datetime.utcnow)


# --- Sinan (Anomaly Analysis & Resolution) ---


class AnomalyBase(SQLModel):
    line_id: uuid.UUID = Field(foreign_key="production_lines.id")
    station_id: uuid.UUID = Field(foreign_key="stations.id")
    defect_type: str = Field(max_length=100)
    severity: str = Field(max_length=20)
    detected_at: datetime
    status: str = Field(default="open", max_length=20)
    assigned_to: uuid.UUID | None = Field(default=None)
    root_cause: str | None = Field(default=None)
    solution_id: uuid.UUID | None = Field(default=None, foreign_key="solutions.id")


class Anomaly(AnomalyBase, table=True):
    __tablename__ = "anomalies"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    closed_at: datetime | None = Field(default=None)


class DiagnosisBase(SQLModel):
    anomaly_id: uuid.UUID = Field(foreign_key="anomalies.id")
    root_cause: str | None = Field(default=None)
    confidence: float | None = Field(default=None)


class Diagnosis(DiagnosisBase, table=True):
    __tablename__ = "diagnoses"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    anomaly_id: uuid.UUID = Field(foreign_key="anomalies.id")

    solutions: list["Solution"] = Relationship(back_populates="diagnosis")


class SolutionBase(SQLModel):
    anomaly_id: uuid.UUID = Field(foreign_key="anomalies.id")
    solution_type: str | None = Field(default=None, max_length=50)
    solution_name: str = Field(max_length=200)
    description: str | None = Field(default=None)
    estimated_downtime_hours: float | None = Field(default=None)
    success_rate: float | None = Field(default=None)
    expected_loss: float | None = Field(default=None)
    roi: float | None = Field(default=None)
    recommended: bool = Field(default=False)


class Solution(SolutionBase, table=True):
    __tablename__ = "solutions"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    diagnosis_id: uuid.UUID | None = Field(default=None, foreign_key="diagnoses.id")
    simulation_result: dict | None = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    diagnosis: Diagnosis | None = Relationship(back_populates="solutions")


class SolutionPublic(SolutionBase):
    id: uuid.UUID
    diagnosis_id: uuid.UUID | None


class DiagnosisPublic(DiagnosisBase):
    id: uuid.UUID
    created_at: datetime
    solutions: list[SolutionPublic] = []


class WorkOrderBase(SQLModel):
    solution_id: uuid.UUID = Field(foreign_key="solutions.id")
    order_type: str | None = Field(default=None, max_length=50)
    responsible_person: str | None = Field(default=None, max_length=100)
    instructions: str | None = Field(default=None)
    estimated_duration_hours: float | None = Field(default=None)
    actual_duration_hours: float | None = Field(default=None)
    status: str = Field(default="pending", max_length=20)
    execution_result: str | None = Field(default=None, max_length=20)
    actual_loss: float | None = Field(default=None)
    notes: str | None = Field(default=None)


class WorkOrder(WorkOrderBase, table=True):
    __tablename__ = "work_orders"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)


class CaseLibraryBase(SQLModel):
    anomaly_id: uuid.UUID = Field(foreign_key="anomalies.id")
    problem_description: str | None = Field(default=None)
    solution_adopted: uuid.UUID | None = Field(default=None)
    lessons_learned: str | None = Field(default=None)


class CaseLibrary(CaseLibraryBase, table=True):
    __tablename__ = "case_library"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    diagnosis_result: dict | None = Field(default=None, sa_column=Column(JSONB))
    expected_effect: dict | None = Field(default=None, sa_column=Column(JSONB))
    actual_effect: dict | None = Field(default=None, sa_column=Column(JSONB))
    tags: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Audit & System ---


class AuditLogBase(SQLModel):
    user_id: uuid.UUID | None = Field(default=None)
    action: str = Field(max_length=100)
    resource_type: str | None = Field(default=None, max_length=50)
    resource_id: str | None = Field(default=None, max_length=50)
    ip_address: str | None = Field(default=None, max_length=50)
    user_agent: str | None = Field(default=None)
    response_status: int | None = Field(default=None)


class AuditLog(AuditLogBase, table=True):
    __tablename__ = "audit_logs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    request_body: dict | None = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Production Dashboard ---


class ProductionDashboardResponse(SQLModel):
    total_production: int = Field(description="总产量")
    quality_rate: float = Field(description="质量率/良率")
    defect_rate: float = Field(description="缺陷率")
    total_target: int = Field(description="总目标产量")
    total_actual: int = Field(description="总实际产量")
    line_count: int = Field(description="产线数量")
    active_lines: int = Field(description="活跃产线数量")


# --- Utility Models ---


class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
