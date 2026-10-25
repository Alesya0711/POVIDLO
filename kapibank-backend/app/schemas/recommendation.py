from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic_core import PydanticCustomError

from app.schemas.common import MoneyStr, PositiveMoneyStr
from app.schemas.product import (
    IndustryCode,
    LegalForm,
    Product,
    PurposeCategory,
    SPECIFIC_PURPOSE_CATALOG,
)


class QuestionnaireAnswers(BaseModel):
    model_config = ConfigDict(extra="forbid")

    industry: IndustryCode
    legalForm: LegalForm
    businessAgeMonths: int = Field(ge=0, le=1200)
    purpose: PurposeCategory
    principal: PositiveMoneyStr
    termMonths: int = Field(ge=1, le=600)
    industryDescription: str | None = Field(default=None, max_length=200)
    specificPurpose: str | None = Field(
        default=None,
        pattern=r"^[a-z][a-z0-9_]{0,63}$",
    )

    @model_validator(mode="after")
    def validate_conditional_fields(self) -> "QuestionnaireAnswers":
        # 1. Нормализация и проверка industryDescription
        if self.industryDescription is not None:
            self.industryDescription = self.industryDescription.strip()

        if self.industry == "other":
            if not self.industryDescription:
                raise PydanticCustomError(
                    "industry_description_required",
                    "Для выбранной сферы «Другое» укажите описание деятельности",
                )

        # 2. Проверка specificPurpose по каноническому словарю и соответствию purpose
        if self.specificPurpose is not None:
            spec_meta = SPECIFIC_PURPOSE_CATALOG.get(self.specificPurpose)
            if spec_meta is None:
                raise PydanticCustomError(
                    "unknown_specific_purpose",
                    "Неизвестный код точной задачи финансирования",
                )
            if spec_meta["category"] != self.purpose:
                raise PydanticCustomError(
                    "specific_purpose_mismatch",
                    f"Точная задача '{self.specificPurpose}' не относится к категории '{self.purpose}'",
                )

        return self

    @property
    def principal_decimal(self) -> Decimal:
        return Decimal(self.principal)


class RecommendationItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product: Product
    rank: int = Field(ge=1)
    reasons: list[str]
    monthlyPayment: MoneyStr
    totalRepayment: MoneyStr
    totalInterest: MoneyStr


class RecommendationResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[RecommendationItem]
    unmatchedReasons: list[str]
    rulesVersion: str
    dataVersion: str