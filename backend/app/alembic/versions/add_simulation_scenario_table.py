"""add simulation_scenario table

Revision ID: add_simulation_scenario
Revises: c8b1f3d2e5a9
Create Date: 2026-02-24

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_simulation_scenario'
down_revision: Union[str, None] = 'c8b1f3d2e5a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 创建 simulation_scenarios 表
    op.create_table(
        'simulation_scenarios',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('scenario_code', sa.String(length=20), nullable=False),
        sa.Column('scenario_name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('anomaly_type', sa.String(length=100), nullable=False),
        sa.Column('anomaly_location', sa.String(length=100), nullable=True),
        sa.Column('severity', sa.String(length=20), nullable=False, server_default='warning'),
        sa.Column('root_cause', sa.Text(), nullable=True),
        sa.Column('root_cause_confidence', sa.Float(), nullable=True),
        sa.Column('solutions', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('knowledge_graph_nodes', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('knowledge_graph_edges', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('causation_chain', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('scenario_code')
    )
    
    # 创建索引
    op.create_index('ix_simulation_scenarios_scenario_code', 'simulation_scenarios', ['scenario_code'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_simulation_scenarios_scenario_code', table_name='simulation_scenarios')
    op.drop_table('simulation_scenarios')
