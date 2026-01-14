from datetime import date, datetime

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import ProductionLine, ProductionPlan, ProductionRecord, QualityMetric


def create_production_line(db: Session, name: str = "Line 1") -> ProductionLine:
    from uuid import uuid4

    line = ProductionLine(line_name=name, factory_id=uuid4())
    db.add(line)
    db.commit()
    db.refresh(line)
    return line


def test_read_production_lines(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_production_line(db, name="Line A")
    create_production_line(db, name="Line B")

    response = client.get(
        f"{settings.API_V1_STR}/production/lines",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content) >= 2
    assert any(line["line_name"] == "Line A" for line in content)
    assert any(line["line_name"] == "Line B" for line in content)


def test_read_production_overview(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/production/overview",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert "total_target" in content
    assert "total_actual" in content
    assert "overall_yield" in content


def test_get_production_dashboard(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    # Create test data
    from uuid import uuid4

    # Create production line
    line = create_production_line(db, name="Dashboard Test Line")

    # Create production plan
    plan = ProductionPlan(
        line_id=line.id,
        product_name="Test Product",
        planned_quantity=100,
        actual_quantity=85,
        start_time=datetime.combine(date.today(), datetime.min.time()),
        status="completed",
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    # Create production records
    record1 = ProductionRecord(
        plan_id=plan.id,
        line_id=line.id,
        station_id=uuid4(),
        quantity=50,
        quality_status="good",
    )
    record2 = ProductionRecord(
        plan_id=plan.id,
        line_id=line.id,
        station_id=uuid4(),
        quantity=35,
        quality_status="good",
    )
    db.add(record1)
    db.add(record2)
    db.commit()

    # Create quality metrics
    metric = QualityMetric(
        plan_id=plan.id,
        line_id=line.id,
        total_produced=85,
        good_quantity=80,
        defect_quantity=5,
        yield_rate=0.94,
        defect_rate=0.06,
    )
    db.add(metric)
    db.commit()

    # Test dashboard API
    response = client.get(
        f"{settings.API_V1_STR}/production/dashboard?start_date={date.today()}&end_date={date.today()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()

    # Check response structure
    assert "total_production" in content
    assert "quality_rate" in content
    assert "defect_rate" in content
    assert "total_target" in content
    assert "total_actual" in content
    assert "line_count" in content
    assert "active_lines" in content

    # Check data types
    assert isinstance(content["total_production"], int)
    assert isinstance(content["quality_rate"], float)
    assert isinstance(content["defect_rate"], float)
    assert isinstance(content["total_target"], int)
    assert isinstance(content["total_actual"], int)
    assert isinstance(content["line_count"], int)
    assert isinstance(content["active_lines"], int)

    # Check data values (should be aggregated from test data)
    assert content["total_production"] >= 85  # At least from our test data
    assert 0 <= content["quality_rate"] <= 1  # Between 0 and 1
    assert 0 <= content["defect_rate"] <= 1  # Between 0 and 1
