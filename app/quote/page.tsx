'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import { divisionColor, DIVISION_LABEL } from '@/lib/theme';

/* Divisions first, then what that division actually quotes. Painting has three
   already; the others are stubs so the shape is visible before they launch. */
const DIVISIONS: { code: string; label: string; live: boolean;
                   services: { label: string; href: string; note: string }[] }[] = [
  { code: 'painting', label: 'Painting', live: true, services: [
    { label: 'Interior',  href: '/quote/new',     note: 'Rooms or detailed takeoff' },
    { label: 'Deck & porch', href: '/quote/deck', note: 'Decks, porches, screened rooms' },
    { label: 'Drywall',   href: '/quote/drywall', note: 'Hang, finish, sand' },
  ]},
  { code: 'pressure_washing', label: 'Pressure Washing', live: false, services: [] },
  { code: 'cleaning',   label: 'Cleaning',   live: false, services: [] },
  { code: 'exteriors',  label: 'Exteriors',  live: false, services: [] },
];

const money = (n: number) => '$' + Math.round(n || 0).toLocaleString();
const tradeOf = (e: any) => (e?.settings?.trade as string) || 'painting';
const pathFor = (e: any) => {
  const t = tradeOf(e);
  return t === 'drywall' ? '/quote/drywall' : t === 'deck' ? '/quote/deck' : '/quote/new';
};

export default function QuoteList() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [picking, setPicking] = useState(false);
  const [division, setDivision] = useState<string | null>(null);
  useEffect(() => {
    supabase.from('estimates').select('id,price,status,division,service_type,settings,created_at,sent_at,contacts(first_name,last_name),properties(address_line1,city)')
      .order('created_at', { ascending: false }).limit(60)
      .then(({ data }) => setRows((data as any) || []));
  }, []);

  return (
    <Chrome>
      <div className="bar">
        <div>
          <h1>Quotes</h1>
          <div className="sub">Tap a quote for the proposal and take-off.</div>
        </div>
      </div>
      <div className="main">
        {rows.length === 0 ? (
          <div className="empty">
            <strong>No quotes yet</strong>
            Start one and it lands here.
          </div>
        ) : rows.map((e) => (
          <button className="row" key={e.id} onClick={() => router.push(`/quote/${e.id}`)}>
            <div className="t1">
              {money(e.price)} · {`${e.contacts?.first_name ?? ''} ${e.contacts?.last_name ?? ''}`.trim() || 'No name'}
            </div>
            <div className="t2">
              {e.properties?.address_line1}{e.properties?.city ? `, ${e.properties.city}` : ''}
            </div>
            <div className="tagrow">
              <span className="tag accent" style={{ ["--accent" as any]: divisionColor(e.division) }}>
                {tradeOf(e)}
              </span>
              <span className="tag">{e.status}</span>
              {e.status === 'draft' && <span className="tag due">unfinished</span>}
            </div>
          </button>
        ))}
      </div>
      <div className="dock"><div className="inner">
        {!picking ? (
          <button className="btn" onClick={() => { setPicking(true); setDivision(null); }}>
            Start a quote
          </button>
        ) : division === null ? (
          <>
            <div className="t2" style={{ marginBottom: 10, fontWeight: 620 }}>Which division</div>
            {DIVISIONS.map((d) => (
              <button key={d.code} className="row" disabled={!d.live}
                style={{ opacity: d.live ? 1 : 0.4, borderRadius: 6, marginBottom: 6,
                         border: '1px solid var(--line)' }}
                onClick={() => d.live && setDivision(d.code)}>
                <div className="t1">
                  <span className="pip" style={{ background: divisionColor(d.code) }} />
                  {d.label}
                </div>
                <div className="t2">{d.live ? `${d.services.length} services` : 'not launched yet'}</div>
              </button>
            ))}
            <button className="btn ghost" style={{ marginTop: 4 }} onClick={() => setPicking(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <div className="t2" style={{ marginBottom: 10, fontWeight: 620 }}>
              {DIVISIONS.find((d) => d.code === division)?.label}
            </div>
            {DIVISIONS.find((d) => d.code === division)!.services.map((sv) => (
              <button key={sv.href} className="row"
                style={{ borderRadius: 6, marginBottom: 6, border: '1px solid var(--line)' }}
                onClick={() => router.push(sv.href)}>
                <div className="t1">{sv.label}</div>
                <div className="t2">{sv.note}</div>
              </button>
            ))}
            <button className="btn ghost" style={{ marginTop: 4 }} onClick={() => setDivision(null)}>
              Back
            </button>
          </>
        )}
      </div></div>
    </Chrome>
  );
}
