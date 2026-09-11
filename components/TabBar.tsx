'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Role = 'owner' | 'admin' | 'estimator' | 'crew_lead' | 'sub' | 'viewer';

const TABS = [
  { href: '/today',     label: 'Today',     es: 'Hoy',     roles: ['owner','admin','estimator','crew_lead','sub'] },
  { href: '/quote',     label: 'Quote',     es: 'Cotizar', roles: ['owner','admin','estimator'] },
  { href: '/leads',     label: 'Leads',     es: 'Clientes',roles: ['owner','admin','estimator'] },
  { href: '/dashboard', label: 'Numbers',   es: 'Numeros', roles: ['owner','admin'] },
];

export default function TabBar({ role, lang }: { role: Role; lang: 'en' | 'es' }) {
  const path = usePathname();
  const visible = TABS.filter((t) => t.roles.includes(role));
  if (visible.length < 2) return null;
  return (
    <nav className="tabs" aria-label="Sections">
      {visible.map((t) => {
        const on = path === t.href || path.startsWith(t.href + '/');
        return (
          <Link key={t.href} href={t.href} data-on={on ? '1' : '0'}>
            <span className="dot" />
            {lang === 'es' ? t.es : t.label}
          </Link>
        );
      })}
    </nav>
  );
}
