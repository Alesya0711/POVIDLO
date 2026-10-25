import { emptyAnswers, validateStep } from '../../../../../src/features/questionnaire/model.ts';

export interface ProfileValues {
  name: string; email: string; company: string; legalForm: string;
  industry: string; industryDescription: string; businessAgeMonths: string;
}
export const demoProfile: ProfileValues = {
  name: 'Алексей', email: 'demo@example.ru', company: 'Тестовая мастерская',
  legalForm: 'ip', industry: 'manufacturing', industryDescription: '', businessAgeMonths: '24',
};
export type ProfileErrors = Partial<Record<keyof ProfileValues, string>>;
export function validateProfile(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!values.name.trim() || values.name.trim().length > 100) errors.name = 'Укажите имя, до 100 символов.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) || values.email.length > 254) errors.email = 'Введите почту в формате name@example.ru.';
  if (!values.company.trim() || values.company.trim().length > 150) errors.company = 'Укажите название компании или имя ИП, до 150 символов.';
  const answers = { ...emptyAnswers, ...values };
  const industryIssue = validateStep(0, answers);
  if (industryIssue) errors[values.industry === 'other' ? 'industryDescription' : 'industry'] = industryIssue;
  const formIssue = validateStep(1, answers);
  if (formIssue) errors.legalForm = formIssue;
  const ageIssue = validateStep(2, answers);
  if (ageIssue) errors.businessAgeMonths = ageIssue;
  return errors;
}
export function normalizeProfile(values: ProfileValues): ProfileValues {
  return { ...values, name: values.name.trim(), email: values.email.trim(), company: values.company.trim(), industryDescription: values.industry === 'other' ? values.industryDescription.trim() : '', businessAgeMonths: String(Number(values.businessAgeMonths)) };
}
