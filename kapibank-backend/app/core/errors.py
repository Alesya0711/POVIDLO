import logging
import uuid
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import InterfaceError, OperationalError, IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("kapibank.errors")

CUSTOM_ERROR_FIELD_MAP = {
    "industry_description_required": "industryDescription",
    "unknown_specific_purpose": "specificPurpose",
    "specific_purpose_mismatch": "specificPurpose",
}


class AppException(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        field_errors: list[dict[str, str]] | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.field_errors = field_errors or []


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:16]}")


def _extract_field_path(loc: tuple | list, err_type: str = "") -> str:
    if err_type in CUSTOM_ERROR_FIELD_MAP:
        return CUSTOM_ERROR_FIELD_MAP[err_type]
    parts = [str(p) for p in loc if p not in ("body", "query", "path", "header", "cookie")]
    return ".".join(parts) if parts else "_request"


def register_exception_handlers(app: FastAPI) -> None:
    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = f"req-{uuid.uuid4().hex[:16]}"
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "code": exc.code,
                "message": exc.message,
                "fieldErrors": exc.field_errors,
                "requestId": get_request_id(request),
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        field_errors: list[dict[str, str]] = []
        for err in exc.errors():
            err_type = str(err.get("type", ""))
            field_path = _extract_field_path(err.get("loc", ()), err_type)
            msg = err.get("msg", "Некорректное значение")
            if msg.startswith("Value error, "):
                msg = msg.replace("Value error, ", "", 1)
            field_errors.append({"field": field_path, "message": msg})

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "code": "VALIDATION_ERROR",
                "message": "Проверьте введённые данные",
                "fieldErrors": field_errors,
                "requestId": get_request_id(request),
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        code_map = {
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "CONFLICT",
            503: "SERVICE_UNAVAILABLE",
        }
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "code": code_map.get(exc.status_code, f"HTTP_{exc.status_code}"),
                "message": str(exc.detail) if exc.detail else "Ошибка запроса",
                "fieldErrors": [],
                "requestId": get_request_id(request),
            },
        )

    @app.exception_handler(IntegrityError)
    async def integrity_handler(request: Request, exc: IntegrityError):
        return JSONResponse(status_code=409, content={"code":"CONFLICT", "message":"Данные изменились или уже существуют. Обновите страницу и повторите действие.", "fieldErrors":[], "requestId":get_request_id(request)})

    @app.exception_handler(OperationalError)
    @app.exception_handler(InterfaceError)
    async def db_unavailable_handler(request: Request, exc: Exception) -> JSONResponse:
        req_id = get_request_id(request)
        logger.error("Database connection error [requestId=%s]: %s", req_id, exc, exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "code": "SERVICE_UNAVAILABLE",
                "message": "Источник временно недоступен",
                "fieldErrors": [],
                "requestId": req_id,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        req_id = get_request_id(request)
        logger.exception("Unhandled internal error [requestId=%s]", req_id)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "code": "INTERNAL_ERROR",
                "message": "Внутренняя ошибка сервера",
                "fieldErrors": [],
                "requestId": req_id,
            },
        )