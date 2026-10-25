import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { api, json, useSession, ErrorNotice } from '../../integration/api';
import { Link, useLocation, useNavigate } from 'react-router';
import { Brand } from '../../components/Brand';
import { Mascot } from '../../components/Mascot';

type Field = 'name' | 'email' | 'password' | 'confirmation';
const input = 'mt-2 min-h-12 w-full rounded-control border border-coffee/50 bg-paper px-4 py-3 text-lg text-espresso';
const button = 'inline-flex min-h-12 items-center justify-center rounded-control px-5 py-3 text-base font-bold transition-transform active:scale-95 motion-reduce:transform-none';

export function AuthPage() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending,setPending] = useState(false);
  const [apiError,setApiError] = useState<Error>();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmation: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const registering = mode === 'register';

  function change(field: Field, value: string) {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined, ...(field === 'password' ? { confirmation: undefined } : {}) }));
    setChecked(false);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    if (registering && !values.name.trim()) next.name = 'Укажите, как к вам обращаться.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Введите почту в формате name@example.ru.';
    if (!values.password) next.password = 'Введите пароль.';
    else if (registering && values.password.length < 8) next.password = 'Нужно не менее 8 символов.';
    if (registering && values.confirmation !== values.password) next.confirmation = 'Пароли должны совпадать.';
    setErrors(next);
    const first = (['name', 'email', 'password', 'confirmation'] as const).find(field => next[field]);
    if (first) { form.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus(); return; }
    setPending(true); setApiError(undefined);
    try {
      const result = await api<{role:string}>(registering ? '/auth/register' : '/auth/login', json(registering ? {email:values.email.trim(),password:values.password,fullName:values.name.trim()} : {email:values.email.trim(),password:values.password}));
      await session.refresh();
      const target = (location.state as {returnTo?:unknown}|null)?.returnTo;
      navigate(typeof target==='string' && target.startsWith('/') && !target.startsWith('//') ? target : result.role==='bank_staff' ? '/bank/applications' : '/cabinet', {replace:true});
    } catch(error) { setApiError(error as Error); } finally { setPending(false); }
    setChecked(true);
    setValues(previous => ({ ...previous, password: '', confirmation: '' }));
    setVisible(false);
  }
  function field(id: Field, label: string, type: string, autoComplete: string) {
    return <div>
      <label htmlFor={`auth-${id}`} className="block text-base font-bold">{label}</label>
      <input id={`auth-${id}`} name={id} type={type} autoComplete={autoComplete} value={values[id]} onChange={event => change(id, event.target.value)} required maxLength={id === 'name' ? 100 : id === 'email' ? 254 : 128} spellCheck={false} autoCapitalize={id === 'name' ? 'words' : 'none'} aria-invalid={Boolean(errors[id])} aria-describedby={errors[id] ? `auth-${id}-error` : undefined} className={input} />
      {errors[id] && <p id={`auth-${id}-error`} className="mt-2 text-base font-bold">{errors[id]}</p>}
    </div>;
  }

  return <div className="min-h-dvh font-sans text-coffee">
    <header className="border-b border-espresso/10"><div className="mx-auto flex min-h-24 max-w-[1120px] items-center justify-between gap-4 px-5 sm:px-8"><Brand /><Link to="/" className="inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">На главную</Link></div></header>
    <main className="mx-auto grid max-w-[1120px] items-start gap-8 px-5 py-8 sm:px-8 sm:py-12 md:grid-cols-[1fr_1.1fr] md:gap-14">
      <section aria-labelledby="auth-title">
        <p className="text-base font-bold text-forest">Личный кабинет</p>
        <h1 id="auth-title" className="mt-3 text-4xl font-extrabold leading-tight tracking-[-.025em] sm:text-5xl">{registering ? 'Начнём знакомство' : 'Снова на связи'}</h1>
        <p className="mt-5 max-w-md text-lg text-cocoa">{registering ? 'Один кабинет для заявок и следующих шагов вашего бизнеса.' : 'Вернитесь к заявкам и планам вашего дела. Капибанкир рядом.'}</p>
        <Mascot pose={registering ? 'savings' : 'journey'} alt={registering ? 'Капибанкир обнимает копилку' : 'Капибанкир отправляется в путь с картой и рюкзаком'} className="mt-6 hidden w-full max-w-[300px] md:block" />
      </section>
      <section aria-label="Форма доступа" className="min-w-0 rounded-panel bg-paper p-5 sm:p-8">
        <div role="group" aria-label="Режим формы" className="grid grid-cols-2 gap-2 rounded-control bg-oat p-1.5">{(['login', 'register'] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => { setMode(value); setValues(previous => ({ ...previous, password: '', confirmation: '' })); setErrors({}); setChecked(false); setVisible(false); }} className={`${button} px-2 ${mode === value ? 'bg-forest text-cream' : 'text-coffee'}`}>{value === 'login' ? 'Войти' : 'Регистрация'}</button>)}</div>
        <ErrorNotice error={apiError}/><form ref={form} onSubmit={submit} noValidate className="mt-6 space-y-5">
          {registering && field('name', 'Как к вам обращаться', 'text', 'given-name')}
          {field('email', 'Электронная почта', 'email', 'username')}
          <div>
            {field('password', 'Пароль', visible ? 'text' : 'password', registering ? 'new-password' : 'current-password')}
            <button type="button" aria-pressed={visible} aria-controls="auth-password" onClick={() => setVisible(!visible)} className="mt-1 inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">{visible ? 'Скрыть пароль' : 'Показать пароль'}</button>
          </div>
          {registering && field('confirmation', 'Повторите пароль', 'password', 'new-password')}
          <button type="submit" disabled={pending} className={`${button} w-full bg-forest text-cream disabled:opacity-60`}>{pending ? 'Подождите…' : registering ? 'Зарегистрироваться' : 'Войти'}</button>
          <p role="status" className="text-base font-semibold">{checked && !apiError ? 'Всё готово. Открываем личный кабинет.' : ''}</p>
        </form>
        <div className="mt-6 border-t border-espresso/15 pt-4"><Link to="/select" className="inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">Продолжить подбор без входа</Link></div>
      </section>
    </main>
  </div>;
}
