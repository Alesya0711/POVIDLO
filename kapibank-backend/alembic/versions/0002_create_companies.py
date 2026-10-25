"""create company_profiles and inn_bindings tables

Revision ID: 0002_create_companies
Revises: 0001_create_products
Create Date: 2026-10-24 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_create_companies"
down_revision = "0001_create_products"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "company_profiles",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("sample_inn", sa.String(length=12), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("legal_form", sa.String(length=16), nullable=False),
        sa.Column("industry", sa.String(length=32), nullable=False),
        sa.Column("registration_date", sa.String(length=10), nullable=False),
        sa.Column("business_age_months", sa.Integer(), nullable=False),
        sa.Column("registry_status", sa.String(length=32), nullable=False),
        sa.Column("revenue", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("previous_revenue", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("operating_expenses", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("existing_monthly_payments", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("monthly_reports", sa.JSON(), nullable=False),
        sa.Column("credit_history_status", sa.String(length=32), nullable=False),
        sa.Column("past_days", sa.Integer(), nullable=False),
        sa.Column("current_days", sa.Integer(), nullable=False),
        sa.Column("has_bank_restriction", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("bank_restriction_reason", sa.String(length=500), nullable=True),
        sa.Column("settlement_account", sa.String(length=32), nullable=False),
        sa.Column("supporting_records", sa.JSON(), nullable=False),
        sa.Column("scenario_note", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sample_inn"),
    )
    op.create_index("ix_company_profiles_sample_inn", "company_profiles", ["sample_inn"], unique=True)
    op.create_index("ix_company_profiles_legal_form", "company_profiles", ["legal_form"], unique=False)

    op.create_table(
        "inn_bindings",
        sa.Column("inn", sa.String(length=12), nullable=False),
        sa.Column("profile_id", sa.String(length=64), nullable=False),
        sa.Column("data_version", sa.String(length=32), nullable=False),
        sa.Column("bound_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["company_profiles.id"]),
        sa.PrimaryKeyConstraint("inn"),
    )


def downgrade() -> None:
    op.drop_table("inn_bindings")
    op.drop_index("ix_company_profiles_legal_form", table_name="company_profiles")
    op.drop_index("ix_company_profiles_sample_inn", table_name="company_profiles")
    op.drop_table("company_profiles")