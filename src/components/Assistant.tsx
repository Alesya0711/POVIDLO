import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { Mascot } from './Mascot';
import { api, json, button, useSession, ApiError } from '../integration/api';
import type { MascotPose } from './Mascot';

export interface AssistantContext {
  screen: 'home' | 'questionnaire' | 'recommendations' | 'product' | 'cabinet' | 'catalog' | 'application' | 'application-details' | 'profile' | 'contract';
  label: string;
  field?: string;
  resourceId?: string;
  step?: number;
  prompts: string[];
  data?: Record<string, unknown>;
  onApply?: (field: string, value: unknown) => void;
}
function assistantPose(context: AssistantContext): MascotPose {
  if (context.screen === 'home') return 'welcome';
  if (context.screen === 'catalog') return 'search';
  if (context.screen === 'product' || context.field === 'principal' || context.field === 'termMonths') return 'calculator';
  if (context.screen === 'recommendations' || context.screen === 'application-details') return 'compare';
  if (context.screen === 'contract') return 'signing';
  if (context.screen === 'profile') return 'savings';
  if (context.screen === 'cabinet') return 'journey';
  if (context.screen === 'application' || (context.screen === 'questionnaire' && !context.field)) return 'review';
  return 'thinking';
}

interface AssistantActions {
  open: (context: AssistantContext, trigger: HTMLElement) => void;
  refresh: (context: AssistantContext) => void;
}
const AssistantActionsContext = createContext<AssistantActions | null>(null);
const keyFor = (context: AssistantContext) => `${context.screen}:${context.resourceId ?? ''}:${context.field ?? 'page'}`;
const wireFor = (context: AssistantContext) => ({screen:context.screen,field:context.field,resourceId:context.resourceId,step:context.step,data:context.data});

export function AssistantEntry({ context, label = 'Спросить Капибанкира' }: { context: AssistantContext; label?: string }) {
  const assistant = useContext(AssistantActionsContext);
  useEffect(() => { assistant?.refresh(context); }, [assistant?.refresh, context]);
  if (!assistant) throw new Error('AssistantProvider is missing');
  return <button type="button" onClick={event => assistant.open(context, event.currentTarget)} aria-haspopup="dialog" className="inline-flex min-h-12 items-center gap-2 rounded-control px-1 text-base font-bold text-coffee underline underline-offset-4 transition-transform active:scale-95 motion-reduce:transform-none"><span aria-hidden="true">✦</span>{label}</button>;
}

interface Reply {conversationId:string;reply:string;dataMode:string;proposal:{id:string;targetField:string;proposedValue:unknown;explanation:string;revision:number}|null}
interface Chat {conversationId?:string;messages:{role:string;text:string}[];response?:Reply;context?:string}
export function AssistantProvider({ children }: { children: ReactNode }) {
  const session=useSession();
  const [context, setContext] = useState<AssistantContext | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [chats,setChats]=useState<Record<string,Chat>>({});
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<Error>();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  const currentContext = useRef(context);
  currentContext.current = context;
  const refresh = useCallback((next: AssistantContext) => {
    setContext(current => current && keyFor(current) === keyFor(next)
      && JSON.stringify(wireFor(current)) !== JSON.stringify(wireFor(next)) ? next : current);
  }, []);

  useEffect(() => {
    if (previousPath.current !== pathname) { setContext(null); previousPath.current = pathname; }
  }, [pathname]);
  useEffect(() => {
    const node = dialog.current;
    if (context && node && !node.open) node.showModal();
    if (!context && node?.open) node.close();
  }, [context]);

  const owner = session.user?.id ?? 'guest';
  const currentOwner = useRef(owner);
  currentOwner.current = owner;
  const key = context ? `${owner}:${keyFor(context)}` : '';
  function setQuestion(value: string) { if (key) setDrafts(current => ({ ...current, [key]: value })); }
  const chat=chats[key];
  const wireContext=context ? wireFor(context) : {};
  const serialized=JSON.stringify(wireContext);
  const mode=chat?.context===serialized?chat.response?.dataMode:undefined;
  async function send() {
    if (!context || pending) return;
    const message = (drafts[key] ?? '').trim();
    if (!message) return;
    setPending(true); setError(undefined);
    try {
      const result = await api<Reply>('/assistant/messages', json({message, context:wireContext, clientMessageId:crypto.randomUUID(), ...(chat?.context===serialized && chat.conversationId ? {conversationId:chat.conversationId} : {})}));
      setChats(current => ({...current, [key]:{context:serialized, conversationId:result.conversationId, messages:[...(chat?.context===serialized ? chat.messages : []), {role:'Вы',text:message}, {role:'Капибанкир',text:result.reply}], response:result}}));
      setDrafts(current => (current[key] ?? '').trim() === message ? {...current, [key]:''} : current);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setChats(current => ({...current, [key]:{...current[key], conversationId:undefined, response:undefined}}));
        setError(new Error('Беседа завершилась. Отправьте вопрос ещё раз, чтобы начать новую.'));
      } else {
        setError(new Error(e instanceof ApiError && e.code === 'ASSISTANT_UNAVAILABLE' ? e.message : 'Не удалось получить ответ. Попробуйте позже.'));
      }
    } finally { setPending(false); }
  }
  async function confirm() {
    const proposal = chat?.response?.proposal;
    if (!proposal || !context?.onApply || chat.context !== serialized || pending) return;
    setPending(true); setError(undefined);
    try {
      const result = await api<{targetField:string;confirmedValue:unknown}>(`/assistant/proposals/${proposal.id}/confirm`, json({revision:proposal.revision, context:wireContext}));
      const latest = currentContext.current;
      if (!latest?.onApply || currentOwner.current !== owner || JSON.stringify(wireFor(latest)) !== serialized) {
        throw new ApiError(409, 'STALE_PROPOSAL', '');
      }
      latest.onApply(result.targetField, result.confirmedValue);
      setChats(current => ({...current, [key]:{...current[key], response:{...current[key].response!, proposal:null}}}));
      setContext(null);
    } catch (e) {
      setError(new Error(e instanceof ApiError && e.code === 'STALE_PROPOSAL' ? 'Поля изменились. Задайте вопрос ещё раз, чтобы получить новое предложение.' : 'Не удалось применить изменение. Попробуйте позже.'));
    } finally { setPending(false); }
  }
  return <AssistantActionsContext.Provider value={{ refresh, open: (next, element) => { trigger.current = element; setError(undefined); setContext(next); } }}>
    {children}
    <dialog ref={dialog} aria-labelledby="assistant-title" aria-describedby="assistant-status" onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const targets = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), textarea, input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')].filter(element => element.getClientRects().length > 0);
      const first = targets[0];
      const last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} onCancel={event => { event.preventDefault(); setContext(null); }} onClose={() => { setContext(null); trigger.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) setContext(null); }} className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-[460px] border-0 bg-cream p-0 text-espresso shadow-2xl backdrop:bg-espresso/35">
      {context && <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-espresso/15 px-5 py-4"><div className="flex items-center gap-3"><Mascot pose={assistantPose(context)} className="w-14 shrink-0" /><div><h2 id="assistant-title" className="text-xl font-extrabold text-coffee">Капибанкир</h2><p className="text-base font-semibold text-coffee">Помощь рядом</p></div></div><button type="button" onClick={() => setContext(null)} aria-label="Закрыть помощника" className="flex size-12 shrink-0 items-center justify-center rounded-control text-2xl text-coffee transition-transform active:scale-95 motion-reduce:transform-none">×</button></header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
          <p className="text-base font-bold text-coffee">{context.label}</p>
          <div id="assistant-status" className="mt-4 rounded-panel bg-sage p-5 text-forest"><h3 className="text-lg font-extrabold">{error?'Помощник временно недоступен':mode==='stub'?'Справочный режим':'Помощь по вашему вопросу'}</h3><p className="mt-2 text-base font-semibold">{error?error.message:mode==='stub'?'Подсказки формируются без нейросети. Они помогут разобраться в условиях, сумме и сроке.':mode==='groq'?'Проверьте ответ и условия перед тем, как действовать.':'Задайте вопрос об этом шаге или условиях.'}</p></div>
          <div aria-live="polite" className="mt-5 space-y-4">{chat?.context===serialized&&chat.messages.map((message,index)=><div key={index} className="rounded-control bg-paper p-4"><p className="text-base font-bold">{message.role}</p><p className="mt-2 whitespace-pre-wrap break-words text-lg [overflow-wrap:anywhere]">{message.text}</p></div>)}{pending&&<p role="status" className="text-base font-semibold">Обрабатываем…</p>}</div>
          {chat?.context===serialized&&chat.response?.proposal&&<section className="mt-5 rounded-panel border border-forest bg-sage p-5"><h3 className="text-lg font-extrabold">Предлагаемое изменение</h3><p className="mt-3 text-lg font-bold">{chat.response.proposal.targetField==='principal'?'Сумма, ₽':chat.response.proposal.targetField==='termMonths'?'Срок, мес.':'Описание бизнеса'}: {String(chat.response.proposal.proposedValue)}</p><p className="mt-3 text-base">{chat.response.proposal.explanation}</p>{context.onApply?<button type="button" disabled={pending} onClick={()=>void confirm()} className={`${button} mt-4`}>Подтвердить и применить</button>:<p className="mt-4 text-base font-semibold">На этом экране значения не редактируются. Изменить параметры можно в опросе или калькуляторе.</p>}</section>}
          <h3 className="mb-3 mt-7 text-lg font-extrabold text-coffee">С чего можно начать</h3>
          <div className="space-y-3">{context.prompts.map(prompt => <button type="button" key={prompt} onClick={() => setQuestion(prompt)} className="min-h-12 w-full rounded-control border border-coffee/35 bg-paper p-4 text-left text-base font-semibold text-espresso transition-transform active:scale-[.98] motion-reduce:transform-none">{prompt}</button>)}</div>
          <p className="mt-6 text-lg text-cocoa">Помощник не принимает решение по заявке. Проверьте предложенное изменение перед подтверждением.</p>
        </div>
        <form onSubmit={event => {event.preventDefault();void send();}} className="shrink-0 border-t border-espresso/15 bg-cream p-5 pb-[max(20px,env(safe-area-inset-bottom))]">
          <label htmlFor="assistant-question" className="mb-2 block text-base font-bold text-coffee">Ваш вопрос</label>
          <textarea id="assistant-question" rows={3} maxLength={1000} value={drafts[key] ?? ''} onChange={event => setQuestion(event.target.value)} className="w-full resize-none rounded-control border border-coffee/50 bg-paper p-3 text-lg text-espresso" />
          <div className="mt-3 flex items-center justify-between gap-3"><span className="text-base font-semibold text-coffee">До 1000 символов</span><button type="submit" disabled={pending||!(drafts[key]??'').trim()} className={button}>Отправить</button></div>
        </form>
      </div>}
    </dialog>
  </AssistantActionsContext.Provider>;
}
