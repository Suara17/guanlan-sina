"""
天筹优化决策系统 API路由

提供优化任务创建、状态查询、方案获取、AHP-TOPSIS决策等功能
"""

import uuid
from datetime import datetime
from typing import Annotated, Any

import numpy as np
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.algorithms import part1_optimization, part2_decision, scheme_translator
from app.api.deps import SessionDep
from app.models import (
    DecisionRecord,
    IndustryType,
    OptimizationTask,
    ParetoSolution,
    TaskStatus,
)

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


# ============ 后台任务函数 ============


def run_optimization_task(task_id: str, db: Session) -> None:
    """
    后台执行优化任务

    参数:
        task_id: 任务ID
        db: 数据库会话
    """
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
            device_count = api_params.get('device_count', 25)

            # 轻工业参数映射
            input_data = {
                'L': api_params.get('workshop_length', 80.0),  # 车间长度
                'W': api_params.get('workshop_width', 60.0),   # 车间宽度
                'N': device_count,       # 设备总数
                'M': list(range(max(0, device_count - 5))),  # 可移动设备（默认除最后5个外都是可移动的）
                'F': list(range(max(0, device_count - 5), device_count)),  # 固定设备（默认最后5个）
                'device_sizes': np.array(api_params.get('device_sizes', [[3.0, 2.0]] * device_count), dtype=np.float64),  # 设备尺寸
                'original_positions': np.array(api_params.get('original_positions', [[i * 3, 10] for i in range(device_count)]), dtype=np.float64),  # 原始位置
                'move_costs': np.array(api_params.get('move_costs', [100.0] * device_count), dtype=np.float64),  # 移动成本
                'safety_distances': np.array(api_params.get('safety_distances', [1.0] * device_count), dtype=np.float64),  # 安全距离
                'aisle_areas': api_params.get('aisle_areas', [[30, 0, 20, 60]]),  # 通道区域
                'f_matrix': np.array([[0 if i==j else 1 for j in range(device_count)] for i in range(device_count)], dtype=np.float64),  # 搬运频率矩阵
                'w_matrix': np.array([[50 if i!=j else 0 for j in range(device_count)] for i in range(device_count)], dtype=np.float64),  # 搬运重量矩阵
                'c_transport': api_params.get('c_transport', 0.08),  # 单位搬运成本
                'product_lines': api_params.get('product_lines', {1: list(range(min(5, device_count))), 2: list(range(5, min(10, device_count))) if device_count > 5 else [], 3: list(range(10, min(15, device_count))) if device_count > 10 else [], 4: list(range(15, min(20, device_count))) if device_count > 15 else [], 5: list(range(20, device_count)) if device_count > 20 else []})  # 产品线信息
            }
            
            results = dual_track.run_light_industry_optimization(input_data)
        else:
            # 重工业参数映射
            input_data = {
                'K': api_params.get('station_count', 8),  # 设备数量
                'J': api_params.get('task_count', 8),     # 任务数量
                'V': api_params.get('agv_count', 5),      # AGV数量
                'T': api_params.get('time_horizon', 72),  # 时间周期
                'device_positions': api_params.get('station_coords', [[25, 25], [50, 25], [75, 25], [100, 25], [25, 50], [50, 50], [75, 50], [100, 50]]),  # 设备位置
                'device_rates': api_params.get('device_rates', [8, 10, 6, 5, 12, 10, 8, 15]),  # 设备速率
                'setup_times': api_params.get('setup_times', [0.8, 0.5, 1.2, 1.5, 0.3, 0.8, 0.8, 0.2]),  # 换型时间
                'device_capacities': api_params.get('device_capacities', [10, 15, 8, 6, 20, 12, 12, 25]),  # 设备容量
                'tasks': api_params.get('tasks', []),  # 任务列表
                'AGV_speed': api_params.get('agv_speed', 3000),  # AGV速度
                'AGV_capacity': api_params.get('agv_capacity', 500),  # AGV容量
                'AGV_energy_rate': api_params.get('agv_energy_rate', 5),  # AGV能耗率
                'beta1': api_params.get('beta1', 0.35),  # 最大完工时间权重
                'beta2': api_params.get('beta2', 0.35),  # 瓶颈设备利用率权重
                'beta3': api_params.get('beta3', 0.30)   # 负载不均衡度权重
            }
            
            results = dual_track.run_heavy_industry_optimization(input_data)

        task.progress = 50
        db.commit()

        optimizer = results["optimizer"]
        pareto_solutions = results["pareto_solutions"]

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

    # 添加后台任务
    background_tasks.add_task(run_optimization_task, str(task.id), session)

    return TaskStatusResponse(
        task_id=str(task.id),
        name=task.name,
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


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str, session: SessionDep
) -> Any:
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
        [
            [s.total_cost, s.implementation_days, s.expected_benefit]
            for s in solutions
        ]
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
async def get_task_summary(
    task_id: str, session: SessionDep
) -> Any:
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
