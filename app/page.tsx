import type { Metadata } from 'next';
import Link from 'next/link';
import Hero from '@/components/Hero';
import FanDeck from '@/components/FanDeck';
import Faq from '@/components/Faq';
import Cta from '@/components/Cta';
import JsonLd from '@/components/JsonLd';
import {
  IconPhone,
  IconRuler,
  IconDoc,
  IconUsers,
  IconClock,
  IconShield,
  IconStar,
} from '@/components/Icons';
import { SITE, AREAS, CLIENT_TYPES } from '@/lib/site';
import { divisionsInDeckOrder } from '@/lib/divisions';
import { GENERAL_FAQ } from '@/lib/faqs';
import { graph, faqPage, webPage } from '@/lib/schema';

export const metadata: Metadata = {
  title: `Painting, Drywall & Home Services in Monroe, GA | ${SITE.name}`,
  description:
    'Painting, drywall, exterior repair, pressure washing, cleaning and construction management across Monroe, Loganville, Winder and metro Atlanta. Measured estimates, written scopes, same-day callback.',
  alternates: { canonical: '/' },
};

// Colours are pulled from the fan deck so the palette carries through the page
// instead of living only in the services row.
const PROMISES = [
  {
    color: '#2D6CA2',
    colorText: '#2D6CA2',
    icon: <IconRuler />,
    title: 'We measure before we quote',
    body: 'Every surface gets a quantity and a line item. No square-foot guess over the phone, and no number that moves once we see the house.',
  },
  {
    color: '#A0563A',
    colorText: '#9A5035',
    icon: <IconDoc />,
    title: 'The scope is in writing',
    body: 'Prep, product, sheen, coats, what is included and what is not. If it is not on the page, it is not in the price — and you can see exactly where the line is.',
  },
  {
    color: '#38523F',
    colorText: '#38523F',
    icon: <IconUsers />,
    title: 'One person, start to finish',
    body: 'The person who measures your house is the person you call during the job and the person who walks it with you at the end. No handoffs into a call center.',
  },
  {
    color: '#2E9B8F',
    colorText: '#1E7A70',
    icon: <IconClock />,
    title: 'Same-day callback',
    body: 'Requests in before 4pm get a call that day. The most common complaint about contractors is silence, and it is the easiest one to fix.',
  },
];

const PROCESS = [
  {
    title: 'You call or send the details',
    body: 'Tell us what you know. If you are not sure what the house needs, that is what the visit is for.',
  },
  {
    title: 'We come measure',
    body: 'Usually within a few days. We walk it with you, measure the real surfaces and flag anything that needs fixing before finishing.',
  },
  {
    title: 'You get a written scope',
    body: 'Line items, products by name, inclusions and exclusions, and a price that holds unless the scope changes.',
  },
  {
    title: 'We do the work and walk it',
    body: 'Protected, cleaned up daily, and inspected with you under a raking light before anyone invoices you.',
  },
];

export default function HomePage() {
  const decks = divisionsInDeckOrder();

  return (
    <>
      <Hero
        imageKey="home"
        variant="home"
        kicker={`${SITE.city}, Georgia · Serving metro Atlanta since ${SITE.founded}`}
        title={<>One contractor for everything the house needs.</>}
        lead={
          <>
            Painting, drywall, exteriors, pressure washing, cleaning and construction
            management — six divisions under one roof in {SITE.city}. Measured estimates,
            written scopes, and the same person on the phone from the first visit to the final
            walkthrough.
          </>
        }
        facts={[
          { value: '6', label: 'Divisions in house' },
          { value: SITE.founded, label: 'Serving Georgia since' },
          { value: `${SITE.rating.toFixed(1)}★`, label: `Across ${SITE.reviewCount} Google reviews` },
          { value: 'Same day', label: 'Estimate callback' },
        ]}
      >
        <Link className="btn btn--white" href="/contact">
          Get a free estimate
        </Link>
        <a className="btn btn--ghost-light" href={SITE.phoneHref}>
          <IconPhone />
          {SITE.phone}
        </a>
      </Hero>

      {/* ───────────────────────────────── the fan deck */}
      <section className="section section--tight" aria-labelledby="divisions">
        <div className="wrap">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem 2rem',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <p className="kicker">Six divisions</p>
              <h2 id="divisions">Pick a trade. Or let us sort it out.</h2>
            </div>
            <p className="muted" style={{ maxWidth: '38ch', fontSize: 'var(--step--1)' }}>
              Each division is quoted and scheduled on its own, and they run together on one
              invoice when a project needs more than one.
            </p>
          </div>

          <FanDeck />

          <div style={{ marginTop: '2rem' }}>
            <Link className="btn btn--ghost" href="/services">
              Compare all six side by side
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────── the four promises */}
      <section className="section section--white" aria-labelledby="promises">
        <div className="wrap">
          <p className="kicker">Why people call us back</p>
          <h2 id="promises" style={{ maxWidth: '24ch', marginBottom: '0.75rem' }}>
            Four things we do that most contractors do not.
          </h2>
          <p className="lead" style={{ marginBottom: '2.5rem' }}>
            None of this is clever. It is just the stuff that goes wrong on every bad
            contractor experience, handled deliberately.
          </p>
          <div className="grid grid--4">
            {PROMISES.map((p) => (
              <article
                className="card card--accent-top"
                key={p.title}
                style={
                  { '--accent': p.color, '--accent-text': p.colorText } as React.CSSProperties
                }
              >
                <div className="card__icon">{p.icon}</div>
                <h4>{p.title}</h4>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────── who we work for */}
      <section className="section section--dark on-dark" aria-labelledby="clients">
        <div className="wrap">
          <div className="split split--wide-left" style={{ marginBottom: '2.5rem' }}>
            <div>
              <p className="kicker kicker--on-dark">Who we work for</p>
              <h2 id="clients">Homeowners, builders, portfolios and designers.</h2>
            </div>
            <p className="lead lead--on-dark">
              About half of what we do is trade work on a schedule and half is direct
              residential. The standards are the same; the paperwork and the pace are not, and
              we run them differently on purpose.
            </p>
          </div>
          <div className="grid grid--4">
            {CLIENT_TYPES.map((c) => (
              <article
                className="card card--accent-top"
                key={c.key}
                style={{ ['--accent' as string]: c.color } as React.CSSProperties}
              >
                <h4>{c.label}</h4>
                <p>{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────── process */}
      <section className="section" aria-labelledby="process">
        <div className="wrap">
          <p className="kicker">How it goes</p>
          <h2 id="process" style={{ marginBottom: '2.5rem', maxWidth: '26ch' }}>
            Four steps, and you know where you stand at each one.
          </h2>
          <div className="steps">
            {PROCESS.map((s) => (
              <div className="step" key={s.title}>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </div>
            ))}
          </div>

          <div className="split" style={{ marginTop: 'clamp(3rem, 2rem + 3vw, 4.5rem)' }}>
            <blockquote className="pull" style={{ margin: 0 }}>
              “If it is not on the written scope, it is not in the price.” That one sentence
              prevents most of the arguments that happen on job sites.
            </blockquote>
            <div className="stack">
              <div className="stat-row">
                <div className="stat">
                  <b>{SITE.rating.toFixed(1)}</b>
                  <span className="stars" aria-label={`${SITE.rating} out of 5`}>
                    <IconStar />
                    <IconStar />
                    <IconStar />
                    <IconStar />
                    <IconStar />
                  </span>
                </div>
                <div className="stat">
                  <b>{SITE.reviewCount}</b>
                  <span>Google reviews</span>
                </div>
                <div className="stat">
                  <b>{new Date().getFullYear() - Number(SITE.founded)}</b>
                  <span>Years in Walton Co.</span>
                </div>
              </div>
              <div
                className="muted"
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  fontSize: 'var(--step--1)',
                  lineHeight: 1.6,
                }}
              >
                <span style={{ flex: 'none', marginTop: '2px' }}>
                  <IconShield />
                </span>
                <span>
                  General liability and workers compensation in force. A certificate of insurance
                  goes out with every proposal, and licensed work is named to its license holder
                  in writing.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────── service area */}
      <section className="section section--white" aria-labelledby="areas">
        <div className="wrap">
          <div className="split split--wide-left">
            <div>
              <p className="kicker">Service area</p>
              <h2 id="areas" style={{ marginBottom: '0.75rem' }}>
                Based in {SITE.city}. Working the whole east side of metro Atlanta.
              </h2>
              <p className="lead">
                Walton, Gwinnett, Barrow, Oconee and Newton counties, plus north Fulton. Close
                enough that the crew is not burning the morning in traffic, which is part of why
                the pricing works.
              </p>
              <div className="btn-row" style={{ marginTop: '1.75rem' }}>
                <Link className="btn btn--ghost" href="/service-area">
                  See every city we serve
                </Link>
              </div>
            </div>
            <ul className="areas-grid">
              {AREAS.map((a) => (
                <li key={a}>{a}, GA</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────── faq */}
      <section className="section" aria-labelledby="faq">
        <div className="wrap">
          <div className="split split--wide-left">
            <div>
              <p className="kicker">Common questions</p>
              <h2 id="faq" style={{ marginBottom: '0.75rem' }}>
                The things people ask before they call.
              </h2>
              <p className="lead">
                Division-specific questions — cost ranges, how long things take, what gets
                included — are answered on each of the{' '}
                <Link href="/services" style={{ textDecoration: 'underline' }}>
                  six division pages
                </Link>
                .
              </p>
              <ul className="chips" style={{ marginTop: '1.5rem' }}>
                {decks.map((d) => (
                  <li key={d.slug}>
                    <Link href={`/${d.slug}`}>{d.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <Faq items={GENERAL_FAQ} />
          </div>
        </div>
      </section>

      <Cta />

      <JsonLd
        data={graph([
          webPage({
            path: '/',
            name: `${SITE.name} — painting, drywall and home services in ${SITE.city}, GA`,
            description: SITE.elevator,
          }),
          faqPage(GENERAL_FAQ, '/'),
        ])}
      />
    </>
  );
}
