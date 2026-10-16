import Link from 'next/link';
import { SITE, AREAS } from '@/lib/site';
import { divisionsInDeckOrder } from '@/lib/divisions';
import { IconPhone, IconMail, IconPin, IconClock } from './Icons';
import DeckRule from './DeckRule';

const decks = divisionsInDeckOrder();

export default function Footer() {
  return (
    <footer className="footer">
      <DeckRule tall />
      <div className="wrap">
        <div className="footer__main">
          <div>
            <Link href="/" className="logo" aria-label={`${SITE.name} home`}>
              <b>Campione</b>
              <em>Home Services</em>
            </Link>
            <p className="footer__blurb">
              Six divisions under one contractor, serving Monroe and metro Atlanta since{' '}
              {SITE.founded}.
            </p>
            <address style={{ marginTop: '1.25rem' }}>
              <span style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <IconPin />
                <span>
                  {SITE.street}
                  <br />
                  {SITE.city}, {SITE.state} {SITE.zip}
                </span>
              </span>
              <span style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <IconClock />
                <span>{SITE.hoursLabel}</span>
              </span>
            </address>
          </div>

          <div>
            <h5>Divisions</h5>
            <ul>
              {decks.map((d) => (
                <li key={d.slug}>
                  <Link href={`/${d.slug}`}>{d.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5>Company</h5>
            <ul>
              <li>
                <Link href="/services">All services</Link>
              </li>
              <li>
                <Link href="/about">About Campione</Link>
              </li>
              <li>
                <Link href="/service-area">Service area</Link>
              </li>
              <li>
                <Link href="/contact">Request an estimate</Link>
              </li>
            </ul>
          </div>

          <div>
            <h5>Get in touch</h5>
            <ul>
              <li>
                <a href={SITE.phoneHref} style={{ display: 'flex', gap: '0.6rem', fontWeight: 700 }}>
                  <IconPhone />
                  {SITE.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} style={{ display: 'flex', gap: '0.6rem' }}>
                  <IconMail />
                  {SITE.email}
                </a>
              </li>
            </ul>
            <h5 style={{ marginTop: '1.75rem' }}>Serving</h5>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
              {AREAS.slice(0, 9).join(' · ')} and the surrounding metro.
            </p>
          </div>
        </div>

        <div className="footer__bar">
          <span>
            © {new Date().getFullYear()} {SITE.legal}. All rights reserved.
          </span>
          <span>
            {SITE.city}, {SITE.stateFull} · {SITE.county}
          </span>
        </div>
      </div>
    </footer>
  );
}
