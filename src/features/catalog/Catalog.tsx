import { useApi, ErrorNotice } from '../../integration/api';
import type { Product } from '../../lib/products';
import { Link, useSearchParams } from 'react-router';
import { Mascot } from '../../components/Mascot';
import { Brand } from '../../components/Brand';
import { AssistantEntry } from '../../components/Assistant';
import { purposes } from '../questionnaire/model';
import { money, rate } from '../../lib/products';

const action = 'inline-flex min-h-12 items-center justify-center rounded-control px-5 py-3 text-base font-bold transition-transform active:scale-95 motion-reduce:transform-none';

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const search = (params.get('search') ?? '').slice(0, 100);
  const purpose = purposes.some(item => item.value === params.get('purpose')) ? params.get('purpose')! : '';
  const filters = new URLSearchParams();
  if (search) filters.set('search', search); if (purpose) filters.set('purpose', purpose);
  const resource = useApi<{items: Product[]}>(`/products?${filters}`);
  const visible = resource.data?.items ?? [];
  function update(key: string, value: string, replace = false) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace, preventScrollReset: true });
  }

  return <div className="min-h-dvh font-sans text-coffee">
    <header className="border-b border-espresso/10"><div className="mx-auto flex min-h-24 max-w-[1120px] items-center justify-between gap-4 px-5 sm:px-8"><Brand /><Link to="/" className="inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">На главную</Link></div></header>
    <main className="mx-auto max-w-[1120px] px-5 py-9 sm:px-8 sm:py-12">
      <p className="text-base font-bold text-forest">Финансирование для бизнеса</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">Продукты для вашего дела</h1>
      <p className="mt-4 max-w-2xl text-lg text-cocoa">Посмотрите условия самостоятельно или начните с нескольких вопросов о бизнесе.</p>
      <Link to="/select" className={`${action} mt-5 bg-forest text-cream`}>Помочь с подбором</Link>
      <section aria-label="Поиск и фильтры" className="mt-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor="catalog-search" className="text-base font-bold">Название продукта</label><input id="catalog-search" type="search" maxLength={100} value={search} onChange={event => update('search', event.target.value, true)} className="mt-2 min-h-14 w-full rounded-control border border-coffee/50 bg-paper px-4 text-lg text-espresso" /></div>
          <div><label htmlFor="catalog-purpose" className="text-base font-bold">Цель финансирования</label><select id="catalog-purpose" value={purpose} onChange={event => update('purpose', event.target.value)} className="mt-2 min-h-14 w-full rounded-control border border-coffee/50 bg-paper px-4 text-lg text-espresso"><option value="">Все цели</option>{purposes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-5"><AssistantEntry label="Помочь с выбором" context={{ screen: 'catalog', label: 'Выбор продукта в каталоге', prompts: ['Какую цель финансирования выбрать?', 'Чем отличаются продукты в этом списке?', 'Какие условия проверить перед заявкой?'], data: { mode: 'synthetic-api', status: resource.loading ? 'loading' : resource.error ? 'error' : 'ready', search, purpose, products: visible.map(product => ({ ...product })) } }} />{(search || purpose) && <button type="button" onClick={() => setParams({})} className="min-h-12 text-base font-bold underline underline-offset-4">Сбросить фильтры</button>}</div>
      </section>
      <section aria-labelledby="catalog-results" className="mt-5">
        <h2 id="catalog-results" aria-live="polite" aria-atomic="true" className="text-xl font-extrabold">Найдено продуктов: {visible.length}</h2>
        {resource.loading ? <p role="status" className="py-6">Загружаем продукты…</p> : resource.error ? <ErrorNotice error={resource.error} retry={resource.refresh}/> : visible.length ? <ul className="mt-4 divide-y divide-espresso/15">{visible.map(product => <li key={product.id} className="py-7 first:pt-3">
          <article aria-labelledby={`title-${product.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-base font-semibold text-coffee">{product.isUniversal ? 'Для разных задач бизнеса' : purposes.find(item => item.value === product.purposeCategories[0])?.label}</p><h3 id={`title-${product.id}`} className="mt-1 text-2xl font-extrabold tracking-[-.012em] sm:text-3xl">{product.name}</h3></div><p className="text-2xl font-extrabold text-forest">{rate(product.annualRate)} <span className="text-base font-semibold">годовых</span></p></div>
            <dl className="mt-5 grid gap-4 text-base sm:grid-cols-3"><div><dt className="font-semibold">Сумма</dt><dd className="mt-1 font-bold tabular-nums">{money(product.minimumPrincipal)} — {money(product.maximumPrincipal)}</dd></div><div><dt className="font-semibold">Срок</dt><dd className="mt-1 font-bold">{product.minimumTermMonths}–{product.maximumTermMonths} месяцев</dd></div><div><dt className="font-semibold">Возраст бизнеса</dt><dd className="mt-1 font-bold">От {product.minimumBusinessAgeMonths} месяцев</dd></div></dl>
            <Link to={`/products/${product.id}`} aria-label={`Условия продукта ${product.name}`} className={`${action} mt-5 bg-oat text-coffee`}>Условия и расчёт</Link>
          </article>
        </li>)}</ul> : <div className="mt-5 rounded-panel bg-paper p-6 sm:p-8"><Mascot pose="search" className="mb-4 w-28" /><h3 className="text-2xl font-extrabold">Такие продукты не найдены</h3><p className="mt-3 text-lg text-cocoa">Попробуйте другое название или измените цель финансирования.</p><button type="button" onClick={() => setParams({})} className={`${action} mt-5 bg-forest text-cream`}>Показать все продукты</button></div>}
      </section>
    </main>
  </div>;
}
