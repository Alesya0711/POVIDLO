from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, JSON
from sqlmodel import SQLModel, Field

class AssistantConversation(SQLModel, table=True):
    __tablename__ = 'assistant_conversations'
    id: str = Field(primary_key=True, max_length=64)
    owner: str = Field(index=True, max_length=100)
    messages: list[dict] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(DateTime(timezone=True), nullable=False))

class AssistantProposal(SQLModel, table=True):
    __tablename__ = 'assistant_proposals'
    id: str = Field(primary_key=True, max_length=64)
    owner: str = Field(index=True, max_length=100)
    conversation_id: str = Field(max_length=64)
    target_field: str = Field(max_length=64)
    value: dict = Field(sa_column=Column(JSON, nullable=False))
    context_hash: str = Field(max_length=64)
    revision: int = 1
    confirmed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(DateTime(timezone=True), nullable=False))
