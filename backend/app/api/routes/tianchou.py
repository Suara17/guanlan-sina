"""
天筹优化决策系统 API路由

提供优化任务创建、状态查询、方案获取、AHP-TOPSIS决策等功能
"""

import uuid
from datetime import datetime
from typing import Annotated, Any

import numpy as np
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select, func

from app.algorithms import part1_optimization, part2_decision, scheme_translator
from app.api.deps import SessionDep
from app.models import (
    DecisionRecord,
    IndustryType,
    OptimizationTask,
    ParetoSolution,
    TaskStatus,
)
from app.services.layout_image_generator import LayoutImageGenerator

router = APIRouter(tags=["天筹优化"])


# ============ 请求/响应模型 ============


class OptimizationRequest(BaseModel):
    """优化任务请求"""

    name: str = Field(..., description="任务名称")
    industry_type: IndustryType = Field(..., description="行业类型: light或heavy")

    # 轻工业参数
    workshop_length: float | None = Field(None, description="车间长度(米)")
    workshop_width: float | None = Field(None, description="车间宽度(米)")
    device_count: int | None = Field(None, description="设备数量")
    transport_matrix: list[list[float]] | None = Field(None, description="搬运频率矩阵")

    # 重工业参数
    station_count: int | None = Field(None, description="工位数量")
    agv_count: int | None = Field(None, description="AGV数量")
    station_coords: list[list[float]] | None = Field(None, description="工位坐标")
    task_assignments: list[list[int]] | None = Field(None, description="任务分配")

    # 商业参数
    daily_output_value: float = Field(20000, description="每日产值(元)")
    base_cost: float = Field(20000, description="基础成本(元)")
    construction_rate: float = Field(3000, description="施工效率(元/天)")
    benefit_multiplier: float = Field(200, description="收益乘数")


class TaskStatusResponse(BaseModel):
    """任务状态响应"""

    task_id: str
    name: str
    industry_type: IndustryType
    status: TaskStatus
    progress: int
    solution_count: int
    recommended_solution_id: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None


class SolutionResponse(BaseModel):
    """方案响应"""

    id: str
    rank: int
    f1: float
    f2: float
    f3: float | None
    total_cost: float
    implementation_days: float
    expected_benefit: float
    expected_loss: float | None
    topsis_score: float | None


class AHPRequest(BaseModel):
    """AHP权重计算请求"""

    matrix_01: float = Field(..., description="成本vs工期的比较值")
    matrix_02: float = Field(..., description="成本vs收益的比较值")
    matrix_12: float = Field(..., description="工期vs收益的比较值")


class AHPResponse(BaseModel):
    """AHP权重响应"""

    weights: dict[str, float]
    consistency_ratio: float
    is_valid: bool


class TOPSISRequest(BaseModel):
    """TOPSIS评分请求"""

    weights: dict[str, float] | None = None


class TOPSISResponse(BaseModel):
    """TOPSIS评分响应"""

    best_solution_id: str
    scores: list[dict[str, Any]]


class LayoutImageResponse(BaseModel):
    """布局图片响应"""

    task_id: str
    image_type: str
    image_base64: str


class LatestCompletedTaskResponse(BaseModel):
    task: TaskStatusResponse
    solution: SolutionResponse | None


class TaskListItem(BaseModel):
    """历史任务列表项"""

    task_id: str
    name: str
    industry_type: IndustryType
    status: TaskStatus
    created_at: datetime
    completed_at: datetime | None
    solution_count: int
    recommended_solution_id: str | None
    recommended_reason: str | None


class TaskListResponse(BaseModel):
    """历史任务列表响应"""

    tasks: list[TaskListItem]
    total: int
    limit: int
    offset: int


# ============ 后台任务函数 ============


def run_optimization_task(task_id: str) -> None:
    """
    后台执行优化任务

    注意：此函数在后台任务中执行，必须创建独立的数据库会话，
    因为传入的会话在请求完成后会被关闭。

    参数:
        task_id: 任务ID
    """
    from app.core.db import engine

    # 创建独立的数据库会话（不依赖请求作用域）
    with Session(engine) as db:
        try:
            # 1. 更新任务状态
            task = db.get(OptimizationTask, uuid.UUID(task_id))
            if not task:
                raise ValueError(f"Task {task_id} not found")

            task.status = TaskStatus.RUNNING
            task.started_at = datetime.utcnow()
            task.progress = 10
            db.commit()

            # 2. 执行 Part 1: 技术优化
            dual_track = part1_optimization.DualTrackAlgorithm()

            # 参数映射：将API参数转换为算法期望的格式
            api_params = task.input_params

            if task.industry_type == IndustryType.LIGHT:
                # 获取设备数量，确保所有相关数组长度一致
                device_count = api_params.get("device_count", 25)

                # 轻工业参数映射
                input_data = {
                    "L": api_params.get("workshop_length", 80.0),  # 车间长度
                    "W": api_params.get("workshop_width", 60.0),  # 车间宽度
                    "N": device_count,  # 设备总数
                    "M": list(
                        range(max(0, device_count - 5))
                    ),  # 可移动设备（默认除最后5个外都是可移动的）
                    "F": list(
                        range(max(0, device_count - 5), device_count)
                    ),  # 固定设备（默认最后5个）
                    "device_sizes": np.array(
                        api_params.get("device_sizes", [[3.0, 2.0]] * device_count),
                        dtype=np.float64,
                    ),  # 设备尺寸
                    "original_positions": np.array(
                        api_params.get(
                            "original_positions",
                            [[i * 3, 10] for i in range(device_count)],
                        ),
                        dtype=np.float64,
                    ),  # 原始位置
                    "move_costs": np.array(
                        api_params.get("move_costs", [100.0] * device_count),
                        dtype=np.float64,
                    ),  # 移动成本
                    "safety_distances": np.array(
                        api_params.get("safety_distances", [1.0] * device_count),
                        dtype=np.float64,
                    ),  # 安全距离
                    "aisle_areas": api_params.get(
                        "aisle_areas", [[30, 0, 20, 60]]
                    ),  # 通道区域
                    "f_matrix": np.array(
                        [
                            [0 if i == j else 1 for j in range(device_count)]
                            for i in range(device_count)
                        ],
                        dtype=np.float64,
                    ),  # 搬运频率矩阵
                    "w_matrix": np.array(
                        [
                            [50 if i != j else 0 for j in range(device_count)]
                            for i in range(device_count)
                        ],
                        dtype=np.float64,
                    ),  # 搬运重量矩阵
                    "c_transport": api_params.get("c_transport", 0.08),  # 单位搬运成本
                    "product_lines": api_params.get(
                        "product_lines",
                        {
                            1: list(range(min(5, device_count))),
                            2: list(range(5, min(10, device_count)))
                            if device_count > 5
                            else [],
                            3: list(range(10, min(15, device_count)))
                            if device_count > 10
                            else [],
                            4: list(range(15, min(20, device_count)))
                            if device_count > 15
                            else [],
                            5: list(range(20, device_count))
                            if device_count > 20
                            else [],
                        },
                    ),  # 产品线信息
                }

                results = dual_track.run_light_industry_optimization(input_data)
            else:
                # 重工业参数映射
                station_count = api_params.get("station_count", 8)
                task_count = api_params.get(
                    "task_count", station_count
                )  # 默认任务数等于工位数
                agv_count = api_params.get("agv_count", 3)

                # 生成默认的设备位置（如果未提供）
                if (
                    "station_coords" not in api_params
                    or not api_params["station_coords"]
                ):
                    # 生成网格布局的设备位置
                    cols = int(np.ceil(np.sqrt(station_count)))
                    rows = int(np.ceil(station_count / cols))
                    device_positions = []
                    for i in range(station_count):
                        row = i // cols
                        col = i % cols
                        x = 25 + col * 30  # 每个设备间隔30米
                        y = 25 + row * 30
                        device_positions.append([x, y])
                else:
                    device_positions = api_params["station_coords"]

                # 生成默认的设备参数（如果未提供）
                device_rates = api_params.get(
                    "device_rates", [8 + i % 8 for i in range(station_count)]
                )
                setup_times = api_params.get(
                    "setup_times", [0.5 + (i % 10) * 0.1 for i in range(station_count)]
                )
                device_capacities = api_params.get(
                    "device_capacities", [10 + i * 2 for i in range(station_count)]
                )

                # 生成默认的任务列表（如果未提供）
                if "tasks" not in api_params or not api_params["tasks"]:
                    tasks = []
                    for j in range(task_count):
                        # 每个任务包含3-5个工序
                        num_operations = 3 + (j % 3)
                        operations = []
                        for op_idx in range(num_operations):
                            # 随机选择设备
                            device_id = (j + op_idx) % station_count
                            operations.append(
                                {
                                    "device_id": device_id,
                                    "process_time": 2.0
                                    + (op_idx % 5) * 0.5,  # 2.0-4.5小时
                                    "quantity": 10 + (j % 5) * 5,  # 10-30件
                                }
                            )
                        tasks.append(
                            {
                                "task_id": j,
                                "quantity": 10 + (j % 5) * 5,
                                "release_time": (j % 3) * 2.0,  # 0, 2, 4小时
                                "deadline": 24.0 + j * 4.0,  # 24-60小时
                                "operations": operations,
                            }
                        )
                else:
                    tasks = api_params["tasks"]

                input_data = {
                    "K": station_count,  # 设备数量
                    "J": task_count,  # 任务数量
                    "V": agv_count,  # AGV数量
                    "T": api_params.get("time_horizon", 72),  # 时间周期
                    "device_positions": device_positions,  # 设备位置
                    "device_rates": device_rates,  # 设备速率
                    "setup_times": setup_times,  # 换型时间
                    "device_capacities": device_capacities,  # 设备容量
                    "tasks": tasks,  # 任务列表
                    "AGV_speed": api_params.get("agv_speed", 3000),  # AGV速度
                    "AGV_capacity": api_params.get("agv_capacity", 500),  # AGV容量
                    "AGV_energy_rate": api_params.get(
                        "agv_energy_rate", 5
                    ),  # AGV能耗率
                    "beta1": api_params.get("beta1", 0.35),  # 最大完工时间权重
                    "beta2": api_params.get("beta2", 0.35),  # 瓶颈设备利用率权重
                    "beta3": api_params.get("beta3", 0.30),  # 负载不均衡度权重
                }

                results = dual_track.run_heavy_industry_optimization(input_data)

            task.progress = 50
            db.commit()

            optimizer = results["optimizer"]
            pareto_solutions = results["pareto_solutions"]
            evolution_history = results.get("evolution_history", [])

            # 保存原始位置到 task.input_params（用于前端布局图片生成）
            if task.industry_type == IndustryType.LIGHT and hasattr(
                optimizer, "original_positions"
            ):
                task.input_params["original_positions"] = (
                    optimizer.original_positions.tolist()
                    if hasattr(optimizer.original_positions, "tolist")
                    else list(optimizer.original_positions)
                )
                task.input_params["workshop_length"] = optimizer.L
                task.input_params["workshop_width"] = optimizer.W
                db.commit()

            task.evolution_history = {"history": evolution_history}

            # 保存所有解数据（用于前端帕累托前沿可视化）
            all_solutions = results.get("all_solutions", [])
            print(f"[DEBUG] all_solutions count: {len(all_solutions)}")
            if all_solutions:
                print(
                    f"[DEBUG] all_solutions sample: {all_solutions[0] if all_solutions else 'empty'}"
                )
            all_solutions_data = [
                {
                    "f1": float(sol["f1"]),
                    "f2": float(sol["f2"]),
                    "f3": float(sol.get("f3")) if sol.get("f3") is not None else None,
                }
                for sol in all_solutions
            ]
            print(f"[DEBUG] all_solutions_data count: {len(all_solutions_data)}")
            task.all_solutions = {"solutions": all_solutions_data}

            # 保存帕累托前沿图片 (base64 编码)
            pareto_plot_base64 = results.get("pareto_plot_base64")
            if pareto_plot_base64:
                task.pareto_plot_image = pareto_plot_base64
                print(
                    f"[DEBUG] Pareto plot image saved, size: {len(pareto_plot_base64)} chars"
                )

            db.commit()

            # 3. 获取初始性能基准
            initial_perf = 0
            if task.industry_type == IndustryType.LIGHT:
                original_pos_list = [tuple(pos) for pos in optimizer.original_positions]
                init_ind = part1_optimization.creator.Individual(original_pos_list)
                _, f1, _, _ = optimizer.evaluate_individual(init_ind)
                initial_perf = f1
            else:
                initial_perf = optimizer.C_ref

            # 4. 执行商业价值映射
            business_params = task.input_params.copy()
            business_params["initial_perf"] = initial_perf

            translator = scheme_translator.SchemeTranslator(
                task.industry_type.value, business_params
            )
            business_data, original_indices = translator.translate(pareto_solutions)

            task.progress = 70
            db.commit()

            # 5. 保存帕累托解
            for idx, sol in enumerate(pareto_solutions):
                if idx not in original_indices:
                    continue

                biz_idx = original_indices.index(idx)
                biz = business_data[biz_idx]

                solution = ParetoSolution(
                    task_id=uuid.UUID(task_id),
                    f1=float(sol["f1"]),
                    f2=float(sol["f2"]),
                    f3=float(sol.get("f3")) if sol.get("f3") is not None else None,
                    total_cost=float(biz[0]),
                    implementation_days=float(biz[1]),
                    expected_benefit=float(biz[2]),
                    solution_data=sol,
                    technical_details=sol.get("individual", {}),
                )
                db.add(solution)

            task.progress = 90
            db.commit()

            # 6. 更新任务状态
            task.status = TaskStatus.COMPLETED
            task.pareto_solution_count = len(original_indices)
            task.completed_at = datetime.utcnow()
            task.progress = 100
            db.commit()

        except Exception as e:
            # 错误处理
            task = db.get(OptimizationTask, uuid.UUID(task_id))
            if task:
                task.status = TaskStatus.FAILED
                task.progress = 0
                db.commit()
            raise e


# ============ API端点 ============


@router.post("/tasks", response_model=TaskStatusResponse)
async def create_optimization_task(
    request: OptimizationRequest,
    background_tasks: BackgroundTasks,
    session: SessionDep,
) -> Any:
    """
    创建新的优化任务 (后台执行)

    - **name**: 任务名称
    - **industry_type**: 行业类型 (light/heavy)
    - 根据行业类型提供相应的参数
    """
    # 创建任务记录
    task = OptimizationTask(
        name=request.name,
        industry_type=request.industry_type,
        input_params=request.model_dump(),
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    # 添加后台任务（不再传递 session，让后台任务自己创建会话）
    background_tasks.add_task(run_optimization_task, str(task.id))

    return TaskStatusResponse(
        task_id=str(task.id),
        name=task.name,
        industry_type=task.industry_type,
        status=task.status,
        progress=task.progress,
        solution_count=task.pareto_solution_count,
        recommended_solution_id=str(task.recommended_solution_id)
        if task.recommended_solution_id
        else None,
        created_at=task.created_at,
        started_at=task.started_at,
        completed_at=task.completed_at,
    )


@router.get("/tasks/history", response_model=TaskListResponse)
async def get_task_list(
    session: SessionDep,
    status: TaskStatus = TaskStatus.COMPLETED,
    limit: int = 20,
    offset: int = 0,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> Any:
    """
    获取历史任务列表

    - **status**: 任务状态 (默认 completed)
    - **limit**: 返回数量 (1-100)
    - **offset**: 偏移量
    - **start_date**: 开始时间筛选
    - **end_date**: 结束时间筛选
    """
    # 构建查询
    statement = select(OptimizationTask).where(OptimizationTask.status == status)

    # 时间筛选
    if start_date:
        statement = statement.where(OptimizationTask.created_at >= start_date)
    if end_date:
        statement = statement.where(OptimizationTask.created_at <= end_date)

    # 获取总数（使用 COUNT 而非加载所有数据）
    count_statement = select(func.count()).select_from(OptimizationTask)
    if start_date:
        count_statement = count_statement.where(
            OptimizationTask.created_at >= start_date
        )
    if end_date:
        count_statement = count_statement.where(OptimizationTask.created_at <= end_date)
    if status:
        count_statement = count_statement.where(OptimizationTask.status == status)
    total = session.exec(count_statement).first() or 0

    # 分页和排序
    statement = statement.order_by(OptimizationTask.created_at.desc())
    statement = statement.offset(offset).limit(limit)

    tasks = session.exec(statement).all()

    if not tasks:
        return TaskListResponse(tasks=[], total=total, limit=limit, offset=offset)

    # 批量查询所有相关数据，避免 N+1 问题
    task_ids = [t.id for t in tasks]

    # 批量查询每个任务的方案数量
    sol_count_stmt = (
        select(ParetoSolution.task_id, func.count(ParetoSolution.id))
        .where(ParetoSolution.task_id.in_(task_ids))
        .group_by(ParetoSolution.task_id)
    )
    sol_counts = dict(session.exec(sol_count_stmt).all())

    # 批量查询每个任务的最新决策记录
    # 使用子查询获取每个任务的最新决策
    latest_decision_subq = (
        select(
            DecisionRecord.task_id,
            func.max(DecisionRecord.created_at).label("max_created_at"),
        )
        .where(DecisionRecord.task_id.in_(task_ids))
        .group_by(DecisionRecord.task_id)
    ).subquery()

    latest_decision_stmt = (
        select(DecisionRecord)
        .join(
            latest_decision_subq,
            DecisionRecord.task_id == latest_decision_subq.c.task_id,
        )
        .where(DecisionRecord.created_at == latest_decision_subq.c.max_created_at)
    )
    all_decisions = session.exec(latest_decision_stmt).all()
    decisions_map = {d.task_id: d for d in all_decisions}

    # 批量查询每个任务的最佳方案（TOPSIS 评分最高的）
    best_sol_subq = (
        select(
            ParetoSolution.task_id,
            func.max(ParetoSolution.topsis_score).label("max_score"),
        )
        .where(ParetoSolution.task_id.in_(task_ids))
        .where(ParetoSolution.topsis_score.isnot(None))
        .group_by(ParetoSolution.task_id)
    ).subquery()

    best_sol_stmt = (
        select(ParetoSolution)
        .join(best_sol_subq, ParetoSolution.task_id == best_sol_subq.c.task_id)
        .where(ParetoSolution.topsis_score == best_sol_subq.c.max_score)
    )
    best_solutions = session.exec(best_sol_stmt).all()
    best_sols_map = {s.task_id: s for s in best_solutions}

    # 获取每个任务的第一个方案（用于没有 TOPSIS 评分的情况）
    first_sol_stmt = select(ParetoSolution).where(ParetoSolution.task_id.in_(task_ids))
    all_solutions = session.exec(first_sol_stmt).all()
    first_sols_map = {}
    for sol in all_solutions:
        if sol.task_id not in first_sols_map:
            first_sols_map[sol.task_id] = sol

    # 组装结果
    result_tasks = []
    for task in tasks:
        task_uuid = task.id
        solution_count = sol_counts.get(task_uuid, 0)
        decision = decisions_map.get(task_uuid)
        best_solution = best_sols_map.get(task_uuid)
        first_solution = first_sols_map.get(task_uuid)

        # 生成推荐原因
        recommended_solution_id = None
        recommended_reason = None

        if decision and decision.best_solution_id:
            recommended_solution_id = str(decision.best_solution_id)

            # 生成推荐原因
            weights = decision.weights or {}
            cost_w = weights.get("cost", 0)
            time_w = weights.get("time", 0)
            benefit_w = weights.get("benefit", 0)

            # 验证权重范围
            if all(0 <= w <= 1 for w in [cost_w, time_w, benefit_w]):
                reason_parts = []
                if cost_w > 0.4:
                    reason_parts.append("成本权重较高")
                if time_w > 0.4:
                    reason_parts.append("工期权重较高")
                if benefit_w > 0.4:
                    reason_parts.append("收益权重较高")

                if reason_parts:
                    recommended_reason = (
                        f"基于AHP-TOPSIS决策，{'，'.join(reason_parts)}，推荐此方案"
                    )
                else:
                    recommended_reason = "基于AHP-TOPSIS综合评分推荐"
            else:
                recommended_reason = "基于AHP-TOPSIS综合评分推荐"
        elif best_solution:
            # 有 TOPSIS 评分时，取评分最高的方案
            recommended_solution_id = str(best_solution.id)
            recommended_reason = "基于TOPSIS综合评分推荐"
        elif first_solution:
            # 取第一个方案
            recommended_solution_id = str(first_solution.id)
            recommended_reason = "基于帕累托最优解推荐"

        result_tasks.append(
            TaskListItem(
                task_id=str(task.id),
                name=task.name,
                industry_type=task.industry_type,
                status=task.status,
                created_at=task.created_at,
                completed_at=task.completed_at,
                solution_count=solution_count,
                recommended_solution_id=recommended_solution_id,
                recommended_reason=recommended_reason,
            )
        )

    return TaskListResponse(
        tasks=result_tasks,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/tasks/latest/completed", response_model=LatestCompletedTaskResponse)
async def get_latest_completed_task(
    session: SessionDep, industry_type: str | None = None
) -> Any:
    if industry_type:
        latest_task_statement = (
            select(OptimizationTask)
            .where(OptimizationTask.status == TaskStatus.COMPLETED)
            .where(OptimizationTask.industry_type == IndustryType(industry_type))
            .order_by(
                OptimizationTask.completed_at.desc(), OptimizationTask.created_at.desc()
            )
            .limit(1)
        )
    else:
        latest_task_statement = (
            select(OptimizationTask)
            .where(OptimizationTask.status == TaskStatus.COMPLETED)
            .order_by(
                OptimizationTask.completed_at.desc(), OptimizationTask.created_at.desc()
            )
            .limit(1)
        )
    task = session.exec(latest_task_statement).first()
    if not task:
        raise HTTPException(
            status_code=404, detail="No completed optimization task found"
        )

    default_solution_statement = (
        select(ParetoSolution)
        .where(ParetoSolution.task_id == task.id)
        .order_by(ParetoSolution.rank.asc(), ParetoSolution.id.asc())
        .limit(1)
    )
    solution = session.exec(default_solution_statement).first()

    return LatestCompletedTaskResponse(
        task=TaskStatusResponse(
            task_id=str(task.id),
            name=task.name,
            industry_type=task.industry_type,
            status=task.status,
            progress=task.progress,
            solution_count=task.pareto_solution_count,
            recommended_solution_id=str(task.recommended_solution_id)
            if task.recommended_solution_id
            else None,
            created_at=task.created_at,
            started_at=task.started_at,
            completed_at=task.completed_at,
        ),
        solution=SolutionResponse(
            id=str(solution.id),
            rank=solution.rank,
            f1=solution.f1,
            f2=solution.f2,
            f3=solution.f3,
            total_cost=solution.total_cost,
            implementation_days=solution.implementation_days,
            expected_benefit=solution.expected_benefit,
            expected_loss=solution.expected_loss,
            topsis_score=solution.topsis_score,
        )
        if solution
        else None,
    )


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str, session: SessionDep) -> Any:
    """
    获取任务状态和进度

    - **task_id**: 任务ID
    """
    task = session.get(OptimizationTask, uuid.UUID(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    return TaskStatusResponse(
        task_id=str(task.id),
        name=task.name,
        industry_type=task.industry_type,
        status=task.status,
        progress=task.progress,
        solution_count=task.pareto_solution_count,
        recommended_solution_id=str(task.recommended_solution_id)
        if task.recommended_solution_id
        else None,
        created_at=task.created_at,
        started_at=task.started_at,
        completed_at=task.completed_at,
    )


@router.get("/tasks/{task_id}/evolution")
async def get_evolution_history(task_id: str, session: SessionDep) -> Any:
    """
    获取算法进化过程数据

    - **task_id: 任务ID
    返回每代的适应度值、多样性、变异率等过程数据
    """
    task = session.get(OptimizationTask, uuid.UUID(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    evolution_data = task.evolution_history or {}
    history = evolution_data.get("history", [])

    return {
        "task_id": task_id,
        "status": task.status,
        "progress": task.progress,
        "history": history,
    }


@router.get("/tasks/{task_id}/all-solutions")
async def get_all_solutions(task_id: str, session: SessionDep) -> Any:
    """
    获取所有解数据（用于帕累托前沿可视化）

    - **task_id**: 任务ID
    返回所有优化过程中生成的解（包括帕累托解和非帕累托解）
    """
    task = session.get(OptimizationTask, uuid.UUID(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    all_solutions_data = task.all_solutions or {}
    solutions = all_solutions_data.get("solutions", [])

    return {
        "task_id": task_id,
        "industry_type": task.industry_type,
        "solutions": solutions,
        "total_count": len(solutions),
        "pareto_plot_image": task.pareto_plot_image,
    }


@router.get("/tasks/{task_id}/solutions", response_model=list[SolutionResponse])
async def get_pareto_solutions(
    task_id: str, session: SessionDep, limit: int = 20
) -> Any:
    """
    获取帕累托最优解列表

    - **task_id**: 任务ID
    - **limit**: 返回数量限制 (默认20)
    """
    statement = (
        select(ParetoSolution)
        .where(ParetoSolution.task_id == uuid.UUID(task_id))
        .order_by(ParetoSolution.rank.asc(), ParetoSolution.id.asc())
        .limit(limit)
    )
    solutions = session.exec(statement).all()

    return [
        SolutionResponse(
            id=str(s.id),
            rank=s.rank,
            f1=s.f1,
            f2=s.f2,
            f3=s.f3,
            total_cost=s.total_cost,
            implementation_days=s.implementation_days,
            expected_benefit=s.expected_benefit,
            expected_loss=s.expected_loss,
            topsis_score=s.topsis_score,
        )
        for s in solutions
    ]


@router.get("/tasks/{task_id}/solutions/{solution_id}")
async def get_solution_detail(
    task_id: str, solution_id: str, session: SessionDep
) -> Any:
    """
    获取方案详情

    - **task_id**: 任务ID
    - **solution_id**: 方案ID
    """
    solution = session.get(ParetoSolution, uuid.UUID(solution_id))
    if not solution or str(solution.task_id) != task_id:
        raise HTTPException(status_code=404, detail="方案不存在")

    task = session.get(OptimizationTask, uuid.UUID(task_id))
    original_positions = None
    if task and task.input_params:
        original_positions = task.input_params.get("original_positions")

    return {
        "id": str(solution.id),
        "rank": solution.rank,
        "f1": solution.f1,
        "f2": solution.f2,
        "f3": solution.f3,
        "total_cost": solution.total_cost,
        "implementation_days": solution.implementation_days,
        "expected_benefit": solution.expected_benefit,
        "topsis_score": solution.topsis_score,
        "solution_data": solution.solution_data,
        "technical_details": solution.technical_details,
        "original_positions": original_positions,
    }


@router.post("/tasks/{task_id}/decide/ahp", response_model=AHPResponse)
async def calculate_ahp_weights(
    task_id: str, request: AHPRequest, session: SessionDep
) -> Any:
    """
    计算AHP权重

    - **task_id**: 任务ID
    - **matrix_01**: 成本vs工期的比较值 (1-9或分数)
    - **matrix_02**: 成本vs收益的比较值
    - **matrix_12**: 工期vs收益的比较值
    """
    # 构建判断矩阵
    matrix = np.array(
        [
            [1, request.matrix_01, request.matrix_02],
            [1 / request.matrix_01, 1, request.matrix_12],
            [1 / request.matrix_02, 1 / request.matrix_12, 1],
        ]
    )

    # 计算权重
    result = part2_decision.ahp_weight_calculation(matrix)

    if result is None:
        raise HTTPException(status_code=400, detail="一致性检验失败，请重新设定权重")

    weights, cr = result

    # 保存决策记录
    record = DecisionRecord(
        task_id=uuid.UUID(task_id),
        ahp_matrix={"matrix": matrix.tolist()},
        weights={
            "cost": float(weights[0]),
            "time": float(weights[1]),
            "benefit": float(weights[2]),
        },
        consistency_ratio=float(cr),
    )
    session.add(record)
    session.commit()

    return AHPResponse(
        weights={
            "cost": round(float(weights[0]), 4),
            "time": round(float(weights[1]), 4),
            "benefit": round(float(weights[2]), 4),
        },
        consistency_ratio=round(float(cr), 4),
        is_valid=cr < 0.1,
    )


@router.post("/tasks/{task_id}/decide/topsis", response_model=TOPSISResponse)
async def run_topsis_decision(
    task_id: str,
    request: TOPSISRequest,
    session: SessionDep,
) -> Any:
    """
    运行TOPSIS综合评分

    - **task_id**: 任务ID
    - **weights**: 权重字典 (可选，默认均等权重)
    """
    # 获取所有方案
    statement = select(ParetoSolution).where(
        ParetoSolution.task_id == uuid.UUID(task_id)
    )
    solutions = session.exec(statement).all()

    if not solutions:
        raise HTTPException(status_code=404, detail="没有找到方案")

    # 构建决策矩阵
    decision_matrix = np.array(
        [[s.total_cost, s.implementation_days, s.expected_benefit] for s in solutions]
    )

    # 使用默认权重或用户提供的权重
    if request.weights is None:
        weights_array = np.array([0.33, 0.33, 0.34])
    else:
        weights_array = np.array(
            [
                request.weights.get("cost", 0.33),
                request.weights.get("time", 0.33),
                request.weights.get("benefit", 0.34),
            ]
        )

    # 计算TOPSIS得分
    scores = part2_decision.topsis_ranking(decision_matrix, weights_array)

    # 更新方案排名
    sorted_indices = np.argsort(scores)[::-1]  # 降序排列
    for rank, idx in enumerate(sorted_indices):
        solutions[idx].topsis_score = float(scores[idx])
        solutions[idx].rank = rank + 1

    session.commit()

    best_idx = int(np.argmax(scores))

    return TOPSISResponse(
        best_solution_id=str(solutions[best_idx].id),
        scores=[
            {"solution_id": str(s.id), "score": round(float(scores[i]), 4)}
            for i, s in enumerate(solutions)
        ],
    )


@router.get("/tasks/{task_id}/summary")
async def get_task_summary(task_id: str, session: SessionDep) -> Any:
    """
    获取任务总结

    - **task_id**: 任务ID
    """
    task = session.get(OptimizationTask, uuid.UUID(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    # 获取所有方案
    statement = select(ParetoSolution).where(
        ParetoSolution.task_id == uuid.UUID(task_id)
    )
    solutions = list(session.exec(statement).all())

    if not solutions:
        return {
            "task": {
                "id": str(task.id),
                "name": task.name,
                "status": task.status,
                "solution_count": 0,
            },
            "representative_solutions": {},
        }

    # 找出代表性方案
    costs = [s.total_cost for s in solutions]
    times = [s.implementation_days for s in solutions]
    benefits = [s.expected_benefit for s in solutions]

    min_cost_idx = int(np.argmin(costs))
    min_time_idx = int(np.argmin(times))
    max_benefit_idx = int(np.argmax(benefits))

    # 找出最佳综合方案 (如果有TOPSIS评分)
    best_overall_idx = min_cost_idx
    if solutions[0].topsis_score is not None:
        scores = [s.topsis_score or 0 for s in solutions]
        best_overall_idx = int(np.argmax(scores))

    return {
        "task": {
            "id": str(task.id),
            "name": task.name,
            "status": task.status,
            "solution_count": len(solutions),
            "created_at": task.created_at,
            "completed_at": task.completed_at,
        },
        "representative_solutions": {
            "min_cost": {
                "id": str(solutions[min_cost_idx].id),
                "total_cost": solutions[min_cost_idx].total_cost,
                "implementation_days": solutions[min_cost_idx].implementation_days,
                "expected_benefit": solutions[min_cost_idx].expected_benefit,
            },
            "min_time": {
                "id": str(solutions[min_time_idx].id),
                "total_cost": solutions[min_time_idx].total_cost,
                "implementation_days": solutions[min_time_idx].implementation_days,
                "expected_benefit": solutions[min_time_idx].expected_benefit,
            },
            "max_benefit": {
                "id": str(solutions[max_benefit_idx].id),
                "total_cost": solutions[max_benefit_idx].total_cost,
                "implementation_days": solutions[max_benefit_idx].implementation_days,
                "expected_benefit": solutions[max_benefit_idx].expected_benefit,
            },
            "best_overall": {
                "id": str(solutions[best_overall_idx].id),
                "total_cost": solutions[best_overall_idx].total_cost,
                "implementation_days": solutions[best_overall_idx].implementation_days,
                "expected_benefit": solutions[best_overall_idx].expected_benefit,
                "topsis_score": solutions[best_overall_idx].topsis_score,
            },
        },
    }


def _resolve_original_positions(input_params: dict[str, Any]) -> list[list[float]]:
    """解析原始设备坐标，缺失时给出默认布局。"""
    original_positions = input_params.get("original_positions", [])
    if not original_positions:
        device_count = input_params.get("device_count") or 25
        return [[i * 3, 10] for i in range(device_count)]

    if isinstance(original_positions, np.ndarray):
        return original_positions.tolist()
    if hasattr(original_positions, "tolist"):
        return original_positions.tolist()
    return original_positions


def _resolve_device_sizes(
    input_params: dict[str, Any], fallback_count: int
) -> list[list[float]]:
    """解析设备尺寸，缺失时按默认尺寸补齐。"""
    device_sizes = input_params.get("device_sizes")
    if device_sizes is None:
        return [[3.0, 2.0]] * fallback_count
    if isinstance(device_sizes, np.ndarray):
        return device_sizes.tolist()
    if hasattr(device_sizes, "tolist"):
        return device_sizes.tolist()
    return device_sizes


@router.get(
    "/tasks/{task_id}/original-layout-image", response_model=LayoutImageResponse
)
async def get_original_layout_image(task_id: str, session: SessionDep) -> Any:
    """
    获取原始布局图

    - **task_id**: 任务ID
    - 返回 base64 编码的 PNG 图片
    """
    task = session.get(OptimizationTask, uuid.UUID(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="任务未完成，无法生成布局图")

    input_params = task.input_params
    original_positions = _resolve_original_positions(input_params)
    device_sizes = _resolve_device_sizes(input_params, len(original_positions))
    workshop_dims = {
        "L": input_params.get("workshop_length", 80.0),
        "W": input_params.get("workshop_width", 60.0),
    }

    generator = LayoutImageGenerator(task.industry_type.value)
    try:
        image_base64 = generator.generate_layout_image(
            positions=original_positions,
            device_sizes=device_sizes,
            workshop_dims=workshop_dims,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成布局图失败: {str(e)}")

    return LayoutImageResponse(
        task_id=task_id,
        image_type="original",
        image_base64=image_base64,
    )


@router.get(
    "/tasks/{task_id}/solutions/{solution_id}/layout-image",
    response_model=LayoutImageResponse,
)
async def get_optimized_layout_image(
    task_id: str, solution_id: str, session: SessionDep
) -> Any:
    """
    获取优化方案布局图

    - **task_id**: 任务ID
    - **solution_id**: 方案ID
    - 返回 base64 编码的 PNG 图片
    """
    task = session.get(OptimizationTask, uuid.UUID(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    solution = session.get(ParetoSolution, uuid.UUID(solution_id))
    if not solution or str(solution.task_id) != task_id:
        raise HTTPException(status_code=404, detail="方案不存在")

    if solution.solution_data is None:
        raise HTTPException(status_code=400, detail="方案数据为空，无法生成布局图")

    input_params = task.input_params

    optimized_positions = solution.solution_data.get("individual", [])
    if not optimized_positions:
        raise HTTPException(
            status_code=400, detail="方案数据缺少设备坐标，无法生成布局图"
        )

    device_sizes = _resolve_device_sizes(input_params, len(optimized_positions))
    original_positions = _resolve_original_positions(input_params)
    workshop_dims = {
        "L": input_params.get("workshop_length", 80.0),
        "W": input_params.get("workshop_width", 60.0),
    }

    generator = LayoutImageGenerator(task.industry_type.value)
    try:
        image_base64 = generator.generate_layout_image(
            positions=optimized_positions,
            device_sizes=device_sizes,
            workshop_dims=workshop_dims,
            solution_data=solution.solution_data,
            original_positions=original_positions if original_positions else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成布局图失败: {str(e)}")

    return LayoutImageResponse(
        task_id=task_id,
        image_type="optimized",
        image_base64=image_base64,
    )


@router.get("/tasks/{task_id}/solutions/{solution_id}/layout-images")
async def get_layout_images(task_id: str, solution_id: str, session: SessionDep) -> Any:
    """
    获取布局图片

    - **task_id**: 任务ID
    - **solution_id**: 方案ID
    返回原始布局和优化布局的base64图片
    """
    task = session.get(OptimizationTask, uuid.UUID(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    solution = session.get(ParetoSolution, uuid.UUID(solution_id))
    if not solution or str(solution.task_id) != task_id:
        raise HTTPException(status_code=404, detail="方案不存在")
    if solution.solution_data is None:
        raise HTTPException(status_code=400, detail="方案数据为空，无法生成布局图")

    optimized_positions = solution.solution_data.get("individual", [])
    if not optimized_positions:
        raise HTTPException(
            status_code=400, detail="方案数据缺少设备坐标，无法生成布局图"
        )

    input_params = task.input_params
    original_positions = _resolve_original_positions(input_params)
    original_device_sizes = _resolve_device_sizes(input_params, len(original_positions))
    optimized_device_sizes = _resolve_device_sizes(
        input_params, len(optimized_positions)
    )
    workshop_dims = {
        "L": input_params.get("workshop_length", 80.0),
        "W": input_params.get("workshop_width", 60.0),
    }

    generator = LayoutImageGenerator(task.industry_type.value)
    try:
        original_image = generator.generate_layout_image(
            positions=original_positions,
            device_sizes=original_device_sizes,
            workshop_dims=workshop_dims,
        )
        optimized_image = generator.generate_layout_image(
            positions=optimized_positions,
            device_sizes=optimized_device_sizes,
            workshop_dims=workshop_dims,
            solution_data=solution.solution_data,
            original_positions=original_positions if original_positions else None,
        )
        return {
            "original_image": original_image,
            "optimized_image": optimized_image,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成布局图片失败: {str(e)}")
