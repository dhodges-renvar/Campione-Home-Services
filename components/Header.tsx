'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SITE } from '@/lib/site';
import { divisionsInDeckOrder } from '@/lib/divisions';
import { IconPhone, IconMenu, IconClose, IconMail } from './Icons';
import DeckRule from './DeckRule';

const decks = divisionsInDeckOrder();

const MAIN = [
  { href: '/about', label: 'About' },
  { href: '/service-area', label: 'Service Area' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const group = useRef<HTMLDivElement>(null);

  // close everything on navigation
  useEffect(() => {
    setDrawer(false);
    setMenu(false);
  }, [pathname]);

  // escape + outside click close the services menu
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    const onDown = (e: MouseEvent) => {
      if (group.current && !group.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [menu]);

  const current = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href)) ? true : undefined;

  return (
    <header className="header">
      <div className="wrap header__bar">
        <Link href="/" className="logo" aria-label={`${SITE.name} home`}>
          <b>Campione</b>
          <em>Home Services</em>
        </Link>

        <nav className="nav" aria-label="Main">
          <div
            className="nav__group"
            ref={group}
            onMouseEnter={() => setMenu(true)}
            onMouseLeave={() => setMenu(false)}
          >
            <button
              type="button"
              className="nav__trigger"
              aria-expanded={menu}
              aria-haspopup="true"
              onClick={() => setMenu((v) => !v)}
            >
              Services
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
                <path d="M4 8l8 8 8-8" />
              </svg>
            </button>

            {menu && (
              <div className="nav__menu" role="menu">
                {decks.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/${d.slug}`}
                    role="menuitem"
                    style={{ ['--sw' as string]: d.color }}
                  >
                    <i />
                    <span>
                      <strong>{d.name}</strong>
                      <span>{d.tagline}</span>
                    </span>
                  </Link>
                ))}
                <div className="nav__menu-foot">
                  <Link href="/services" role="menuitem">
                    All six divisions, side by side →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {MAIN.map((l) => (
            <Link key={l.href} href={l.href} aria-current={current(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="header__cta">
          <a className="header__phone" href={SITE.phoneHref}>
            <IconPhone />
            {SITE.phone}
          </a>
          <Link className="btn btn--white" href="/contact">
            Get an estimate
          </Link>
        </div>

        <div className="mobile-tools">
          <a className="icon-btn" href={SITE.phoneHref} aria-label={`Call ${SITE.phone}`}>
            <IconPhone />
          </a>
          <button
            type="button"
            className="burger"
            aria-expanded={drawer}
            aria-controls="mobile-drawer"
            onClick={() => setDrawer((v) => !v)}
          >
            {drawer ? <IconClose /> : <IconMenu />}
            {drawer ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      <DeckRule />

      <div className="drawer" id="mobile-drawer" data-open={drawer}>
        <div className="drawer__inner">
          <p className="drawer__label">Divisions</p>
          {decks.map((d) => (
            <Link key={d.slug} href={`/${d.slug}`} style={{ ['--sw' as string]: d.color }}>
              <i />
              {d.name}
            </Link>
          ))}
          <p className="drawer__label">Company</p>
          <Link href="/services">All services</Link>
          {MAIN.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          <Link className="btn btn--white btn--block" href="/contact">
            Get a free estimate
          </Link>
          <a
            className="btn btn--ghost-light btn--block"
            href={`mailto:${SITE.email}`}
            style={{ marginTop: '0.5rem' }}
          >
            <IconMail />
            {SITE.email}
          </a>
        </div>
      </div>
    </header>
  );
}
