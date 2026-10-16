import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Hero from '@/components/Hero';
import Faq from '@/components/Faq';
import Cta from '@/components/Cta';
import Crumbs from '@/components/Crumbs';
import JsonLd from '@/components/JsonLd';
import LeadForm from '@/components/LeadForm';
import {
  DivisionIcon,
  IconPhone,
  IconCheck,
  IconMinus,
  IconArrow,
} from '@/components/Icons';
import { DIVISIONS, getDivision, divisionsInDeckOrder } from '@/lib/divisions';
import { SITE, AREAS } from '@/lib/site';
import { graph, serviceNode, faqPage, breadcrumbs, webPage } from '@/lib/schema';

type Params = { params: { slug: string } };

/** Only the six divisions resolve here. Anything else is a 404, not a soft page. */
export function generateStaticParams() {
  return DIVISIONS.map((d) => ({ slug: d.slug }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: Params): Metadata {
  const d = getDivision(params.slug);
  if (!d) return {};
  return {
    title: d.metaTitle,
    description: d.metaDesc,
    alternates: { canonical: `/${d.slug}` },
    openGraph: {
      title: d.metaTitle,
      description: d.metaDesc,
      url: `${SITE.url}/${d.slug}`,
      type: 'website',
    },
  };
}

export default function DivisionPage({ params }: Params) {
  const d = getDivision(params.slug);
  if (!d) notFound();

  const others = divisionsInDeckOrder().filter((x) => x.slug !== d.slug);
  const trade = d.audience === 'trade';

  return (
    <div
      style={
        {
          '--accent': d.color,
          '--accent-text': d.colorText,
          '--accent-ink': d.colorOn,
        } as React.CSSProperties
      }
    >
      <Hero
        imageKey={d.slug}
        kicker={d.heroKicker}
        accent={d.color}
        footRule={d.color}
        title={
          <>
            {d.name} in {SITE.city}, GA
            <br />
            {/* The division hue lightened for a dark hero — see .hero h1 .accent-line.
                The raw colour is tuned for ink on paper and reads at about 1.5:1
                against a near-black hero, which is not a headline, it is a stain. */}
            <span className="accent-line">{d.tagline}</span>
          </>
        }
        lead={d.lead}
      >
        <Link className="btn btn--white" href="#estimate">
          {trade ? 'Request a scope and fee' : 'Get a free estimate'}
        </Link>
        <a className="btn btn--ghost-light" href={SITE.phoneHref}>
          <IconPhone />
          {SITE.phone}
        </a>
      </Hero>

      <Crumbs items={[{ href: '/services', label: 'Services' }, { label: d.name }]} />

      {/* ───────────────────────────────── what we do */}
      <section className="section" aria-labelledby="work">
        <div className="wrap">
          <div className="split split--wide-left" style={{ marginBottom: '2.5rem' }}>
            <div>
              <p className="kicker">What this division does</p>
              <h2 id="work" style={{ maxWidth: '24ch' }}>
                Six kinds of {d.name.toLowerCase()} work we take on.
              </h2>
            </div>
            <p className="muted" style={{ fontSize: 'var(--step--1)' }}>
              Each of these is quoted as its own line item, so a project that only needs one of
              them is not carrying the cost of the other five.
            </p>
          </div>
          <div className="grid grid--3">
            {d.services.map((s) => (
              <article className="card card--accent-top" key={s.title}>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────── process */}
      <section className="section section--dark on-dark" aria-labelledby="how">
        <div className="wrap">
          <p className="kicker kicker--on-dark">How we run it</p>
          <h2 id="how" style={{ marginBottom: '2.5rem', maxWidth: '28ch' }}>
            The order matters more than the materials.
          </h2>
          <div className="steps">
            {d.process.map((s) => (
              <div className="step" key={s.title}>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────── in / out of scope */}
      <section className="section section--white" aria-labelledby="scope">
        <div className="wrap">
          <p className="kicker">What you are buying</p>
          <h2 id="scope" style={{ maxWidth: '30ch', marginBottom: '0.75rem' }}>
            Included, and deliberately not included.
          </h2>
          <p className="lead" style={{ marginBottom: '2.5rem' }}>
            Published here so you can compare us against another bid line for line. Most of the
            difference between two quotes is in the second column.
          </p>
          <div className="split">
            <div className="card">
              <h4 style={{ marginBottom: '0.5rem' }}>Included as standard</h4>
              <ul className="ticks ticks--yes">
                {d.included.map((i) => (
                  <li key={i}>
                    <IconCheck />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h4 style={{ marginBottom: '0.5rem' }}>Not included</h4>
              <ul className="ticks ticks--no">
                {d.notIncluded.map((i) => (
                  <li key={i}>
                    <IconMinus />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: '0.5rem' }}>
                Any of these can be added — they are listed separately so the price you compare is
                the price you pay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────── faq + form */}
      <section className="section" id="estimate" aria-labelledby="ask">
        <div className="wrap">
          <div className="split split--sticky">
            <div>
              <p className="kicker">{d.name} questions</p>
              <h2 id="ask" style={{ marginBottom: '1.5rem' }}>
                Straight answers, including the price ones.
              </h2>
              <Faq items={d.faq} />

              <h3 style={{ marginTop: '3rem', marginBottom: '1rem' }}>
                Where we do {d.name.toLowerCase()} work
              </h3>
              <ul className="chips">
                {AREAS.slice(0, 12).map((a) => (
                  <li key={a}>
                    <span>{a}</span>
                  </li>
                ))}
                <li>
                  <Link href="/service-area">+ more →</Link>
                </li>
              </ul>
            </div>

            <div className="card" style={{ gap: '1.25rem' }}>
              <div>
                <p className="kicker" style={{ marginBottom: '0.5rem' }}>
                  No cost, no obligation
                </p>
                <h3>{trade ? 'Request a scope and fee' : `Get a ${d.name.toLowerCase()} estimate`}</h3>
              </div>
              <p style={{ fontSize: 'var(--step--1)' }}>
                {trade
                  ? 'Tell us about the project — value, trade count, schedule and who holds the license. We will come walk it and send a written scope of management services with a fee.'
                  : 'Send the details and we will call you the same business day to set a time to come measure.'}
              </p>
              <LeadForm division={d.slug} />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────── cross-sell */}
      <section className="section section--white" aria-labelledby="also">
        <div className="wrap">
          <p className="kicker">Also in house</p>
          <h2 id="also" style={{ marginBottom: '0.75rem', maxWidth: '28ch' }}>
            Bundle it and you pay for the trip once.
          </h2>
          <p className="lead" style={{ marginBottom: '2rem' }}>
            Mobilization is a real cost. Combining divisions on one scope is cheaper than hiring
            each trade separately, and it means one schedule instead of three.
          </p>
          <div className="grid grid--3">
            {others.map((o) => (
              <Link
                className="card"
                key={o.slug}
                href={`/${o.slug}`}
                style={{ borderTop: `4px solid ${o.color}` }}
              >
                <span
                  className="card__icon"
                  style={
                    { '--accent': o.color, '--accent-text': o.colorText } as React.CSSProperties
                  }
                >
                  <DivisionIcon name={o.icon} />
                </span>
                <h4>{o.name}</h4>
                <p>{o.tagline}</p>
                <span
                  className="deck__go"
                  style={
                    { '--swatch-text': o.colorText, marginTop: 'auto' } as React.CSSProperties
                  }
                >
                  Open <IconArrow />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Cta
        accent={d.color}
        title={trade ? 'Put someone on the site who answers for it.' : `Let us look at the ${d.name.toLowerCase()} work.`}
        body={
          trade
            ? `Call and talk it through, or send the project details and we will come walk it with you.`
            : `Free measured estimates across Walton, Gwinnett and Barrow counties. Call and you get a person — or send the details and we will come look at it.`
        }
        primaryLabel={trade ? 'Request a scope and fee' : 'Get a free estimate'}
      />

      <JsonLd
        data={graph([
          webPage({
            path: `/${d.slug}`,
            name: d.metaTitle,
            description: d.metaDesc,
            about: `${SITE.url}/${d.slug}#service`,
          }),
          serviceNode(d),
          faqPage(d.faq, `/${d.slug}`),
          breadcrumbs([
            { name: 'Services', path: '/services' },
            { name: d.name, path: `/${d.slug}` },
          ]),
        ])}
      />
    </div>
  );
}
