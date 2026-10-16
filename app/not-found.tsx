import Link from 'next/link';
import { SITE } from '@/lib/site';
import { divisionsInDeckOrder } from '@/lib/divisions';
import { IconPhone } from '@/components/Icons';
import DeckRule from '@/components/DeckRule';

export const metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  const decks = divisionsInDeckOrder();
  return (
    <>
      <section className="hero hero--center">
        <div className="hero__field" />
        <div className="hero__rake" />
        <div className="hero__scrim" />
        <div className="hero__grain" />
        <div className="wrap">
          <div className="hero__inner">
            <p className="kicker kicker--on-dark" style={{ justifyContent: 'center' }}>
              404
            </p>
            <h1>That page is not here.</h1>
            <p className="hero__lead">
              It may have moved, or the link may be wrong. Everything we do is one click away
              below — or just call and ask.
            </p>
            <div className="btn-row">
              <Link className="btn btn--white" href="/services">
                See all services
              </Link>
              <a className="btn btn--ghost-light" href={SITE.phoneHref}>
                <IconPhone />
                {SITE.phone}
              </a>
            </div>
          </div>
        </div>
        <div className="hero__rule">
          <DeckRule tall />
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <ul className="chips">
            <li>
              <Link href="/">Home</Link>
            </li>
            {decks.map((d) => (
              <li key={d.slug}>
                <Link href={`/${d.slug}`}>{d.name}</Link>
              </li>
            ))}
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/service-area">Service area</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
