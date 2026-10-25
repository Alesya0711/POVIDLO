from pathlib import Path
from sqlalchemy.engine import URL
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, SecretStr


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Капибанк"
    VERSION: str = "0.3.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "local"

    POSTGRES_SERVER: str = "127.0.0.1"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "kapibank"
    POSTGRES_PASSWORD: str = "kapibank_secret"
    POSTGRES_DB: str = "kapibank"

    BACKEND_CORS_ORIGINS: list[str] = [
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://localhost:4173",
    ]

    FRONTEND_DIST_DIR: Path = Path("/app/frontend-dist")

    DATA_VERSION: str = "demo-data-1"
    RULES_VERSION: str = "demo-rules-1"
    REPORTING_DATE: str = "2026-10-01"

    SECRET_KEY: str = "kapibank-dev-secret-key-change-me"
    LLM_MODE: str = "groq"
    GROQ_API_KEY: SecretStr = SecretStr("")
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_TIMEOUT_SECONDS: float = Field(default=20, gt=0, le=60)
    GROQ_MAX_COMPLETION_TOKENS: int = Field(default=2048, ge=256, le=4096)
    DATABASE_URL: str | None = None

    @property
    def sqlalchemy_database_uri(self) -> str:
        if self.DATABASE_URL: return self.DATABASE_URL
        return URL.create('postgresql+psycopg',username=self.POSTGRES_USER,password=self.POSTGRES_PASSWORD,host=self.POSTGRES_SERVER,port=self.POSTGRES_PORT,database=self.POSTGRES_DB).render_as_string(hide_password=False)


settings = Settings()
