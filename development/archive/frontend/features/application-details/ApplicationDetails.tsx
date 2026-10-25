import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Brand } from '../../../../../src/components/Brand';
import { AssistantEntry } from '../../../../../src/components/Assistant';
import { Mascot } from '../../../../../src/components/Mascot';
import { findDemoProduct, money } from '../recommendations/fixtures';
import { OfferPanel } from './OfferPanel';
import { demoApplication, detailStates, resolveDetailState } from './fixtures';
import type { DetailState } from './fixtures';

const width = 'mx-auto max-w-[1120px] px-5 sm:px-8';
const action = 'inline-flex min-h-12 items-center justify-center rounded-control px-5 py-3 text-base font-bold transition-transform active:scale-95 motion-reduce:transform-none';

export function ApplicationDetailsRoute() {
  const { applicationId } = useParams();
  const [params, setParams] = useSearchParams();
  const state = resolveDetailState(params.get('view'));
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [prepared, setPrepared] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const previouslyPrepared = useRef(false);
  useEffect(() => {
    if (prepared) preview.current?.focus();
    else if (previouslyPrepared.current) field.current?.focus();
    previouslyPrepared.current = prepared;
  }, [prepared]);
  // Route changes must not show a response from a different resource.
  useEffect(() => { setAnswer(''); setError(''); setPrepared(false); }, [applicationId]);

  const header = <header className="border-b border-espresso/10"><div className={`${width} flex min-h-24 items-center justify-between gap-4`}><Brand /><Link to="/cabinet" className="inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">К заявкам</Link></div></header>;
  if (applicationId !== demoApplication.id) return <div className="min-h-dvh font-sans text-coffee">{header}<main className={`${width} py-12`}><p className="text-base font-bold text-forest">Заявка недоступна</p><h1 className="mt-3 text-4xl font-extrabold tracking-[-.025em]">Такой заявки в примере нет</h1><p className="mt-5 max-w-xl text-lg text-cocoa">Сейчас доступна одна демонстрационная карточка. Получение ваших заявок пока не подключено.</p><Link to="/cabinet" className={`${action} mt-6 bg-forest text-cream`}>Вернуться к заявкам</Link></main></div>;
  const application = demoApplication;
  const product = findDemoProduct(application.productId)!;
  const status = detailStates[state];
  const hasOffer = state === 'offer' || state === 'approved';
  const timeline = ['Получена', 'Рассмотрение', 'Решение'];
  function prepare() {
    if (!answer.trim()) { setError('Опишите, какое оборудование нужно бизнесу.'); field.current?.focus(); return; }
    if (answer.length > 1000) { setError('Сократите ответ до 1000 символов.'); field.current?.focus(); return; }
    setError(''); setPrepared(true);
  }

  return <div className="min-h-dvh font-sans text-coffee">{header}
    <main className={`${width} py-8 sm:py-12`}>
      <p className="text-base font-bold text-forest">Личный кабинет · Демопример</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">Заявка {application.label}</h1>
      <aside className="mt-6 rounded-panel bg-oat p-5 text-base font-semibold"><p className="font-extrabold">Пример карточки заявки</p><p className="mt-1">Это вымышленные сведения, не результат заполнения формы. Статусы, запрос и история заданы для демонстрации. Получение заявки и отправка ответа пока не подключены.</p>
        <div className="mt-4"><label htmlFor="application-demo-state" className="block text-base font-bold">Пример состояния</label><select id="application-demo-state" value={state} onChange={event => { const next = new URLSearchParams(params); next.set('view', event.target.value as DetailState); setParams(next, { preventScrollReset: true }); }} className="mt-2 min-h-12 w-full rounded-control border border-coffee/50 bg-paper px-3 text-base text-espresso sm:max-w-xs">{Object.entries(detailStates).map(([value, item]) => <option value={value} key={value}>{item.label}</option>)}</select></div>
      </aside>
      <section aria-live="polite" aria-atomic="true" aria-labelledby="application-status" className="mt-7 rounded-panel bg-sage p-5 text-forest sm:p-7"><p className="text-base font-bold">{status.label}</p><h2 id="application-status" className="mt-2 text-3xl font-extrabold leading-tight tracking-[-.025em]">{status.title}</h2><p className="mt-3 max-w-2xl text-lg">{status.description}</p></section>
      <div className="mt-8 grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {state === 'needs_info' && <section aria-labelledby="bank-request" className="rounded-panel bg-paper p-5 sm:p-7"><p className="text-base font-bold text-forest">Запрос сведений · Демопример</p><h2 id="bank-request" className="mt-2 text-2xl font-extrabold leading-tight tracking-[-.012em]">{application.request.title}</h2><p className="mt-4 text-lg text-cocoa">{application.request.description}</p>
            <div className="mt-3"><AssistantEntry label="Разобраться в запросе" context={{ screen: 'application-details', resourceId: application.id, field: application.request.id, label: 'Запрос по заявке ДЕМО-001', prompts: ['Что нужно уточнить в ответе?', 'Как описать назначение оборудования?', 'Что проверить перед отправкой ответа?'], data: { mode: 'ui-fixture-v1', applicationId: application.id, status: state, request: application.request, productId: application.productId } }} /></div>
            {prepared ? <div ref={preview} tabIndex={-1} className="mt-5 rounded-control bg-oat p-4"><h3 className="text-lg font-extrabold">Ваш ответ для проверки</h3><p className="mt-3 whitespace-pre-wrap break-words text-lg [overflow-wrap:anywhere]">{answer.trim()}</p><p id="response-status" className="mt-4 text-base font-semibold">Ответ подготовлен только на этой странице. Он не отправлен; статус заявки не изменился.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setPrepared(false)} className={`${action} bg-paper text-coffee`}>Изменить ответ</button><button type="button" disabled aria-describedby="response-status" className={`${action} cursor-not-allowed bg-paper text-coffee`}>Отправить ответ</button></div></div> : <form className="mt-5" onSubmit={event => { event.preventDefault(); prepare(); }} noValidate><label htmlFor="application-response" className="block text-base font-bold">Пояснение для сотрудника</label><textarea ref={field} id="application-response" maxLength={1000} rows={5} value={answer} onChange={event => { setAnswer(event.target.value); setError(''); }} aria-invalid={Boolean(error)} aria-describedby={`response-hint${error ? ' response-error' : ''}`} className="mt-2 w-full resize-y rounded-control border border-coffee/50 bg-paper p-4 text-lg text-espresso" /><p id="response-hint" className="mt-2 text-base font-semibold">До 1000 символов. Используйте вымышленные данные. Текст хранится до ухода со страницы или обновления.</p>{error && <p id="response-error" className="mt-2 text-base font-bold">{error}</p>}<button type="submit" className={`${action} mt-5 w-full bg-forest text-cream sm:w-auto`}>Проверить ответ</button></form>}
          </section>}
          {hasOffer && <OfferPanel approved={state === 'approved'} />}
          {state === 'declined' && <section aria-labelledby="decline-details" className="rounded-panel bg-paper p-5 sm:p-7"><h2 id="decline-details" className="text-2xl font-extrabold">Причина в демопримере</h2><p className="mt-4 text-lg text-cocoa">В этом сценарии запрос не соответствует условиям выбранного продукта. Причина задана для демонстрации, она не рассчитана по вашим ответам.</p><p className="mt-4 text-base font-semibold">Можно вернуться к подбору и изучить другие варианты. Новый подбор сам по себе не гарантирует одобрение.</p><Link to="/select" className={`${action} mt-5 bg-forest text-cream`}>Вернуться к подбору</Link></section>}
          <section aria-labelledby="timeline-title" className={state === 'received' || state === 'review' ? '' : 'mt-8'}><h2 id="timeline-title" className="text-2xl font-extrabold tracking-[-.012em]">Путь заявки</h2><p className="mt-2 text-base font-semibold">Пример этапов, без обещания сроков и одобрения.</p><ol className="mt-5 space-y-5">{timeline.map((label, index) => { const step = index + 1; const current = step === status.currentStep; return <li key={label} aria-current={current ? 'step' : undefined} className="flex items-start gap-4"><span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${step <= status.currentStep ? 'bg-forest text-cream' : 'bg-oat text-coffee'}`}>{step < status.currentStep ? '✓' : step}</span><div><h3 className="text-lg font-extrabold">{label}</h3><p className="text-base font-semibold">{current ? state === 'needs_info' ? 'Текущий этап · ждём уточнение в этом примере' : 'Текущий этап в этом примере' : step < status.currentStep ? 'Пройдено в этом примере' : 'Следующий этап'}</p></div></li>; })}</ol></section>
          {state !== 'needs_info' && !hasOffer && <div className="mt-5"><AssistantEntry label="Обсудить этап заявки" context={{ screen: 'application-details', resourceId: application.id, field: 'status', label: `Этап заявки: ${status.label}`, prompts: ['Что происходит на этом этапе?', 'Чем рассмотрение отличается от одобрения?', 'Где появятся запросы сведений?'], data: { applicationId: application.id, status: state, mode: 'ui-fixture-v1' } }} /></div>}
        </div>
        <aside aria-labelledby="application-summary" className="min-w-0 rounded-panel bg-paper p-5 sm:p-6"><Mascot pose={state === 'approved' ? 'savings' : state === 'needs_info' ? 'review' : state === 'offer' ? 'compare' : 'thinking'} className="mx-auto mb-4 w-36" /><h2 id="application-summary" className="text-xl font-extrabold">Параметры заявки</h2><dl className="mt-5 space-y-4 text-base"><div><dt className="font-semibold">Продукт</dt><dd className="mt-1 text-lg font-bold">{product.name}</dd></div><div><dt className="font-semibold">Сумма</dt><dd className="mt-1 break-words text-lg font-bold tabular-nums">{money(application.principal)}</dd></div><div><dt className="font-semibold">Срок</dt><dd className="mt-1 text-lg font-bold">{application.termMonths} месяцев</dd></div><div><dt className="font-semibold">Компания</dt><dd className="mt-1 break-words font-bold">{application.company} · {application.legalForm}</dd></div><div><dt className="font-semibold">Цель</dt><dd className="mt-1 font-bold">{application.purpose}</dd></div></dl><p className="mt-5 text-base font-semibold">{hasOffer ? 'Это исходный запрос. Предлагаемые условия показаны отдельно и отличаются от него.' : state === 'declined' ? 'Это исходный запрос. В сценарии отказа предложения и договора нет.' : 'Это параметры запроса. Итогового предложения банка и договора пока нет.'}</p><Link to={`/products/${product.id}`} className="mt-3 inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">Посмотреть продукт</Link></aside>
      </div>
    </main>
  </div>;
}
