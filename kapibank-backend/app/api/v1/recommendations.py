from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.db import get_session
from app.models.product import ProductModel
from app.schemas.common import ApiError
from app.schemas.recommendation import QuestionnaireAnswers, RecommendationResult
from app.services.recommendation import recommend_products_for_answers

router = APIRouter(tags=["Recommendations"])


@router.post(
    "/recommendations",
    operation_id="recommendProducts",
    summary="Подобрать продукты по подтверждённым ответам",
    description=(
        "После обязательного допуска к продуктам: точная задача, общая категория, "
        "универсальный продукт; затем totalRepayment для одной запрошенной суммы и срока; "
        "затем id. Если specificPurpose отсутствует, точного уровня нет. "
        "Пустой items с причинами = 200. Подбор не создаёт заявку и не является кредитным решением."
    ),
    response_model=RecommendationResult,
    responses={
        422: {"model": ApiError, "description": "Ошибка полей"},
        503: {"model": ApiError, "description": "Подбор временно недоступен"},
        500: {"model": ApiError, "description": "Неожиданная внутренняя ошибка; без stack trace"},
    },
)
def recommend_products(
    answers: QuestionnaireAnswers,
    session: Session = Depends(get_session),
) -> RecommendationResult:
    products = list(session.exec(select(ProductModel)).all())
    return recommend_products_for_answers(products=products, answers=answers)
