from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, String, JSON
from sqlmodel import Field, SQLModel


class UserModel(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(primary_key=True, max_length=64)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(nullable=False, max_length=255)
    role: str = Field(nullable=False, max_length=32)  # client | bank_staff
    full_name: str = Field(nullable=False, max_length=255)
    profile: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    bound_inn: str | None = Field(default=None, max_length=12, index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )