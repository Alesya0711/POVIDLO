from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, DateTime, JSON, Numeric, UniqueConstraint
from sqlmodel import Field, SQLModel


class ApplicationModel(SQLModel, table=True):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("user_id", "submission_key", name="uq_application_submission"),)

    id: str = Field(primary_key=True, max_length=64)
    user_id: str = Field(nullable=False, max_length=64, index=True)
    inn: str = Field(nullable=False, max_length=12, index=True)
    product_id: str = Field(nullable=False, max_length=64)

    # Параметры финансирования
    principal: Decimal = Field(sa_column=Column(Numeric(14, 2), nullable=False))
    term_months: int = Field(nullable=False, ge=1)
    purpose: str = Field(nullable=False, max_length=64)

    company_snapshot: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    info_requests: list[dict] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    requested_principal: Decimal | None = Field(default=None, sa_column=Column(Numeric(14, 2), nullable=True))
    requested_term_months: int | None = None
    annual_rate: Decimal | None = Field(default=None, sa_column=Column(Numeric(8, 6), nullable=True))
    version: int = Field(default=1, nullable=False)
    offer_version: int = Field(default=1, nullable=False)
    submission_key: str | None = Field(default=None, max_length=100)
    submission_hash: str | None = Field(default=None, max_length=64)
    comment: str = Field(default="", max_length=1000)
    contact_email: str | None = Field(default=None, max_length=254)

    # Статус заявки по жизненному циклу
    status: str = Field(nullable=False, max_length=32, default="draft")
    # draft | automatic_check | info_requested | employee_review | waiting_acceptance | bank_rejected | issued

    score: int | None = Field(default=None)
    approval_probability: int | None = Field(default=None)
    monthly_payment: Decimal | None = Field(default=None, sa_column=Column(Numeric(14, 2), nullable=True))

    # История изменений и запросов (список словарей)
    history: list[dict] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))

    # Предложенные банком изменённые условия (если банк применил альтернативное предложение)
    alternative_offer: dict | None = Field(default=None, sa_column=Column(JSON, nullable=True))

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )