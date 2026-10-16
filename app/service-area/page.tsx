import type { Metadata } from 'next';
import Link from 'next/link';
import Hero from '@/components/Hero';
import Cta from '@/components/Cta';
import Crumbs from '@/components/Crumbs';
import JsonLd from '@/components/JsonLd';
import { IconPhone, IconPin } from '@/components/Icons';
import { SITE } from '@/lib/site';
import { AREA_GROUPS, AREA_COUNT } from '@/lib/areas';
import { divisionsInDeckOrder } from '@/lib/divisions';
import { graph, breadcrumbs, webPage } from '@/lib/schema';

const decks = divisionsInDeckOrder();

export const metadata: Metadata = {
  title: 'Service Area | Monroe, Loganville, Winder & Metro Atlanta',
  description: `Campione Home Services covers ${AREA_COUNT} cities across Walton, Gwinnett, Barrow, Oconee, Newton and north Fulton counties from our base in ${SITE.city}, GA.`,
  alternates: { canonical: '/service-area' },
};

export default function ServiceAreaPage() {
  return (
    <>
      <Hero
        imageKey="service-area"
        kicker={`${AREA_COUNT} cities · 6 counties`}
        title="Where we work, and why that matters to your price."
        lead={
          <>
            We work out of {SITE.city} and stay inside a radius a crew can reach without burning
            the first hour of the day in traffic. Drive time is a real cost in this business, and
            keeping it short is part of why our pricing holds up.
          </>
        }
      >
        <Link className="btn btn--white" href="/contact">
          Check your address
        </Link>
        <a className="btn btn--ghost-light" href={SITE.phoneHref}>
          <IconPhone />
          {SITE.phone}
        </a>
      </Hero>

      <Crumbs items={[{ label: 'Service Area' }]} />

      <section className="section">
        <div className="wrap">
          <div className="stack-lg">
            {AREA_GROUPS.map((g, i) => (
              <div key={g.county} style={{ ['--accent' as string]: g.color } as React.CSSProperties}>
                {i > 0 && <hr className="rule" style={{ marginBottom: '2.5rem' }} />}
                <div className="split split--wide-left" style={{ marginBottom: '1.5rem' }}>
                  <div>
                    <p className="kicker">
                      <IconPin />
                      {g.cities.length} {g.cities.length === 1 ? 'city' : 'cities'}
                    </p>
                    <h2 style={{ fontSize: 'var(--step-2)', marginBottom: '0.5rem' }}>
                      {g.county}
                    </h2>
                  </div>
                  <p className="muted" style={{ fontSize: 'var(--step--1)' }}>
                    {g.blurb}
                  </p>
                </div>
                <div className="grid grid--3">
                  {g.cities.map((c) => (
                    <article className="card card--accent-top" key={c.name}>
                      <h4>
                        {c.name}, GA
                      </h4>
                      <p>{c.note}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--dark on-dark">
        <div className="wrap">
          <div className="split split--wide-left">
            <div>
              <p className="kicker kicker--on-dark">Not on the list?</p>
              <h2 style={{ marginBottom: '0.75rem', maxWidth: '26ch' }}>
                Call and ask. We will give you a straight answer.
              </h2>
              <p className="lead lead--on-dark">
                If you are just outside the ring, it usually comes down to the size of the
                project. A whole-house exterior is worth the drive; a single interior door is
                not, and we will say so rather than quote you a travel surcharge and hope you
                take it.
              </p>
              <div className="btn-row" style={{ marginTop: '1.75rem' }}>
                <a className="btn btn--white" href={SITE.phoneHref}>
                  <IconPhone />
                  {SITE.phone}
                </a>
                <Link className="btn btn--ghost-light" href="/contact">
                  Send your address
                </Link>
              </div>
            </div>
            <div className="stack">
              <h3 style={{ fontSize: 'var(--step-2)' }}>Every division, every city</h3>
              <p className="lead lead--on-dark" style={{ fontSize: 'var(--step-0)' }}>
                All six divisions are available everywhere on this page.
              </p>
              <ul className="chips">
                {decks.map((d) => (
                  <li key={d.slug}>
                    <Link href={`/${d.slug}`}>{d.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Cta />

      <JsonLd
        data={graph([
          webPage({
            path: '/service-area',
            name: `Service area — ${SITE.name}`,
            description: `${AREA_COUNT} cities across six counties, served from ${SITE.city}, Georgia.`,
          }),
          breadcrumbs([{ name: 'Service Area', path: '/service-area' }]),
        ])}
      />
    </>
  );
}
