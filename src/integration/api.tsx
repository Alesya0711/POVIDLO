import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Brand } from '../components/Brand';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fieldErrors: {field:string;message:string}[] = [], public requestId = '') { super(message); }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch('/api/v1'+path,{...options,credentials:'same-origin',cache:'no-store',headers:{...(options.body ? {'Content-Type':'application/json'} : {}),...options.headers}}); }
  catch(error) { if (error instanceof DOMException && error.name==='AbortError') throw error; throw new ApiError(0,'NETWORK_ERROR','Сервис временно недоступен. Попробуйте ещё раз позже.'); }
  const data = await response.json().catch(()=>null);
  if (!response.ok) throw new ApiError(response.status,data?.code ?? 'HTTP_ERROR',data?.message ?? 'Не удалось выполнить действие. Попробуйте ещё раз.',data?.fieldErrors ?? [],data?.requestId ?? '');
  return data as T;
}
export const json = (body: unknown): RequestInit => ({method:'POST',body:JSON.stringify(body)});
export function useApi<T>(path: string | null, body?: unknown) {
  const [data,setData]=useState<T>(); const [error,setError]=useState<ApiError>(); const [loading,setLoading]=useState(Boolean(path)); const [revision,setRevision]=useState(0);
  const encoded=body===undefined ? undefined : JSON.stringify(body);
  const refresh=useCallback(()=>setRevision(value=>value+1),[]);
  useEffect(()=>{ if (!path) {setLoading(false);setData(undefined);return;} const controller=new AbortController();let active=true;setLoading(true);setError(undefined);setData(undefined);
    api<T>(path,{signal:controller.signal,...(encoded===undefined ? {} : {method:'POST',body:encoded})}).then(value=>{if(active)setData(value);}).catch(e=>{if(active&&e.name!=='AbortError')setError(e);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;controller.abort();};
  },[path,encoded,revision]);
  return {data,error,loading,refresh,mutate:setData};
}
export interface User { id:string;role:'client'|'bank_staff';email:string;fullName:string;boundInn:string|null;profile:Record<string,string> }
const SessionContext=createContext<{user:User|null;loading:boolean;error:ApiError|null;refresh:()=>Promise<void>;logout:()=>Promise<void>}|null>(null);
export function SessionProvider({children}:{children:ReactNode}) {
  const [user,setUser]=useState<User|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState<ApiError|null>(null);
  const refresh=useCallback(async()=>{setLoading(true);setError(null);try{setUser(await api<User>('/auth/me'));}catch(e){setUser(null);if(e instanceof ApiError&&e.status!==401)setError(e);}finally{setLoading(false);}},[]);
  useEffect(()=>{void refresh();},[refresh]);
  async function logout(){await api('/auth/logout',json({}));setUser(null);}
  return <SessionContext.Provider value={{user,loading,error,refresh,logout}}>{children}</SessionContext.Provider>;
}
export function useSession(){const value=useContext(SessionContext);if(!value)throw new Error('SessionProvider missing');return value;}
export function ErrorNotice({error,retry}:{error?:ApiError|Error;retry?:()=>void}) {return error ? <div role="alert" className="my-5 rounded-control bg-oat p-5 text-base font-semibold text-coffee"><p>{error.message}</p>{error instanceof ApiError&&error.fieldErrors.length>0&&<ul className="mt-2 list-disc pl-5">{error.fieldErrors.map((item,index)=><li key={index}>{item.message}</li>)}</ul>}{error instanceof ApiError&&error.requestId&&<p className="mt-2 break-all">Код обращения: {error.requestId}</p>}{retry&&<button type="button" onClick={retry} className="mt-3 min-h-12 font-bold underline">Повторить</button>}</div>:null;}
export function RequireSession({children,staff=false}:{children:ReactNode;staff?:boolean}) {const session=useSession();const location=useLocation();if(session.loading)return <p role="status" className="py-8">Проверяем вход…</p>;if(session.error)return <ErrorNotice error={session.error} retry={()=>void session.refresh()}/>;if(!session.user)return <section className="py-8"><h2 className="text-2xl font-extrabold">Войдите, чтобы продолжить</h2><Link to="/login" state={{returnTo:location.pathname+location.search}} className={`${button} mt-5`}>Войти</Link></section>;if(staff&&session.user.role!=='bank_staff')return <p role="alert" className="my-8 rounded-control bg-oat p-5">Этот раздел доступен только сотруднику банка.</p>;return <>{children}</>;}
export const button='inline-flex min-h-12 items-center justify-center rounded-control bg-forest px-5 py-3 text-base font-bold text-cream transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-oat disabled:text-coffee motion-reduce:transform-none';
export const control='mt-2 min-h-14 w-full rounded-control border border-coffee/50 bg-paper px-4 py-3 text-lg text-espresso';
export const panel='min-w-0 rounded-panel bg-paper p-5 sm:p-7';
export function Page({title,children,back='/cabinet',backLabel='Кабинет'}:{title:string;children:ReactNode;back?:string;backLabel?:string}){const session=useSession();const navigate=useNavigate();const[error,setError]=useState<Error>();return <div className="min-h-dvh font-sans text-coffee"><header className="border-b border-espresso/10"><div className="mx-auto flex min-h-24 max-w-[1280px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-12"><Brand/><div className="flex flex-wrap items-center gap-4"><Link to={back} className="inline-flex min-h-12 items-center text-base font-bold underline underline-offset-4">{backLabel}</Link>{session.user&&<button type="button" onClick={()=>void session.logout().then(()=>navigate('/login')).catch(e=>setError(e as Error))} className="min-h-12 text-base font-bold underline">Выйти</button>}</div></div></header><main className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 sm:py-12 lg:px-12"><h1 className="break-words text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">{title}</h1><ErrorNotice error={error}/>{children}</main></div>;}
