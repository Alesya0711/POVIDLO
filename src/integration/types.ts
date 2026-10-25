export interface Company {
  inn:string;profileId:string;name:string;legalForm:string;industry:string;businessAgeMonths:number;
  registryStatus?:string;creditHistoryStatus?:string;hasBankRestriction?:boolean;bankRestrictionReason?:string|null;
  revenue:string;operatingExpenses:string;existingMonthlyPayments:string;settlementAccount:string;
  supportingRecords:{id:string;title:string;verificationResult:string;summary:string}[];
  discrepancies?:{field:string;questionnaireValue:string;simulatorValue:string;message:string}[];
}
export interface Offer { id:string;version:number;principal:string;termMonths:number;annualRate:string;monthlyPayment:string;totalRepayment:string;totalInterest:string;comment:string }
export interface Application {id:string;userId:string;inn:string;productId:string;productName:string;principal:string;termMonths:number;purpose:string;annualRate:string;status:string;score:number|null;approvalProbability:number|null;monthlyPayment:string|null;requestedPrincipal:string;requestedTermMonths:number;company:Company;offer:Offer|null;infoRequests:{id:string;message:string;status:string;answer:string|null;createdAt:string}[];version:number;comment:string;contactEmail:string|null;history:{timestamp:string;initiator:string;action:string;description:string}[];createdAt:string;updatedAt:string}
export interface Precheck {status:string;canSubmitStandard:boolean;canRequestOtherTerms:boolean;approvalProbability:number|null;score:number|null;monthlyPayment:string;totalRepayment:string;totalInterest:string;paymentLimit:string;factors:string[];blockReason:string|null}
export interface Contract {applicationId:string;version:string;documentMode:string;offer:Offer;company:Company;canSign:boolean;signed:boolean;notice:string}
export const statusLabels:Record<string,string>={employee_review:'На рассмотрении',info_requested:'Нужны сведения',waiting_acceptance:'Есть предложение',waiting_signing:'Ожидает подписания',bank_rejected:'Отказ банка',client_rejected:'Отклонена клиентом',issued:'Выдача смоделирована'};

export const legalFormLabels: Record<string, string> = { ip: 'ИП', ooo: 'ООО' };
export const registryStatusLabels: Record<string, string> = { active: 'Действует', inactive: 'Регистрация прекращена' };
export const creditHistoryLabels: Record<string, string> = { ok: 'Есть сведения', empty: 'Кредитов не было', source_unavailable: 'Сведения недоступны' };
