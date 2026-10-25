from decimal import Decimal
from sqlalchemy import Column, JSON, Numeric
from sqlmodel import Field, SQLModel


class ProductModel(SQLModel, table=True):
    __tablename__ = "products"

    id: str = Field(primary_key=True, max_length=64)
    name: str = Field(nullable=False, max_length=255)
    purpose_categories: list[str] = Field(sa_column=Column(JSON, nullable=False))
    specific_purposes: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    is_universal: bool = Field(default=False, nullable=False)
    industries: list[str] = Field(sa_column=Column(JSON, nullable=False))
    legal_forms: list[str] = Field(sa_column=Column(JSON, nullable=False))
    minimum_business_age_months: int = Field(nullable=False, ge=6)
    minimum_principal: Decimal = Field(sa_column=Column(Numeric(14, 2), nullable=False))
    maximum_principal: Decimal = Field(sa_column=Column(Numeric(14, 2), nullable=False))
    minimum_term_months: int = Field(nullable=False, ge=1)
    maximum_term_months: int = Field(nullable=False, ge=1)
    annual_rate: Decimal = Field(sa_column=Column(Numeric(6, 4), nullable=False))