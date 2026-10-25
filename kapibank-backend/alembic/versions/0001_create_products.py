"""create products table

Revision ID: 0001_create_products
Revises:
Create Date: 2026-10-24 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_create_products"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("purpose_categories", sa.JSON(), nullable=False),
        sa.Column("specific_purposes", sa.JSON(), nullable=False),
        sa.Column("is_universal", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("industries", sa.JSON(), nullable=False),
        sa.Column("legal_forms", sa.JSON(), nullable=False),
        sa.Column("minimum_business_age_months", sa.Integer(), nullable=False),
        sa.Column("minimum_principal", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("maximum_principal", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("minimum_term_months", sa.Integer(), nullable=False),
        sa.Column("maximum_term_months", sa.Integer(), nullable=False),
        sa.Column("annual_rate", sa.Numeric(precision=6, scale=4), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("products")