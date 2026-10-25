import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Brand } from '../../components/Brand';
import { AssistantEntry } from '../../components/Assistant';
import { Mascot } from '../../components/Mascot';
import { emptyDraft, industries, loadDraft, purposes, STORAGE_KEY, steps, summaryValues, toRequest, validateStep } from './model';
import type { Answers } from './model';

const button = 'inline-flex min-h-14 items-center justify-center gap-4 rounded-control bg-forest px-7 py-3 text-base font-bold text-cream transition-transform active:scale-95 motion-reduce:transform-none';
const titles = ['Чем занимается ваш бизнес?', 'В какой форме работаете?', 'Сколько вашему бизнесу?', 'На что нужны средства?', 'Какая сумма вам нужна?', 'На какой срок рассчитываете?'];
const descriptions = ['Начнём с вашей сферы, так проще понять задачу.', 'В этом подборе представлены продукты для ИП и ООО.', 'Укажите, сколько полных месяцев прошло с даты регистрации.', 'Выберите задачу, которая сейчас важнее всего.', 'Выберите вариант или введите свою сумму в рублях.', 'Выберите удобный срок или укажите свой в целых месяцах.'];

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    shop: <><path d="M4 10h16l-2-6H6zM5 10v10h14V10M9 20v-6h6v6" /><path d="M4 10c0 4 4 4 4 0 0 4 4 4 4 0 0 4 4 4 4 0 0 4 4 4 4 0" /></>,
    cup: <><path d="M5 9h12v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM17 10h2a3 3 0 0 1 0 6h-2M8 3v2M13 3v2" /></>,
    factory: <><path d="M4 20V9l6 4V9l6 4V4h4v16zM7 17h1m4 0h1m4 0h1" /></>,
    growth: <><path d="m4 17 6-6 4 4 6-9M15 6h5v5M4 21h16" /></>,
    dots: <><circle cx="6" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="18" cy="12" r="1" /></>,
    person: <><circle cx="12" cy="7" r="3" /><path d="M5 21v-3a7 7 0 0 1 14 0v3" /></>,
    company: <><path d="M5 21V4h14v17M3 21h18M9 8h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1" /></>,
  };
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.dots}</svg>;
}

function Choices({ field, value, choices, onChange, error }: { field: string; value: string; choices: readonly { value: string; label: string; description: string; icon: string }[]; onChange: (value: string) => void; error: boolean }) {
  return <div className="grid gap-3 sm:grid-cols-2">
    {choices.map(choice => <label key={choice.value} className="relative cursor-pointer">
      <input type="radio" name={field} value={choice.value} checked={value === choice.value} onChange={() => onChange(choice.value)} aria-invalid={error || undefined} aria-describedby={error ? 'step-error' : undefined} className="peer sr-only" />
      <span className="flex h-full min-h-40 flex-col rounded-panel border border-espresso/15 bg-paper p-5 text-espresso transition-transform peer-checked:border-forest peer-checked:bg-sage peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-forest active:scale-[.98] motion-reduce:transform-none">
        <span className="mb-4 flex items-center justify-between"><Icon name={choice.icon} /><span className={`flex size-6 items-center justify-center rounded-full border ${value === choice.value ? 'border-forest bg-forest text-cream' : 'border-coffee'}`} aria-hidden="true">{value === choice.value && <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 10 4 4 8-8" /></svg>}</span></span>
        <span className="text-lg font-extrabold">{choice.label}</span><span className="mt-1 text-lg font-semibold leading-snug">{choice.description}</span>
      </span>
    </label>)}
  </div>;
}

export function Questionnaire() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [initial] = useState(() => {
    const loaded = loadDraft();
    const requested = params.get('step');
    if (requested && /^[1-6]$/.test(requested)) {
      const firstInvalid = steps.findIndex((_, index) => validateStep(index, loaded.draft.answers));
      loaded.draft.step = Math.min(Number(requested) - 1, firstInvalid < 0 ? 5 : firstInvalid);
    }
    return loaded;
  });
  const [draft, setDraft] = useState(initial.draft);
  const [notice, setNotice] = useState(initial.notice);
  const [saveStatus, setSaveStatus] = useState(() => Object.values(initial.draft.answers).some(Boolean) ? 'Ответы восстановлены' : 'Ответы сохраняются автоматически');
  const [storageError, setStorageError] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(draft.step);
  const lastSaved = useRef(JSON.stringify(initial.draft));
  const { answers, step } = draft;
  const complete = step === 6;
  const values = summaryValues(answers);

  useEffect(() => {
    const serialized = JSON.stringify(draft);
    if (serialized === lastSaved.current) return;
    try { localStorage.setItem(STORAGE_KEY, serialized); lastSaved.current = serialized; setSaveStatus('Ответы сохранены'); setStorageError(false); }
    catch { setSaveStatus('Не удалось сохранить ответы. Не закрывайте страницу, чтобы не потерять изменения.'); setStorageError(true); }
  }, [draft]);

  useEffect(() => {
    if (previousStep.current !== step) {
      heading.current?.focus();
      previousStep.current = step;
    }
  }, [step]);

  function update(field: keyof Answers, value: string) {
    setDraft(current => ({ ...current, answers: { ...current.answers, [field]: value } }));
    setError(''); setNotice('');
  }
  function goTo(next: number) { setError(''); setDraft(current => ({ ...current, step: next })); }
  function next(event: FormEvent) {
    event.preventDefault();
    const issue = validateStep(step, answers);
    if (issue) { setError(issue); return; }
    goTo(step + 1);
  }
  function restart() { setDraft(emptyDraft()); setError(''); setNotice('Ответы удалены. Начните с первого шага.'); }

  function numberField(field: 'businessAgeMonths' | 'principal' | 'termMonths', label: string, unit: string, presets: { value: string; label: string }[], hint: string) {
    return <div>
      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {presets.map(preset => <button type="button" key={preset.value} aria-pressed={answers[field] === preset.value} onClick={() => update(field, preset.value)} className={`min-h-16 rounded-control border px-3 py-3 text-lg font-bold transition-transform active:scale-95 motion-reduce:transform-none ${answers[field] === preset.value ? 'border-forest bg-sage text-espresso' : 'border-espresso/15 bg-paper text-espresso'}`}>{preset.label}</button>)}
      </div>
      <label htmlFor={field} className="mb-2 block text-base font-bold text-coffee">{label}</label>
      <div className={`flex items-center gap-3 rounded-control border-2 bg-paper px-4 focus-within:border-forest ${error ? 'border-[var(--error)]' : 'border-coffee/40'}`}>
        <input id={field} name={field} type="text" inputMode={field === 'principal' ? 'decimal' : 'numeric'} maxLength={field === 'principal' ? 30 : 6} autoComplete="off" value={answers[field]} onChange={event => update(field, event.target.value)} aria-invalid={!!error} aria-describedby={`${field}-hint${error ? ' step-error' : ''}`} className="min-h-16 w-full min-w-0 bg-transparent text-2xl font-bold tabular-nums text-espresso focus-visible:outline-none" />
        <span className="text-lg font-semibold text-espresso">{unit}</span>
      </div>
      <p id={`${field}-hint`} className="mt-3 text-lg text-cocoa">{hint}</p>
    </div>;
  }

  return <div className="min-h-screen font-sans">
    <a href="#quiz-main" className="fixed left-5 top-3 z-50 -translate-y-24 rounded-control bg-forest px-5 py-3 text-base font-bold text-cream focus:translate-y-0">Перейти к опросу</a>
    <header className="border-b border-espresso/10"><div className="mx-auto flex min-h-24 max-w-[1280px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-12"><Brand /><Link to="/" className="inline-flex min-h-12 items-center gap-2 text-base font-bold text-coffee"><span>На главную</span></Link></div></header>
    <main id="quiz-main" className="mx-auto grid max-w-[1280px] gap-10 px-5 py-9 sm:px-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14 lg:px-12 lg:py-14">
      <aside aria-label="Ваш путь подбора">
        <p className="text-base font-bold text-coffee">Финансирование под ваше дело</p>
        <ol className="mt-6 hidden space-y-1 lg:block">
          {steps.map((label, index) => <li key={label}><button type="button" disabled={index > step} onClick={() => goTo(index)} aria-current={index === step ? 'step' : undefined} className={`flex min-h-13 w-full items-center gap-3 rounded-control px-3 py-2 text-left text-base font-bold ${index === step ? 'bg-sage text-forest' : 'text-coffee'} disabled:cursor-default`}>
            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${index < step ? 'bg-forest text-cream' : 'bg-oat text-espresso'}`}>{index < step ? '✓' : index + 1}</span>{label}
          </button></li>)}
        </ol>
        <div className="mt-6 hidden lg:block"><Mascot pose={complete ? 'review' : step === 0 ? 'search' : step === 1 ? 'journey' : step === 2 ? 'thinking' : step === 3 ? 'savings' : 'calculator'} className="mx-auto w-40" /><p className="mt-2 text-lg text-cocoa">Не нужно разбираться в банковских терминах. Начнём с простого.</p></div>
      </aside>
      <div className="min-w-0 max-w-[770px]">
        <div className="mb-7"><div className="mb-3 flex justify-between gap-3 text-base font-bold text-coffee"><span>{complete ? 'Всё готово' : `Шаг ${step + 1} из 6`}</span><span>{Math.round((complete ? 6 : step) / 6 * 100)}%</span></div><div role="progressbar" aria-label="Заполнение опроса" aria-valuemin={0} aria-valuemax={6} aria-valuenow={complete ? 6 : step} aria-valuetext={complete ? 'Все 6 шагов заполнены' : `Заполнено ${step} из 6 шагов`} className="h-2 overflow-hidden rounded-full bg-oat"><div className="h-full rounded-full bg-forest" style={{ width: `${(complete ? 6 : step) / 6 * 100}%` }} /></div></div>
        {notice && <p role="status" className="mb-5 rounded-control bg-oat px-4 py-3 text-base font-semibold text-espresso">{notice}</p>}
        <h1 ref={heading} tabIndex={-1} className="text-[clamp(30px,4vw,44px)] font-extrabold leading-tight tracking-[-.025em] text-coffee focus-visible:outline-none">{complete ? 'Всё верно? Давайте проверим.' : titles[step]}</h1>
        <p className="mt-3 text-lg text-cocoa">{complete ? 'Ответы собраны в одном месте. Каждый пункт можно изменить.' : descriptions[step]}</p>
        <div className="mb-6 mt-2"><AssistantEntry label={complete ? 'Обсудить ответы' : 'Помочь с ответом'} context={{ screen: 'questionnaire', label: complete ? 'Сводка ответов' : titles[step], step: complete ? undefined : step + 1, field: complete ? undefined : [answers.industry === 'other' ? 'industryDescription' : 'industry', 'legalForm', 'businessAgeMonths', 'purpose', 'principal', 'termMonths'][step], prompts: complete ? ['Что стоит проверить перед подбором?', 'Какие условия влияют на платёж?'] : step === 4 ? ['Как указать сумму своими словами?', 'Как оценить, сколько денег нужно бизнесу?'] : step === 5 ? ['Как срок влияет на ежемесячный платёж?', 'Можно ли указать свой срок?'] : ['Как правильно ответить на этот вопрос?', 'Мне не подходит ни один вариант. Что выбрать?'], data: { answers }, onApply: (field,value) => { if (['principal','termMonths','industryDescription'].includes(field)) update(field as keyof Answers,String(value)); } }} /></div>

        {complete ? <section aria-label="Ваши ответы">
          <dl className="rounded-panel bg-paper px-5 shadow-[0_1px_4px_#30282014] sm:px-7">{steps.map((label, index) => <div key={label} className={`flex items-start justify-between gap-4 py-5 ${index ? 'border-t border-espresso/10' : ''}`}><div className="min-w-0"><dt className="text-base font-semibold text-espresso">{label}</dt><dd className="mt-1 break-words text-lg font-extrabold text-espresso">{values[index]}</dd></div><button type="button" onClick={() => goTo(index)} aria-label={`Изменить: ${label}`} className="inline-flex min-h-11 shrink-0 items-center text-base font-bold text-espresso underline underline-offset-4">Изменить</button></div>)}</dl>
          <div className="mt-6 rounded-panel bg-sage p-5 text-forest"><h2 className="text-lg font-extrabold">Ответы готовы к подбору</h2><p className="mt-2 text-base font-semibold">По ответам подберём продукты и покажем, чем отличаются условия.</p></div>
          <button type="button" className={`${button} mt-6 w-full sm:w-auto`} onClick={() => { if (toRequest(answers)) navigate('/recommendations', { state: { answers } }); }}>Подобрать продукты</button>
        </section> : <form onSubmit={next} noValidate>
          <fieldset><legend className="sr-only">{titles[step]}</legend>
            {step === 0 && <><Choices field="industry" value={answers.industry} choices={industries} error={!!error} onChange={value => update('industry', value)} />{answers.industry === 'other' && <div className="mt-6"><label htmlFor="industryDescription" className="mb-2 block text-base font-bold text-coffee">Чем занимается ваш бизнес?</label><textarea id="industryDescription" rows={3} maxLength={200} value={answers.industryDescription} onChange={event => update('industryDescription', event.target.value)} aria-invalid={!!error} aria-describedby={error ? 'step-error' : undefined} className="w-full resize-y rounded-control border border-coffee/50 bg-paper p-4 text-lg text-espresso" /><p className="mt-2 text-lg text-cocoa">Описание сохраним как ваш ответ в категории «Другая сфера».</p></div>}</>}
            {step === 1 && <Choices field="legalForm" value={answers.legalForm} choices={[{ value: 'ip', label: 'ИП', description: 'Индивидуальный предприниматель', icon: 'person' }, { value: 'ooo', label: 'ООО', description: 'Общество с ограниченной ответственностью', icon: 'company' }]} error={!!error} onChange={value => update('legalForm', value)} />}
            {step === 2 && numberField('businessAgeMonths', 'Возраст бизнеса', 'мес.', [{ value: '6', label: '6 месяцев' }, { value: '12', label: '1 год' }, { value: '24', label: '2 года' }, { value: '36', label: '3 года' }, { value: '60', label: '5 лет' }], 'Если бизнес младше месяца, укажите 0. Доступность продуктов проверяется отдельно.')}
            {step === 3 && <Choices field="purpose" value={answers.purpose} choices={purposes} error={!!error} onChange={value => update('purpose', value)} />}
            {step === 4 && numberField('principal', 'Своя сумма', '₽', [{ value: '300000', label: '300 000 ₽' }, { value: '500000', label: '500 000 ₽' }, { value: '1000000', label: '1 000 000 ₽' }, { value: '2000000', label: '2 000 000 ₽' }, { value: '5000000', label: '5 000 000 ₽' }], 'Можно указать точную сумму с копейками. Например, 1 250 000,50.')}
            {step === 5 && numberField('termMonths', 'Свой срок', 'мес.', [{ value: '6', label: '6 месяцев' }, { value: '12', label: '12 месяцев' }, { value: '24', label: '24 месяца' }, { value: '36', label: '36 месяцев' }, { value: '60', label: '60 месяцев' }], 'Допустимый срок зависит от выбранного продукта. Здесь укажите желаемый.')}
          </fieldset>
          {error && <p id="step-error" role="alert" className="mt-5 rounded-control bg-[var(--errorSurface)] p-4 text-base font-semibold text-[var(--error)]">{error}</p>}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-espresso/15 pt-6">{step > 0 ? <button type="button" onClick={() => goTo(step - 1)} className="inline-flex min-h-14 items-center gap-2 px-2 text-base font-bold text-coffee">Назад</button> : <Link to="/" className="inline-flex min-h-14 items-center px-2 text-base font-bold text-coffee">На главную</Link>}<button type="submit" className={button}>{step === 5 ? 'Проверить ответы' : 'Продолжить'}</button></div>
        </form>}
        {Object.values(answers).some(Boolean) && <details className="mt-7"><summary className="inline-flex min-h-12 items-center text-base font-bold text-coffee underline underline-offset-4">Начать заново</summary><div className="mt-3 rounded-control bg-oat p-4"><p className="text-lg text-espresso">Удалить ответы этого опроса и вернуться к первому шагу?</p><button type="button" onClick={restart} className="mt-3 min-h-12 text-base font-bold text-espresso underline underline-offset-4">Да, очистить ответы</button></div></details>}
        <p role="status" aria-live="polite" className={`mt-7 text-base font-semibold ${storageError ? 'rounded-control bg-oat p-4 text-espresso' : 'text-coffee'}`}>{saveStatus}</p>
      </div>
    </main>
  </div>;
}
