"""add cost matrix fields to solution and anomaly

Revision ID: c8b1f3d2e5a9
Revises: 7aa942b12897
Create Date: 2026-02-24 10:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision = "c8b1f3d2e5a9"
down_revision = "7aa942b12897"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "solutions",
        sa.Column("repair_cost", sa.Float(), nullable=True, server_default="0"),
    )
    op.add_column(
        "solutions",
        sa.Column(
            "delivery_impact_hours", sa.Float(), nullable=True, server_default="0"
        ),
    )
    op.add_column(
        "solutions",
        sa.Column(
            "delivery_impact_cost", sa.Float(), nullable=True, server_default="0"
        ),
    )
    op.add_column(
        "solutions",
        sa.Column("quality_risk_cost", sa.Float(), nullable=True, server_default="0"),
    )
    op.add_column(
        "solutions",
        sa.Column("downtime_cost", sa.Float(), nullable=True, server_default="0"),
    )
    op.add_column(
        "solutions",
        sa.Column("total_expected_loss", sa.Float(), nullable=True, server_default="0"),
    )
    op.add_column(
        "solutions",
        sa.Column(
            "implementation_time_hours", sa.Float(), nullable=True, server_default="0"
        ),
    )
    op.add_column(
        "solutions",
        sa.Column("risk_level", sa.String(20), nullable=True, server_default="low"),
    )

    op.add_column(
        "anomalies", sa.Column("root_cause_confidence", sa.Float(), nullable=True)
    )
    op.add_column("anomalies", sa.Column("causation_chain", JSONB(), nullable=True))


def downgrade():
    op.drop_column("solutions", "repair_cost")
    op.drop_column("solutions", "delivery_impact_hours")
    op.drop_column("solutions", "delivery_impact_cost")
    op.drop_column("solutions", "quality_risk_cost")
    op.drop_column("solutions", "downtime_cost")
    op.drop_column("solutions", "total_expected_loss")
    op.drop_column("solutions", "implementation_time_hours")
    op.drop_column("solutions", "risk_level")

    op.drop_column("anomalies", "root_cause_confidence")
    op.drop_column("anomalies", "causation_chain")
