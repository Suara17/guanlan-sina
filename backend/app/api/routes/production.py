import uuid
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Query
from sqlmodel import select, SQLModel

from app.api.deps import CurrentUser, SessionDep
from app.crud import get_production_dashboard_data
from app.models import (
    ProductionDashboardResponse,
    ProductionLine,
    ProductionPlan,
    Product,
    ProcessFlow,
    WorkOrder,
)

router = APIRouter()


# ==================== 3.2 优化路线：生产计划 API ====================

class ProductionPlanResponse(SQLModel):
    """生产计划响应模型"""
    work_order_no: str
    product_id: str
    product_code: str
    product_name: str
    line_id: str
    planned_quantity: int
    actual_quantity: int
    progress_percent: int
    estimated_completion_time: str | None
    status: str


class NextPlanResponse(SQLModel):
    """下一工单预览响应模型"""
    work_order_no: str
    product_id: str
    product_code: str
    product_name: str
    planned_quantity: int
    estimated_start_time: str | None


class ProductChangeWarningResponse(SQLModel):
    """产品切换预警响应模型"""
    change_detected: bool
    current_product: str
    next_product: str
    requires_optimization: bool
    flow_differences: list[str]


class CurrentPlanResponse(SQLModel):
    """当前产线生产计划完整响应"""
    current_plan: ProductionPlanResponse | None
    next_plan: NextPlanResponse | None
    product_change_warning: ProductChangeWarningResponse | None


def check_product_change(
    current_product_id: uuid.UUID | None,
    next_product_id: uuid.UUID | None,
    session: SessionDep,
) -> dict:
    """
    检查产品切换
    
    Returns:
        {
            "change_detected": bool,
            "current_product": str,
            "next_product": str,
            "requires_optimization": bool,
            "flow_differences": list[str]
        }
    """
    if not current_product_id or not next_product_id:
        return {
            "change_detected": False,
            "current_product": "",
            "next_product": "",
            "requires_optimization": False,
            "flow_differences": []
        }
    
    if current_product_id == next_product_id:
        return {
            "change_detected": False,
            "current_product": "",
            "next_product": "",
            "requires_optimization": False,
            "flow_differences": []
        }
    
    # 获取两个产品的工艺流程
    current_product = session.get(Product, current_product_id)
    next_product = session.get(Product, next_product_id)
    
    current_flow = None
    next_flow = None
    
    if current_product and current_product.default_flow_id:
        current_flow = session.get(ProcessFlow, current_product.default_flow_id)
    
    if next_product and next_product.default_flow_id:
        next_flow = session.get(ProcessFlow, next_product.default_flow_id)
    
    # 比较工序差异
    differences = []
    if current_flow and next_flow:
        current_steps = {s.get("step"): s.get("name") for s in current_flow.steps}
        next_steps = {s.get("step"): s.get("name") for s in next_flow.steps}
        
        # 新增工序
        for step, name in next_steps.items():
            if step not in current_steps:
                differences.append(f"新增{step}工序: {name}")
        
        # 删除工序
        for step, name in current_steps.items():
            if step not in next_steps:
                differences.append(f"删除{step}工序: {name}")
    
    return {
        "change_detected": True,
        "current_product": current_product.product_name if current_product else "",
        "next_product": next_product.product_name if next_product else "",
        "requires_optimization": len(differences) > 0,
        "flow_differences": differences
    }


@router.get("/lines/{line_id}/current-plan", response_model=CurrentPlanResponse)
def get_current_production_plan(
    line_id: str,
    session: SessionDep,
    _current_user: CurrentUser,
) -> Any:
    """
    获取产线的当前生产计划信息
    包括当前工单、下一工单预览、产品切换预警
    """
    try:
        line_uuid = uuid.UUID(line_id)
    except ValueError:
        return {
            "current_plan": None,
            "next_plan": None,
            "product_change_warning": None
        }
    
    # 获取产线
    line = session.get(ProductionLine, line_uuid)
    if not line:
        return {
            "current_plan": None,
            "next_plan": None,
            "product_change_warning": None
        }
    
    # 获取当前运行中的工单
    current_work_order = None
    statement = select(WorkOrder).where(
        WorkOrder.status == "running"
    ).order_by(WorkOrder.created_at.desc()).limit(1)
    current_work_order = session.exec(statement).first()
    
    # 如果没有运行中的工单，查找最近的
    if not current_work_order:
        statement = select(WorkOrder).where(
            WorkOrder.status == "pending"
        ).order_by(WorkOrder.created_at.desc()).limit(1)
        current_work_order = session.exec(statement).first()
    
    # 获取下一工单
    statement = select(WorkOrder).where(
        WorkOrder.status == "pending"
    ).order_by(WorkOrder.created_at.asc()).limit(1)
    next_work_order = session.exec(statement).first()
    
    # 构建响应
    current_plan = None
    next_plan = None
    product_change_warning = None
    
    if current_work_order:
        # 计算进度
        progress_percent = 0
        if current_work_order.planned_quantity > 0:
            progress_percent = int(
                current_work_order.actual_quantity / current_work_order.planned_quantity * 100
            )
        
        # 获取产品信息
        product_code = ""
        product_name = ""
        if current_work_order.product_id:
            product = session.get(Product, current_work_order.product_id)
            if product:
                product_code = product.product_code
                product_name = product.product_name
        
        current_plan = {
            "work_order_no": current_work_order.work_order_no,
            "product_id": str(current_work_order.product_id) if current_work_order.product_id else "",
            "product_code": product_code,
            "product_name": product_name,
            "line_id": str(line_uuid),
            "planned_quantity": current_work_order.planned_quantity,
            "actual_quantity": current_work_order.actual_quantity,
            "progress_percent": progress_percent,
            "estimated_completion_time": current_work_order.started_at.isoformat() if current_work_order.started_at else None,
            "status": current_work_order.status,
        }
    
    if next_work_order:
        product_code = ""
        product_name = ""
        if next_work_order.product_id:
            product = session.get(Product, next_work_order.product_id)
            if product:
                product_code = product.product_code
                product_name = product.product_name
        
        next_plan = {
            "work_order_no": next_work_order.work_order_no,
            "product_id": str(next_work_order.product_id) if next_work_order.product_id else "",
            "product_code": product_code,
            "product_name": product_name,
            "planned_quantity": next_work_order.planned_quantity,
            "estimated_start_time": None,
        }
    
    # 检查产品切换
    if current_work_order and next_work_order:
        product_change_warning = check_product_change(
            current_work_order.product_id,
            next_work_order.product_id,
            session
        )
    
    return {
        "current_plan": current_plan,
        "next_plan": next_plan,
        "product_change_warning": product_change_warning
    }


@router.post("/product-switch-optimization")
def trigger_product_switch_optimization(
    line_id: str,
    current_product_id: str,
    next_product_id: str,
    session: SessionDep,
    _current_user: CurrentUser,
) -> Any:
    """
    触发产品切换优化任务
    """
    try:
        line_uuid = uuid.UUID(line_id)
        current_uuid = uuid.UUID(current_product_id)
        next_uuid = uuid.UUID(next_product_id)
    except ValueError:
        return {"error": "Invalid UUID format"}
    
    # TODO: 创建优化任务并返回task_id
    # 这里可以调用天筹的优化算法
    
    return {
        "task_id": str(uuid.uuid4()),
        "status": "pending",
        "estimated_time": 30,
        "redirect_url": f"/app/tianchou"
    }


@router.get("/lines", response_model=list[ProductionLine])
def read_production_lines(
    session: SessionDep, _current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve production lines.
    """
    statement = select(ProductionLine).offset(skip).limit(limit)
    lines = session.exec(statement).all()
    return lines


@router.get("/overview")
def read_production_overview(session: SessionDep, _current_user: CurrentUser) -> Any:
    """
    Retrieve production overview statistics.
    """
    # Fetch all lines with their current plans
    lines = session.exec(select(ProductionLine)).all()

    total_target = 0
    total_actual = 0
    line_stats = []

    for line in lines:
        target = 0
        actual = 0

        # Try to find current plan
        # Note: In a real app with high load, we should eager load plans or use a join
        if line.current_plan_id:
            # We assume current_plan_id points to a valid plan
            # We could also look up plans by line_id and status='in_progress'
            plan = session.get(ProductionPlan, line.current_plan_id)
            if plan:
                target = plan.planned_quantity
                actual = plan.actual_quantity

        total_target += target
        total_actual += actual

        line_stats.append(
            {
                "name": line.line_name,
                "target": target,
                "actual": actual,
                "status": line.current_status,
            }
        )

    # Calculate overall yield (here simplified as actual/target, but could be based on QualityMetrics)
    overall_yield = (total_actual / total_target) if total_target > 0 else 0.0

    return {
        "total_target": total_target,
        "total_actual": total_actual,
        "overall_yield": overall_yield,
        "line_stats": line_stats,
    }


@router.get("/dashboard", response_model=ProductionDashboardResponse)
def get_production_dashboard(
    session: SessionDep,
    _current_user: CurrentUser,
    start_date: date = Query(..., description="开始日期"),
    end_date: date = Query(..., description="结束日期"),
    line_ids: list[str] | None = Query(None, description="产线ID列表"),
) -> Any:
    """
    获取生产数据汇总dashboard
    """
    # 将字符串ID转换为UUID
    line_uuids = None
    if line_ids:
        import uuid

        try:
            line_uuids = [uuid.UUID(line_id) for line_id in line_ids]
        except ValueError:
            # 如果ID格式错误，返回空结果
            line_uuids = []

    dashboard_data = get_production_dashboard_data(
        session=session, start_date=start_date, end_date=end_date, line_ids=line_uuids
    )
    return dashboard_data
