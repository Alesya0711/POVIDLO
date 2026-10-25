import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useApi } from '../../integration/api';
import type { RecommendationResult } from '../../lib/products';
import { Brand } from '../../components/Brand';
import { AssistantEntry } from '../../components/Assistant';
import { Mascot } from '../../components/Mascot';
import { isAnswers, loadDraft, steps, summaryValues, toRequest } from '../questionnaire/model';
import type { Answers } from '../questionnaire/model';
import { money, rate } from '../../lib/products';
import type { RecommendationItem } from '../../lib/products';

const primary = 'inline-flex min-h-14 items-center justify-center gap-4 rounded-control bg-forest px-6 py-3 text-base font-bold text-cream transition-transform active:scale-95 motion-reduce:transform-none';
const secondary = 'inline-flex min-h-12 items-center justify-center rounded-control border border-coffee/40 px-5 py-3 text-base font-bold text-coffee transition-transform active:scale-95 motion-reduce:transform-none';

function ProductDetails({ item, answers }: { item: RecommendationItem; answers: Answers }) {
  const { product } = item;
  return <><details className="mt-5 border-t border-espresso/15 pt-3">
    <summary className="flex min-h-12 list-none items-center justify-between gap-4 text-base font-bold text-espresso"><span>Условия и требования</span><span aria-hidden="true">⌄</span></summary>
    <dl className="mt-3 grid gap-3 text-lg text-espresso sm:grid-cols-2">
      <div><dt className="text-base font-semibold">Сумма продукта</dt><dd className="font-bold">{money(product.minimumPrincipal)} — {money(product.maximumPrincipal)}</dd></div>
      <div><dt className="text-base font-semibold">Срок продукта</dt><dd className="font-bold">{product.minimumTermMonths}–{product.maximumTermMonths} мес.</dd></div>
      <div><dt className="text-base font-semibold">Возраст бизнеса</dt><dd className="font-bold">От {product.minimumBusinessAgeMonths} месяцев</dd></div>
      <div><dt className="text-base font-semibold">Правовая форма</dt><dd className="font-bold">{product.legalForms.map(form=>form==='ip'?'ИП':'ООО').join(' или ')}</dd></div>
    </dl>
    <p className="mt-4 text-base font-semibold text-espresso">При оформлении мы попросим ИНН, чтобы заполнить сведения о компании.</p>
  </details><Link to={`/products/${product.id}`} state={{ answers }} aria-label={`Открыть продукт ${product.name}`} className={`${item.rank === 1 ? primary : secondary} mt-4 w-full sm:w-auto`}>Посмотреть продукт</Link></>;
}

function Comparison({ items, principal, termMonths }: { items: RecommendationItem[]; principal: string; termMonths: number }) {
  const rows = [
    ['Ставка', ...items.map(item => `${rate(item.product.annualRate)} годовых`)],
    ['Платёж в месяц', ...items.map(item => money(item.monthlyPayment))],
    ['Общий возврат', ...items.map(item => money(item.totalRepayment))],
    ['Сумма процентов', ...items.map(item => money(item.totalInterest))],
    ['Максимальная сумма', ...items.map(item => money(item.product.maximumPrincipal))],
    ['Максимальный срок', ...items.map(item => `${item.product.maximumTermMonths} мес.`)],
    ['Возраст бизнеса', ...items.map(item => `От ${item.product.minimumBusinessAgeMonths} мес.`)],
  ];
  return <details className="group mt-8 rounded-panel bg-oat p-5 sm:p-7">
    <summary className="flex min-h-12 list-none items-center justify-between gap-4 text-xl font-extrabold text-espresso"><span>Сравнить все предложения</span><span aria-hidden="true" className="group-open:hidden">＋</span><span aria-hidden="true" className="hidden group-open:block">−</span></summary>
    <p className="mb-5 mt-3 text-lg text-espresso">Одна сумма и срок: {money(principal)} на {termMonths} мес. Дополнительные комиссии не включены в расчёт.</p>
    <div role="region" aria-label="Сравнение предложений" tabIndex={0} className="overflow-x-auto rounded-control">
      <table className="w-full min-w-[760px] border-collapse text-left text-base tabular-nums text-espresso">
        <thead><tr><th scope="col" className="pb-4 pr-6 font-bold">Условия расчёта</th>{items.map(item => <th scope="col" key={item.product.id} className="pb-4 pr-5 font-extrabold">{item.product.name}</th>)}</tr></thead>
        <tbody>{rows.map(([label, ...values]) => <tr key={label} className="border-t border-espresso/20"><th scope="row" className="py-4 pr-6 font-semibold">{label}</th>{values.map((value, index) => <td key={index} className="py-4 pr-5 font-bold">{value}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </details>;
}

export function Recommendations() {
  const location = useLocation();
  const [source] = useState(() => {
    const passed = (location.state as { answers?: unknown } | null)?.answers;
    const saved = loadDraft();
    if (isAnswers(passed) && toRequest(passed)) return { answers: passed, notice: saved.notice.startsWith('Не удалось') ? saved.notice : '' };
    return { answers: saved.draft.step === 6 && toRequest(saved.draft.answers) ? saved.draft.answers : null, notice: saved.notice.startsWith('Не удалось') ? saved.notice : '' };
  });
  const answers = source.answers;
  const resource = useApi<RecommendationResult>(answers ? '/recommendations' : null, answers ? toRequest(answers) : undefined);
  const response = resource.data;
  const mode = resource.loading ? 'loading' : resource.error ? 'error' : response?.items.length ? 'ready' : 'empty';
  const principal = answers?.principal ?? '0';
  const termMonths = Number(answers?.termMonths ?? 0);
  const items = response?.items ?? [];
  const featured = items[0];
  const values = answers ? summaryValues(answers) : [];
  const ready = !['empty', 'error', 'loading'].includes(mode ?? '');
  function resetScenario() { resource.refresh(); }

  return <div className="min-h-screen font-sans">
    <a href="#results-main" className="fixed left-5 top-3 z-50 -translate-y-24 rounded-control bg-forest px-5 py-3 text-base font-bold text-cream focus:translate-y-0">Перейти к предложениям</a>
    <header className="border-b border-espresso/10"><div className="mx-auto flex min-h-24 max-w-[1280px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-12"><Brand /><Link to="/select" className="inline-flex min-h-12 items-center text-base font-bold text-coffee">К ответам</Link></div></header>
    <main id="results-main" className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      {!answers ? <section className="mx-auto max-w-2xl py-10"><p className="text-base font-bold text-coffee">Сначала познакомимся</p><h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-[-.025em] text-coffee">Расскажите немного о вашем деле.</h1><p className="mt-5 text-lg text-cocoa">Заполните шесть ответов, чтобы увидеть варианты для вашего бизнеса.</p><Link to="/select" className={`${primary} mt-7`}>Перейти к опросу</Link></section> : <>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-3 text-base font-bold text-coffee">Ваш путь к финансированию</p><h1 className="text-[clamp(32px,4vw,46px)] font-extrabold leading-tight tracking-[-.025em] text-coffee">{mode === 'empty' ? 'Давайте уточним запрос.' : mode === 'error' ? 'Попробуем ещё раз.' : mode === 'loading' ? 'Один момент.' : 'Варианты для вашего запроса'}</h1><p className="mt-3 text-lg text-cocoa">Сравните условия продуктов и проверьте расчёт для своего запроса.</p></div><Link to="/select" className={`${secondary} shrink-0`}>Изменить ответы</Link></div>
        <section aria-label="Параметры подбора" className="my-7 rounded-control bg-sage px-5 py-4 text-forest"><p className="text-base font-semibold">Расчёт для {money(principal)} на {termMonths} мес. Подбор учитывает ваши ответы, но не означает одобрение заявки.</p></section>
        {source.notice && <p role="status" className="mb-6 rounded-control bg-oat p-4 text-base font-semibold text-espresso">{source.notice}</p>}
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-8">
          <div className="min-w-0">
            {!ready && <section aria-label="Состояние подбора" aria-busy={mode === 'loading'} className="min-h-[360px] rounded-panel bg-paper p-6 shadow-[0_1px_4px_#30282014] sm:p-8">
              <p className="mb-5 text-base font-bold text-espresso">Результат подбора</p>
              <h2 className="text-3xl font-extrabold leading-tight text-coffee">{mode === 'loading' ? 'Подбираем варианты…' : mode === 'error' ? 'Не удалось загрузить варианты' : 'Подходящих продуктов пока нет'}</h2>
              <p role="status" className="mt-4 text-lg text-espresso">{mode === 'loading' ? 'Сравниваем продукты по вашим ответам.' : mode === 'error' ? 'Ваши ответы сохранены. Попробуйте повторить подбор или изменить запрос.' : 'Измените ответы и попробуйте подобрать продукты ещё раз.'}</p>
              {resource.error && <p role="alert" className="mt-4 text-base font-semibold">Не удалось загрузить варианты. Попробуйте ещё раз.</p>}{response?.unmatchedReasons.map(reason=><p key={reason} className="mt-3 text-base font-semibold">{reason}</p>)}<div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={resetScenario} className={primary}>{mode === 'error' ? 'Повторить подбор' : 'Обновить подбор'}</button><Link to="/select" className={secondary}>Изменить ответы</Link></div>
            </section>}
            {ready && featured && <>
              <article aria-labelledby="featured-title" className="rounded-panel bg-paper p-6 shadow-[0_2px_8px_#30282016] sm:p-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><span className="inline-flex rounded-full bg-sage px-4 py-2 text-base font-bold text-forest">Подходит по параметрам</span><span className="text-base font-semibold text-espresso">01 / {items.length.toString().padStart(2, '0')}</span></div>
                <h2 id="featured-title" className="text-3xl font-extrabold tracking-[-.025em] text-coffee sm:text-4xl">{featured.product.name}</h2>
                <p className="mt-2 text-lg text-espresso">{featured.reasons[0]}</p>
                <dl className="mt-7 grid gap-6 sm:grid-cols-2"><div><dt className="text-base font-semibold text-espresso">Платёж в месяц</dt><dd className="mt-1 text-[clamp(28px,3vw,38px)] font-extrabold leading-tight tracking-[-.025em] tabular-nums text-coffee">{money(featured.monthlyPayment)}</dd></div><div><dt className="text-base font-semibold text-espresso">Фиксированная ставка</dt><dd className="mt-1 text-[38px] font-extrabold leading-tight tracking-[-.025em] text-coffee">{rate(featured.product.annualRate)} <span className="text-lg font-semibold">годовых</span></dd></div></dl>
                <dl className="mt-6 grid gap-4 border-t border-espresso/15 pt-5 sm:grid-cols-2"><div><dt className="text-base font-semibold text-espresso">Общий возврат</dt><dd className="text-xl font-extrabold tabular-nums text-espresso">{money(featured.totalRepayment)}</dd></div><div><dt className="text-base font-semibold text-espresso">Из них проценты</dt><dd className="text-xl font-extrabold tabular-nums text-espresso">{money(featured.totalInterest)}</dd></div></dl>
                <details className="mt-5"><summary className="inline-flex min-h-12 items-center text-base font-bold text-espresso underline underline-offset-4">Почему этот продукт</summary><ul className="mt-2 space-y-2 text-lg text-espresso">{featured.reasons.map(reason => <li key={reason} className="flex gap-3"><span aria-hidden="true">·</span>{reason}</li>)}</ul><p className="mt-3 text-base font-semibold text-espresso">При оформлении мы попросим ИНН, чтобы заполнить сведения о компании.</p></details>
                <ProductDetails item={featured} answers={answers} />
              </article>
              <section aria-labelledby="alternatives-title" className="mt-9"><h2 id="alternatives-title" className="mb-4 text-2xl font-extrabold tracking-[-.012em] text-coffee">Посмотрите и другие варианты</h2><div className="divide-y divide-espresso/15 rounded-panel bg-paper px-5 shadow-[0_1px_4px_#30282014] sm:px-7">{items.slice(1).map(item => <article key={item.product.id} className="py-6"><div className="flex flex-wrap justify-between gap-4"><div><h3 className="text-xl font-extrabold text-coffee">{item.product.name}</h3><p className="mt-1 text-base font-semibold text-espresso">{item.product.isUniversal ? 'Для разных задач бизнеса' : 'Другие пределы суммы и срока'}</p></div><div className="text-left sm:text-right"><p className="text-xl font-extrabold tabular-nums text-espresso">{money(item.monthlyPayment)} <span className="text-base font-semibold">/ мес.</span></p><p className="text-base font-semibold text-espresso">{rate(item.product.annualRate)} годовых</p></div></div><ProductDetails item={item} answers={answers} /></article>)}</div></section>
              <Comparison items={items} principal={principal} termMonths={termMonths} />
            </>}
          </div>
          <aside aria-label="Ответы и помощь" className="min-w-0"><section className="rounded-panel bg-oat p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><h2 className="text-xl font-extrabold text-espresso">Ваш запрос</h2><Link to="/select" className="inline-flex min-h-10 items-center text-base font-bold text-espresso underline underline-offset-4">Изменить</Link></div><dl className="mt-3 divide-y divide-espresso/15">{steps.map((label, index) => <div key={label} className="py-3"><dt className="flex items-center justify-between gap-2 text-base font-semibold text-espresso"><span>{label}</span><Link to={`/select?step=${index + 1}`} aria-label={`Изменить: ${label}`} className="inline-flex min-h-10 shrink-0 items-center text-base font-bold underline underline-offset-4">Править</Link></dt><dd className="mt-1 break-words text-lg font-bold text-espresso [overflow-wrap:anywhere]">{values[index]}</dd></div>)}</dl><p className="mt-3 text-base font-semibold text-espresso">Эти ответы мы учли при подборе.</p></section><section className="mt-6 px-1"><div className="flex items-center gap-3"><Mascot pose="compare" className="w-24 shrink-0" /><h2 className="text-xl font-extrabold text-coffee">Разберёмся<br />без спешки</h2></div><p className="mt-3 text-lg text-cocoa">Ежемесячный платёж показывает, сколько возвращать каждый месяц. Общая сумма возврата включает проценты.</p><div className="mt-3"><AssistantEntry label="Обсудить варианты" context={{ screen: 'recommendations', label: 'Подобранные варианты', prompts: ['Почему у продуктов разный платёж?', 'Чем ставка отличается от общей стоимости?', 'Что изменится, если увеличить срок?'], data: { answers, status: mode, unmatchedReasons: response?.unmatchedReasons ?? [], products: items.map(item => ({ ...item.product, rank: item.rank, reasons: item.reasons, monthlyPayment: item.monthlyPayment, totalRepayment: item.totalRepayment, totalInterest: item.totalInterest })), dataMode: 'synthetic-api', principal, termMonths } }} /></div></section></aside>
        </div>
        
      </>}
    </main>
  </div>;
}
