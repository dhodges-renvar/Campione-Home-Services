import Link from 'next/link';
import { SITE } from '@/lib/site';
import { IconPhone } from './Icons';

/** Mobile-only. Two taps always available: call, or start an estimate. */
export default function CallBar() {
  return (
    <div className="callbar">
      <a className="btn btn--white" href={SITE.phoneHref}>
        <IconPhone />
        Call now
      </a>
      <Link className="btn btn--accent" href="/contact">
        Free estimate
      </Link>
    </div>
  );
}
