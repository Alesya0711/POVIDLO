import Decimal from 'decimal.js';
import { normalizeMoney } from '../questionnaire/model.ts';
import type { Product } from '../../lib/products.ts';

const D = Decimal.clone({ precision: 48, rounding: Decimal.ROUND_HALF_UP });
export const CALCULATOR_PREFIX = 'kapibank.product-calculator.v1:';
export interface CalculatorValues { principal: string; termMonths: string }
export interface Preview { monthlyPayment: string; totalRepayment: string; totalInterest: string }

export function validateCalculator(values: CalculatorValues, product: Product) {
  const principal = normalizeMoney(values.principal);
  const issues = { principal: '', termMonths: '' };
  if (!principal) issues.principal = 'Укажите сумму больше нуля, не более двух знаков после запятой.';
  else if (new D(principal).lt(product.minimumPrincipal) || new D(principal).gt(product.maximumPrincipal)) issues.principal = 'Сумма должна быть в пределах этого продукта.';
  if (!/^\d+$/.test(values.termMonths.trim()) || !Number.isSafeInteger(Number(values.termMonths)) || Number(values.termMonths) < product.minimumTermMonths || Number(values.termMonths) > product.maximumTermMonths) issues.termMonths = `Укажите целый срок от ${product.minimumTermMonths} до ${product.maximumTermMonths} месяцев.`;
  return issues;
}

/** Illustrative browser preview only. The server remains the authority for offers. */
export function calculatePreview(principal: string, months: number, annualRate: string): Preview {
  const normalized = normalizeMoney(principal);
  if (!normalized || !Number.isSafeInteger(months) || months < 1 || months > 600 || !/^(0|[1-9]\d*)(\.\d+)?$/.test(annualRate)) throw new RangeError('Invalid preview inputs');
  const p = new D(normalized);
  const r = new D(annualRate).div(12);
  const payment = (r.isZero() ? p.div(months) : p.times(r).div(new D(1).minus(new D(1).plus(r).pow(-months)))).toDecimalPlaces(2, D.ROUND_HALF_UP);
  if (!payment.isFinite() || payment.isNegative()) throw new RangeError('Preview unavailable');
  const total = payment.times(months);
  return { monthlyPayment: payment.toFixed(2), totalRepayment: total.toFixed(2), totalInterest: total.minus(p).toFixed(2) };
}

export function loadCalculator(productId: string, fallback: CalculatorValues, baseKey: string) {
  try {
    const raw = sessionStorage.getItem(CALCULATOR_PREFIX + productId);
    if (!raw) return { values: fallback, restored: false, notice: '' };
    const saved = JSON.parse(raw);
    if (saved?.version !== 1 || typeof saved.principal !== 'string' || saved.principal.length > 30 || typeof saved.termMonths !== 'string' || saved.termMonths.length > 6) throw new Error('Invalid calculator draft');
    if (saved.baseKey !== baseKey) return { values: fallback, restored: false, notice: '' };
    return { values: { principal: saved.principal, termMonths: saved.termMonths }, restored: true, notice: '' };
  } catch { return { values: fallback, restored: false, notice: 'Не удалось восстановить расчёт. Можно продолжить с текущими значениями.' }; }
}
