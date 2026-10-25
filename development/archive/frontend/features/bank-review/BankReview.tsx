import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { Brand } from '../../../../../src/components/Brand';
import { detailStates } from '../application-details/fixtures';
import { queueItems } from '../bank-queue/fixtures';
import type { QueueItem } from '../bank-queue/fixtures';
import { money } from '../recommendations/fixtures';
import { normalizeMoney } from '../../../../../src/features/questionnaire/model';
import { previewDecision, validateDecision } from './model';
import type { DecisionDraft, DecisionErrors } from './model';

const width = 'mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12';
const action = 'inline-flex min-h-12 items-center justify-center rounded-control px-5 py-3 text-base font-bold transition-transform active:scale-95 motion-reduce:transform-none';
const input = 'mt-2 min-h-14 w-full rounded-control border border-coffee/50 bg-paper px-4 py-3 text-lg text-espresso';
const outcomes = { offer: 'Предложить условия', approve: 'Одобрить', decline: 'Отказать' };

export function BankReviewRoute() {
  const { applicationId } = useParams();
  const { state } = useLocation();
  const origin = state as { queueSearch?: unknown; queueStatus?: unknown } | null;
  const query = new URLSearchParams();
  if (typeof origin?.queueSearch === 'string' && origin.queueSearch) query.set('search', origin.queueSearch.slice(0, 100));
  if (typeof origin?.queueStatus === 'string' && Object.hasOwn(detailStates, origin.queueStatus)) query.set('status', origin.queueStatus);
  const queueUrl = `/bank/applications${query.size ? `?${query}` : ''}`;
  const item = queueItems.find(candidate => candidate.id === applicationId);
  if (!item) return <div className="min-h-dvh font-sans text-coffee"><header className={`${width} py-6`}><Brand /></header><main className={`${width} py-12`}><h1 className="text-4xl font-extrabold tracking-[-.025em]">Заявка недоступна</h1><p className="mt-5 max-w-xl text-lg text-cocoa">В демонстрационной очереди нет записи с этим адресом. Получение заявок с сервера пока не подключено.</p><Link to={queueUrl} className={`${action} mt-6 bg-forest text-cream`}>К очереди заявок</Link></main></div>;
  return <BankReview key={item.id} item={item} queueUrl={queueUrl} />;
}

function BankReview({ item, queueUrl }: { item: QueueItem; queueUrl: string }) {
  const [mode, setMode] = useState<'request' | 'decision'>(item.status === 'needs_info' ? 'request' : 'decision');
  const [request, setRequest] = useState('');
  const [requestError, setRequestError] = useState('');
  const [decision, setDecision] = useState<DecisionDraft>({ outcome: 'offer', principal: item.principal, termMonths: String(item.termMonths), ratePercent: '26', reason: '' });
  const [errors, setErrors] = useState<DecisionErrors>({});
  const [prepared, setPrepared] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const wasPrepared = useRef(false);
  const editable = ['received', 'review', 'needs_info'].includes(item.status);
  const financialPreview = prepared && mode === 'decision' ? previewDecision(decision) : null;
  useEffect(() => {
    if (prepared) preview.current?.focus();
    else if (wasPrepared.current) form.current?.querySelector<HTMLElement>(mode === 'request' ? '[name="request"]' : '[name="outcome"]')?.focus();
    wasPrepared.current = prepared;
  }, [prepared, mode]);
  function update(field: keyof DecisionDraft, value: string) { setDecision(previous => ({ ...previous, [field]: value })); setErrors(previous => ({ ...previous, [field]: undefined })); }
  function attrs(field: keyof DecisionDraft) { return { id: `decision-${field}`, name: field, 'aria-invalid': Boolean(errors[field]), 'aria-describedby': errors[field] ? `decision-${field}-error` : undefined }; }
  function error(field: keyof DecisionDraft) { return errors[field] ? <p id={`decision-${field}-error`} className="mt-2 text-base font-bold">{errors[field]}</p> : null; }
  function prepare() {
    if (!editable) return;
    if (mode === 'request') {
      if (!request.trim() || request.length > 1000) { setRequestError('Опишите, какие сведения нужны, до 1000 символов.'); form.current?.querySelector<HTMLTextAreaElement>('[name="request"]')?.focus(); return; }
      setRequestError('');
    } else {
      const next = validateDecision(decision);
      if (!Object.keys(next).length && decision.outcome !== 'decline' && !previewDecision(decision)) next.principal = 'Не удалось получить корректный пример расчёта. Проверьте параметры.';
      setErrors(next);
      const first = (['outcome', 'principal', 'termMonths', 'ratePercent', 'reason'] as const).find(field => next[field]);
      if (first) { form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return; }
    }
    setPrepared(true);
  }
  const checks = [
    { title: 'Сведения о компании', status: 'Пример совпадения', description: 'В примере название и правовая форма согласованы. Запрос в реестр не выполнялся.' },
    { title: 'Финансовая оценка', status: 'Оценка недоступна', description: 'Обороты, риск и платёжеспособность не рассчитаны. Недоступность не означает нулевой риск или отказ.' },
    { title: 'Подтверждающие сведения', status: item.status === 'needs_info' ? 'Нужно уточнение' : 'Не проверены', description: 'Документы и подтверждение стоимости не получены. Это пример состояния, а не результат проверки заявки.' },
  ];

  return <div className="min-h-dvh font-sans text-coffee">
    <header className="border-b border-espresso/10"><div className={`${width} flex min-h-24 items-center justify-between gap-4`}><Brand /><Link to={queueUrl} className="inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">К очереди</Link></div></header>
    <main className={`${width} py-8 sm:py-12`}>
      <p className="text-base font-bold text-forest">Кабинет сотрудника · Деморежим</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">Рассмотрение {item.label}</h1>
      <p className="mt-4 text-lg font-bold">{item.company} · {item.legalForm} · {detailStates[item.status].label}</p>
      <aside className="mt-6 rounded-panel bg-oat p-5 text-base font-semibold"><p className="font-extrabold">Демонстрационная карточка</p><p className="mt-1">Сведения и результаты проверок вымышленные. Вход сотрудника, проверки и отправка пока не подключены. Подготовка запроса или решения не меняет статус заявки. Вводите только тестовый текст; черновик исчезнет после обновления или ухода.</p></aside>
      <a href="#review-actions" className="mt-4 inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4 min-[1000px]:hidden">К подготовке запроса или решения ↓</a>
      <div className="mt-8 grid items-start gap-8 min-[1000px]:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">
          <section aria-labelledby="review-summary" className="rounded-panel bg-paper p-5 sm:p-7"><h2 id="review-summary" className="text-2xl font-extrabold">Компания и запрос</h2><dl className="mt-5 grid gap-5 text-base sm:grid-cols-2"><div><dt className="font-semibold">Компания</dt><dd className="mt-1 break-words text-lg font-bold">{item.company}</dd></div><div><dt className="font-semibold">Правовая форма</dt><dd className="mt-1 text-lg font-bold">{item.legalForm}</dd></div><div><dt className="font-semibold">Запрошенная сумма</dt><dd className="mt-1 break-words text-xl font-extrabold tabular-nums">{money(item.principal)}</dd></div><div><dt className="font-semibold">Срок</dt><dd className="mt-1 text-lg font-bold">{item.termMonths} мес.</dd></div><div className="sm:col-span-2"><dt className="font-semibold">Цель</dt><dd className="mt-1 text-lg font-bold">{item.purpose}</dd></div></dl></section>
          <section aria-labelledby="review-checks" className="mt-8"><h2 id="review-checks" className="text-2xl font-extrabold">Результаты проверок</h2><p className="mt-3 text-base font-semibold">Три образца состояний. Проверки по данным компании не выполнялись.</p><ul className="mt-5 divide-y divide-espresso/15 border-y border-espresso/15">{checks.map(check => <li key={check.title} className="py-5"><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="text-lg font-extrabold">{check.title}</h3><span className="rounded-control bg-oat px-3 py-2 text-base font-bold">{check.status}</span></div><p className="mt-3 text-lg text-cocoa">{check.description}</p></li>)}</ul></section>
        </div>
        <section id="review-actions" aria-labelledby="review-action-title" className="min-w-0 rounded-panel bg-paper p-5 sm:p-7"><h2 id="review-action-title" className="text-2xl font-extrabold">Действие сотрудника</h2>
          {!editable ? <div className="mt-5 rounded-control bg-oat p-4"><h3 className="text-lg font-extrabold">Просмотр завершённого этапа</h3><p className="mt-3 text-base font-semibold">В этом примере уже показано предложение или решение. Повторная подготовка отключена; исходный статус не меняется.</p><button type="button" disabled className={`${action} mt-4 cursor-not-allowed bg-paper text-coffee`}>Отправить решение</button></div> : <>
            <div role="group" aria-label="Тип действия" className="mt-5 grid grid-cols-2 gap-2 rounded-control bg-oat p-1.5">{(['request', 'decision'] as const).map(value => <button type="button" key={value} aria-pressed={mode === value} onClick={() => { setMode(value); setPrepared(false); setErrors({}); setRequestError(''); }} className={`${action} px-2 ${mode === value ? 'bg-forest text-cream' : 'text-coffee'}`}>{value === 'request' ? 'Уточнение' : 'Решение'}</button>)}</div>
            {prepared ? <div ref={preview} tabIndex={-1} className="mt-6"><h3 className="text-xl font-extrabold">{mode === 'request' ? 'Проверьте запрос' : `Проверьте решение: ${outcomes[decision.outcome as keyof typeof outcomes]}`}</h3>
              {mode === 'request' ? <p className="mt-4 whitespace-pre-wrap break-words text-lg [overflow-wrap:anywhere]">{request.trim()}</p> : <><p className="mt-4 whitespace-pre-wrap break-words text-lg [overflow-wrap:anywhere]">{decision.reason.trim()}</p>{financialPreview && <dl className="mt-5 space-y-4 text-base"><div><dt className="font-semibold">Предлагаемая сумма</dt><dd className="mt-1 break-words text-xl font-extrabold">{money(normalizeMoney(decision.principal)!)}</dd></div><div><dt className="font-semibold">Срок и ставка</dt><dd className="mt-1 text-lg font-bold">{Number(decision.termMonths)} мес. · {decision.ratePercent.trim()}% годовых</dd></div><div><dt className="font-semibold">Примерный платёж в месяц</dt><dd className="mt-1 break-words text-xl font-extrabold tabular-nums">{money(financialPreview.monthlyPayment)}</dd></div><div><dt className="font-semibold">Примерный общий возврат</dt><dd className="mt-1 break-words text-lg font-bold tabular-nums">{money(financialPreview.totalRepayment)}</dd></div></dl>}</>}
              <p id="review-send-status" className="mt-5 rounded-control bg-oat p-4 text-base font-semibold">Подготовлено только для просмотра. Ничего не отправлено, клиентский статус и очередь не изменились.{financialPreview ? ' Платёж рассчитан в браузере без дополнительных комиссий; условия не подтверждены сервером.' : ''}</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setPrepared(false)} className={`${action} bg-oat text-coffee`}>Изменить</button><button type="button" disabled aria-describedby="review-send-status" className={`${action} cursor-not-allowed bg-oat text-coffee`}>{mode === 'request' ? 'Отправить запрос' : 'Отправить решение'}</button></div>
            </div> : <form ref={form} onSubmit={event => { event.preventDefault(); prepare(); }} noValidate className="mt-6 space-y-5">
              {mode === 'request' ? <div><label htmlFor="review-request" className="text-base font-bold">Какие сведения нужны</label><textarea id="review-request" name="request" rows={5} maxLength={1000} value={request} onChange={event => { setRequest(event.target.value); setRequestError(''); }} aria-invalid={Boolean(requestError)} aria-describedby={requestError ? 'review-request-error' : 'review-request-hint'} className={`${input} resize-y`} /><p id="review-request-hint" className="mt-2 text-base font-semibold">До 1000 символов. Укажите понятный вопрос и что нужно уточнить.</p>{requestError && <p id="review-request-error" className="mt-2 text-base font-bold">{requestError}</p>}</div> : <>
                <div><label htmlFor="decision-outcome" className="text-base font-bold">Вариант решения</label><select {...attrs('outcome')} value={decision.outcome} onChange={event => { update('outcome', event.target.value); setErrors({}); }} className={input}>{Object.entries(outcomes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{error('outcome')}</div>
                {decision.outcome !== 'decline' && <><p className="text-base font-semibold">Начальные сумма и срок взяты из запроса. Ставка 26% задана для примера. Параметры можно изменить; они не являются одобренными условиями.</p><div><label htmlFor="decision-principal" className="text-base font-bold">Предлагаемая сумма, ₽</label><input {...attrs('principal')} inputMode="decimal" maxLength={30} value={decision.principal} onChange={event => update('principal', event.target.value)} className={input} />{error('principal')}</div><div className="grid gap-4 sm:grid-cols-2 min-[1000px]:grid-cols-1"><div><label htmlFor="decision-termMonths" className="text-base font-bold">Срок, месяцы</label><input {...attrs('termMonths')} inputMode="numeric" maxLength={6} value={decision.termMonths} onChange={event => update('termMonths', event.target.value)} className={input} />{error('termMonths')}</div><div><label htmlFor="decision-ratePercent" className="text-base font-bold">Ставка, % годовых</label><input {...attrs('ratePercent')} inputMode="decimal" maxLength={6} value={decision.ratePercent} onChange={event => update('ratePercent', event.target.value)} className={input} />{error('ratePercent')}</div></div></>}
                <div><label htmlFor="decision-reason" className="text-base font-bold">Обоснование решения</label><textarea {...attrs('reason')} rows={4} maxLength={1000} value={decision.reason} onChange={event => update('reason', event.target.value)} className={`${input} resize-y`} />{error('reason')}</div>
              </>}
              <button type="submit" className={`${action} w-full bg-forest text-cream`}>Проверить перед отправкой</button>
            </form>}
          </>}
        </section>
      </div>
    </main>
  </div>;
}
