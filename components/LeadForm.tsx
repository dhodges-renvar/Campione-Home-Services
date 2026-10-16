'use client';

import { useEffect, useRef, useState } from 'react';
import { DIVISIONS } from '@/lib/divisions';
import { SITE } from '@/lib/site';
import { IconCheck } from './Icons';

export default function LeadForm({ division = '' }: { division?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const t0 = useRef(0);
  const live = useRef<HTMLDivElement>(null);

  useEffect(() => {
    t0.current = Date.now();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setError('');

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          t0: t0.current,
          page: typeof window !== 'undefined' ? window.location.pathname : '',
        }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !json.ok) {
        setError(json.error || `Please call or text ${SITE.phone} and we will take care of it.`);
        setState('error');
        return;
      }
      setState('done');
    } catch {
      setError(`We could not reach the server. Please call or text ${SITE.phone}.`);
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="card card--accent-top" role="status" style={{ gap: '1rem' }}>
        <div className="card__icon">
          <IconCheck />
        </div>
        <h3>Got it. We will call you.</h3>
        <p>
          Your request is in front of us now, not in a pile for next week. Expect a call the same
          business day if you sent it before 4pm, and the next morning otherwise.
        </p>
        <p>
          If it is urgent, skip the wait —{' '}
          <a href={SITE.phoneHref} style={{ fontWeight: 700, textDecoration: 'underline' }}>
            {SITE.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div aria-live="polite" ref={live}>
        {state === 'error' && (
          <div className="form__status form__status--err">{error}</div>
        )}
      </div>

      <div className="field--2">
        <div className="field">
          <label htmlFor="first_name">First name *</label>
          <input id="first_name" name="first_name" required autoComplete="given-name" />
        </div>
        <div className="field">
          <label htmlFor="last_name">Last name</label>
          <input id="last_name" name="last_name" autoComplete="family-name" />
        </div>
      </div>

      <div className="field--2">
        <div className="field">
          <label htmlFor="phone">Phone *</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(404) 555-0123"
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" inputMode="email" autoComplete="email" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="address">Project address</label>
        <input id="address" name="address" autoComplete="street-address" placeholder="Street address" />
      </div>

      <div className="field--2">
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" name="city" autoComplete="address-level2" />
        </div>
        <div className="field">
          <label htmlFor="zip">ZIP</label>
          <input id="zip" name="zip" inputMode="numeric" autoComplete="postal-code" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="division">What do you need?</label>
        <select id="division" name="division" defaultValue={division}>
          <option value="">Not sure yet — help me figure it out</option>
          {DIVISIONS.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="message">Tell us about the project</label>
        <textarea
          id="message"
          name="message"
          placeholder="Rooms, square footage, what is failing, when you would like it done — whatever you know. If you are not sure, that is fine, that is what the visit is for."
        />
        <span className="hint">
          The more you put here, the more useful the first conversation is.
        </span>
      </div>

      {/* honeypot — hidden from people, irresistible to bots */}
      <div aria-hidden style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
        <label htmlFor="company_website">Website</label>
        <input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>

      <button className="btn btn--accent btn--block" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Request my free estimate'}
      </button>

      <p className="form__note">
        No obligation and no pressure. We will call to set a time that works, come measure, and
        send a written scope. Prefer to talk now?{' '}
        <a href={SITE.phoneHref} style={{ fontWeight: 700, textDecoration: 'underline' }}>
          {SITE.phone}
        </a>
      </p>
    </form>
  );
}
