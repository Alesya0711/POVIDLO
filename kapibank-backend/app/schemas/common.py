from decimal import Decimal, ROUND_HALF_UP
from typing import Annotated
from pydantic import AfterValidator, BaseModel, ConfigDict, Field


def _ensure_not_zero_money(value: str) -> str:
    if value == "0.00":
        raise ValueError("Запрошенная сумма должна быть строго больше нуля")
    return value


MoneyStr = Annotated[
    str,
    Field(
        pattern=r"^(0|[1-9][0-9]*)\.[0-9]{2}$",
        description="Неотрицательная сумма в рублях, десятичная строка с двумя знаками, например 1250000.00.",
    ),
]

PositiveMoneyStr = Annotated[
    str,
    Field(
        pattern=r"^(0|[1-9][0-9]*)\.[0-9]{2}$",
        description="Запрошенная сумма в рублях, строго больше нуля.",
    ),
    AfterValidator(_ensure_not_zero_money),
]

RateStr = Annotated[
    str,
    Field(
        pattern=r"^(0|[1-9][0-9]*)(\.[0-9]+)?$",
        description="Доля единицы: 0.24 означает 24% годовых.",
    ),
]

SpecificPurposeCode = Annotated[
    str,
    Field(pattern=r"^[a-z][a-z0-9_]{0,63}$"),
]


def format_money(value: Decimal) -> str:
    quantized = value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return f"{quantized:.2f}"


def format_rate(value: Decimal) -> str:
    normalized = value.normalize()
    s = format(normalized, "f")
    if "." not in s:
        return f"{s}.00"
    integer_part, frac_part = s.split(".", 1)
    if len(frac_part) == 1:
        return f"{integer_part}.{frac_part}0"
    return s


class FieldErrorItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    field: str
    message: str


class ApiError(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    message: str
    fieldErrors: list[FieldErrorItem]
    requestId: str
