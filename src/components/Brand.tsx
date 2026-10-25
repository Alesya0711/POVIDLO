import { Link } from 'react-router';

export function Brand({ light = false }: { light?: boolean }) {
  return <Link to="/#top" aria-label="Капибанк — на главную" className={`inline-flex min-h-12 shrink-0 items-center gap-3 text-[27px] font-extrabold tracking-[-.035em] ${light ? 'text-cream' : 'text-forest'}`}>
    <svg width="38" height="36" viewBox="0 0 40 38" fill="none" aria-hidden="true">
      <ellipse cx="9" cy="8" rx="4.5" ry="5" transform="rotate(-24 9 8)" fill="currentColor" />
      <ellipse cx="31" cy="8" rx="4.5" ry="5" transform="rotate(24 31 8)" fill="currentColor" />
      <path d="M4 20C4 10 10 6 20 6S36 10 36 20v7c0 7-6 10-16 10S4 34 4 27z" fill="currentColor" />
      <path d="M12.5 16v1.5m15-1.5v1.5" stroke={light ? '#354B3A' : '#FAF7F0'} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="9" y="20" width="22" height="13" rx="6.5" fill={light ? '#354B3A' : '#FAF7F0'} />
      <path d="M17 24v.5m6-.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 28.5c1.5 1.5 4.5 1.5 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    Капибанк
  </Link>;
}

