"""initial_sync_with_design_doc

Revision ID: a9bad07b2d87
Revises:
Create Date: 2026-01-12 21:26:36.749645

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a9bad07b2d87'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Create tables without circular foreign keys
    op.create_table('audit_logs',
    sa.Column('user_id', sa.Uuid(), nullable=True),
    sa.Column('action', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
    sa.Column('resource_type', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
    sa.Column('resource_id', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
    sa.Column('ip_address', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
    sa.Column('user_agent', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('response_status', sa.Integer(), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('request_body', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('production_lines',
    sa.Column('line_name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
    sa.Column('factory_id', sa.Uuid(), nullable=False),
    sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
    sa.Column('current_status', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('current_plan_id', sa.Uuid(), nullable=True),
    sa.Column('bottleneck_station_id', sa.Uuid(), nullable=True),
    sa.Column('last_updated', sa.DateTime(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('users',
    sa.Column('email', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
    sa.Column('username', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('is_superuser', sa.Boolean(), nullable=False),
    sa.Column('full_name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
    sa.Column('phone', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
    sa.Column('role', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('hashed_password', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('factory_ids', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('line_ids', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('permissions', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('last_login_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    op.create_table('stations',
    sa.Column('station_name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
    sa.Column('line_id', sa.Uuid(), nullable=False),
    sa.Column('station_type', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
    sa.Column('sequence_order', sa.Integer(), nullable=True),
    sa.Column('current_cycle_time', sa.Float(), nullable=True),
    sa.Column('wip_quantity', sa.Integer(), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('equipment_ids', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['line_id'], ['production_lines.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('production_plans',
    sa.Column('line_id', sa.Uuid(), nullable=False),
    sa.Column('product_name', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=True),
    sa.Column('planned_quantity', sa.Integer(), nullable=False),
    sa.Column('actual_quantity', sa.Integer(), nullable=False),
    sa.Column('start_time', sa.DateTime(), nullable=False),
    sa.Column('estimated_completion_time', sa.DateTime(), nullable=True),
    sa.Column('actual_completion_time', sa.DateTime(), nullable=True),
    sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('product_id', sa.Uuid(), nullable=True),
    sa.Column('created_by', sa.Uuid(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['line_id'], ['production_lines.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('anomalies',
    sa.Column('line_id', sa.Uuid(), nullable=False),
    sa.Column('station_id', sa.Uuid(), nullable=False),
    sa.Column('defect_type', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
    sa.Column('severity', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
    sa.Column('detected_at', sa.DateTime(), nullable=False),
    sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
    sa.Column('assigned_to', sa.Uuid(), nullable=True),
    sa.Column('root_cause', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('solution_id', sa.Uuid(), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('closed_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['line_id'], ['production_lines.id'], ),
    sa.ForeignKeyConstraint(['station_id'], ['stations.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('solutions',
    sa.Column('anomaly_id', sa.Uuid(), nullable=False),
    sa.Column('solution_type', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
    sa.Column('solution_name', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=False),
    sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('estimated_downtime_hours', sa.Float(), nullable=True),
    sa.Column('success_rate', sa.Float(), nullable=True),
    sa.Column('expected_loss', sa.Float(), nullable=True),
    sa.Column('roi', sa.Float(), nullable=True),
    sa.Column('recommended', sa.Boolean(), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('simulation_result', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['anomaly_id'], ['anomalies.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('items',
    sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
    sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('owner_id', sa.Uuid(), nullable=False),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('production_records',
    sa.Column('plan_id', sa.Uuid(), nullable=False),
    sa.Column('line_id', sa.Uuid(), nullable=False),
    sa.Column('station_id', sa.Uuid(), nullable=False),
    sa.Column('product_id', sa.Uuid(), nullable=True),
    sa.Column('batch_id', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('quality_status', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
    sa.Column('defect_type', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True),
    sa.Column('cycle_time', sa.Float(), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('recorded_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['line_id'], ['production_lines.id'], ),
    sa.ForeignKeyConstraint(['plan_id'], ['production_plans.id'], ),
    sa.ForeignKeyConstraint(['station_id'], ['stations.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('quality_metrics',
    sa.Column('plan_id', sa.Uuid(), nullable=False),
    sa.Column('line_id', sa.Uuid(), nullable=False),
    sa.Column('station_id', sa.Uuid(), nullable=True),
    sa.Column('total_produced', sa.Integer(), nullable=False),
    sa.Column('good_quantity', sa.Integer(), nullable=False),
    sa.Column('defect_quantity', sa.Integer(), nullable=False),
    sa.Column('rework_quantity', sa.Integer(), nullable=False),
    sa.Column('yield_rate', sa.Float(), nullable=True),
    sa.Column('defect_rate', sa.Float(), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('calculated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['line_id'], ['production_lines.id'], ),
    sa.ForeignKeyConstraint(['plan_id'], ['production_plans.id'], ),
    sa.ForeignKeyConstraint(['station_id'], ['stations.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('case_library',
    sa.Column('anomaly_id', sa.Uuid(), nullable=False),
    sa.Column('problem_description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('solution_adopted', sa.Uuid(), nullable=True),
    sa.Column('lessons_learned', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('diagnosis_result', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('expected_effect', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('actual_effect', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['anomaly_id'], ['anomalies.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('work_orders',
    sa.Column('solution_id', sa.Uuid(), nullable=False),
    sa.Column('order_type', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
    sa.Column('responsible_person', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True),
    sa.Column('instructions', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('estimated_duration_hours', sa.Float(), nullable=True),
    sa.Column('actual_duration_hours', sa.Float(), nullable=True),
    sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
    sa.Column('execution_result', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
    sa.Column('actual_loss', sa.Float(), nullable=True),
    sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('started_at', sa.DateTime(), nullable=True),
    sa.Column('completed_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['solution_id'], ['solutions.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('defect_details',
    sa.Column('record_id', sa.Uuid(), nullable=False),
    sa.Column('plan_id', sa.Uuid(), nullable=False),
    sa.Column('line_id', sa.Uuid(), nullable=False),
    sa.Column('station_id', sa.Uuid(), nullable=False),
    sa.Column('defect_type', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
    sa.Column('severity', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
    sa.Column('defect_image_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('confidence', sa.Float(), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('detected_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['line_id'], ['production_lines.id'], ),
    sa.ForeignKeyConstraint(['plan_id'], ['production_plans.id'], ),
    sa.ForeignKeyConstraint(['record_id'], ['production_records.id'], ),
    sa.ForeignKeyConstraint(['station_id'], ['stations.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # Step 2: Add circular foreign key constraints
    op.create_foreign_key('fk_production_lines_bottleneck_station', 'production_lines', 'stations', ['bottleneck_station_id'], ['id'])
    op.create_foreign_key('fk_production_lines_current_plan', 'production_lines', 'production_plans', ['current_plan_id'], ['id'])
    op.create_foreign_key('fk_anomalies_solution', 'anomalies', 'solutions', ['solution_id'], ['id'])


def downgrade():
    # Step 1: Drop circular foreign keys first
    op.drop_constraint('fk_anomalies_solution', 'anomalies', type_='foreignkey')
    op.drop_constraint('fk_production_lines_current_plan', 'production_lines', type_='foreignkey')
    op.drop_constraint('fk_production_lines_bottleneck_station', 'production_lines', type_='foreignkey')

    # Step 2: Drop tables
    op.drop_table('defect_details')
    op.drop_table('work_orders')
    op.drop_table('case_library')
    op.drop_table('quality_metrics')
    op.drop_table('production_records')
    op.drop_table('items')
    op.drop_table('solutions')
    op.drop_table('anomalies')
    op.drop_table('production_plans')
    op.drop_table('stations')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_table('production_lines')
    op.drop_table('audit_logs')
