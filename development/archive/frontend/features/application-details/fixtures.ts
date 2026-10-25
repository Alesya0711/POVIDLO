export const demoApplication = {
  id: 'demo-application-1', label: 'ДЕМО-001', productId: 'demo-equipment-1',
  company: 'Тестовая мастерская', legalForm: 'ИП', purpose: 'Покупка оборудования',
  principal: '1500000.50', termMonths: 30,
  request: {
    id: 'demo-request-1', title: 'Уточните, какое оборудование планируете приобрести',
    description: 'В этом примере сотрудник просит описать назначение оборудования, его примерную стоимость и то, как оно поможет бизнесу. Достаточно короткого текстового пояснения.',
  },
} as const;
export const detailStates = {
  received: { label: 'Получена', title: 'Первый шаг сделан', description: 'В этом примере заявка получена. Следующий этап — рассмотрение сведений о бизнесе.', currentStep: 1 },
  review: { label: 'На рассмотрении', title: 'Разбираемся в деталях', description: 'В этом примере сотрудник изучает заявку. Если понадобятся уточнения, они появятся здесь.', currentStep: 2 },
  needs_info: { label: 'Нужны сведения', title: 'Нужно немного подробностей', description: 'В этом примере сотрудник запросил уточнение. Посмотрите вопрос и подготовьте ответ ниже.', currentStep: 2 },
  offer: { label: 'Есть предложение', title: 'Посмотрите предложенные условия', description: 'В этом примере банк предлагает другие сумму и срок. Сравните их с запросом перед ознакомлением с договором.', currentStep: 3 },
  approved: { label: 'Одобрено', title: 'Решение в примере — положительное', description: 'Это демонстрационный статус, а не одобрение настоящей заявки. Договор ещё не подписан, выдачи средств нет.', currentStep: 3 },
  declined: { label: 'Отказ', title: 'В этом примере — отказ', description: 'Синтетический результат для проверки интерфейса. Он не является оценкой вашей компании или решением по вашим сведениям.', currentStep: 3 },
} as const;
export type DetailState = keyof typeof detailStates;
export function resolveDetailState(value: string | null): DetailState {
  return value && Object.hasOwn(detailStates, value) ? value as DetailState : 'needs_info';
}
