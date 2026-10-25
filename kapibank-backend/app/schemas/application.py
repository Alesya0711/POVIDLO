from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, EmailStr, model_validator
from app.schemas.common import MoneyStr, PositiveMoneyStr
from app.schemas.product import PurposeCategory

class ApplicationCreateRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    inn: str = Field(min_length=10, max_length=12)
    productId: str = Field(min_length=1)
    principal: PositiveMoneyStr
    termMonths: int = Field(ge=1, le=600)
    purpose: PurposeCategory
    requestOtherTerms: bool = False
    comment: str = Field(default='', max_length=1000)
    contactEmail: EmailStr | None = None
    @model_validator(mode='after')
    def require_explanation(self):
        if self.requestOtherTerms and not self.comment.strip(): raise ValueError('Поясните запрос других условий')
        return self

class HistoryEventSchema(BaseModel):
    timestamp: str
    initiator: str
    action: str
    description: str

class ApplicationResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id: str
    userId: str
    inn: str
    productId: str
    productName: str
    principal: MoneyStr
    termMonths: int
    purpose: str
    annualRate: str
    status: str
    score: int | None
    approvalProbability: int | None
    monthlyPayment: MoneyStr | None
    requestedPrincipal: MoneyStr
    requestedTermMonths: int
    company: dict
    offer: dict | None
    infoRequests: list[dict]
    version: int
    comment: str
    contactEmail: str | None
    history: list[HistoryEventSchema]
    createdAt: datetime
    updatedAt: datetime

class ApplicationListResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')
    items: list[ApplicationResponse]
