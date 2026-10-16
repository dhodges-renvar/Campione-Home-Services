import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import Crumbs from '@/components/Crumbs';
import JsonLd from '@/components/JsonLd';
import LeadForm from '@/components/LeadForm';
import { IconPhone, IconMail, IconPin, IconClock } from '@/components/Icons';
import { SITE, AREAS } from '@/lib/site';
import { graph, breadcrumbs, webPage } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Request a Free Estimate | Campione Home Services, Monroe GA',
  description: `Call ${SITE.phone} or send the project details. Free measured estimates for painting, drywall, exteriors, pressure washing, cleaning and construction management across metro Atlanta.`,
  alternates: { canonical: '/contact' },
};

const NEXT = [
  {
    t: 'We call you back',
    b: 'Same business day if it is before 4pm, next morning otherwise. A real person, not a scheduling bot.',
  },
  {
    t: 'We come measure',
    b: 'Usually within a few days. Bring your questions — the visit is as much for you to size us up as the reverse.',
  },
  {
    t: 'You get it in writing',
    b: 'Line items, products by name, inclusions and exclusions, and a price that holds unless the scope changes.',
  },
];

export default function ContactPage() {
  return (
    <>
      <Hero
        imageKey="contact"
        kicker="Free, no obligation"
        title="Tell us what the house needs."
        lead="Fill this in and we will call you the same business day. If you would rather just talk it through, the number is right here and it rings a person."
      >
        <a className="btn btn--white" href={SITE.phoneHref}>
          <IconPhone />
          {SITE.phone}
        </a>
        <a className="btn btn--ghost-light" href={`mailto:${SITE.email}`}>
          <IconMail />
          Email us
        </a>
      </Hero>

      <Crumbs items={[{ label: 'Contact' }]} />

      <section className="section">
        <div className="wrap">
          <div className="split split--wide-left">
            <div className="card" style={{ gap: '1.25rem' }}>
              <div>
                <p className="kicker" style={{ marginBottom: '0.5rem' }}>
                  Estimate request
                </p>
                <h2 style={{ fontSize: 'var(--step-2)' }}>Send the details</h2>
              </div>
              <LeadForm />
            </div>

            <div className="stack-lg">
              <div className="stack">
                <h3>Reach us directly</h3>
                <div className="card">
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '1.1rem' }}>
                    <li style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                      <span style={{ flex: 'none', color: 'var(--accent)', marginTop: 2 }}>
                        <IconPhone />
                      </span>
                      <span>
                        <b style={{ display: 'block', fontSize: 'var(--step-1)' }}>
                          <a href={SITE.phoneHref}>{SITE.phone}</a>
                        </b>
                        <span className="muted" style={{ fontSize: 'var(--step--1)' }}>
                          Call or text. Fastest way to reach us.
                        </span>
                      </span>
                    </li>
                    <li style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                      <span style={{ flex: 'none', color: 'var(--accent)', marginTop: 2 }}>
                        <IconMail />
                      </span>
                      <span>
                        <b style={{ display: 'block' }}>
                          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                        </b>
                        <span className="muted" style={{ fontSize: 'var(--step--1)' }}>
                          Good for plans, scopes and bid packages.
                        </span>
                      </span>
                    </li>
                    <li style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                      <span style={{ flex: 'none', color: 'var(--accent)', marginTop: 2 }}>
                        <IconClock />
                      </span>
                      <span>
                        <b style={{ display: 'block' }}>{SITE.hoursLabel}</b>
                        <span className="muted" style={{ fontSize: 'var(--step--1)' }}>
                          Messages outside hours get answered first thing.
                        </span>
                      </span>
                    </li>
                    <li style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                      <span style={{ flex: 'none', color: 'var(--accent)', marginTop: 2 }}>
                        <IconPin />
                      </span>
                      <span>
                        <b style={{ display: 'block' }}>
                          {SITE.street}, {SITE.city}, {SITE.state} {SITE.zip}
                        </b>
                        <span className="muted" style={{ fontSize: 'var(--step--1)' }}>
                          Office and estimating. Work happens at your place.
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="stack">
                <h3>What happens next</h3>
                <div className="steps" style={{ gridTemplateColumns: '1fr' }}>
                  {NEXT.map((n) => (
                    <div className="step" key={n.t}>
                      <h4>{n.t}</h4>
                      <p>{n.b}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stack">
                <h3>Service area</h3>
                <p className="muted" style={{ fontSize: 'var(--step--1)' }}>
                  {AREAS.join(' · ')} — plus the surrounding metro. Walton, Gwinnett, Barrow,
                  Oconee and Newton counties and north Fulton.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <JsonLd
        data={graph([
          webPage({
            path: '/contact',
            name: `Contact ${SITE.name}`,
            description: `Request a free estimate or call ${SITE.phone}.`,
          }),
          {
            '@type': 'ContactPage',
            '@id': `${SITE.url}/contact#contactpage`,
            url: `${SITE.url}/contact`,
            name: `Contact ${SITE.name}`,
          },
          breadcrumbs([{ name: 'Contact', path: '/contact' }]),
        ])}
      />
    </>
  );
}
