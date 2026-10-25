from decimal import Decimal
from app.core.config import settings
from app.models.product import ProductModel
from app.schemas.common import format_money
from app.schemas.product import Product, SPECIFIC_PURPOSE_CATALOG
from app.schemas.recommendation import (
    QuestionnaireAnswers,
    RecommendationItem,
    RecommendationResult,
)
from app.services.finance import calculate_annuity

PURPOSE_LABELS = {
    "working_capital": "оборотные средства",
    "equipment": "покупка оборудования",
    "growth": "развитие бизнеса",
}

LEGAL_FORM_LABELS = {
    "ip": "ИП",
    "ooo": "ООО",
}

INDUSTRY_LABELS = {
    "trade": "торговля",
    "services": "услуги",
    "manufacturing": "производство",
    "other": "выбранная сфера бизнеса",
}


def _match_goal_tier(product: ProductModel, answers: QuestionnaireAnswers) -> int | None:
    """
    Возвращает уровень совпадения цели (1 — лучший, 3 — универсальный) или None, если цель не подходит:
    1: неуниверсальный продукт с совпадением specificPurpose
    2: неуниверсальный продукт с совпадением общей категории purpose
    3: продукт с is_universal=True
    """
    if not product.is_universal:
        if (
            answers.specificPurpose
            and answers.specificPurpose in product.specific_purposes
            and answers.purpose in product.purpose_categories
        ):
            return 1
        if answers.purpose in product.purpose_categories:
            return 2
        return None

    return 3


def _build_reasons(
    product: ProductModel,
    answers: QuestionnaireAnswers,
    tier: int,
) -> list[str]:
    reasons: list[str] = []

    if tier == 1 and answers.specificPurpose:
        spec_title = SPECIFIC_PURPOSE_CATALOG[answers.specificPurpose]["title"].lower()
        reasons.append(f"Точное совпадение задачи: {spec_title}")
    elif tier == 2:
        reasons.append(f"Совпадает цель: {PURPOSE_LABELS[answers.purpose]}")
    else:
        reasons.append(
            f"Универсальный продукт: подходит для цели «{PURPOSE_LABELS[answers.purpose]}»"
        )

    legal_label = LEGAL_FORM_LABELS[answers.legalForm]
    ind_label = (
        f"«{answers.industryDescription}»"
        if answers.industry == "other" and answers.industryDescription
        else INDUSTRY_LABELS[answers.industry]
    )
    reasons.append(
        f"Подходит для {legal_label} в сфере ({ind_label}), возраст бизнеса от {product.minimum_business_age_months} мес."
    )
    reasons.append(
        f"Запрошенная сумма и срок ({answers.termMonths} мес.) входят в условия продукта"
    )
    return reasons


def _diagnose_unmatched_reasons(
    products: list[ProductModel],
    answers: QuestionnaireAnswers,
) -> list[str]:
    if not products:
        return ["Каталог продуктов пуст"]

    principal = answers.principal_decimal
    reasons: list[str] = []

    by_age = [p for p in products if answers.businessAgeMonths >= p.minimum_business_age_months]
    if not by_age:
        min_required = min(p.minimum_business_age_months for p in products)
        reasons.append(
            f"Нет продуктов для указанного возраста бизнеса ({answers.businessAgeMonths} мес.; минимальное требование каталога — от {min_required} мес.)"
        )

    by_form = [p for p in products if answers.legalForm in p.legal_forms]
    if not by_form:
        reasons.append("Нет продуктов для выбранной организационно-правовой формы")

    by_industry = [p for p in products if answers.industry in p.industries]
    if not by_industry:
        reasons.append("Нет продуктов для выбранной отрасли")

    by_principal = [
        p for p in products if p.minimum_principal <= principal <= p.maximum_principal
    ]
    if not by_principal:
        min_p = min(p.minimum_principal for p in products)
        max_p = max(p.maximum_principal for p in products)
        reasons.append(
            f"Запрошенная сумма не входит в допустимые границы продуктов (доступно от {format_money(min_p)} до {format_money(max_p)} ₽)"
        )

    by_term = [
        p
        for p in products
        if p.minimum_term_months <= answers.termMonths <= p.maximum_term_months
    ]
    if not by_term:
        min_t = min(p.minimum_term_months for p in products)
        max_t = max(p.maximum_term_months for p in products)
        reasons.append(
            f"Запрошенный срок ({answers.termMonths} мес.) выходит за пределы условий продуктов (от {min_t} до {max_t} мес.)"
        )

    if not reasons:
        reasons.append(
            "Нет продуктов, одновременно сочетающих выбранную цель, сумму, срок и параметры бизнеса"
        )

    return reasons


def recommend_products_for_answers(
    products: list[ProductModel],
    answers: QuestionnaireAnswers,
) -> RecommendationResult:
    principal: Decimal = answers.principal_decimal
    candidates: list[tuple[int, Decimal, str, ProductModel, list[str], tuple[str, str, str]]] = []

    for product in products:
        if answers.legalForm not in product.legal_forms:
            continue
        if answers.industry not in product.industries:
            continue
        if answers.businessAgeMonths < product.minimum_business_age_months:
            continue
        if not (product.minimum_principal <= principal <= product.maximum_principal):
            continue
        if not (product.minimum_term_months <= answers.termMonths <= product.maximum_term_months):
            continue

        tier = _match_goal_tier(product, answers)
        if tier is None:
            continue

        calc = calculate_annuity(
            principal=principal,
            annual_rate=product.annual_rate,
            term_months=answers.termMonths,
        )
        reasons = _build_reasons(product, answers, tier)
        formatted_calc = (
            format_money(calc.monthly_payment),
            format_money(calc.total_repayment),
            format_money(calc.total_interest),
        )
        candidates.append(
            (tier, calc.total_repayment, product.id, product, reasons, formatted_calc)
        )

    if not candidates:
        return RecommendationResult(
            items=[],
            unmatchedReasons=_diagnose_unmatched_reasons(products, answers),
            rulesVersion=settings.RULES_VERSION,
            dataVersion=settings.DATA_VERSION,
        )

    # Сортировка: 1) уровень цели (1..3), 2) меньшая общая выплата totalRepayment, 3) id продукта
    candidates.sort(key=lambda item: (item[0], item[1], item[2]))

    result_items: list[RecommendationItem] = []
    for idx, (_, _, _, prod_model, reasons, formatted_calc) in enumerate(candidates, start=1):
        monthly_str, total_rep_str, total_int_str = formatted_calc
        result_items.append(
            RecommendationItem(
                product=Product.from_orm_model(prod_model),
                rank=idx,
                reasons=reasons,
                monthlyPayment=monthly_str,
                totalRepayment=total_rep_str,
                totalInterest=total_int_str,
            )
        )

    return RecommendationResult(
        items=result_items,
        unmatchedReasons=[],
        rulesVersion=settings.RULES_VERSION,
        dataVersion=settings.DATA_VERSION,
    )