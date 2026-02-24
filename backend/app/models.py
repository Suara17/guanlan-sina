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
    root_cause_confidence: float | None = Field(default=None)
    causation_chain: list | None = Field(default=None, sa_column=Column(JSONB))


class AnomalyDetail(SQLModel):
    """异常详情响应模型"""
    id: uuid.UUID
    line_id: uuid.UUID
    station_id: uuid.UUID
    defect_type: str
    severity: str
    detected_at: datetime
    status: str
    root_cause: str | None = None
    root_cause_confidence: float | None = None
    causation_chain: list = []
    solutions: list["SolutionPublic"] = []
    location: str = ""
    message: str = ""
    created_at: datetime


class AnomalyWithRootCause(SQLModel):
    """带根因分析的异常模型"""
    id: uuid.UUID
    line_id: uuid.UUID
    station_id: uuid.UUID
    defect_type: str
    severity: str
    detected_at: datetime
    status: str
    root_cause: str | None = None
    root_cause_confidence: float | None = None
    causation_chain: list = []
    location: str = ""
    created_at: datetime


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
    # 成本相关字段
    repair_cost: float | None = Field(default=0.0)
    delivery_impact_hours: float | None = Field(default=0.0)
    delivery_impact_cost: float | None = Field(default=0.0)
    quality_risk_cost: float | None = Field(default=0.0)
    downtime_cost: float | None = Field(default=0.0)
    total_expected_loss: float | None = Field(default=0.0)
    implementation_time_hours: float | None = Field(default=0.0)
    risk_level: str | None = Field(default="low", max_length=20)

    diagnosis: Diagnosis | None = Relationship(back_populates="solutions")


class SolutionPublic(SolutionBase):
    id: uuid.UUID
    diagnosis_id: uuid.UUID | None


class SolutionWithCost(SolutionBase):
    """带成本分析的解决方案模型"""
    id: uuid.UUID
    diagnosis_id: uuid.UUID | None
    repair_cost: float = 0.0
    delivery_impact_hours: float = 0.0
    delivery_impact_cost: float = 0.0
    quality_risk_cost: float = 0.0
    downtime_cost: float = 0.0
    total_expected_loss: float = 0.0
    implementation_time_hours: float = 0.0
    success_rate: float = 0.0
    risk_level: str = "low"
    recommended: bool = False
    cost_matrix: dict | None = None


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


# --- Tianchou (Optimization & Decision) ---


from enum import Enum


class IndustryType(str, Enum):
    """行业类型枚举"""

    LIGHT = "light"  # 轻工业
    HEAVY = "heavy"  # 重工业


class TaskStatus(str, Enum):
    """任务状态枚举"""

    PENDING = "pending"  # 待执行
    RUNNING = "running"  # 执行中
    COMPLETED = "completed"  # 已完成
    FAILED = "failed"  # 失败


class OptimizationTask(SQLModel, table=True):
    """优化任务主表"""

    __tablename__ = "optimization_tasks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True, max_length=255)
    industry_type: IndustryType

    # 输入参数 (JSON存储)
    input_params: dict = Field(default={}, sa_column=Column(JSONB))

    # 任务状态
    status: TaskStatus = Field(default=TaskStatus.PENDING)
    progress: int = Field(default=0)  # 0-100

    # 进化过程数据 (JSONB存储)
    evolution_history: dict = Field(default={}, sa_column=Column(JSONB))

    # 所有解数据 (用于前端帕累托前沿可视化)
    all_solutions: dict = Field(default={}, sa_column=Column(JSONB))

    # 帕累托前沿图片 (base64 编码)
    pareto_plot_image: str | None = Field(default=None, sa_column=Column(String))

    # 结果摘要
    pareto_solution_count: int = Field(default=0)
    recommended_solution_id: uuid.UUID | None = Field(default=None)

    # 商业决策权重
    weights_cost: float | None = Field(default=None)
    weights_time: float | None = Field(default=None)
    weights_benefit: float | None = Field(default=None)

    # 元数据
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_by: uuid.UUID | None = Field(default=None, foreign_key="users.id")

    # 关联关系
    solutions: list["ParetoSolution"] = Relationship(
        back_populates="task", cascade_delete=True
    )
    decisions: list["DecisionRecord"] = Relationship(
        back_populates="task", cascade_delete=True
    )


class ParetoSolution(SQLModel, table=True):
    """帕累托最优解"""

    __tablename__ = "pareto_solutions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    task_id: uuid.UUID = Field(foreign_key="optimization_tasks.id", index=True)

    # 技术指标 (Part 1)
    f1: float  # 目标1
    f2: float  # 目标2
    f3: float | None = None  # 目标3 (轻工业)

    # 商业指标 (Part 2)
    total_cost: float = Field(default=0)
    implementation_days: float = Field(default=0)
    expected_benefit: float = Field(default=0)

    # 方案详情 (JSON)
    solution_data: dict = Field(default={}, sa_column=Column(JSONB))

    # 设备/路径方案 (JSON)
    technical_details: dict = Field(default={}, sa_column=Column(JSONB))

    # 排名和评分
    rank: int = Field(default=0)
    topsis_score: float | None = None

    # 关联
    task: OptimizationTask = Relationship(back_populates="solutions")


class DecisionRecord(SQLModel, table=True):
    """决策记录 (AHP-TOPSIS)"""

    __tablename__ = "decision_records"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    task_id: uuid.UUID = Field(foreign_key="optimization_tasks.id", index=True)

    # AHP判断矩阵
    ahp_matrix: dict = Field(default={}, sa_column=Column(JSONB))

    # 计算权重
    weights: dict = Field(default={}, sa_column=Column(JSONB))
    consistency_ratio: float = Field(default=0)

    # TOPSIS结果
    best_solution_id: uuid.UUID | None = None
    decision_scores: dict = Field(default={}, sa_column=Column(JSONB))

    created_at: datetime = Field(default_factory=datetime.utcnow)

    task: OptimizationTask = Relationship(back_populates="decisions")


# ==================== 3.2 优化路线：产品与工艺流程 ====================


class ProductBase(SQLModel):
    """产品基础信息"""

    product_code: str = Field(unique=True, index=True, max_length=100)
    product_name: str = Field(max_length=200)
    category: str | None = Field(default=None, max_length=50)
    description: str | None = Field(default=None)


class Product(ProductBase, table=True):
    """产品信息表"""

    __tablename__ = "products"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # 尺寸信息 (JSON)
    dimensions: dict | None = Field(default=None, sa_column=Column(JSONB))

    # 所需工位列表
    required_stations: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))

    # 关联默认工艺流程
    default_flow_id: uuid.UUID | None = Field(
        default=None, foreign_key="process_flows.id"
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProcessFlowBase(SQLModel):
    """工艺流程基础信息"""

    product_id: uuid.UUID = Field(foreign_key="products.id")
    flow_name: str = Field(max_length=200)
    version: str = Field(default="v1.0", max_length=20)
    description: str | None = Field(default=None)
    is_active: bool = Field(default=True)


class ProcessFlow(ProcessFlowBase, table=True):
    """工艺流程定义表"""

    __tablename__ = "process_flows"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # 工序列表 (JSON) - 示例: [{"step": 1, "name": "印刷", "station_type": "printer", "cycle_time": 30}]
    steps: list[dict] = Field(default=[], sa_column=Column(JSONB))

    # 设备约束 (JSON)
    equipment_requirements: dict = Field(default={}, sa_column=Column(JSONB))

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    product: Product = Relationship(sa_relationship_kwargs={"foreign_keys": "[ProcessFlow.product_id]"})


# ==================== 模拟情境相关模型 ====================


class SimulationScenario(SQLModel, table=True):
    """模拟情境表"""
    __tablename__ = "simulation_scenarios"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    scenario_code: str = Field(unique=True, index=True, max_length=50)
    scenario_name: str = Field(max_length=200)
    description: str | None = Field(default=None)
    anomaly_type: str = Field(max_length=100)
    anomaly_location: str = Field(max_length=200)
    severity: str = Field(max_length=20)
    root_cause: str | None = Field(default=None)
    root_cause_confidence: float | None = Field(default=None)
    solutions: list = Field(default=[], sa_column=Column(JSONB))
    knowledge_graph_nodes: list = Field(default=[], sa_column=Column(JSONB))
    knowledge_graph_edges: list = Field(default=[], sa_column=Column(JSONB))
    causation_chain: list = Field(default=[], sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SimulationScenarioSummary(SQLModel):
    """模拟情境摘要"""
    id: uuid.UUID
    scenario_code: str
    scenario_name: str
    severity: str
    description: str | None = None


class SimulationScenarioPublic(SQLModel):
    """模拟情境公开信息"""
    id: uuid.UUID
    scenario_code: str
    scenario_name: str
    description: str | None = None
    anomaly_type: str
    anomaly_location: str
    severity: str
    root_cause: str | None = None
    root_cause_confidence: float | None = None
    solutions: list = []
    knowledge_graph_nodes: list = []
    knowledge_graph_edges: list = []


class SimulationExecuteRequest(SQLModel):
    """模拟执行请求"""
    scenario_id: uuid.UUID | None = None
    scenario_code: str | None = None
    parameters: dict | None = None


class SimulationExecuteResponse(SQLModel):
    """模拟执行响应"""
    success: bool
    message: str
    scenario_id: uuid.UUID | None = None
    results: dict | None = None
