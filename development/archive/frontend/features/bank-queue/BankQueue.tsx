import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Brand } from '../../../../../src/components/Brand';
import { Mascot } from '../../../../../src/components/Mascot';
import { detailStates } from '../application-details/fixtures';
import { money } from '../recommendations/fixtures';
import { queueItems } from './fixtures';

const action = 'inline-flex min-h-12 items-center justify-center rounded-control px-5 py-3 text-base font-bold transition-transform active:scale-95 motion-reduce:transform-none';
const width = 'mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12';

export function BankQueue() {
  const [params, setParams] = useSearchParams();
  const [expanded, setExpanded] = useState<string | null>(null);
  const search = (params.get('search') ?? '').slice(0, 100);
  const rawStatus = params.get('status') ?? '';
  const status = Object.hasOwn(detailStates, rawStatus) ? rawStatus : '';
  const query = search.trim().toLocaleLowerCase('ru-RU');
  const visible = queueItems.filter(item => (!status || item.status === status) && [item.company, item.label, item.id].some(value => value.toLocaleLowerCase('ru-RU').includes(query)));
  function update(key: string, value: string, replace = false) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace, preventScrollReset: true });
  }
  return <div className="min-h-dvh font-sans text-coffee">
    <header className="border-b border-espresso/10"><div className={`${width} flex min-h-24 items-center justify-between gap-4`}><Brand /><Link to="/cabinet" className="inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">Кабинет</Link></div></header>
    <main className={`${width} py-8 sm:py-12`}>
      <p className="text-base font-bold text-forest">Кабинет сотрудника · Деморежим</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">Очередь заявок</h1>
      <p className="mt-4 max-w-2xl text-lg text-cocoa">Найдите заявку и посмотрите её параметры. Статус помогает понять, на каком этапе находится рассмотрение.</p>
      <aside className="mt-6 rounded-panel bg-oat p-5 text-base font-semibold"><p className="font-extrabold">Демонстрационная очередь</p><p className="mt-1">Все компании и заявки вымышленные. Вход сотрудника и загрузка с сервера пока не подключены. Просмотр этой страницы не предоставляет прав сотрудника и не меняет решения по заявкам.</p></aside>
      <section aria-label="Поиск и фильтры" className="mt-8"><div className="grid gap-5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"><div><label htmlFor="queue-search" className="text-base font-bold">Компания или номер заявки</label><input id="queue-search" type="search" maxLength={100} value={search} onChange={event => update('search', event.target.value, true)} placeholder="Например, ДЕМО-001" className="mt-2 min-h-14 w-full rounded-control border border-coffee/50 bg-paper px-4 text-lg text-espresso" /></div><div><label htmlFor="queue-status" className="text-base font-bold">Статус заявки</label><select id="queue-status" value={status} onChange={event => update('status', event.target.value)} className="mt-2 min-h-14 w-full rounded-control border border-coffee/50 bg-paper px-4 text-lg text-espresso"><option value="">Все статусы</option>{Object.entries(detailStates).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></div></div></section>
      <section aria-labelledby="queue-results" className="mt-6"><div className="flex min-h-12 flex-wrap items-center justify-between gap-3"><h2 id="queue-results" aria-live="polite" aria-atomic="true" className="text-xl font-extrabold">Заявок: {visible.length}</h2>{(search || status) && <button type="button" onClick={() => setParams({})} className="min-h-12 text-base font-bold underline underline-offset-4">Сбросить фильтры</button>}</div>
        {visible.length ? <ul className="mt-4 divide-y divide-espresso/15 border-y border-espresso/15">{visible.map(item => {
          const open = expanded === item.id;
          return <li key={item.id} className="py-6"><article aria-labelledby={`queue-title-${item.id}`}>
            <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div className="min-w-0"><p className="text-base font-semibold">{item.label} · {item.legalForm}</p><h3 id={`queue-title-${item.id}`} className="mt-1 break-words text-xl font-extrabold tracking-[-.012em]">{item.company}</h3></div>
              <dl><dt className="text-base font-semibold">Запрошено</dt><dd className="mt-1 break-words text-lg font-bold tabular-nums">{money(item.principal)}</dd><dd className="text-base font-semibold">На {item.termMonths} мес.</dd></dl>
              <div><p className="text-base font-semibold">Статус</p><p className={`mt-1 inline-flex max-w-full rounded-control px-3 py-2 text-base font-bold ${item.status === 'needs_info' ? 'bg-sage text-forest' : 'bg-oat text-coffee'}`}>{detailStates[item.status].label}</p></div>
              <button type="button" onClick={() => setExpanded(open ? null : item.id)} aria-expanded={open} aria-controls={`queue-details-${item.id}`} aria-label={`${open ? 'Скрыть' : 'Показать'} сведения ${item.label}`} className={`${action} w-full bg-paper text-coffee sm:w-fit`}>{open ? 'Скрыть' : 'Сведения'} <span className="ml-2" aria-hidden="true">{open ? '−' : '+'}</span></button>
            </div>
            <div id={`queue-details-${item.id}`} hidden={!open} className="mt-5 rounded-panel bg-paper p-5"><h4 className="text-lg font-extrabold">Параметры запроса</h4><dl className="mt-3 grid gap-4 text-base sm:grid-cols-2"><div><dt className="font-semibold">Цель финансирования</dt><dd className="mt-1 font-bold">{item.purpose}</dd></div><div><dt className="font-semibold">Номер примера</dt><dd className="mt-1 break-words font-bold">{item.label}</dd></div></dl><p id={`queue-action-${item.id}`} className="mt-4 text-base font-semibold">Откройте карточку, чтобы посмотреть примеры проверок и подготовить уточнение или решение. Отправка отключена.</p><Link to={`/bank/applications/${item.id}`} state={{ queueSearch: search, queueStatus: status }} aria-describedby={`queue-action-${item.id}`} className={`${action} mt-4 bg-forest text-cream`}>Перейти к рассмотрению</Link></div>
          </article></li>;
        })}</ul> : <div className="mt-5 rounded-panel bg-paper p-6 sm:p-8"><Mascot pose="search" className="mb-4 w-24" /><h3 className="text-2xl font-extrabold">По этим фильтрам заявок нет</h3><p className="mt-3 text-lg text-cocoa">Попробуйте другое название, номер или статус.</p><button type="button" onClick={() => setParams({})} className={`${action} mt-5 bg-forest text-cream`}>Показать все заявки</button></div>}
      </section>
    </main>
  </div>;
}
