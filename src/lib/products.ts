export interface Product {
  id: string; name: string; purposeCategories: string[]; industries: string[];
  legalForms: string[]; minimumBusinessAgeMonths: number;
  minimumPrincipal: string; maximumPrincipal: string;
  minimumTermMonths: number; maximumTermMonths: number; annualRate: string;
  specificPurposes?: string[]; isUniversal?: boolean;
}
export interface RecommendationItem {
  product: Product; rank: number; reasons: string[];
  monthlyPayment: string; totalRepayment: string; totalInterest: string;
}
export interface RecommendationResult {
  items: RecommendationItem[]; unmatchedReasons: string[]; rulesVersion: string; dataVersion: string;
}
export const defaultTerms = { principal: '1250000.50', termMonths: 24 } as const;
export const money = (value: string) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
export const rate = (value: string) => new Intl.NumberFormat('ru-RU', { style: 'percent', maximumFractionDigits: 2 }).format(Number(value));
