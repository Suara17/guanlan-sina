from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.core.config import settings
from app.models import IndustryType, OptimizationTask, ParetoSolution, TaskStatus


def _reset_tianchou_tables(db: Session) -> None:
    db.execute(delete(ParetoSolution))
    db.execute(delete(OptimizationTask))
    db.commit()


def test_get_latest_completed_task_returns_latest_solution(
    client: TestClient, db: Session
) -> None:
    _reset_tianchou_tables(db)

    older_task = OptimizationTask(
        name="older-task",
        industry_type=IndustryType.LIGHT,
        status=TaskStatus.COMPLETED,
        completed_at=datetime.utcnow() - timedelta(hours=2),
    )
    latest_task = OptimizationTask(
        name="latest-task",
        industry_type=IndustryType.HEAVY,
        status=TaskStatus.COMPLETED,
        completed_at=datetime.utcnow() - timedelta(minutes=5),
    )
    db.add(older_task)
    db.add(latest_task)
    db.commit()
    db.refresh(older_task)
    db.refresh(latest_task)

    older_solution = ParetoSolution(
        task_id=older_task.id,
        rank=1,
        f1=1.0,
        f2=2.0,
        f3=3.0,
        total_cost=1000,
        implementation_days=5,
        expected_benefit=3000,
    )
    latest_solution_rank2 = ParetoSolution(
        task_id=latest_task.id,
        rank=2,
        f1=1.2,
        f2=2.2,
        f3=3.2,
        total_cost=2200,
        implementation_days=7,
        expected_benefit=5200,
        topsis_score=0.71,
    )
    latest_solution_rank1 = ParetoSolution(
        task_id=latest_task.id,
        rank=1,
        f1=1.1,
        f2=2.1,
        f3=3.1,
        total_cost=1800,
        implementation_days=6,
        expected_benefit=6100,
        topsis_score=0.83,
    )
    db.add(older_solution)
    db.add(latest_solution_rank2)
    db.add(latest_solution_rank1)
    db.commit()

    response = client.get(f"{settings.API_V1_STR}/tianchou/tasks/latest/completed")
    assert response.status_code == 200

    data = response.json()
    assert data["task"]["task_id"] == str(latest_task.id)
    assert data["task"]["name"] == "latest-task"
    assert data["task"]["industry_type"] == IndustryType.HEAVY.value
    assert data["solution"]["id"] == str(latest_solution_rank1.id)
    assert data["solution"]["rank"] == 1
    assert data["solution"]["total_cost"] == latest_solution_rank1.total_cost


def test_get_latest_completed_task_returns_404_without_completed_task(
    client: TestClient, db: Session
) -> None:
    _reset_tianchou_tables(db)

    running_task = OptimizationTask(
        name="running-task",
        industry_type=IndustryType.LIGHT,
        status=TaskStatus.RUNNING,
    )
    db.add(running_task)
    db.commit()

    response = client.get(f"{settings.API_V1_STR}/tianchou/tasks/latest/completed")
    assert response.status_code == 404
    assert response.json()["detail"] == "No completed optimization task found"
