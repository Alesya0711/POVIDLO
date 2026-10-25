import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Brand } from '../../../../../src/components/Brand';
import { AssistantEntry } from '../../../../../src/components/Assistant';
import { Mascot } from '../../../../../src/components/Mascot';
import { demoApplication } from '../application-details/fixtures';
import { demoOffer } from '../application-details/offer';
import { OfferAmounts } from '../application-details/OfferPanel';

const width = 'mx-auto max-w-[1120px] px-5 sm:px-8';

export function ContractRoute() {
  const { applicationId } = useParams();
  const [params] = useSearchParams();
  const view = params.get('view') ?? 'offer';
  if (applicationId !== demoApplication.id || !['offer', 'approved'].includes(view)) return <div className="min-h-dvh font-sans text-coffee"><header className={`${width} py-6`}><Brand /></header><main className={`${width} py-12`}><h1 className="text-4xl font-extrabold tracking-[-.025em]">Договор недоступен</h1><p className="mt-5 max-w-xl text-lg text-cocoa">В этом примере договор доступен только для известной заявки с предложением или одобрением.</p><Link to="/cabinet" className="mt-6 inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">К моим заявкам</Link></main></div>;
  return <Contract key={`${applicationId}:${view}`} view={view} />;
}

function Contract({ view }: { view: string }) {
  const [read, setRead] = useState(false);
  const back = `/applications/${demoApplication.id}?view=${view}`;
  return <div className="min-h-dvh font-sans text-coffee">
    <header className="border-b border-espresso/10"><div className={`${width} flex min-h-24 items-center justify-between gap-4`}><Brand /><Link to={back} className="inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">К заявке</Link></div></header>
    <main className={`${width} py-8 sm:py-12`}>
      <p className="text-base font-bold text-forest">Заявка {demoApplication.label} · Версия {demoOffer.contractVersion}</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">Ознакомление с договором</h1>
      <aside className="mt-6 rounded-panel bg-oat p-5 text-base font-semibold"><p className="font-extrabold">Демонстрационный макет</p><p className="mt-1">Здесь показана сводка вымышленных условий, а не юридический текст договора. Документ банка, принятие условий и подписание пока не подключены. Реальных обязательств и денежных операций нет.</p></aside>
      <div className="mt-8 grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
        <article aria-labelledby="contract-terms" className="min-w-0 rounded-panel bg-paper p-5 sm:p-7">
          <p className="text-base font-bold">Пример {demoOffer.contractVersion} · Не подписан</p><h2 id="contract-terms" className="mt-2 text-2xl font-extrabold tracking-[-.012em]">Условия финансирования</h2><p className="mt-4 text-lg text-cocoa">Получатель в примере — {demoApplication.company}, {demoApplication.legalForm}. Цель — покупка оборудования.</p>
          <OfferAmounts />
          <p className="mt-5 text-base font-semibold">Платёж и общий возврат — пример расчёта в браузере по фиксированной ставке без дополнительных комиссий. Последний платёж, даты и полный график банка здесь не сформированы.</p>
          <section aria-labelledby="contract-checklist" className="mt-7 border-t border-espresso/15 pt-6"><h2 id="contract-checklist" className="text-xl font-extrabold">Что проверить в документе банка</h2><ul className="mt-4 list-disc space-y-3 pl-5 text-lg text-cocoa"><li>Сумму, срок, ставку и общую сумму возврата.</li><li>Даты и размер платежей, комиссии и дополнительные условия.</li><li>Реквизиты сторон и соответствие согласованному предложению.</li></ul><p className="mt-4 text-base font-semibold">Эти сведения появятся из документа банка при подключении. Сейчас полный договор нельзя скачать или подписать.</p></section>
        </article>
        <aside aria-labelledby="contract-actions" className="min-w-0 rounded-panel bg-sage p-5 text-forest sm:p-6"><Mascot pose="signing" className="mx-auto mb-4 w-40" /><h2 id="contract-actions" className="text-2xl font-extrabold tracking-[-.012em]">Сначала ознакомимся</h2><p className="mt-3 text-base font-semibold">Сравните сводку с предложением. В этом примере условия на обеих страницах одинаковые.</p>
          <label className="mt-5 flex min-h-12 cursor-pointer items-start gap-3 text-base font-semibold"><input type="checkbox" checked={read} onChange={event => setRead(event.target.checked)} className="mt-1 size-5 shrink-0 accent-forest" /><span>Я просмотрел(а) демонстрационную сводку</span></label>
          <p role="status" className="mt-3 min-h-32 text-base font-semibold">{read ? 'Ознакомление отмечено только на этой странице. Договор не принят и не подписан.' : 'Отметка ознакомления действует только в этом примере и не является подписью.'}</p>
          <button type="button" disabled aria-describedby="contract-sign-status" className="mt-4 inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-control bg-cream px-4 py-3 text-base font-bold text-coffee">Подписать договор</button><p id="contract-sign-status" className="mt-3 text-base font-semibold">Подписание не подключено. Отметка ознакомления не разблокирует эту кнопку.</p>
          <div className="mt-4 rounded-control bg-cream px-3"><AssistantEntry label="Объяснить условия" context={{ screen: 'contract', resourceId: `${demoApplication.id}:${demoOffer.contractVersion}`, label: 'Демонстрационная сводка договора', prompts: ['Какие условия сравнить с предложением?', 'Что входит в пример общего возврата?', 'Чем ознакомление отличается от подписания?'], data: { applicationId: demoApplication.id, offer: demoOffer, documentMode: 'summary-preview', signingAvailable: false } }} /></div>
        </aside>
      </div>
      <Link to={back} className="mt-7 inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">Вернуться к предложению</Link>
    </main>
  </div>;
}
