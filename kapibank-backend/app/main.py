from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlmodel import Session, text
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.products import router as products_router
from app.core.config import settings
from app.core.db import engine
from app.core.errors import AppException, register_exception_handlers
from app.seed.products import seed_products
from app.api.v1.companies import router as companies_router
from app.seed.companies import seed_companies
from app.api.v1.auth import router as auth_router
from app.seed.users import seed_users
from app.api.v1.applications import router as applications_router
from app.api.v1.staff import router as staff_router
from app.api.v1.assistant import router as assistant_router
from app.models.assistant import AssistantConversation, AssistantProposal

@asynccontextmanager
async def lifespan(app: FastAPI):
    with Session(engine) as session:
        seed_products(session)
        seed_companies(session)
        seed_users(session)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Кредитный кабинет для бизнеса: продукты, заявки, рассмотрение и помощь с условиями."
    ),
    servers=[
        {
            "url": "http://127.0.0.1:8080",
            "description": "Объединённый контейнер: FastAPI, API и собранный фронтенд на одном origin",
        },
        {
            "url": "http://127.0.0.1:8000",
            "description": "Отдельный сервер для разработки; Vite проксирует /api без переписывания пути",
        },
    ],
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)


@app.get("/health", tags=["System"])
def healthcheck() -> dict[str, str]:
    with Session(engine) as session:
        session.exec(text("SELECT 1"))
    return {"status": "ok", "version": settings.VERSION}


app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(recommendations_router, prefix=settings.API_V1_STR)
app.include_router(companies_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(applications_router, prefix=settings.API_V1_STR)
app.include_router(staff_router, prefix=settings.API_V1_STR)
app.include_router(assistant_router, prefix=settings.API_V1_STR)

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], include_in_schema=False)
def unknown_api_route(path: str):
    raise AppException(
        status_code=status.HTTP_404_NOT_FOUND,
        code="NOT_FOUND",
        message=f"API маршрут '/api/{path}' не найден",
        field_errors=[],
    )


@app.get("/{full_path:path}", include_in_schema=False)
def serve_spa(full_path: str):
    dist_dir = settings.FRONTEND_DIST_DIR.resolve()
    index_file = dist_dir / "index.html"

    if not index_file.is_file():
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message="Страница недоступна. Попробуйте открыть её позже.",
            field_errors=[],
        )

    requested = (dist_dir / full_path).resolve()
    if not requested.is_relative_to(dist_dir):
        raise AppException(status_code=404, code="NOT_FOUND", message="Недопустимый путь")

    if full_path.startswith("assets/"):
        if requested.is_file():
            return FileResponse(requested)
        raise AppException(status_code=404, code="NOT_FOUND", message="Статический файл не найден")

    if full_path and requested.is_file():
        return FileResponse(requested)

    return FileResponse(index_file)