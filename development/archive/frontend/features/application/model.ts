import { validateCalculator } from '../../../../../src/features/product/model.ts';
import type { DemoProduct } from '../recommendations/fixtures.ts';

export interface ApplicationValues {
  company: string; legalForm: string; email: string; purpose: string;
  principal: string; termMonths: string; comment: string;
}
export type ApplicationErrors = Partial<Record<keyof ApplicationValues, string>>;
export function validateApplication(values: ApplicationValues, product: DemoProduct): ApplicationErrors {
  const errors: ApplicationErrors = {};
  if (!values.company.trim() || values.company.trim().length > 150) errors.company = 'Укажите название компании или имя ИП, до 150 символов.';
  if (!product.legalForms.includes(values.legalForm)) errors.legalForm = 'Выберите правовую форму из списка.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) || values.email.length > 254) errors.email = 'Введите почту в формате name@example.ru.';
  if (!product.purposeCategories.includes(values.purpose)) errors.purpose = 'Выберите цель финансирования.';
  const terms = validateCalculator(values, product);
  if (terms.principal) errors.principal = terms.principal;
  if (terms.termMonths) errors.termMonths = terms.termMonths;
  if (values.comment.length > 500) errors.comment = 'Сократите комментарий до 500 символов.';
  return errors;
}
