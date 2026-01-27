import uuid
from datetime import datetime

from sqlmodel import Session

from app.core.db import engine
from app.models import ProductionLine


def insert_production_lines() -> None:
    """插入产线数据到数据库"""
    with Session(engine) as session:
        # 准备产线数据
        lines_data = [
            {"line_name": "SMT 智能产线 A01", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000001"), "status": "active", "current_status": "running"},
            {"line_name": "SMT 智能产线 A02", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000001"), "status": "active", "current_status": "idle"},
            {"line_name": "SMT 智能产线 A03", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000001"), "status": "maintenance", "current_status": "idle"},
            {"line_name": "SMT 高速贴片线 B01", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000001"), "status": "active", "current_status": "running"},
            {"line_name": "SMT 柔性组装线 B02", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000001"), "status": "active", "current_status": "timeout"},
            {"line_name": "PCB 自动钻孔线 C01", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000002"), "status": "active", "current_status": "running"},
            {"line_name": "PCB 自动化蚀刻线 C02", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000002"), "status": "active", "current_status": "idle"},
            {"line_name": "PCB 影像曝光线 C03", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000002"), "status": "inactive", "current_status": "idle"},
            {"line_name": "PCB 高多层压合线 C04", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000002"), "status": "active", "current_status": "running"},
            {"line_name": "PCB 表面处理线 C05", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000002"), "status": "maintenance", "current_status": "idle"},
            {"line_name": "3C 智能组装线 D01", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000003"), "status": "active", "current_status": "running"},
            {"line_name": "3C 精密检测线 D02", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000003"), "status": "active", "current_status": "running"},
            {"line_name": "3C 成品包装线 D03", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000003"), "status": "active", "current_status": "timeout"},
            {"line_name": "3C 机器人锁附线 D04", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000003"), "status": "active", "current_status": "idle"},
            {"line_name": "3C 视觉标定线 D05", "factory_id": uuid.UUID("00000000-0000-0000-0000-000000000003"), "status": "active", "current_status": "running"},
        ]

        # 创建产线记录
        created_count = 0
        for line_info in lines_data:
            line = ProductionLine(
                line_name=line_info["line_name"],
                factory_id=line_info["factory_id"],
                status=line_info["status"],
                current_status=line_info["current_status"],
                current_plan_id=None,
                bottleneck_station_id=None,
            )
            session.add(line)
            created_count += 1

        session.commit()
        print(f"成功插入 {created_count} 条产线记录")


if __name__ == "__main__":
    insert_production_lines()