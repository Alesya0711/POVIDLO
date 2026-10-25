import { emptyAnswers, validateStep } from '../questionnaire/model.ts';

export interface ProfileValues {
  name: string; email: string; company: string; legalForm: string;
  industry: string; industryDescription: string; businessAgeMonths: string;
}
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
