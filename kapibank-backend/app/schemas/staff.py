from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.schemas.common import PositiveMoneyStr, RateStr

class VersionedAction(BaseModel):
    model_config = ConfigDict(extra='forbid')
    expectedVersion: int = Field(ge=1)

class BankDecisionRequest(VersionedAction):
    action: Literal['approve','reject','propose_alternative']
    rejectionReason: str | None = Field(default=None, max_length=1000)
    alternativePrincipal: PositiveMoneyStr | None = None
    alternativeTermMonths: int | None = Field(default=None, ge=1, le=600)
    annualRate: RateStr | None = None
    comment: str = Field(min_length=1, max_length=1000)
    @model_validator(mode='after')
    def validate_action(self):
        if not self.comment.strip(): raise ValueError('Укажите обоснование')
        if self.action == 'reject' and not (self.rejectionReason or self.comment).strip(): raise ValueError('Укажите причину отказа')
        if self.action == 'propose_alternative' and (self.alternativePrincipal is None or self.alternativeTermMonths is None): raise ValueError('Укажите сумму и срок альтернативного предложения')
        if self.annualRate is not None:
            from decimal import Decimal
            if Decimal(self.annualRate) > 1: raise ValueError('Ставка должна быть от 0 до 1 в долях единицы')
        return self

class ClientOfferActionRequest(VersionedAction):
    action: Literal['accept','request_revision','reject']
    offerVersion: int = Field(ge=1)
    revisionPrincipal: PositiveMoneyStr | None = None
    revisionTermMonths: int | None = Field(default=None, ge=1, le=600)
    revisionComment: str = Field(default='', max_length=1000)

class InfoRequest(VersionedAction):
    message: str = Field(min_length=1, max_length=1000)

class InfoReply(VersionedAction):
    message: str = Field(min_length=1, max_length=1000)

class SignAndIssueRequest(VersionedAction):
    settlementAccount: str = Field(pattern=r'^\d{20}$')
    contractVersion: str = Field(min_length=1)
    confirmed: bool
