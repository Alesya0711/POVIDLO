import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router';
import { useApi, ErrorNotice, Page } from '../../integration/api';
import { Brand } from '../../components/Brand';
import { AssistantEntry } from '../../components/Assistant';
import { industries, isAnswers, loadDraft, normalizeMoney, purposes, toRequest } from '../questionnaire/model';
import { defaultTerms, money, rate } from '../../lib/products';
import type { Product } from '../../lib/products';
import { CALCULATOR_PREFIX, calculatePreview, loadCalculator, validateCalculator } from './model';
import type { CalculatorValues } from './model';

const button = 'inline-flex min-h-14 items-center justify-center gap-3 rounded-control bg-forest px-6 py-3 text-base font-bold text-cream transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-oat disabled:text-coffee motion-reduce:transform-none';
const pageWidth = 'mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12';

export function ProductRoute() {
  const { productId = '' } = useParams();
  const resource = useApi<Product>(`/products/${encodeURIComponent(productId)}`);
  const product = resource.data;
  if (resource.loading) return <Page title="Продукт" back="/products" backLabel="Каталог"><p role="status">Загружаем условия…</p></Page>;
  if (resource.error) return <Page title="Продукт" back="/products" backLabel="Каталог"><ErrorNotice error={resource.error} retry={resource.refresh}/></Page>;
  if (!product) return <div className="min-h-screen font-sans"><header className={`${pageWidth} py-6`}><Brand /></header><main className={`${pageWidth} py-12`}><p className="text-base font-bold text-coffee">Продукт недоступен</p><h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-[-.025em] text-coffee">Такой продукт не найден.</h1><p className="mt-5 max-w-xl text-lg text-cocoa">Вернитесь к вариантам и выберите продукт из списка.</p><Link to="/recommendations" className={`${button} mt-7`}>К предложениям</Link></main></div>;
  return <ProductPage key={product.id} product={product} />;
}

function ProductPage({ product }: { product: Product }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [initial] = useState(() => {
    const passed = (location.state as { answers?: unknown } | null)?.answers;
    const saved = loadDraft();
    const answers = isAnswers(passed) && toRequest(passed) ? passed : saved.draft.step === 6 && toRequest(saved.draft.answers) ? saved.draft.answers : null;
    const fallback = answers ? { principal: answers.principal, termMonths: answers.termMonths } : { principal: defaultTerms.principal, termMonths: String(defaultTerms.termMonths) };
    const baseKey = `${normalizeMoney(fallback.principal)}:${Number(fallback.termMonths)}`;
    return { ...loadCalculator(product.id, fallback, baseKey), baseKey, fromQuiz: !!answers };
  });
  const [values, setValues] = useState<CalculatorValues>(initial.values);
  const [changed, setChanged] = useState(false);
  const [storageNotice, setStorageNotice] = useState(initial.notice);
  const lastSaved = useRef(JSON.stringify(initial.values));
  const issues = validateCalculator(values, product);
  const valid = !issues.principal && !issues.termMonths;
  const preview = useMemo(() => {
    if (!valid) return null;
    try { return calculatePreview(values.principal, Number(values.termMonths), product.annualRate); }
    catch { return null; }
  }, [valid, values.principal, values.termMonths, product.annualRate]);

  useEffect(() => {
    const serialized = JSON.stringify(values);
    if (serialized === lastSaved.current) return;
    try { sessionStorage.setItem(CALCULATOR_PREFIX + product.id, JSON.stringify({ version: 1, baseKey: initial.baseKey, ...values })); lastSaved.current = serialized; setStorageNotice('Расчёт сохранён.'); }
    catch { setStorageNotice('Расчёт не сохранился. Вы можете продолжить, пока страница открыта.'); }
  }, [values, product.id, initial.baseKey]);
  function update(field: keyof CalculatorValues, value: string) { setValues(current => ({ ...current, [field]: value })); setChanged(true); }

  const goalNames = product.purposeCategories.map(value => purposes.find(item => item.value === value)?.label ?? value);
  const industryNames = [...new Set(product.industries.map(value => industries.find(item => item.value === value)?.label ?? 'Другая сфера'))];
  const termPresets = [6, 12, 24, 36, 60].filter(value => value >= product.minimumTermMonths && value <= product.maximumTermMonths);
  const amountPresets = ['500000', '1000000', '2000000'].filter(value => Number(value) >= Number(product.minimumPrincipal) && Number(value) <= Number(product.maximumPrincipal));
  const sourceLabel = changed ? 'Вы меняете сумму и срок расчёта.' : initial.restored ? 'Ваш расчёт восстановлен.' : initial.fromQuiz ? 'Сумма и срок взяты из ответов опроса.' : 'Для примера указаны сумма и срок. Их можно изменить.';

  return <div className="min-h-screen font-sans">
    <a href="#product-main" className="fixed left-5 top-3 z-50 -translate-y-24 rounded-control bg-forest px-5 py-3 text-base font-bold text-cream focus:translate-y-0">Перейти к продукту</a>
    <header className="border-b border-espresso/10"><div className={`${pageWidth} flex min-h-24 flex-wrap items-center justify-between gap-3 py-3`}><Brand /><Link to="/recommendations" className="inline-flex min-h-12 items-center text-base font-bold text-coffee"><span className="sm:hidden">Назад</span><span className="hidden sm:inline">К предложениям</span></Link></div></header>
    <main id="product-main" className={`${pageWidth} py-9 lg:py-12`}>
      <div className="mb-7 flex flex-wrap gap-3"><span className="rounded-full bg-sage px-4 py-2 text-base font-bold text-forest">{product.isUniversal ? 'Для разных задач бизнеса' : goalNames[0]}</span></div>
      <div className="grid items-start gap-9 min-[900px]:grid-cols-[minmax(0,1fr)_440px] min-[900px]:gap-9 xl:gap-12">
        <div className="min-w-0">
          <h1 className="text-[clamp(36px,4.2vw,54px)] font-extrabold leading-[1.1] tracking-[-.035em] text-coffee">{product.name}</h1>
          <p className="mt-5 max-w-xl text-lg text-cocoa">{product.isUniversal ? 'Для повседневных задач и новых планов. Посмотрите условия и оцените платёж, прежде чем двигаться дальше.' : product.purposeCategories[0] === 'equipment' ? 'Обновить технику, оснастить мастерскую или сделать производство удобнее. Начните с понятного расчёта.' : product.purposeCategories[0] === 'growth' ? 'Открыть новую точку, расширить производство или запустить направление. Посмотрите, как финансирование впишется в ваш план.' : 'Закупить товар, подготовиться к сезону или рассчитаться с поставщиками. Финансирование для ежедневного движения бизнеса.'}</p>
          <a href="#calculator-title" className="mt-4 inline-flex min-h-12 items-center text-base font-bold text-coffee underline underline-offset-4 min-[900px]:hidden">К расчёту платежа ↓</a>
          <dl className="mt-8 grid grid-cols-2 gap-5 border-y border-espresso/15 py-6"><div><dt className="text-base font-semibold text-coffee">Фиксированная ставка</dt><dd className="mt-1 text-4xl font-extrabold tracking-[-.025em] text-coffee">{rate(product.annualRate)} <span className="text-base font-semibold">годовых</span></dd></div><div><dt className="text-base font-semibold text-coffee">Доступный срок</dt><dd className="mt-1 text-2xl font-extrabold text-coffee">{product.minimumTermMonths}–{product.maximumTermMonths} <span className="text-base font-semibold">месяцев</span></dd></div></dl>
          <section aria-labelledby="requirements-title" className="mt-9"><h2 id="requirements-title" className="text-2xl font-extrabold tracking-[-.012em] text-coffee">Что важно для этого продукта</h2><dl className="mt-4 divide-y divide-espresso/15"><div className="py-4"><dt className="text-base font-semibold text-coffee">Сумма финансирования</dt><dd className="mt-1 text-lg font-bold text-espresso">{money(product.minimumPrincipal)} — {money(product.maximumPrincipal)}</dd></div><div className="py-4"><dt className="text-base font-semibold text-coffee">Возраст бизнеса</dt><dd className="mt-1 text-lg font-bold text-espresso">Не меньше {product.minimumBusinessAgeMonths} полных месяцев</dd></div><div className="py-4"><dt className="text-base font-semibold text-coffee">Правовая форма</dt><dd className="mt-1 text-lg font-bold text-espresso">{product.legalForms.map(value => value === 'ip' ? 'ИП' : 'ООО').join(' или ')}</dd></div><div className="py-4"><dt className="text-base font-semibold text-coffee">Сфера деятельности</dt><dd className="mt-1 text-lg font-bold text-espresso">{industryNames.join(', ')}</dd></div><div className="py-4"><dt className="text-base font-semibold text-coffee">Назначение</dt><dd className="mt-1 text-lg font-bold text-espresso">{goalNames.join(', ')}</dd></div></dl></section>
          <section className="mt-6 rounded-panel bg-oat p-5 text-espresso"><h2 className="text-lg font-extrabold">Условия продукта</h2><p className="mt-2 text-base font-semibold">Совпадение с условиями продукта не означает одобрение. При оформлении мы запросим сведения о компании, а решение по заявке примут отдельно.</p></section>
        </div>

        <section aria-labelledby="calculator-title" className="min-w-0 rounded-panel bg-paper p-5 shadow-[0_2px_8px_#30282016] sm:p-7">
          <p className="text-base font-bold text-espresso">Под ваш план</p><h2 id="calculator-title" className="mt-2 text-3xl font-extrabold leading-tight tracking-[-.025em] text-coffee">Посчитаем платёж</h2>
          <p className="mt-3 text-base font-semibold text-espresso">{sourceLabel}</p>
          <form onSubmit={event => event.preventDefault()} noValidate>
            <label htmlFor="product-principal" className="mb-2 mt-6 block text-base font-bold text-espresso">Сумма кредита</label>
            <div className={`flex min-h-16 items-center gap-3 rounded-control border-2 bg-paper px-4 focus-within:border-forest ${issues.principal ? 'border-[var(--error)]' : 'border-coffee/40'}`}><input id="product-principal" type="text" inputMode="decimal" maxLength={30} autoComplete="off" value={values.principal} onChange={event => update('principal', event.target.value)} aria-invalid={!!issues.principal} aria-describedby={`principal-range${issues.principal ? ' principal-error' : ''}`} className="min-h-16 w-full min-w-0 bg-transparent text-2xl font-bold tabular-nums text-espresso focus-visible:outline-none" /><span className="text-lg font-bold text-espresso">₽</span></div>
            <p id="principal-range" className="mt-2 text-base font-semibold text-espresso">От {money(product.minimumPrincipal)} до {money(product.maximumPrincipal)}</p>
            {issues.principal && <p id="principal-error" className="mt-2 rounded-control bg-[var(--errorSurface)] p-3 text-base font-semibold text-[var(--error)]">{issues.principal}</p>}
            <div className="mt-3 flex flex-wrap gap-2">{amountPresets.map(value => <button type="button" key={value} aria-pressed={normalizeMoney(values.principal) === normalizeMoney(value)} onClick={() => update('principal', value)} className={`min-h-11 rounded-control px-3 py-2 text-base font-bold transition-transform active:scale-95 motion-reduce:transform-none ${normalizeMoney(values.principal) === normalizeMoney(value) ? 'bg-sage text-forest' : 'bg-oat text-espresso'}`}>{new Intl.NumberFormat('ru-RU').format(Number(value))} ₽</button>)}</div>

            <label htmlFor="product-months" className="mb-2 mt-6 block text-base font-bold text-espresso">Срок кредита</label>
            <div className={`flex min-h-16 items-center gap-3 rounded-control border-2 bg-paper px-4 focus-within:border-forest ${issues.termMonths ? 'border-[var(--error)]' : 'border-coffee/40'}`}><input id="product-months" type="text" inputMode="numeric" maxLength={6} autoComplete="off" value={values.termMonths} onChange={event => update('termMonths', event.target.value)} aria-invalid={!!issues.termMonths} aria-describedby={`months-range${issues.termMonths ? ' months-error' : ''}`} className="min-h-16 w-full min-w-0 bg-transparent text-2xl font-bold tabular-nums text-espresso focus-visible:outline-none" /><span className="text-lg font-semibold text-espresso">мес.</span></div>
            <p id="months-range" className="mt-2 text-base font-semibold text-espresso">От {product.minimumTermMonths} до {product.maximumTermMonths} месяцев</p>
            {issues.termMonths && <p id="months-error" className="mt-2 rounded-control bg-[var(--errorSurface)] p-3 text-base font-semibold text-[var(--error)]">{issues.termMonths}</p>}
            <input type="range" min={product.minimumTermMonths} max={product.maximumTermMonths} step={1} disabled={!!issues.termMonths} value={issues.termMonths ? product.minimumTermMonths : Number(values.termMonths)} onChange={event => update('termMonths', event.target.value)} aria-label="Изменить срок ползунком" className="mt-5 min-h-10 w-full accent-forest disabled:cursor-not-allowed" />
            <div className="mt-1 flex flex-wrap gap-2">{termPresets.map(value => <button type="button" key={value} aria-pressed={Number(values.termMonths) === value} onClick={() => update('termMonths', String(value))} className={`min-h-11 rounded-control px-3 py-2 text-base font-bold transition-transform active:scale-95 motion-reduce:transform-none ${Number(values.termMonths) === value ? 'bg-sage text-forest' : 'bg-oat text-espresso'}`}>{value} мес.</button>)}</div>
          </form>

          <div className="mt-7 min-h-[190px] rounded-panel bg-sage p-5 text-forest" aria-live="polite" aria-atomic="true">{preview ? <><p className="text-base font-semibold">Примерный платёж в месяц</p><p className="mt-1 break-words text-[clamp(28px,3vw,36px)] font-extrabold leading-tight tracking-[-.025em] tabular-nums">{money(preview.monthlyPayment)}</p><dl className="mt-5 space-y-3"><div><dt className="text-base font-semibold">Общий возврат</dt><dd className="text-lg font-extrabold tabular-nums">{money(preview.totalRepayment)}</dd></div><div><dt className="text-base font-semibold">Из них проценты</dt><dd className="text-lg font-extrabold tabular-nums">{money(preview.totalInterest)}</dd></div></dl></> : <><h3 className="text-lg font-extrabold">{valid ? 'Расчёт недоступен' : 'Проверьте параметры'}</h3><p className="mt-3 text-base font-semibold">{valid ? 'Не удалось получить корректный результат. Можно изменить параметры и повторить.' : 'Укажите сумму и целый срок в пределах этого продукта. До этого платёж не показываем.'}</p></>}</div>
          <p className="mt-4 text-base font-semibold text-espresso">Предварительный расчёт без дополнительных комиссий. Итоговые условия могут отличаться после рассмотрения заявки.</p>
          <AssistantEntry label="Разобраться в расчёте" context={{ screen: 'product', resourceId: product.id, field: 'financing_terms', label: `Условия ${product.name}`, prompts: ['Как срок влияет на платёж?', 'Что входит в общую сумму возврата?', 'Какие сведения понадобятся для заявки?'], data: { productId: product.id, product, inputs: values, principal: normalizeMoney(values.principal), termMonths: values.termMonths, preview, dataMode: 'synthetic-api', quoteMode: 'browser-preview' }, onApply: (field,value) => { if (field==='principal'||field==='termMonths') update(field,String(value)); } }} />
          <button type="button" disabled={!preview} onClick={() => navigate(`/applications/new?${new URLSearchParams({ productId: product.id, principal: normalizeMoney(values.principal)!, termMonths: String(Number(values.termMonths)) })}`)} className={`${button} mt-3 w-full`}>Перейти к заявке</button>
          {storageNotice && <p role="status" className="mt-4 text-base font-semibold text-espresso">{storageNotice}</p>}
          <details className="mt-5 border-t border-espresso/15 pt-2"><summary className="inline-flex min-h-12 cursor-pointer items-center text-base font-bold text-espresso underline underline-offset-4">Как рассчитан платёж</summary><p className="mt-2 text-lg text-espresso">Платежи одинаковы каждый месяц и рассчитаны по фиксированной ставке. Платёж округляется до копеек. Общая сумма возврата равна ежемесячному платежу, умноженному на срок. Проценты составляют разницу между общей суммой возврата и суммой кредита.</p></details>
        </section>
      </div>
    </main>
  </div>;
}
