import logging
import random
import uuid
from datetime import datetime, timedelta

from sqlmodel import Session, select

from app.core.db import engine
from app.models import (
    Anomaly,
    CaseLibrary,
    Diagnosis,
    ProductionLine,
    ProductionPlan,
    ProductionRecord,
    QualityMetric,
    Solution,
    Station,
    WorkOrder,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_production_data() -> None:
    with Session(engine) as session:
        # Check if data already exists
        existing_lines = session.exec(select(ProductionLine)).all()
        if existing_lines:
            logger.info("Production data already exists. Skipping.")
            return

        logger.info("Creating production data...")

        factory_id = uuid.uuid4()

        # 1. Create Production Lines
        lines_data = [
            {"name": "Line A", "target": 1200},
            {"name": "Line B", "target": 1000},
            {"name": "Line C", "target": 800},
            {"name": "Line D", "target": 1500},
        ]

        created_lines = []
        for line_info in lines_data:
            line = ProductionLine(
                line_name=line_info["name"],
                factory_id=factory_id,
                status="active",
                current_status="running",
            )
            session.add(line)
            created_lines.append((line, line_info["target"]))

        session.commit()
        for line, _ in created_lines:
            session.refresh(line)

        # 2. Create Stations for each line
        stations = []
        for line, _ in created_lines:
            for i in range(1, 6):  # 5 stations per line
                station = Station(
                    station_name=f"{line.line_name} - Station {i}",
                    line_id=line.id,
                    station_type="assembly",
                    sequence_order=i,
                    current_cycle_time=random.uniform(25.0, 35.0),
                    wip_quantity=random.randint(0, 10),
                )
                session.add(station)
                stations.append(station)

        session.commit()
        for station in stations:
            session.refresh(station)

        # 3. Create Production Plans for today
        plans = []
        today_start = datetime.utcnow().replace(
            hour=8, minute=0, second=0, microsecond=0
        )

        for line, target in created_lines:
            plan = ProductionPlan(
                line_id=line.id,
                product_name=f"Product-{line.line_name[-1]}",
                planned_quantity=target,
                actual_quantity=0,
                start_time=today_start,
                status="in_progress",
            )
            session.add(plan)
            plans.append(plan)

            # Update line with current plan
            line.current_plan_id = plan.id
            session.add(line)

        session.commit()
        for plan in plans:
            session.refresh(plan)

        # 4. Create Production Records and update Actuals
        # Simulate that we are partway through the day
        for plan in plans:
            # Random completion percentage between 60% and 90%
            completion_rate = random.uniform(0.6, 0.9)
            actual_qty = int(plan.planned_quantity * completion_rate)
            plan.actual_quantity = actual_qty
            session.add(plan)

            # Find stations for this line
            line_stations = [s for s in stations if s.line_id == plan.line_id]
            last_station = line_stations[-1] if line_stations else None

            if last_station:
                # Create some records for the last station (finished goods)
                # Not creating records for every single item to save time/space, just a few samples
                for _ in range(20):
                    record = ProductionRecord(
                        plan_id=plan.id,
                        line_id=plan.line_id,
                        station_id=last_station.id,
                        product_id=uuid.uuid4(),
                        quantity=1,
                        quality_status="good",
                        cycle_time=random.uniform(28.0, 32.0),
                        recorded_at=today_start + timedelta(hours=random.randint(0, 4)),
                    )
                    session.add(record)

            # 5. Create Quality Metrics
            # Simulate yield
            total = actual_qty
            defects = int(total * random.uniform(0.01, 0.05))
            good = total - defects

            metric = QualityMetric(
                plan_id=plan.id,
                line_id=plan.line_id,
                total_produced=total,
                good_quantity=good,
                defect_quantity=defects,
                yield_rate=good / total if total > 0 else 0,
                defect_rate=defects / total if total > 0 else 0,
            )
            session.add(metric)

        session.commit()
        logger.info("Production data created successfully.")


def create_sinan_data() -> None:
    """创建司南系统的种子数据（异常、诊断、方案、工单、案例库）"""
    with Session(engine) as session:
        # 检查是否已有数据
        existing_anomalies = session.exec(select(Anomaly)).all()
        if existing_anomalies:
            logger.info("SiNan data already exists. Skipping.")
            return

        logger.info("Creating SiNan system data...")

        # 获取已有的产线和工位
        lines = session.exec(select(ProductionLine)).all()
        if not lines:
            logger.warning(
                "No production lines found. Please run create_production_data() first."
            )
            return

        stations = session.exec(select(Station)).all()
        if not stations:
            logger.warning(
                "No stations found. Please run create_production_data() first."
            )
            return

        # 创建一些异常案例
        anomaly_templates = [
            {
                "defect_type": "刀具磨损",
                "severity": "high",
                "root_cause": "刀具使用时间超过规定寿命，未及时更换",
                "solutions": [
                    {
                        "name": "立即更换刀具",
                        "type": "corrective",
                        "description": "停机更换磨损刀具，检查刀具库存",
                        "downtime": 0.5,
                        "success_rate": 0.95,
                        "expected_loss": 1200.0,
                        "roi": 8.5,
                        "recommended": True,
                    },
                    {
                        "name": "调整刀具参数后继续使用",
                        "type": "adjustment",
                        "description": "调整切削参数，降低负载，延长刀具使用",
                        "downtime": 0.1,
                        "success_rate": 0.60,
                        "expected_loss": 3500.0,
                        "roi": 3.2,
                        "recommended": False,
                    },
                ],
                "lessons": "建议实施刀具寿命监控系统，提前预警",
                "tags": ["设备维护", "刀具管理", "预防性维护"],
            },
            {
                "defect_type": "温度异常",
                "severity": "medium",
                "root_cause": "冷却系统效率下降，散热不足",
                "solutions": [
                    {
                        "name": "清洁冷却系统",
                        "type": "preventive",
                        "description": "清理冷却液管路，更换过滤器",
                        "downtime": 1.0,
                        "success_rate": 0.85,
                        "expected_loss": 2000.0,
                        "roi": 6.0,
                        "recommended": True,
                    },
                    {
                        "name": "降低设备运行速度",
                        "type": "adjustment",
                        "description": "临时降低设备运行速度，减少热量产生",
                        "downtime": 0.0,
                        "success_rate": 0.70,
                        "expected_loss": 4000.0,
                        "roi": 2.5,
                        "recommended": False,
                    },
                ],
                "lessons": "定期维护冷却系统可避免此类问题，建议每月检查一次",
                "tags": ["温度控制", "冷却系统", "预防性维护"],
            },
            {
                "defect_type": "尺寸偏差",
                "severity": "high",
                "root_cause": "夹具松动导致工件定位不准",
                "solutions": [
                    {
                        "name": "重新校准夹具",
                        "type": "corrective",
                        "description": "停机检查并重新校准所有夹具，确保定位精度",
                        "downtime": 2.0,
                        "success_rate": 0.90,
                        "expected_loss": 3000.0,
                        "roi": 7.0,
                        "recommended": True,
                    },
                ],
                "lessons": "夹具应每周检查紧固状态，避免松动",
                "tags": ["质量控制", "夹具管理", "精度管理"],
            },
        ]

        created_cases = []

        for idx, template in enumerate(anomaly_templates):
            # 随机选择一条产线和工位
            line = random.choice(lines)
            line_stations = [s for s in stations if s.line_id == line.id]
            if not line_stations:
                continue
            station = random.choice(line_stations)

            # 创建异常
            anomaly = Anomaly(
                line_id=line.id,
                station_id=station.id,
                defect_type=template["defect_type"],
                severity=template["severity"],
                detected_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                status="resolved" if idx < 2 else "open",  # 前两个已解决
                root_cause=template["root_cause"],
            )
            session.add(anomaly)
            session.commit()
            session.refresh(anomaly)

            # 创建诊断
            diagnosis = Diagnosis(
                anomaly_id=anomaly.id,
                root_cause=template["root_cause"],
                confidence=0.85 + random.random() * 0.1,
            )
            session.add(diagnosis)
            session.commit()
            session.refresh(diagnosis)

            # 创建解决方案
            solutions = []
            for sol_template in template["solutions"]:
                solution = Solution(
                    anomaly_id=anomaly.id,
                    diagnosis_id=diagnosis.id,
                    solution_type=sol_template["type"],
                    solution_name=sol_template["name"],
                    description=sol_template["description"],
                    estimated_downtime_hours=sol_template["downtime"],
                    success_rate=sol_template["success_rate"],
                    expected_loss=sol_template["expected_loss"],
                    roi=sol_template["roi"],
                    recommended=sol_template["recommended"],
                    simulation_result={
                        "estimated_cost": sol_template["expected_loss"],
                        "estimated_benefit": sol_template["expected_loss"]
                        * sol_template["roi"],
                        "risk_level": "low"
                        if sol_template["success_rate"] > 0.8
                        else "medium",
                    },
                )
                session.add(solution)
                solutions.append(solution)

            session.commit()
            for sol in solutions:
                session.refresh(sol)

            # 对于已解决的异常，创建工单和案例库
            if anomaly.status == "resolved":
                # 选择推荐的方案
                recommended_solution = next(
                    (s for s in solutions if s.recommended), solutions[0]
                )
                anomaly.solution_id = recommended_solution.id
                session.add(anomaly)

                # 创建工单
                work_order = WorkOrder(
                    solution_id=recommended_solution.id,
                    order_type="maintenance",
                    responsible_person="张工程师" if idx == 0 else "李技术员",
                    instructions=recommended_solution.description,
                    estimated_duration_hours=recommended_solution.estimated_downtime_hours,
                    actual_duration_hours=recommended_solution.estimated_downtime_hours
                    * random.uniform(0.8, 1.2),
                    status="completed",
                    execution_result="success",
                    actual_loss=recommended_solution.expected_loss
                    * random.uniform(0.7, 1.1),
                    notes="执行顺利，问题已解决",
                    started_at=anomaly.detected_at + timedelta(hours=1),
                    completed_at=anomaly.detected_at
                    + timedelta(hours=1)
                    + timedelta(
                        hours=recommended_solution.estimated_downtime_hours or 1
                    ),
                )
                session.add(work_order)
                session.commit()
                session.refresh(work_order)

                # 创建案例库记录
                case = CaseLibrary(
                    anomaly_id=anomaly.id,
                    problem_description=f"{template['defect_type']} - {template['root_cause']}",
                    solution_adopted=recommended_solution.id,
                    lessons_learned=template["lessons"],
                    diagnosis_result={
                        "root_cause": template["root_cause"],
                        "confidence": diagnosis.confidence,
                        "analysis_method": "expert_system",
                    },
                    expected_effect={
                        "downtime_hours": recommended_solution.estimated_downtime_hours,
                        "cost": recommended_solution.expected_loss,
                        "success_probability": recommended_solution.success_rate,
                    },
                    actual_effect={
                        "downtime_hours": work_order.actual_duration_hours,
                        "cost": work_order.actual_loss,
                        "result": work_order.execution_result,
                    },
                    tags=template["tags"],
                )
                session.add(case)
                created_cases.append(case)

                # 更新异常的关闭时间
                anomaly.closed_at = work_order.completed_at
                session.add(anomaly)

        session.commit()
        logger.info(
            f"SiNan data created successfully. Created {len(created_cases)} case library entries."
        )


if __name__ == "__main__":
    create_production_data()
    create_sinan_data()
