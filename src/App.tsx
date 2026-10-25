import { Cabinet, Profile, ApplicationRoute, ApplicationDetailsRoute, ContractRoute } from './integration/ClientPages';
import { BankQueue, BankReviewRoute } from './integration/StaffPages';
import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router';
import { Brand } from './components/Brand';
import { Questionnaire } from './features/questionnaire/Questionnaire';
import { Recommendations } from './features/recommendations/Recommendations';
import { AssistantEntry } from './components/Assistant';
import { Catalog } from './features/catalog/Catalog';
import { AuthPage } from './features/auth/AuthPage';
import { ProductRoute } from './features/product/ProductPage';
import welcomeMascot from '../assets/mascot/kapibankir-welcome-v1.png';

const action = 'inline-flex min-h-14 items-center justify-center gap-5 rounded-control bg-forest px-7 py-4 text-base font-bold text-cream transition-transform duration-150 hover:-translate-y-0.5 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none';
const width = 'mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12';


function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="relative z-10 border-b border-espresso/10 bg-cream">
    <div className={`${width} flex min-h-24 items-center gap-3 sm:gap-6 lg:gap-10`}>
      <Brand />
      <nav aria-label="Главное меню" className="hidden items-center gap-7 md:flex">
        <a className="inline-flex min-h-12 items-center text-base font-bold text-coffee underline-offset-8 hover:underline" href="#financing">Для бизнеса</a>
        <a className="inline-flex min-h-12 items-center text-base font-bold text-coffee underline-offset-8 hover:underline" href="#how-it-works">Как это работает</a>
      </nav>
      <Link to="/cabinet" className="hidden min-h-12 items-center text-base font-bold text-coffee underline underline-offset-4 md:inline-flex">Мои заявки</Link>
      <span className="ml-auto hidden text-base font-semibold text-coffee lg:block">На стороне вашего дела</span>
      <Link to="/login" className="ml-auto hidden min-h-12 items-center gap-2 rounded-control bg-oat px-5 text-base font-bold text-coffee sm:inline-flex lg:ml-0">Войти</Link>
      <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'} className="ml-auto flex size-12 shrink-0 items-center justify-center rounded-control text-forest transition-transform active:scale-95 motion-reduce:transform-none sm:ml-0 md:hidden">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">{menuOpen ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 8h16M4 16h16" />}</svg>
      </button>
    </div>
    {menuOpen && <nav id="mobile-navigation" aria-label="Мобильное меню" className={`${width} flex flex-col gap-1 pb-5 md:hidden`}>
      <a onClick={() => setMenuOpen(false)} href="#financing" className="py-3 text-base font-bold text-coffee">Для бизнеса</a>
      <a onClick={() => setMenuOpen(false)} href="#how-it-works" className="py-3 text-base font-bold text-coffee">Как это работает</a>
      <Link onClick={() => setMenuOpen(false)} to="/cabinet" className="py-3 text-base font-bold text-coffee">Мои заявки</Link>
      <Link to="/login" onClick={() => setMenuOpen(false)} className="mt-2 inline-flex min-h-12 w-fit items-center rounded-control bg-oat px-5 text-base font-bold text-coffee sm:hidden">Войти</Link>
    </nav>}
  </header>;
}

function Hero() {
  return <section aria-labelledby="hero-title" className={`${width} grid items-center gap-10 pb-12 pt-10 md:grid-cols-[1.12fr_1fr] md:gap-6 md:pb-16 md:pt-14 lg:gap-12 lg:pt-18`}>
    <div>
      <p className="mb-5 inline-flex items-center gap-2.5 text-base font-bold text-coffee"><span className="size-2 rounded-full bg-forest" aria-hidden="true" /> Для тех, кто делает своё дело</p>
      <h1 id="hero-title" className="max-w-[670px] text-[clamp(40px,5.2vw,70px)] font-extrabold leading-[1.06] tracking-[-.045em] text-coffee">Большие планы.<br /><span className="text-forest">Спокойный старт.</span></h1>
      <p className="mt-6 max-w-[490px] text-lg leading-relaxed text-cocoa">Подберите вариант для своего дела, сравните условия и разберитесь, какой шаг будет следующим.</p>
      <Link to="/select" className={`${action} mt-8 w-full sm:w-auto`}>Подобрать финансирование</Link>
      <p className="mt-4 flex items-center justify-center gap-2 text-base font-semibold text-coffee sm:justify-start"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg> Начните без регистрации</p>
      <div className="mt-2 flex justify-center sm:justify-start"><AssistantEntry context={{ screen: 'home', label: 'С чего начать финансирование', prompts: ['Как проходит подбор финансирования?', 'Какие сведения о бизнесе понадобятся?', 'Чем подбор отличается от одобрения?'] }} /></div>
    </div>
    <figure className="relative mx-auto w-full max-w-[490px] pb-8 pt-2 md:pt-8">
      <div className="absolute inset-x-3 bottom-12 top-12 rounded-[45%_45%_24px_24px] bg-sage" aria-hidden="true" />
      <img src={welcomeMascot} width="1312" height="1199" fetchPriority="high" alt="Капибанкир, карамельная капибара в шалфейном жилете, приветствует вас" className="relative mx-auto h-auto w-[92%] max-w-[430px] object-contain" />
      <figcaption className="relative -mt-3 ml-auto flex w-fit max-w-[95%] items-center gap-4 rounded-panel bg-paper px-5 py-4 shadow-[0_3px_18px_#30282012] sm:mr-2">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sage text-xl text-forest" aria-hidden="true">✦</span>
        <span><strong className="block text-base font-extrabold text-espresso">Капибанкир</strong><span className="block text-base font-semibold text-espresso">Поможет во всём разобраться</span></span>
      </figcaption>
    </figure>
  </section>;
}

const steps = [
  { number: '01', title: 'Расскажите о бизнесе', text: 'Чем занимаетесь, на что нужны деньги и какие условия вам удобны.' },
  { number: '02', title: 'Сравните варианты', text: 'Сравните продукты, платёж и общую сумму возврата.' },
  { number: '03', title: 'Отправьте заявку', text: 'Дополните сведения и следите за рассмотрением в одном кабинете.' },
];

function HowItWorks() {
  return <section id="how-it-works" aria-labelledby="steps-title" className={`${width} pb-16 pt-5 lg:pb-20`}>
    <div className="mb-8 flex flex-col justify-between gap-3 border-t border-espresso/15 pt-10 sm:flex-row sm:items-end">
      <h2 id="steps-title" className="max-w-[500px] text-3xl font-extrabold leading-tight tracking-[-.025em] text-coffee sm:text-4xl">От идеи до заявки.<br />Без лишних кругов.</h2>
      <p className="max-w-[290px] text-lg text-cocoa">Три шага, чтобы разобраться с финансированием.</p>
    </div>
    <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
      {steps.map(step => <li key={step.number} className="relative pt-3">
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-oat text-lg font-extrabold text-espresso">{step.number}</span>
        <h3 className="mb-2 text-[22px] font-extrabold tracking-[-.012em] text-coffee">{step.title}</h3>
        <p className="max-w-[330px] text-lg text-cocoa">{step.text}</p>
      </li>)}
    </ol>
  </section>;
}

const goals = [
  { id: 'working-capital', number: '01', title: 'На ежедневные задачи', hint: 'Оборотные средства', description: 'Закупить товар, рассчитаться с поставщиками или подготовиться к сезону. Оборотное финансирование помогает поддерживать текущую работу бизнеса.' },
  { id: 'equipment', number: '02', title: 'На новое оборудование', hint: 'Техника и производство', description: 'Обновить станки, оснастить мастерскую или приобрести технику. Сравните стоимость оборудования с будущим платежом и доходами бизнеса.' },
  { id: 'growth', number: '03', title: 'На следующий большой шаг', hint: 'Развитие бизнеса', description: 'Открыть новую точку, расширить производство или запустить направление. Для такого плана важно заранее определить бюджет и срок финансирования.' },
];

function Financing() {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  return <section id="financing" aria-labelledby="financing-title" className="bg-forest py-12 text-cream lg:py-16">
    <div className={`${width} grid gap-9 lg:grid-cols-[.8fr_1.2fr] lg:gap-16`}>
      <div>
        <p className="mb-4 text-base font-bold">У каждого дела свой путь</p>
        <h2 id="financing-title" className="max-w-[390px] text-4xl font-extrabold leading-[1.15] tracking-[-.025em]">Что вы планируете<br />для бизнеса?</h2>
        <p className="mt-5 max-w-[365px] text-lg leading-relaxed">Начните с цели. Она поможет понять, какое финансирование искать и что учесть при выборе.</p>
        <Link to="/products" className="mt-5 inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">Посмотреть все продукты</Link>
      </div>
      <div className="overflow-hidden rounded-panel bg-cream text-espresso">
        {goals.map((goal, index) => {
          const expanded = selectedGoal === goal.id;
          return <div key={goal.id} className={index > 0 ? 'border-t border-espresso/15' : ''}>
            <h3><button type="button" aria-expanded={expanded} aria-controls={`goal-${goal.id}`} onClick={() => setSelectedGoal(expanded ? null : goal.id)} className="flex min-h-[116px] w-full items-center gap-4 px-5 py-6 text-left transition-transform active:scale-[.98] motion-reduce:transform-none sm:gap-5 sm:px-7">
              <span className="text-base font-bold text-coffee">{goal.number}</span>
              <span className="flex-1"><span className="block text-base font-semibold text-coffee">{goal.hint}</span><span className="mt-1 block text-xl font-extrabold tracking-[-.012em] text-coffee sm:text-[23px]">{goal.title}</span></span>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-oat text-espresso"><svg className={`transition-transform duration-150 motion-reduce:transition-none ${expanded ? 'rotate-45' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></span>
            </button></h3>
            <div id={`goal-${goal.id}`} hidden={!expanded} className="px-5 pb-7 text-lg text-cocoa sm:pl-[66px] sm:pr-7">{goal.description}</div>
          </div>;
        })}
      </div>
    </div>
  </section>;
}

function Questions() {
  return <section aria-labelledby="questions-title" className={`${width} grid gap-7 py-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-16 lg:py-18`}>
    <div><p className="mb-3 text-base font-bold text-coffee">Можно по-простому?</p><h2 id="questions-title" className="text-3xl font-extrabold leading-tight tracking-[-.025em] text-coffee sm:text-4xl">Конечно.<br />Вот что важно знать.</h2></div>
    <div>
      {[
        ['Нужно ли регистрироваться для подбора?', 'Начать подбор можно без аккаунта. Личный кабинет понадобится при отправке заявки, чтобы сохранять её и следить за рассмотрением.'],
        ['Подбор означает одобрение?', 'Подбор помогает найти продукт под задачу бизнеса. Решение по заявке принимается отдельно после проверки сведений и условий.'],
        ['Что будет после отправки заявки?', 'В личном кабинете вы увидите этап рассмотрения и сможете ответить на запрос дополнительных сведений.'],
      ].map(([question, answer]) => <details key={question} className="group border-b border-espresso/15">
        <summary className="flex min-h-20 list-none items-center justify-between gap-5 py-5 text-lg font-extrabold text-coffee"><span>{question}</span><span aria-hidden="true" className="text-2xl font-normal group-open:hidden">+</span><span aria-hidden="true" className="hidden text-2xl font-normal group-open:block">−</span></summary>
        <p className="pb-6 pr-7 text-lg text-cocoa">{answer}</p>
      </details>)}
    </div>
  </section>;
}

function Footer() {
  return <footer className="border-t border-espresso/15 pb-7 pt-8">
    <div className={width}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><Brand /><p className="text-base font-bold text-coffee">Спокойно. Понятно. По делу.</p></div>
      <p className="mt-5 text-base font-semibold text-coffee">© 2026 Капибанк</p>
    </div>
  </footer>;
}

function HomePage() {
  return <div id="top" className="font-sans">
    <a href="#main" className="fixed left-5 top-3 z-50 -translate-y-24 rounded-control bg-forest px-5 py-3 text-base font-bold text-cream focus:translate-y-0">Перейти к содержимому</a>
    <Header />
    <main id="main"><Hero /><HowItWorks /><Financing /><Questions /></main>
    <Footer />
  </div>;
}

export function App() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const anchor = hash ? document.getElementById(hash.slice(1)) : null;
    if (anchor) anchor.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = pathname === '/bank/applications' ? 'Очередь заявок | Капибанк' : pathname.startsWith('/bank/applications/') ? 'Рассмотрение заявки | Капибанк' : pathname.endsWith('/contract') ? 'Сводка условий | Капибанк' : pathname === '/profile' ? 'Профиль | Капибанк' : pathname === '/applications/new' ? 'Оформление заявки | Капибанк' : pathname.startsWith('/applications/') ? 'Карточка заявки | Капибанк' : pathname === '/products' ? 'Каталог продуктов | Капибанк' : pathname === '/login' ? 'Вход и регистрация | Капибанк' : pathname === '/cabinet' ? 'Мои заявки | Капибанк' : pathname.startsWith('/products/') ? 'Продукт | Капибанк' : pathname === '/recommendations' ? 'Предложения | Капибанк' : pathname === '/select' ? 'Подбор финансирования | Капибанк' : 'Капибанк | Финансирование без суеты';
  }, [pathname, hash]);
  return <>
    <p role="note" className="border-b border-espresso/15 bg-oat px-5 py-3 text-center text-sm font-semibold text-coffee">Сервис демонстрационный: сведения и банковские действия моделируются. Реальные кредиты и переводы недоступны, а подписание не создаёт юридических обязательств.</p>
    <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/bank/applications/:applicationId" element={<BankReviewRoute />} />
    <Route path="/bank/applications" element={<BankQueue />} />
    <Route path="/applications/:applicationId/contract" element={<ContractRoute />} />
    <Route path="/applications/:applicationId" element={<ApplicationDetailsRoute />} />
    <Route path="/applications/new" element={<ApplicationRoute />} />
    <Route path="/products" element={<Catalog />} />
    <Route path="/login" element={<AuthPage />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/cabinet" element={<Cabinet />} />
    <Route path="/select" element={<Questionnaire />} />
    <Route path="/recommendations" element={<Recommendations />} />
    <Route path="/products/:productId" element={<ProductRoute />} />
    <Route path="*" element={<main className="mx-auto max-w-2xl px-5 py-20 font-sans"><Brand /><h1 className="mt-10 text-4xl font-extrabold text-coffee">Страница не найдена</h1><Link to="/" className="mt-6 inline-flex min-h-12 items-center font-bold underline">Вернуться на главную</Link></main>} />
    </Routes>
  </>;
}
