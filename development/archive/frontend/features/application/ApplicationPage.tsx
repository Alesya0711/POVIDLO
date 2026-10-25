import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Mascot } from '../../../../../src/components/Mascot';
import { Brand } from '../../../../../src/components/Brand';
import { AssistantEntry } from '../../../../../src/components/Assistant';
import { purposes, normalizeMoney } from '../../../../../src/features/questionnaire/model';
import { exampleTerms, findDemoProduct, money, rate } from '../recommendations/fixtures';
import type { DemoProduct } from '../recommendations/fixtures';
import { validateApplication } from './model';
import type { ApplicationValues, ApplicationErrors } from './model';

const action = 'inline-flex min-h-12 items-center justify-center rounded-control px-5 py-3 text-base font-bold transition-transform active:scale-95 motion-reduce:transform-none';
const control = 'mt-2 min-h-14 w-full rounded-control border border-coffee/50 bg-paper px-4 py-3 text-lg text-espresso';
const width = 'mx-auto max-w-[1120px] px-5 sm:px-8';

export function ApplicationRoute() {
  const [params] = useSearchParams();
  const product = findDemoProduct(params.get('productId') ?? '');
  const principal = (params.get('principal') ?? exampleTerms.principal).slice(0, 30);
  const termMonths = (params.get('termMonths') ?? String(exampleTerms.termMonths)).slice(0, 6);
  if (!product) return <div className="min-h-dvh font-sans text-coffee"><header className={`${width} py-6`}><Brand /></header><main className={`${width} py-10`}><h1 className="text-4xl font-extrabold tracking-[-.025em]">Сначала выберем продукт</h1><p className="mt-5 max-w-xl text-lg text-cocoa">Чтобы перейти к оформлению, откройте условия продукта и укажите сумму и срок.</p><Link to="/products" className={`${action} mt-6 bg-forest text-cream`}>В каталог продуктов</Link></main></div>;
  return <ApplicationPage key={`${product.id}:${principal}:${termMonths}`} product={product} principal={principal} termMonths={termMonths} />;
}

function ApplicationPage({ product, principal, termMonths }: { product: DemoProduct; principal: string; termMonths: string }) {
  const [values, setValues] = useState<ApplicationValues>({ company: '', legalForm: '', email: '', purpose: product.purposeCategories.length === 1 ? product.purposeCategories[0] : '', principal, termMonths, comment: '' });
  const [errors, setErrors] = useState<ApplicationErrors>({});
  const [review, setReview] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const previousStep = useRef(false);
  useEffect(() => { if (previousStep.current !== review) { heading.current?.focus(); previousStep.current = review; } }, [review]);
  function update(field: keyof ApplicationValues, value: string) {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const next = validateApplication(values, product);
    setErrors(next);
    const first = (Object.keys(values) as (keyof ApplicationValues)[]).find(field => next[field]);
    if (first) { form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return; }
    setReview(true);
  }
  function error(field: keyof ApplicationValues) { return errors[field] ? <p id={`application-${field}-error`} className="mt-2 text-base font-bold text-coffee">{errors[field]}</p> : null; }
  function attrs(field: keyof ApplicationValues) { return { id: `application-${field}`, name: field, 'aria-invalid': Boolean(errors[field]), 'aria-describedby': errors[field] ? `application-${field}-error` : undefined }; }
  const purposeLabel = purposes.find(item => item.value === values.purpose)?.label ?? '';

  return <div className="min-h-dvh font-sans text-coffee">
    <header className="border-b border-espresso/10"><div className={`${width} flex min-h-24 items-center justify-between gap-4`}><Brand /><Link to={`/products/${product.id}`} className="inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">К продукту</Link></div></header>
    <main className={`${width} py-8 sm:py-12`}>
      <ol aria-label="Этапы оформления" className="flex flex-wrap gap-3 text-base font-bold"><li aria-current={!review ? 'step' : undefined} className={!review ? 'text-forest' : 'text-coffee'}>1. Сведения</li><li aria-current={review ? 'step' : undefined} className={review ? 'text-forest' : 'text-coffee'}>2. Проверка</li></ol>
      <h1 ref={heading} tabIndex={-1} className="mt-4 text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">{review ? 'Всё ли верно?' : 'Заявка для вашего дела'}</h1>
      <aside className="mt-6 rounded-panel bg-oat p-5 text-base font-semibold"><p className="font-extrabold">Предпросмотр оформления</p><p className="mt-1">Используйте вымышленные данные. Отправка пока не подключена, заявка не создаётся. Поля сохраняются только до ухода с этой страницы; после обновления сведения компании нужно ввести заново.</p></aside>
      <div className="mt-8 grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label={review ? 'Проверка сведений' : 'Сведения для заявки'} className="min-w-0 rounded-panel bg-paper p-5 sm:p-7">
          {review ? <div>
            <h2 className="text-2xl font-extrabold">Сведения о бизнесе</h2>
            <dl className="mt-5 space-y-5 text-lg"><div><dt className="text-base font-semibold">Компания или ИП</dt><dd className="break-words font-bold">{values.company.trim()}</dd></div><div><dt className="text-base font-semibold">Правовая форма</dt><dd className="font-bold">{values.legalForm === 'ip' ? 'ИП' : 'ООО'}</dd></div><div><dt className="text-base font-semibold">Контактная почта</dt><dd className="break-words font-bold">{values.email.trim()}</dd></div><div><dt className="text-base font-semibold">Цель</dt><dd className="font-bold">{purposeLabel}</dd></div>{values.comment.trim() && <div><dt className="text-base font-semibold">Комментарий</dt><dd className="whitespace-pre-wrap break-words">{values.comment.trim()}</dd></div>}</dl>
            <button type="button" onClick={() => setReview(false)} className={`${action} mt-6 bg-oat text-coffee`}>Изменить сведения</button>
            <div className="mt-7 border-t border-espresso/15 pt-6"><p id="application-send-status" className="text-base font-semibold">Отправка станет доступна после подключения сервиса. Проверка полей не означает одобрение или проверку компании.</p><button type="button" disabled aria-describedby="application-send-status" className={`${action} mt-4 w-full cursor-not-allowed bg-oat text-coffee`}>Отправить заявку</button></div>
          </div> : <form ref={form} onSubmit={submit} noValidate className="space-y-5">
            <h2 className="text-2xl font-extrabold">Расскажите о компании</h2>
            <div><label htmlFor="application-company" className="text-base font-bold">Компания или имя ИП</label><input {...attrs('company')} value={values.company} onChange={event => update('company', event.target.value)} maxLength={150} autoComplete="organization" required className={control} />{error('company')}</div>
            <div><label htmlFor="application-legalForm" className="text-base font-bold">Правовая форма</label><select {...attrs('legalForm')} value={values.legalForm} onChange={event => update('legalForm', event.target.value)} required className={control}><option value="">Выберите форму</option>{product.legalForms.map(value => <option key={value} value={value}>{value === 'ip' ? 'ИП' : 'ООО'}</option>)}</select>{error('legalForm')}</div>
            <div><label htmlFor="application-email" className="text-base font-bold">Контактная почта</label><input {...attrs('email')} type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} value={values.email} onChange={event => update('email', event.target.value)} required className={control} />{error('email')}</div>
            <h2 className="pt-3 text-2xl font-extrabold">Параметры финансирования</h2>
            <div><label htmlFor="application-purpose" className="text-base font-bold">Цель</label><select {...attrs('purpose')} value={values.purpose} onChange={event => update('purpose', event.target.value)} required className={control}><option value="">Выберите цель</option>{purposes.filter(item => product.purposeCategories.includes(item.value)).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{error('purpose')}</div>
            <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="application-principal" className="text-base font-bold">Сумма, ₽</label><input {...attrs('principal')} inputMode="decimal" maxLength={30} value={values.principal} onChange={event => update('principal', event.target.value)} required className={`${control} tabular-nums`} />{error('principal')}</div><div><label htmlFor="application-termMonths" className="text-base font-bold">Срок, месяцы</label><input {...attrs('termMonths')} inputMode="numeric" maxLength={6} value={values.termMonths} onChange={event => update('termMonths', event.target.value)} required className={control} />{error('termMonths')}</div></div>
            <div><label htmlFor="application-comment" className="text-base font-bold">Комментарий <span className="font-semibold">· необязательно</span></label><textarea {...attrs('comment')} rows={3} maxLength={500} value={values.comment} onChange={event => update('comment', event.target.value)} className={`${control} resize-y`} /><p className="mt-1 text-base font-semibold">До 500 символов. Не указывайте паспортные данные или реквизиты.</p>{error('comment')}</div>
            <button type="submit" className={`${action} w-full bg-forest text-cream`}>Проверить сведения</button>
          </form>}
        </section>
        <aside aria-label="Выбранный продукт" className="min-w-0 rounded-panel bg-sage p-5 text-forest sm:p-6">
          <Mascot pose="review" className="mx-auto mb-4 w-36" /><p className="text-base font-bold">Демонстрационный продукт</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-.012em]">{product.name}</h2><p className="mt-4 text-3xl font-extrabold">{rate(product.annualRate)} <span className="text-base font-semibold">годовых</span></p>
          <dl className="mt-5 space-y-4 text-base"><div><dt className="font-semibold">Сумма</dt><dd className="break-words text-lg font-bold">{normalizeMoney(values.principal) ? money(normalizeMoney(values.principal)!) : 'Не указана корректно'}</dd></div><div><dt className="font-semibold">Срок</dt><dd className="break-words text-lg font-bold">{/^\d+$/.test(values.termMonths.trim()) ? `${values.termMonths} мес.` : 'Не указан корректно'}</dd></div></dl>
          <p className="mt-5 text-base font-semibold">Допустимо: {money(product.minimumPrincipal)}–{money(product.maximumPrincipal)}, {product.minimumTermMonths}–{product.maximumTermMonths} мес. Итоговых условий банка пока нет.</p>
          <div className="mt-4 rounded-control bg-cream px-3"><AssistantEntry label="Помочь с оформлением" context={{ screen: 'application', resourceId: product.id, field: review ? 'review' : 'details', label: review ? 'Проверка перед отправкой' : 'Заполнение заявки', prompts: ['Как выбрать цель заявки?', 'Что проверить перед отправкой?', 'Что будет после подачи заявки?'], data: { productId: product.id, principal: values.principal, termMonths: values.termMonths, purpose: values.purpose, mode: 'form-preview' } }} /></div>
        </aside>
      </div>
    </main>
  </div>;
}
