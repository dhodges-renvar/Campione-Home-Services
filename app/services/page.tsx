import type { Metadata } from 'next';
import Link from 'next/link';
import Hero from '@/components/Hero';
import Cta from '@/components/Cta';
import Crumbs from '@/components/Crumbs';
import JsonLd from '@/components/JsonLd';
import FanDeck from '@/components/FanDeck';
import { DivisionIcon, IconPhone, IconCheck, IconArrow } from '@/components/Icons';
import { divisionsInDeckOrder } from '@/lib/divisions';
import { SITE } from '@/lib/site';
import { graph, breadcrumbs, webPage, serviceNode } from '@/lib/schema';

const decks = divisionsInDeckOrder();

export const metadata: Metadata = {
  title: 'Our Services | Painting, Drywall, Exteriors, Cleaning & CM',
  description:
    'All six Campione divisions in one place: painting, drywall, exteriors, pressure washing, cleaning and construction management across Monroe, GA and metro Atlanta.',
  alternates: { canonical: '/services' },
};

const PICKER = [
  {
    q: 'The walls look tired but the house is sound',
    a: 'Painting',
    slug: 'painting',
  },
  {
    q: 'There are cracks, holes or a ceiling that needs redoing',
    a: 'Drywall',
    slug: 'drywall',
  },
  {
    q: 'Something outside is soft, split or peeling',
    a: 'Exteriors',
    slug: 'exteriors',
  },
  {
    q: 'It is mostly dirty — siding, concrete, deck',
    a: 'Pressure Washing',
    slug: 'pressure-washing',
  },
  {
    q: 'The work is done and it needs to look finished',
    a: 'Cleaning',
    slug: 'cleaning',
  },
  {
    q: 'There are several trades and nobody is running them',
    a: 'Construction Management',
    slug: 'construction-management',
  },
];

export default function ServicesPage() {
  return (
    <>
      <Hero
        imageKey="services"
        kicker="All six divisions"
        title="Everything we do, and who each division is for."
        lead={
          <>
            Six trades under one roof in {SITE.city}, Georgia. Each one is quoted and scheduled on
            its own, and they run together on a single scope when a project needs more than one.
          </>
        }
      >
        <Link className="btn btn--white" href="/contact">
          Get a free estimate
        </Link>
        <a className="btn btn--ghost-light" href={SITE.phoneHref}>
          <IconPhone />
          {SITE.phone}
        </a>
      </Hero>

      <Crumbs items={[{ label: 'Services' }]} />

      <section className="section section--tight">
        <div className="wrap">
          <FanDeck />
        </div>
      </section>

      {/* ───────────────────────────────── the detail rows */}
      <section className="section section--white" aria-labelledby="detail">
        <div className="wrap">
          <p className="kicker">Division by division</p>
          <h2 id="detail" style={{ marginBottom: '2.5rem', maxWidth: '26ch' }}>
            What each one actually covers.
          </h2>

          <div className="stack-lg">
            {decks.map((d, i) => (
              <article
                key={d.slug}
                style={
                  {
                    '--accent': d.color,
                    '--accent-text': d.colorText,
                    '--accent-ink': d.colorOn,
                  } as React.CSSProperties
                }
              >
                {i > 0 && <hr className="rule" style={{ marginBottom: '2rem' }} />}
                <div className="split split--wide-left">
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.9rem',
                        alignItems: 'center',
                        marginBottom: '0.9rem',
                      }}
                    >
                      <span className="card__icon" style={{ width: 44, height: 44 }}>
                        <DivisionIcon name={d.icon} />
                      </span>
                      <div>
                        <h3 style={{ marginBottom: '0.1rem' }}>{d.name}</h3>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 'var(--step--1)',
                            fontWeight: 700,
                            color: d.colorText,
                          }}
                        >
                          {d.tagline}
                        </p>
                      </div>
                    </div>
                    <p style={{ color: 'var(--ink-3)' }}>{d.lead}</p>
                    <div className="btn-row" style={{ marginTop: '1.25rem' }}>
                      <Link className="btn btn--accent" href={`/${d.slug}`}>
                        {d.name} details
                        <IconArrow />
                      </Link>
                    </div>
                  </div>

                  <ul className="ticks ticks--yes">
                    {d.services.map((s) => (
                      <li key={s.title}>
                        <IconCheck />
                        <span>
                          <b>{s.title}</b>
                          <br />
                          <span className="muted">{s.body}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────── picker */}
      <section className="section section--dark on-dark" aria-labelledby="picker">
        <div className="wrap">
          <p className="kicker kicker--on-dark">Not sure which one</p>
          <h2 id="picker" style={{ marginBottom: '0.75rem', maxWidth: '26ch' }}>
            Find your situation. We will tell you where it belongs.
          </h2>
          <p className="lead lead--on-dark" style={{ marginBottom: '2.5rem' }}>
            And if it turns out to be two divisions, that is fine — most projects are.
          </p>
          <div className="grid grid--3">
            {PICKER.map((p) => {
              const d = decks.find((x) => x.slug === p.slug)!;
              return (
                <Link
                  className="card"
                  key={p.slug}
                  href={`/${p.slug}`}
                  style={{ borderTop: `4px solid ${d.color}` }}
                >
                  <p style={{ fontSize: 'var(--step-0)', color: '#fff', fontWeight: 600 }}>
                    “{p.q}”
                  </p>
                  <span
                    className="deck__go"
                    style={{ ['--swatch' as string]: '#fff', marginTop: 'auto' } as React.CSSProperties}
                  >
                    {p.a} <IconArrow />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <Cta
        title="One call covers all six."
        body="Tell us what is going on at the house and we will work out which divisions it takes. Free measured estimates across Walton, Gwinnett and Barrow counties."
      />

      <JsonLd
        data={graph([
          webPage({
            path: '/services',
            name: 'Services — Campione Home Services',
            description:
              'Painting, drywall, exteriors, pressure washing, cleaning and construction management in Monroe, GA.',
          }),
          ...decks.map(serviceNode),
          breadcrumbs([{ name: 'Services', path: '/services' }]),
        ])}
      />
    </>
  );
}
