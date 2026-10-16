import type { Metadata } from 'next';
import Link from 'next/link';
import Hero from '@/components/Hero';
import Cta from '@/components/Cta';
import Crumbs from '@/components/Crumbs';
import JsonLd from '@/components/JsonLd';
import { IconPhone, IconCheck } from '@/components/Icons';
import { SITE, CLIENT_TYPES } from '@/lib/site';
import { divisionsInDeckOrder } from '@/lib/divisions';
import { graph, breadcrumbs, webPage } from '@/lib/schema';

const decks = divisionsInDeckOrder();
const years = new Date().getFullYear() - Number(SITE.founded);

export const metadata: Metadata = {
  title: `About Campione Home Services | Monroe, GA Contractor Since ${SITE.founded}`,
  description: `Campione Home Services has worked out of Monroe, Georgia since ${SITE.founded}. Six divisions, residential and trade, across Walton, Gwinnett and Barrow counties.`,
  alternates: { canonical: '/about' },
};

const VALUES = [
  {
    color: '#2D6CA2',
    title: 'Measure it, then price it',
    body: 'Phone quotes are guesses, and guesses get corrected later at the customer’s expense. We measure the real surfaces and put quantities on the page.',
  },
  {
    color: '#546A7B',
    title: 'Write down what is not included',
    body: 'Most contractor disputes are about something nobody wrote down. Publishing the exclusions is less comfortable and far less expensive.',
  },
  {
    color: '#2E9B8F',
    title: 'Answer the phone',
    body: 'Silence is the single most common complaint about this industry. Same-day callbacks are not a service feature here, they are the baseline.',
  },
  {
    color: '#A0563A',
    title: 'Say no to the wrong job',
    body: 'If refinishing will not hold on your cabinets, or a fence is past repair, we will tell you instead of taking the work and hoping.',
  },
];

export default function AboutPage() {
  return (
    <>
      <Hero
        imageKey="about"
        kicker={`${SITE.city}, Georgia · ${SITE.county}`}
        title={<>A painting company that kept getting asked to do the next thing.</>}
        lead={
          <>
            Campione started in {SITE.founded} doing one trade well. {years} years later it runs
            six divisions, because the customers who trusted us with the walls kept asking who
            they should call about the drywall, the rotten fascia, the dirty driveway and the
            subs nobody was managing.
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

      <Crumbs items={[{ label: 'About' }]} />

      <section className="section">
        <div className="wrap">
          <div className="split split--wide-left">
            <div className="stack">
              <p className="kicker">The short version</p>
              <h2 style={{ maxWidth: '28ch' }}>
                One contractor, six divisions, same standard across all of them.
              </h2>
              <p className="lead">
                We are a {SITE.city}-based contractor working the east side of metro Atlanta.
                Painting is the oldest division and still the largest. Drywall, exteriors,
                pressure washing, cleaning and construction management each grew out of real jobs
                where a customer needed the next trade and did not want to find and manage another
                company.
              </p>
              <p>
                That structure is the whole point. A kitchen that needs drywall repair, cabinet
                refinishing and a final clean is one scope, one schedule and one invoice here.
                Elsewhere it is three companies, three deposits and three people blaming each
                other about who scratched the floor.
              </p>
              <p>
                About half of our work is for homeowners and half is trade — production and custom
                builders, property management portfolios and interior designers. The craftsmanship
                standard is identical. The paperwork and the pace are not, and we run them
                differently on purpose.
              </p>
            </div>

            <div className="stack">
              <div className="stat-row">
                <div className="stat">
                  <b>{SITE.founded}</b>
                  <span>Founded</span>
                </div>
                <div className="stat">
                  <b>6</b>
                  <span>Divisions</span>
                </div>
                <div className="stat">
                  <b>{SITE.rating.toFixed(1)}</b>
                  <span>Google rating</span>
                </div>
                <div className="stat">
                  <b>20+</b>
                  <span>Cities served</span>
                </div>
              </div>
              <div className="card">
                <h4>Credentials</h4>
                <ul className="ticks ticks--yes">
                  <li>
                    <IconCheck />
                    <span>General liability insurance in force</span>
                  </li>
                  <li>
                    <IconCheck />
                    <span>Workers compensation coverage</span>
                  </li>
                  <li>
                    <IconCheck />
                    <span>Certificate of insurance with every proposal</span>
                  </li>
                  <li>
                    <IconCheck />
                    <span>Licensed work performed under a named license holder</span>
                  </li>
                  <li>
                    <IconCheck />
                    <span>Written scope and written labor warranty on every job</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--white" aria-labelledby="values">
        <div className="wrap">
          <p className="kicker">How we operate</p>
          <h2 id="values" style={{ marginBottom: '2.5rem', maxWidth: '24ch' }}>
            Four rules, and they are all boring.
          </h2>
          <div className="grid grid--4">
            {VALUES.map((v) => (
              <article
                className="card card--accent-top"
                key={v.title}
                style={{ ['--accent' as string]: v.color } as React.CSSProperties}
              >
                <h4>{v.title}</h4>
                <p>{v.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--dark on-dark" aria-labelledby="who">
        <div className="wrap">
          <p className="kicker kicker--on-dark">Who we work for</p>
          <h2 id="who" style={{ marginBottom: '2.5rem', maxWidth: '26ch' }}>
            Four kinds of client, run four different ways.
          </h2>
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

          <hr className="rule" style={{ marginBlock: '3rem' }} />

          <div className="split split--wide-left">
            <div>
              <h3 style={{ marginBottom: '0.75rem' }}>The six divisions</h3>
              <p className="lead lead--on-dark">
                Each has its own page with real cost ranges, what is included, what is not, and
                the questions people actually ask before they call.
              </p>
            </div>
            <ul className="chips">
              {decks.map((d) => (
                <li key={d.slug}>
                  <Link href={`/${d.slug}`}>{d.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Cta
        title="Come see whether we are the right fit."
        body="No charge for the visit and no pressure after it. We will measure, tell you what the house needs, and put it in writing."
      />

      <JsonLd
        data={graph([
          webPage({
            path: '/about',
            name: `About ${SITE.name}`,
            description: `Campione Home Services has worked out of ${SITE.city}, Georgia since ${SITE.founded}, running six divisions for homeowners and the trade.`,
          }),
          breadcrumbs([{ name: 'About', path: '/about' }]),
        ])}
      />
    </>
  );
}
