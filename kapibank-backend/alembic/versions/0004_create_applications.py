"""create applications table

Revision ID: 0004_create_applications
Revises: 0003_create_users
Create Date: 2026-10-24 15:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0004_create_applications"
down_revision = "0003_create_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "applications",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("inn", sa.String(length=12), nullable=False),
        sa.Column("product_id", sa.String(length=64), nullable=False),
        sa.Column("principal", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("term_months", sa.Integer(), nullable=False),
        sa.Column("purpose", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("approval_probability", sa.Integer(), nullable=True),
        sa.Column("monthly_payment", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("history", sa.JSON(), nullable=False),
        sa.Column("alternative_offer", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_applications_user_id", "applications", ["user_id"], unique=False)
    op.create_index("ix_applications_inn", "applications", ["inn"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_applications_inn", table_name="applications")
    op.drop_index("ix_applications_user_id", table_name="applications")
    op.drop_table("applications")