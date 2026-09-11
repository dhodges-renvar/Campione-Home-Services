'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconToday, IconQuote, IconLeads, IconNumbers, IconSetup } from './Glyphs';

const TABS = [
  { href: '/today',     en: 'Today',   es: 'Hoy',      Icon: IconToday,   roles: ['owner','admin','estimator','crew_lead','sub'] },
  { href: '/quote',     en: 'Quote',   es: 'Cotizar',  Icon: IconQuote,   roles: ['owner','admin','estimator'] },
  { href: '/leads',     en: 'Leads',   es: 'Clientes', Icon: IconLeads,   roles: ['owner','admin','estimator'] },
  { href: '/dashboard', en: 'Numbers', es: 'Numeros',  Icon: IconNumbers, roles: ['owner','admin'] },
  { href: '/setup',     en: 'Setup',   es: 'Ajustes',  Icon: IconSetup,   roles: ['owner','admin'] },
];

export default function TabBar({ role, lang }: { role: string; lang: 'en' | 'es' }) {
  const path = usePathname();
  const visible = TABS.filter((t) => t.roles.includes(role));
  if (visible.length < 2) return null;
  return (
    <div className="tabs">
      <nav aria-label="Sections">
        {visible.map(({ href, en, es, Icon }) => {
          const on = path === href || path.startsWith(href + '/');
          return (
            <Link key={href} href={href} data-on={on ? '1' : '0'}>
              <Icon />
              {lang === 'es' ? es : en}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
