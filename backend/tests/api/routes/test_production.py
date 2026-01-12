from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import ProductionLine


def create_production_line(db: Session, name: str = "Line 1") -> ProductionLine:
    line = ProductionLine(name=name, status="idle", target_output=100)
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
    assert any(line["name"] == "Line A" for line in content)
    assert any(line["name"] == "Line B" for line in content)

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
