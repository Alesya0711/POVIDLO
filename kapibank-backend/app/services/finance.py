from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP, localcontext


@dataclass(frozen=True)
class AnnuityCalculation:
    monthly_payment: Decimal
    total_repayment: Decimal
    total_interest: Decimal


def round_money(value: Decimal) -> Decimal:
    """Арифметическое округление до копеек (половина вверх)."""
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_annuity(
    principal: Decimal,
    annual_rate: Decimal,
    term_months: int,
) -> AnnuityCalculation:
    """
    Расчёт аннуитетного платежа без промежуточных округлений:
    monthly_rate = annual_rate / 12
    payment = principal * monthly_rate / (1 - (1 + monthly_rate)^(-months))
    """
    months_dec = Decimal(term_months)

    if annual_rate == Decimal("0"):
        monthly_payment = round_money(principal / months_dec)
    else:
        with localcontext() as ctx:
            ctx.prec = 50
            monthly_rate = annual_rate / Decimal(12)
            discount_factor = (Decimal(1) + monthly_rate) ** (-term_months)
            raw_payment = (principal * monthly_rate) / (Decimal(1) - discount_factor)
            monthly_payment = round_money(raw_payment)

    total_repayment = round_money(monthly_payment * months_dec)
    total_interest = round_money(total_repayment - principal)

    return AnnuityCalculation(
        monthly_payment=monthly_payment,
        total_repayment=total_repayment,
        total_interest=total_interest,
    )