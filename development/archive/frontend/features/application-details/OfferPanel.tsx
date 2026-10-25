import { Link } from 'react-router';
import { AssistantEntry } from '../../../../../src/components/Assistant';
import { money, rate } from '../recommendations/fixtures';
import { demoApplication } from './fixtures';
import { demoOffer } from './offer';

export function OfferAmounts() {
  return <dl className="mt-5 grid gap-5 text-base sm:grid-cols-2"><div><dt className="font-semibold">Сумма по предложению</dt><dd className="mt-1 break-words text-xl font-extrabold tabular-nums">{money(demoOffer.principal)}</dd></div><div><dt className="font-semibold">Срок</dt><dd className="mt-1 text-xl font-extrabold">{demoOffer.termMonths} мес.</dd></div><div><dt className="font-semibold">Фиксированная ставка</dt><dd className="mt-1 text-xl font-extrabold">{rate(demoOffer.annualRate)} годовых</dd></div><div><dt className="font-semibold">Примерный платёж в месяц</dt><dd className="mt-1 break-words text-xl font-extrabold tabular-nums">{money(demoOffer.preview.monthlyPayment)}</dd></div><div><dt className="font-semibold">Примерный общий возврат</dt><dd className="mt-1 break-words text-lg font-bold tabular-nums">{money(demoOffer.preview.totalRepayment)}</dd></div><div><dt className="font-semibold">Из них проценты</dt><dd className="mt-1 break-words text-lg font-bold tabular-nums">{money(demoOffer.preview.totalInterest)}</dd></div></dl>;
}

export function OfferPanel({ approved }: { approved: boolean }) {
  return <section aria-labelledby="bank-offer" className="rounded-panel bg-paper p-5 sm:p-7"><p className="text-base font-bold text-forest">Предложение · Демопример</p><h2 id="bank-offer" className="mt-2 text-2xl font-extrabold tracking-[-.012em]">Посмотрите, что изменилось</h2><p className="mt-3 text-lg text-cocoa">Условия этого примера отличаются от запроса. До принятия важно сравнить сумму, срок и общий возврат.</p>
    <div className="mt-5 rounded-control bg-oat p-4 text-base"><h3 className="font-extrabold">В исходной заявке</h3><p className="mt-1 font-semibold">{money(demoApplication.principal)} на {demoApplication.termMonths} месяцев.</p></div>
    <OfferAmounts />
    <p className="mt-5 text-base font-semibold">Фиксированные демонстрационные условия. Платёж рассчитан в браузере без дополнительных комиссий, по тем же правилам округления, что калькулятор. Это не серверный расчёт и не настоящее предложение банка.</p>
    <AssistantEntry label="Разобрать предложение" context={{ screen: 'application-details', resourceId: demoApplication.id, field: demoOffer.id, label: 'Демонстрационное предложение по заявке', prompts: ['Что изменилось по сравнению с запросом?', 'Чем платёж отличается от общего возврата?', 'Что проверить перед ознакомлением с договором?'], data: { applicationId: demoApplication.id, offer: demoOffer, original: { principal: demoApplication.principal, termMonths: demoApplication.termMonths }, mode: 'offer-preview' } }} />
    <div className="mt-5 flex flex-wrap gap-3"><Link to={`/applications/${demoApplication.id}/contract?view=${approved ? 'approved' : 'offer'}`} className="inline-flex min-h-12 items-center justify-center rounded-control bg-forest px-5 py-3 text-base font-bold text-cream transition-transform active:scale-95 motion-reduce:transform-none">Посмотреть договор</Link><button type="button" disabled aria-describedby="offer-action-status" className="inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-control bg-oat px-5 py-3 text-base font-bold text-coffee">Принять условия</button></div>
    <p id="offer-action-status" className="mt-4 text-base font-semibold">Принятие условий и подписание пока не подключены. Просмотр договора ничего не подтверждает и не меняет статус заявки.</p>
  </section>;
}
