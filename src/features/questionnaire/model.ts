export const STORAGE_KEY = 'kapibank.questionnaire.v1';
export const steps = ['Сфера бизнеса', 'Правовая форма', 'Возраст бизнеса', 'Цель', 'Сумма', 'Срок'] as const;
export const industries = [
  { value: 'trade', label: 'Торговля', description: 'Магазины, опт и продажи онлайн', icon: 'shop' },
  { value: 'services', label: 'Услуги', description: 'От студии и кафе до консалтинга', icon: 'cup' },
  { value: 'manufacturing', label: 'Производство', description: 'Мастерские, цеха и изготовление', icon: 'factory' },
  { value: 'other', label: 'Другая сфера', description: 'Расскажите, чем занимаетесь', icon: 'dots' },
] as const;
export const purposes = [
  { value: 'working_capital', label: 'Оборотные средства', description: 'Закупки, поставщики, текущие расходы', icon: 'shop' },
  { value: 'equipment', label: 'Покупка оборудования', description: 'Техника, инструменты и оснащение', icon: 'factory' },
  { value: 'growth', label: 'Развитие бизнеса', description: 'Новая точка или новое направление', icon: 'growth' },
] as const;

export interface Answers {
  industry: string;
  industryDescription: string;
  legalForm: string;
  businessAgeMonths: string;
  purpose: string;
  principal: string;
  termMonths: string;
}
export interface Draft { version: 1; step: number; answers: Answers }
export const emptyAnswers: Answers = { industry: '', industryDescription: '', legalForm: '', businessAgeMonths: '', purpose: '', principal: '', termMonths: '' };
export const emptyDraft = (): Draft => ({ version: 1, step: 0, answers: { ...emptyAnswers } });

export function isAnswers(value: unknown): value is Answers {
  if (!value || typeof value !== 'object') return false;
  return Object.keys(emptyAnswers).every(key => {
    const answer = (value as Record<string, unknown>)[key];
    return typeof answer === 'string' && answer.length <= 200;
  });
}

export function normalizeMoney(raw: string): string | null {
  const value = raw.replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const result = `${whole.replace(/^0+(?=\d)/, '')}.${fraction.padEnd(2, '0')}`;
  return result === '0.00' ? null : result;
}

function integerWithin(value: string, min: number, max: number) {
  return /^\d+$/.test(value.trim()) && Number.isSafeInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
}

export function validateStep(step: number, answers: Answers): string | null {
  switch (step) {
    case 0:
      if (!industries.some(item => item.value === answers.industry)) return 'Выберите сферу деятельности.';
      if (answers.industry === 'other' && !answers.industryDescription.trim()) return 'Коротко расскажите, чем занимается ваш бизнес.';
      if (answers.industryDescription.trim().length > 200) return 'Сократите описание до 200 символов.';
      return null;
    case 1: return ['ip', 'ooo'].includes(answers.legalForm) ? null : 'Выберите ИП или ООО.';
    case 2: return integerWithin(answers.businessAgeMonths, 0, 1200) ? null : 'Укажите возраст бизнеса в полных месяцах: от 0 до 1 200.';
    case 3: return purposes.some(item => item.value === answers.purpose) ? null : 'Выберите цель финансирования.';
    case 4: return normalizeMoney(answers.principal) ? null : 'Введите сумму больше нуля, до 12 цифр перед запятой и не более двух после. Например, 1 250 000.';
    case 5: return integerWithin(answers.termMonths, 1, 600) ? null : 'Укажите срок от 1 до 600 целых месяцев.';
    default: return 'Не удалось определить шаг. Вернитесь к началу опроса.';
  }
}

export function loadDraft(): { draft: Draft; notice: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { draft: emptyDraft(), notice: '' };
    const candidate = JSON.parse(raw);
    if (!candidate || candidate.version !== 1 || !Number.isInteger(candidate.step) || candidate.step < 0 || candidate.step > 6 || !candidate.answers) throw new Error('Invalid draft');
    const answers = Object.fromEntries(Object.keys(emptyAnswers).map(key => {
      const value = candidate.answers[key];
      if (typeof value !== 'string' || value.length > 200) throw new Error('Invalid answer');
      return [key, value];
    })) as unknown as Answers;
    const firstInvalid = steps.findIndex((_, index) => validateStep(index, answers));
    return { draft: { version: 1, step: firstInvalid >= 0 ? Math.min(candidate.step, firstInvalid) : candidate.step, answers }, notice: Object.values(answers).some(value => value.trim()) ? 'Продолжим с того места, где вы остановились.' : '' };
  } catch {
    return { draft: emptyDraft(), notice: 'Не удалось восстановить ответы. Можно пройти опрос заново; сохранение зависит от настроек браузера.' };
  }
}

export function toRequest(answers: Answers) {
  if (steps.some((_, index) => validateStep(index, answers))) return null;
  return { industry: answers.industry, legalForm: answers.legalForm, businessAgeMonths: Number(answers.businessAgeMonths), purpose: answers.purpose, principal: normalizeMoney(answers.principal)!, termMonths: Number(answers.termMonths), ...(answers.industry === 'other' ? { industryDescription: answers.industryDescription.trim() } : {}) };
}

export function summaryValues(answers: Answers) {
  const industry = industries.find(item => item.value === answers.industry)?.label ?? 'Не выбрано';
  return [
    answers.industry === 'other' && answers.industryDescription ? answers.industryDescription.trim() : industry,
    answers.legalForm === 'ip' ? 'ИП' : answers.legalForm === 'ooo' ? 'ООО' : 'Не выбрано',
    answers.businessAgeMonths === '' ? 'Не указано' : `${Number(answers.businessAgeMonths)} мес.`,
    purposes.find(item => item.value === answers.purpose)?.label ?? 'Не выбрано',
    normalizeMoney(answers.principal) ? `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(normalizeMoney(answers.principal)))} ₽` : 'Не указано',
    answers.termMonths === '' ? 'Не указано' : `${Number(answers.termMonths)} мес.`,
  ];
}
