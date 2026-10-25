from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, DateTime, JSON, Numeric
from sqlmodel import Field, SQLModel


class CompanyProfileModel(SQLModel, table=True):
    __tablename__ = "company_profiles"

    id: str = Field(primary_key=True, max_length=64)
    sample_inn: str = Field(unique=True, index=True, max_length=12)
    name: str = Field(nullable=False, max_length=255)
    legal_form: str = Field(nullable=False, max_length=16, index=True)  # ip | ooo
    industry: str = Field(nullable=False, max_length=32)  # trade | services | manufacturing | other
    registration_date: str = Field(nullable=False, max_length=10)  # YYYY-MM-DD
    business_age_months: int = Field(nullable=False, ge=0)
    registry_status: str = Field(nullable=False, max_length=32)  # active | inactive

    # Финансовые показатели (средние за последние 3 мес. и предыдущие 3 мес.)
    revenue: Decimal = Field(sa_column=Column(Numeric(14, 2), nullable=False))
    previous_revenue: Decimal = Field(sa_column=Column(Numeric(14, 2), nullable=False))
    operating_expenses: Decimal = Field(sa_column=Column(Numeric(14, 2), nullable=False))
    existing_monthly_payments: Decimal = Field(sa_column=Column(Numeric(14, 2), nullable=False))

    # Помесячная отчётность за 6 последних полных месяцев (список словарей)
    monthly_reports: list[dict] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))

    # Кредитная история из имитатора БКИ: ok | empty | source_unavailable
    credit_history_status: str = Field(nullable=False, max_length=32, default="ok")
    past_days: int = Field(nullable=False, default=0, ge=0)
    current_days: int = Field(nullable=False, default=0, ge=0)

    # Внутренние банковские ограничения («красный флаг» и причина)
    has_bank_restriction: bool = Field(nullable=False, default=False)
    bank_restriction_reason: str | None = Field(default=None, max_length=500)

    # Синтетический расчётный счёт и подтверждающие записи имитаторов
    settlement_account: str = Field(nullable=False, max_length=32)
    supporting_records: list[dict] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    scenario_note: str = Field(nullable=False, max_length=255)


class InnProfileBindingModel(SQLModel, table=True):
    __tablename__ = "inn_bindings"

    inn: str = Field(primary_key=True, max_length=12)
    profile_id: str = Field(nullable=False, foreign_key="company_profiles.id", max_length=64)
    data_version: str = Field(nullable=False, max_length=32)
    bound_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
