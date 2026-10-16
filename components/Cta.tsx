import Link from 'next/link';
import { SITE } from '@/lib/site';
import { IconPhone } from './Icons';

type Props = {
  title?: string;
  body?: string;
  accent?: string;
  primaryLabel?: string;
};

export default function Cta({
  title = 'Tell us what the house needs.',
  body = `Free, measured estimates across Walton, Gwinnett and Barrow counties. Call and you get a person, not a queue — or send the details and we will come look at it.`,
  accent,
  primaryLabel = 'Get a free estimate',
}: Props) {
  return (
    <section className="cta" style={accent ? ({ '--accent': accent } as React.CSSProperties) : undefined}>
      <div className="wrap">
        <div className="cta__inner">
          <div>
            <h2>{title}</h2>
            <p>{body}</p>
          </div>
          <div className="btn-row">
            <Link className="btn btn--white" href="/contact">
              {primaryLabel}
            </Link>
            <a className="btn btn--ghost-light" href={SITE.phoneHref}>
              <IconPhone />
              {SITE.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
