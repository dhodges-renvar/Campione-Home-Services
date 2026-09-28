'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type Sections = {
  scope: string; exclusions: string; customer: string; internal: string;
};
export const emptySections = (): Sections =>
  ({ scope: '', exclusions: '', customer: '', internal: '' });

const META: [keyof Sections, string, string][] = [
  ['scope', 'Scope of work', 'What we are doing. Specific enough that nobody argues later.'],
  ['exclusions', 'Exclusions', 'What we are NOT doing. This is where change orders come from.'],
  ['customer', 'Customer responsibilities', 'What has to be ready before we start.'],
  ['internal', 'Internal notes', 'Never shown to the customer.'],
];

/* Four named boxes rather than one free-text field. A rep who is not Jorge
   should not have to remember what a proposal needs to say. */
export default function ProposalSections({ trade, value, onChange }:
  { trade: string; value: Sections; onChange: (s: Sections) => void }) {
  const [open, setOpen] = useState<keyof Sections | null>(null);
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('proposal_defaults').select('section,body')
      .eq('trade', trade).eq('active', true)
      .then(({ data }) => {
        const d = Object.fromEntries((data || []).map((r: any) => [r.section, r.body]));
        setDefaults(d);
        setLoaded(true);
        // prefill only what is still blank
        const next = { ...value };
        let changed = false;
        for (const k of ['scope', 'exclusions', 'customer', 'internal'] as (keyof Sections)[]) {
          if (!next[k] && d[k]) { next[k] = d[k]; changed = true; }
        }
        if (changed) onChange(next);
      });
  }, [trade]);

  const set = (k: keyof Sections, v: string) => onChange({ ...value, [k]: v });
  const filled = (k: keyof Sections) => value[k]?.trim().length > 0;
  const isDefault = (k: keyof Sections) => value[k]?.trim() === (defaults[k] ?? '').trim();

  return (
    <>
      {META.map(([k, label, hint]) => (
        <div key={k}>
          <button className="acc" onClick={() => setOpen(open === k ? null : k)}>
            <span>{label}</span>
            <span className="r">
              {filled(k) ? (isDefault(k) ? 'house standard' : 'edited') : 'empty'}
              {open === k ? '  \u2212' : '  +'}
            </span>
          </button>
          {open === k && (
            <div className="field">
              <div className="t2" style={{ marginBottom: 10 }}>{hint}</div>
              <textarea className="note" rows={k === 'internal' ? 3 : 9}
                value={value[k]} onChange={(e) => set(k, e.target.value)} />
              {loaded && defaults[k] && !isDefault(k) && (
                <button className="chip" style={{ marginTop: 10 }}
                  onClick={() => set(k, defaults[k])}>Reset to house standard</button>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
