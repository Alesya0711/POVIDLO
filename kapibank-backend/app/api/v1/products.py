from decimal import Decimal
from typing import Annotated
from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.errors import AppException
from app.models.product import ProductModel
from app.schemas.common import ApiError, PositiveMoneyStr
from app.schemas.product import Product, ProductList, PurposeCategory

router = APIRouter(tags=["Products"])


@router.get(
    "/products",
    operation_id="listProducts",
    summary="Получить каталог продуктов",
    response_model=ProductList,
    responses={
        422: {"model": ApiError, "description": "Некорректные query-параметры"},
        503: {"model": ApiError, "description": "Каталог временно недоступен"},
        500: {"model": ApiError, "description": "Неожиданная внутренняя ошибка; без stack trace"},
    },
)
def list_products(
    search: Annotated[
        str | None,
        Query(
            max_length=120,
            description="Поиск по подстроке названия без учёта регистра, пробелы по краям удаляются. Пустая строка не фильтрует.",
        ),
    ] = None,
    purpose: Annotated[
        PurposeCategory | None,
        Query(description="Общая категория. Универсальные продукты также включаются."),
    ] = None,
    principal: Annotated[
        PositiveMoneyStr | None,
        Query(description="Положительная сумма в рублях; включённые границы minimumPrincipal/maximumPrincipal."),
    ] = None,
    termMonths: Annotated[
        int | None,
        Query(ge=1, description="Включённые границы срока продукта."),
    ] = None,
    session: Session = Depends(get_session),
) -> ProductList:
    principal_dec = Decimal(principal) if principal is not None else None
    search_clean = search.strip().lower() if search is not None else ""

    rows = session.exec(select(ProductModel).order_by(ProductModel.id)).all()

    items: list[Product] = []
    for row in rows:
        if search_clean and search_clean not in row.name.lower():
            continue
        if purpose is not None and not (row.is_universal or purpose in row.purpose_categories):
            continue
        if principal_dec is not None and not (row.minimum_principal <= principal_dec <= row.maximum_principal):
            continue
        if termMonths is not None and not (row.minimum_term_months <= termMonths <= row.maximum_term_months):
            continue
        items.append(Product.from_orm_model(row))

    return ProductList(items=items)


@router.get(
    "/products/{productId}",
    operation_id="getProduct",
    summary="Получить продукт по идентификатору",
    response_model=Product,
    responses={
        404: {"model": ApiError, "description": "Продукт не найден"},
        503: {"model": ApiError, "description": "Источник временно недоступен"},
        500: {"model": ApiError, "description": "Неожиданная внутренняя ошибка; без stack trace"},
    },
)
def get_product(
    productId: str,
    session: Session = Depends(get_session),
) -> Product:
    product = session.get(ProductModel, productId)
    if not product:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=f"Продукт '{productId}' не найден",
            field_errors=[],
        )
    return Product.from_orm_model(product)