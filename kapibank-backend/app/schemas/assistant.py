from typing import Any
from pydantic import BaseModel, ConfigDict, Field

class AssistantMessageRequest(BaseModel):
    model_config=ConfigDict(extra='forbid')
    conversationId: str | None = Field(default=None,max_length=64)
    clientMessageId: str = Field(min_length=1,max_length=64)
    message: str = Field(min_length=1,max_length=1000)
    context: dict[str,Any] = Field(default_factory=dict)
class ProposalSchema(BaseModel):
    id: str
    targetField: str
    proposedValue: Any
    explanation: str
    revision: int
class AssistantMessageResponse(BaseModel):
    conversationId: str
    reply: str
    dataMode: str
    proposal: ProposalSchema | None = None
class ProposalConfirmRequest(BaseModel):
    model_config=ConfigDict(extra='forbid')
    revision: int = Field(ge=1)
    context: dict[str,Any] = Field(default_factory=dict)
class ProposalConfirmResponse(BaseModel):
    status: str = 'confirmed'
    targetField: str
    confirmedValue: Any
    revision: int
