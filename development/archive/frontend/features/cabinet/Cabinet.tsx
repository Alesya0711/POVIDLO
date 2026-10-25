import { Link } from 'react-router';
import { Brand } from '../../../../../src/components/Brand';
import { AssistantEntry } from '../../../../../src/components/Assistant';
import { Mascot } from '../../../../../src/components/Mascot';

export function Cabinet() {
  return <div className="min-h-dvh font-sans text-coffee">
    <header className="border-b border-espresso/10">
      <div className="mx-auto flex min-h-24 max-w-[1120px] items-center justify-between gap-4 px-5 sm:px-8">
        <Brand />
        <Link to="/" className="inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">На главную</Link>
      </div>
    </header>
    <main className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 sm:py-14">
      <nav aria-label="Личный кабинет" className="mb-7 flex flex-wrap gap-3"><Link to="/cabinet" aria-current="page" className="inline-flex min-h-12 items-center justify-center rounded-control bg-forest px-5 py-3 text-base font-bold text-cream">Мои заявки</Link><Link to="/profile" className="inline-flex min-h-12 items-center justify-center rounded-control bg-oat px-5 py-3 text-base font-bold text-coffee">Профиль</Link></nav>
      <p className="text-base font-bold text-forest">Личный кабинет</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">Мои заявки</h1>
      <p className="mt-4 max-w-2xl text-lg text-cocoa">Здесь можно будет следить за рассмотрением и возвращаться к оформлению.</p>
      <section aria-labelledby="cabinet-preview-title" className="mt-7 rounded-panel bg-oat p-5">
        <h2 id="cabinet-preview-title" className="text-base font-extrabold">Предпросмотр кабинета</h2>
        <p className="mt-1 text-base font-semibold">Вход и получение заявок пока не подключены. Ниже — пример пустого состояния, а не сведения о ваших заявках.</p>
      </section>
      <section aria-labelledby="empty-title" className="mt-8 grid items-center gap-6 rounded-panel bg-paper px-6 py-8 sm:px-10 md:grid-cols-[1fr_280px] md:gap-10 md:py-12">
        <div>
          <h2 id="empty-title" className="max-w-lg text-3xl font-extrabold leading-tight tracking-[-.025em] sm:text-4xl">Следующий шаг<br />для вашего дела</h2>
          <p className="mt-4 max-w-lg text-lg text-cocoa">Начните с подбора финансирования. Ответьте на несколько вопросов о бизнесе и посмотрите подходящие направления.</p>
          <Link to="/select" className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-control bg-forest px-6 py-4 text-center text-base font-bold text-cream transition-transform active:scale-95 motion-reduce:transform-none sm:w-auto">Подобрать финансирование</Link>
          <div className="mt-3"><AssistantEntry context={{ screen: 'cabinet', label: 'Помощь с заявками', prompts: ['Как подготовиться к первой заявке?', 'Чем подбор отличается от заявки?', 'Какие этапы проходит рассмотрение?'], data: { mode: 'empty-preview' } }} /></div>
        </div>
        <Mascot pose="journey" alt="Капибанкир отправляется в путь с картой и рюкзаком" className="mx-auto w-full max-w-[220px] md:max-w-[280px]" />
      </section>
      <section aria-labelledby="example-application" className="mt-8 border-t border-espresso/15 pt-6"><h2 id="example-application" className="text-xl font-extrabold">Как выглядит рассмотрение</h2><p className="mt-2 max-w-xl text-base font-semibold">Отдельный демопример: статус, этапы и запрос сведений. Это не ваша отправленная заявка.</p><Link to="/applications/demo-application-1" className="mt-3 inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">Посмотреть пример заявки</Link><div className="mt-3"><Link to="/bank/applications" className="inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">Открыть демоочередь банка</Link></div></section>
    </main>
  </div>;
}
