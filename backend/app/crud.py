import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import and_
from sqlmodel import Session, func, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Item,
    ItemCreate,
    ProductionDashboardResponse,
    ProductionLine,
    ProductionPlan,
    ProductionRecord,
    QualityMetric,
    User,
    UserCreate,
    UserUpdate,
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def get_production_dashboard_data(
    session: Session,
    start_date: date,
    end_date: date,
    line_ids: list[uuid.UUID] | None = None,
) -> ProductionDashboardResponse:
    """
    获取生产数据汇总，用于dashboard展示
    """
    # 将date转换为datetime范围
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # 获取产线统计
    lines = session.exec(select(ProductionLine)).all()
    line_count = len(lines)
    active_lines = sum(
        1 for line in lines if line.current_status in ["running", "active"]
    )

    # 获取生产计划统计
    plan_query = select(ProductionPlan).where(
        ProductionPlan.start_time >= start_datetime,
        ProductionPlan.start_time <= end_datetime,
    )
    plans = session.exec(plan_query).all()

    total_target = sum(plan.planned_quantity for plan in plans)
    total_actual = sum(plan.actual_quantity for plan in plans)

    # 获取质量指标统计
    quality_query = select(QualityMetric).where(
        QualityMetric.calculated_at >= start_datetime,
        QualityMetric.calculated_at <= end_datetime,
    )
    quality_metrics = session.exec(quality_query).all()

    total_production = sum(metric.total_produced for metric in quality_metrics)

    # 计算平均质量率和缺陷率
    if quality_metrics:
        quality_rate = sum(metric.yield_rate or 0 for metric in quality_metrics) / len(
            quality_metrics
        )
        defect_rate = sum(metric.defect_rate or 0 for metric in quality_metrics) / len(
            quality_metrics
        )
    else:
        quality_rate = 0.0
        defect_rate = 0.0

    # 如果没有质量指标数据，从生产记录计算产量
    if total_production == 0:
        record_query = select(ProductionRecord).where(
            ProductionRecord.recorded_at >= start_datetime,
            ProductionRecord.recorded_at <= end_datetime,
        )
        records = session.exec(record_query).all()
        total_production = sum(record.quantity for record in records)

    return ProductionDashboardResponse(
        total_production=total_production,
        quality_rate=quality_rate,
        defect_rate=defect_rate,
        total_target=total_target,
        total_actual=total_actual,
        line_count=line_count,
        active_lines=active_lines,
    )

    # 获取生产计划统计
    plan_conditions = [
        ProductionPlan.start_time >= start_datetime,
        ProductionPlan.start_time <= end_datetime,
    ]
    if line_ids:
        plan_conditions.append(ProductionPlan.line_id.in_(line_ids))

    plan_query = select(
        func.sum(ProductionPlan.planned_quantity).label("total_target"),
        func.sum(ProductionPlan.actual_quantity).label("total_actual"),
    ).where(and_(*plan_conditions))

    plan_result = session.exec(plan_query).first()
    if plan_result:
        total_target = plan_result[0] or 0
        total_actual = plan_result[1] or 0
    else:
        total_target = 0
        total_actual = 0

    # 获取质量指标统计
    quality_conditions = [
        QualityMetric.calculated_at >= start_datetime,
        QualityMetric.calculated_at <= end_datetime,
    ]
    if line_ids:
        quality_conditions.append(QualityMetric.line_id.in_(line_ids))

    quality_query = select(
        func.sum(QualityMetric.total_produced).label("total_production"),
        func.avg(QualityMetric.yield_rate).label("avg_quality_rate"),
        func.avg(QualityMetric.defect_rate).label("avg_defect_rate"),
    ).where(and_(*quality_conditions))

    quality_result = session.exec(quality_query).first()
    if quality_result:
        total_production = quality_result[0] or 0
        quality_rate = quality_result[1] or 0.0
        defect_rate = quality_result[2] or 0.0
    else:
        total_production = 0
        quality_rate = 0.0
        defect_rate = 0.0

    # 如果没有质量指标数据，从生产记录计算
    if total_production == 0:
        record_conditions = [
            ProductionRecord.recorded_at >= start_datetime,
            ProductionRecord.recorded_at <= end_datetime,
        ]
        if line_ids:
            record_conditions.append(ProductionRecord.line_id.in_(line_ids))

        record_query = select(
            func.sum(ProductionRecord.quantity).label("total_quantity")
        ).where(and_(*record_conditions))

        record_result = session.exec(record_query).first()
        if record_result:
            total_production = record_result[0] or 0

    return ProductionDashboardResponse(
        total_production=total_production,
        quality_rate=quality_rate,
        defect_rate=defect_rate,
        total_target=total_target,
        total_actual=total_actual,
        line_count=line_count,
        active_lines=active_lines,
    )

    # 获取生产计划统计
    plan_query = select(
        func.sum(ProductionPlan.planned_quantity).label("total_target"),
        func.sum(ProductionPlan.actual_quantity).label("total_actual"),
    ).where(
        ProductionPlan.start_time >= start_datetime,
        ProductionPlan.start_time <= end_datetime,
    )

    if line_ids:
        plan_query = plan_query.where(ProductionPlan.line_id.in_(line_ids))

    plan_stats = session.exec(plan_query).first()
    total_target = plan_stats.total_target or 0
    total_actual = plan_stats.total_actual or 0

    # 获取质量指标统计
    quality_query = select(
        func.sum(QualityMetric.total_produced).label("total_production"),
        func.avg(QualityMetric.yield_rate).label("avg_quality_rate"),
        func.avg(QualityMetric.defect_rate).label("avg_defect_rate"),
    ).where(
        QualityMetric.calculated_at >= start_datetime,
        QualityMetric.calculated_at <= end_datetime,
    )

    if line_ids:
        quality_query = quality_query.where(QualityMetric.line_id.in_(line_ids))

    quality_stats = session.exec(quality_query).first()
    total_production = quality_stats.total_production or 0
    quality_rate = quality_stats.avg_quality_rate or 0.0
    defect_rate = quality_stats.avg_defect_rate or 0.0

    # 如果没有质量指标数据，从生产记录计算
    if total_production == 0:
        record_query = select(
            func.sum(ProductionRecord.quantity).label("total_quantity")
        ).where(
            ProductionRecord.recorded_at >= start_datetime,
            ProductionRecord.recorded_at <= end_datetime,
        )

        if line_ids:
            record_query = record_query.where(ProductionRecord.line_id.in_(line_ids))

        record_stats = session.exec(record_query).first()
        total_production = record_stats.total_quantity or 0

    return ProductionDashboardResponse(
        total_production=total_production,
        quality_rate=quality_rate,
        defect_rate=defect_rate,
        total_target=total_target,
        total_actual=total_actual,
        line_count=line_count,
        active_lines=active_lines,
    )
