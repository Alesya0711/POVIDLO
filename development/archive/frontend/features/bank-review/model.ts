import Decimal from 'decimal.js';
import { normalizeMoney } from '../../../../../src/features/questionnaire/model.ts';
import { calculatePreview } from '../../../../../src/features/product/model.ts';

export interface DecisionDraft { outcome: string; principal: string; termMonths: string; ratePercent: string; reason: string }
export type DecisionErrors = Partial<Record<keyof DecisionDraft, string>>;
export function annualRateFromPercent(value: string): string | null {
  const raw = value.trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(raw)) return null;
  const percent = new Decimal(raw);
  return percent.lte(100) ? percent.div(100).toFixed() : null;
}
export function validateDecision(draft: DecisionDraft): DecisionErrors {
  const errors: DecisionErrors = {};
  if (!['offer', 'approve', 'decline'].includes(draft.outcome)) errors.outcome = 'Выберите вариант решения.';
  if (!draft.reason.trim() || draft.reason.length > 1000) errors.reason = 'Укажите обоснование, до 1000 символов.';
  if (draft.outcome === 'offer' || draft.outcome === 'approve') {
    if (!normalizeMoney(draft.principal)) errors.principal = 'Укажите положительную сумму, не более двух знаков после запятой.';
    if (!/^\d+$/.test(draft.termMonths.trim()) || !Number.isSafeInteger(Number(draft.termMonths)) || Number(draft.termMonths) < 1 || Number(draft.termMonths) > 600) errors.termMonths = 'Укажите целое число месяцев от 1 до 600.';
    if (annualRateFromPercent(draft.ratePercent) === null) errors.ratePercent = 'Укажите ставку от 0 до 100%, до двух знаков после запятой.';
  }
  return errors;
}
export function previewDecision(draft: DecisionDraft) {
  if (Object.keys(validateDecision(draft)).length || draft.outcome === 'decline') return null;
  try {
    const result = calculatePreview(draft.principal, Number(draft.termMonths), annualRateFromPercent(draft.ratePercent)!);
    return new Decimal(result.monthlyPayment).lte(0) || new Decimal(result.totalInterest).isNegative() ? null : result;
  }
  catch { return null; }
}
