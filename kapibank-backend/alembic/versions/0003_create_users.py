"""create users table

Revision ID: 0003_create_users
Revises: 0002_create_companies
Create Date: 2026-10-24 14:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_create_users"
down_revision = "0002_create_companies"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("bound_inn", sa.String(length=12), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_bound_inn", "users", ["bound_inn"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_bound_inn", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")