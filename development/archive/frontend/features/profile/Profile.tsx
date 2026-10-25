import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Brand } from '../../../../../src/components/Brand';
import { AssistantEntry } from '../../../../../src/components/Assistant';
import { Mascot } from '../../../../../src/components/Mascot';
import { industries } from '../../../../../src/features/questionnaire/model';
import { demoProfile, normalizeProfile, validateProfile } from './model';
import type { ProfileValues, ProfileErrors } from './model';

const width = 'mx-auto max-w-[1120px] px-5 sm:px-8';
const action = 'inline-flex min-h-12 items-center justify-center rounded-control px-5 py-3 text-base font-bold transition-transform active:scale-95 motion-reduce:transform-none';
const input = 'mt-2 min-h-14 w-full rounded-control border border-coffee/50 bg-paper px-4 py-3 text-lg text-espresso';

export function Profile() {
  const [profile, setProfile] = useState<ProfileValues>({ ...demoProfile });
  const [draft, setDraft] = useState<ProfileValues>({ ...demoProfile });
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [notice, setNotice] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (editing) form.current?.querySelector<HTMLInputElement>('[name="name"]')?.focus();
    else if (wasEditing.current) editButton.current?.focus();
    wasEditing.current = editing;
  }, [editing]);
  function update(field: keyof ProfileValues, value: string) {
    setDraft(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined, ...(field === 'industry' ? { industryDescription: undefined } : {}) }));
  }
  function attrs(field: keyof ProfileValues) { return { id: `profile-${field}`, name: field, 'aria-invalid': Boolean(errors[field]), 'aria-describedby': errors[field] ? `profile-${field}-error` : undefined }; }
  function error(field: keyof ProfileValues) { return errors[field] ? <p id={`profile-${field}-error`} className="mt-2 text-base font-bold">{errors[field]}</p> : null; }
  function row(label: string, value: string) { return <div className="py-4"><dt className="text-base font-semibold">{label}</dt><dd className="mt-1 break-words text-lg font-bold [overflow-wrap:anywhere]">{value}</dd></div>; }
  const industryLabel = industries.find(item => item.value === profile.industry)?.label ?? profile.industry;

  return <div className="min-h-dvh font-sans text-coffee">
    <header className="border-b border-espresso/10"><div className={`${width} flex min-h-24 items-center justify-between gap-4`}><Brand /><Link to="/" className="inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">На главную</Link></div></header>
    <main className={`${width} py-8 sm:py-12`}>
      <nav aria-label="Личный кабинет" className="mb-7 flex flex-wrap gap-3"><Link to="/cabinet" className={`${action} bg-oat text-coffee`}>Мои заявки</Link><Link to="/profile" aria-current="page" className={`${action} bg-forest text-cream`}>Профиль</Link></nav>
      <p className="text-base font-bold text-forest">Личный кабинет · Демопример</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">Профиль предпринимателя</h1>
      <aside className="mt-6 rounded-panel bg-oat p-5 text-base font-semibold"><p className="font-extrabold">Предпросмотр профиля</p><p className="mt-1">Ниже вымышленные сведения. Вход, загрузка и сохранение на сервере пока не подключены. Изменения видны только на этой странице и сбрасываются после обновления или ухода. Используйте тестовые данные.</p></aside>
      <p role="status" className="mt-4 min-h-7 text-base font-semibold">{notice}</p>
      <div className="mt-4 grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label={editing ? 'Редактирование профиля' : 'Сведения профиля'} className="min-w-0 rounded-panel bg-paper p-5 sm:p-7">
          {editing ? <form ref={form} noValidate onSubmit={event => {
            event.preventDefault(); const next = validateProfile(draft); setErrors(next);
            const first = (Object.keys(draft) as (keyof ProfileValues)[]).find(field => next[field]);
            if (first) { form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return; }
            const normalized = normalizeProfile(draft); setProfile(normalized); setDraft(normalized); setEditing(false); setNotice('Изменения применены в предпросмотре. На сервер ничего не отправлено; анкета и заявки не изменились.');
          }} className="space-y-5">
            <h2 className="text-2xl font-extrabold">Контактные сведения</h2>
            <div><label htmlFor="profile-name" className="text-base font-bold">Как к вам обращаться</label><input {...attrs('name')} autoComplete="given-name" maxLength={100} value={draft.name} onChange={event => update('name', event.target.value)} required className={input} />{error('name')}</div>
            <div><label htmlFor="profile-email" className="text-base font-bold">Контактная почта</label><input {...attrs('email')} type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} value={draft.email} onChange={event => update('email', event.target.value)} required className={input} />{error('email')}</div>
            <h2 className="pt-3 text-2xl font-extrabold">Ваш бизнес</h2>
            <div><label htmlFor="profile-company" className="text-base font-bold">Компания или имя ИП</label><input {...attrs('company')} autoComplete="organization" maxLength={150} value={draft.company} onChange={event => update('company', event.target.value)} required className={input} />{error('company')}</div>
            <div><label htmlFor="profile-legalForm" className="text-base font-bold">Правовая форма</label><select {...attrs('legalForm')} value={draft.legalForm} onChange={event => update('legalForm', event.target.value)} required className={input}><option value="">Выберите форму</option><option value="ip">ИП</option><option value="ooo">ООО</option></select>{error('legalForm')}</div>
            <div><label htmlFor="profile-industry" className="text-base font-bold">Сфера бизнеса</label><select {...attrs('industry')} value={draft.industry} onChange={event => update('industry', event.target.value)} required className={input}><option value="">Выберите сферу</option>{industries.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}</select>{error('industry')}</div>
            {draft.industry === 'other' && <div><label htmlFor="profile-industryDescription" className="text-base font-bold">Чем занимается бизнес</label><textarea {...attrs('industryDescription')} rows={3} maxLength={200} value={draft.industryDescription} onChange={event => update('industryDescription', event.target.value)} required className={`${input} resize-y`} /><p className="mt-2 text-base font-semibold">Короткое описание, до 200 символов.</p>{error('industryDescription')}</div>}
            <div><label htmlFor="profile-businessAgeMonths" className="text-base font-bold">Возраст бизнеса, полных месяцев</label><input {...attrs('businessAgeMonths')} inputMode="numeric" maxLength={6} value={draft.businessAgeMonths} onChange={event => update('businessAgeMonths', event.target.value)} required className={input} />{error('businessAgeMonths')}</div>
            <div className="flex flex-wrap gap-3 pt-2"><button type="submit" className={`${action} bg-forest text-cream`}>Применить в предпросмотре</button><button type="button" onClick={() => { setDraft({ ...profile }); setErrors({}); setEditing(false); setNotice('Редактирование отменено. В предпросмотре остались прежние сведения.'); }} className={`${action} bg-oat text-coffee`}>Отмена</button></div>
          </form> : <div>
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-extrabold">Контактные сведения</h2><button ref={editButton} type="button" onClick={() => { setDraft({ ...profile }); setErrors({}); setNotice(''); setEditing(true); }} className={`${action} bg-oat text-coffee`}>Редактировать</button></div>
            <dl className="mt-3 divide-y divide-espresso/15">{row('Как к вам обращаться', profile.name)}{row('Контактная почта', profile.email)}</dl>
            <h2 className="mt-7 text-2xl font-extrabold">Ваш бизнес</h2><dl className="mt-3 divide-y divide-espresso/15">{row('Компания или имя ИП', profile.company)}{row('Правовая форма', profile.legalForm === 'ip' ? 'ИП' : 'ООО')}{row('Сфера бизнеса', industryLabel)}{profile.industry === 'other' && row('Описание бизнеса', profile.industryDescription)}{row('Возраст бизнеса', `${profile.businessAgeMonths} мес.`)}</dl>
          </div>}
        </section>
        <aside className="min-w-0 rounded-panel bg-sage p-5 text-forest sm:p-6"><Mascot pose={editing ? 'review' : 'savings'} className="mx-auto mb-4 w-40" /><h2 className="text-2xl font-extrabold tracking-[-.012em]">Всё о вашем деле</h2><p className="mt-3 text-base font-semibold">Контакты нужны для связи, сведения о компании — чтобы понимать задачу бизнеса. Изменение профиля не меняет уже поданные заявки.</p><p className="mt-4 text-base font-semibold">В этом примере данные не проверялись по реестрам и не подтверждают доступность кредита.</p><div className="mt-4 rounded-control bg-cream px-3"><AssistantEntry label="Помочь со сведениями" context={{ screen: 'profile', field: editing ? 'editing' : 'overview', label: 'Сведения профиля', prompts: ['Как указать возраст бизнеса?', 'Что написать для другой сферы?', 'Изменятся ли сведения в уже поданной заявке?'], data: { mode: 'profile-preview', fields: ['name', 'email', 'company', 'legalForm', 'industry', 'industryDescription', 'businessAgeMonths'] } }} /></div></aside>
      </div>
    </main>
  </div>;
}
