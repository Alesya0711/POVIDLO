from pydantic import BaseModel, ConfigDict, Field
from app.schemas.common import MoneyStr, PositiveMoneyStr
from app.schemas.product import IndustryCode, LegalForm, PurposeCategory


class CompanyLookupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    inn: str = Field(min_length=10, max_length=12, description="ИНН организации (10 цифр) или ИП (12 цифр)")
    questionnaireLegalForm: LegalForm | None = None
    questionnaireIndustry: IndustryCode | None = None
    questionnaireBusinessAgeMonths: int | None = Field(default=None, ge=0)


class DiscrepancyItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    field: str
    questionnaireValue: str
    simulatorValue: str
    message: str


class SupportingRecordSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    type: str
    title: str
    period: str
    source: str
    verificationResult: str
    summary: str


class CompanyProfileResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    inn: str
    profileId: str
    isSyntheticDemo: bool = True
    name: str
    legalForm: LegalForm
    industry: IndustryCode
    registrationDate: str
    businessAgeMonths: int
    registryStatus: str
    revenue: MoneyStr
    previousRevenue: MoneyStr
    operatingExpenses: MoneyStr
    existingMonthlyPayments: MoneyStr
    creditHistoryStatus: str
    pastDays: int
    currentDays: int
    hasBankRestriction: bool
    bankRestrictionReason: str | None
    settlementAccount: str
    supportingRecords: list[SupportingRecordSchema]
    discrepancies: list[DiscrepancyItem]
    reportingDate: str
    dataVersion: str


class PrecheckRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    inn: str = Field(min_length=10, max_length=12)
    productId: str = Field(min_length=1)
    principal: PositiveMoneyStr
    termMonths: int = Field(ge=1, le=600)
    purpose: PurposeCategory | None = None
    userRevenueOverride: MoneyStr | None = None
    userOperatingExpensesOverride: MoneyStr | None = None


class PrecheckResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    inn: str
    productId: str
    status: str
    canSubmitStandard: bool
    canRequestOtherTerms: bool
    approvalProbability: int | None
    score: int | None
    riskBand: str
    monthlyPayment: MoneyStr
    totalRepayment: MoneyStr
    totalInterest: MoneyStr
    operatingCash: MoneyStr
    availableCash: MoneyStr
    paymentLimit: MoneyStr
    isAffordable: bool
    factors: list[str]
    blockReason: str | None
    hasDiscrepancyWithSimulator: bool
    rulesVersion: str
    dataVersion: str