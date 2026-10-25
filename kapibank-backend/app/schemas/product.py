from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from app.models.product import ProductModel
from app.schemas.common import MoneyStr, RateStr, SpecificPurposeCode, format_money, format_rate

PurposeCategory = Literal["working_capital", "equipment", "growth"]
LegalForm = Literal["ip", "ooo"]
IndustryCode = Literal["trade", "services", "manufacturing", "other"]

# Задачи финансирования и соответствующие категории целей.
SPECIFIC_PURPOSE_CATALOG: dict[str, dict[str, str]] = {
    # working_capital
    "inventory_purchase": {"category": "working_capital", "title": "Закупка товара и пополнение склада"},
    "cash_gap": {"category": "working_capital", "title": "Покрытие кассового разрыва"},
    "raw_materials": {"category": "working_capital", "title": "Закупка сырья и материалов"},
    "contract_execution": {"category": "working_capital", "title": "Исполнение контракта или заказа"},
    "operational_expenses": {"category": "working_capital", "title": "Текущие операционные расходы и аренда"},
    # equipment
    "machinery_purchase": {"category": "equipment", "title": "Покупка производственных станков и линий"},
    "commercial_equipment": {"category": "equipment", "title": "Торговое, складское или холодильное оборудование"},
    "service_appliances": {"category": "equipment", "title": "Профессиональное оборудование для сферы услуг"},
    "it_hardware": {"category": "equipment", "title": "Серверы, компьютеры и ИТ-инфраструктура"},
    "commercial_transport": {"category": "equipment", "title": "Коммерческий транспорт и спецтехника"},
    # growth
    "new_branch": {"category": "growth", "title": "Открытие новой точки, филиала или студии"},
    "workshop_expansion": {"category": "growth", "title": "Расширение и модернизация производства"},
    "market_expansion": {"category": "growth", "title": "Выход на новый рынок или запуск направления"},
    "digital_growth": {"category": "growth", "title": "Цифровизация, ПО и развитие онлайн-каналов"},
}


class Product(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    name: str
    purposeCategories: list[PurposeCategory]
    industries: list[str]
    legalForms: list[LegalForm]
    minimumBusinessAgeMonths: int = Field(ge=6)
    minimumPrincipal: MoneyStr
    maximumPrincipal: MoneyStr
    minimumTermMonths: int = Field(ge=1)
    maximumTermMonths: int = Field(ge=1)
    annualRate: RateStr
    specificPurposes: list[SpecificPurposeCode] = Field(default_factory=list)
    isUniversal: bool = Field(default=False)

    @classmethod
    def from_orm_model(cls, model: ProductModel) -> "Product":
        return cls(
            id=model.id,
            name=model.name,
            purposeCategories=model.purpose_categories,  # type: ignore[arg-type]
            industries=model.industries,
            legalForms=model.legal_forms,  # type: ignore[arg-type]
            minimumBusinessAgeMonths=model.minimum_business_age_months,
            minimumPrincipal=format_money(model.minimum_principal),
            maximumPrincipal=format_money(model.maximum_principal),
            minimumTermMonths=model.minimum_term_months,
            maximumTermMonths=model.maximum_term_months,
            annualRate=format_rate(model.annual_rate),
            specificPurposes=model.specific_purposes,
            isUniversal=model.is_universal,
        )


class ProductList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[Product]