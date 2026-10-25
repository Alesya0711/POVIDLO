export interface DemoProduct {
  id: string; name: string; purposeCategories: string[]; industries: string[];
  legalForms: string[]; minimumBusinessAgeMonths: number;
  minimumPrincipal: string; maximumPrincipal: string;
  minimumTermMonths: number; maximumTermMonths: number; annualRate: string;
  specificPurposes?: string[]; isUniversal?: boolean;
}
export interface DemoItem {
  product: DemoProduct; rank: number; reasons: string[];
  monthlyPayment: string; totalRepayment: string; totalInterest: string;
}
export interface RecommendationResult {
  items: DemoItem[]; unmatchedReasons: string[]; rulesVersion: string; dataVersion: string;
}
export const exampleTerms = { principal: '1250000.50', termMonths: 24 } as const;
const quotes = [{"rate": "0.24", "payment": "66088.90", "total": "1586133.60", "interest": "336133.10"}, {"rate": "0.26", "payment": "67343.24", "total": "1616237.76", "interest": "366237.26"}, {"rate": "0.28", "payment": "68610.65", "total": "1646655.60", "interest": "396655.10"}];
const goals: Record<string, { names: string[]; reason: string }> = {
  working_capital: { names: ['Капи Оборот', 'Оборот с запасом', 'Универсальный'], reason: 'Пример финансирования закупок и текущих расходов' },
  equipment: { names: ['Капи Оснащение', 'Техника для дела', 'Универсальный'], reason: 'Пример финансирования техники и оборудования' },
  growth: { names: ['Капи Развитие', 'Новый горизонт', 'Универсальный'], reason: 'Пример финансирования расширения бизнеса' },
};
export function getDemoResponse(purpose: string): RecommendationResult {
  const goal = goals[purpose];
  if (!goal) return { items: [], unmatchedReasons: ['Для этой цели нет демонстрационных примеров.'], rulesVersion: 'ui-fixture-v1', dataVersion: 'ui-fixture-v1' };
  return {
    items: goal.names.map((name, index) => ({
      product: {
        id: `demo-${purpose}-${index + 1}`, name,
        purposeCategories: index === 2 ? ['working_capital', 'equipment', 'growth'] : [purpose],
        specificPurposes: [], isUniversal: index === 2,
        industries: ['trade', 'services', 'manufacturing', 'other'], legalForms: ['ip', 'ooo'],
        minimumBusinessAgeMonths: index === 0 ? 12 : 6,
        minimumPrincipal: '100000.00', maximumPrincipal: index === 1 ? '10000000.00' : '5000000.00',
        minimumTermMonths: 6, maximumTermMonths: index === 1 ? 60 : 36, annualRate: quotes[index].rate,
      },
      rank: index + 1,
      reasons: [index === 2 ? 'Универсальный демонстрационный продукт' : goal.reason, 'Одинаковые сумма и срок для сравнения стоимости', 'Позиция в списке задана демонстрационными данными'],
      monthlyPayment: quotes[index].payment, totalRepayment: quotes[index].total, totalInterest: quotes[index].interest,
    })),
    unmatchedReasons: [], rulesVersion: 'ui-fixture-v1', dataVersion: 'ui-fixture-v1',
  };
}
export function findDemoProduct(id: string): DemoProduct | null {
  for (const purpose of Object.keys(goals)) {
    const item = getDemoResponse(purpose).items.find(candidate => candidate.product.id === id);
    if (item) return item.product;
  }
  return null;
}
export const money = (value: string) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
export const rate = (value: string) => new Intl.NumberFormat('ru-RU', { style: 'percent', maximumFractionDigits: 2 }).format(Number(value));
