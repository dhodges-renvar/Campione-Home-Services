'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import { divisionColor } from '@/lib/theme';

const money = (n: number) => '$' + Math.round(n || 0).toLocaleString();
const tradeOf = (e: any) => (e?.settings?.trade as string) || 'painting';
const pathFor = (e: any) => {
  const t = tradeOf(e);
  return t === 'drywall' ? '/quote/drywall' : t === 'deck' ? '/quote/deck' : '/quote/new';
};

export default function QuoteList() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
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
          <div className="sub">Tap any quote to pick it back up.</div>
        </div>
      </div>
      <div className="main">
        {rows.length === 0 ? (
          <div className="empty">
            <strong>No quotes yet</strong>
            Start one and it lands here.
          </div>
        ) : rows.map((e) => (
          <button className="row" key={e.id} onClick={() => router.push(`${pathFor(e)}?id=${e.id}`)}>
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" onClick={() => router.push('/quote/deck')}>Deck</button>
          <button className="btn ghost" onClick={() => router.push('/quote/drywall')}>Drywall</button>
          <button className="btn" onClick={() => router.push('/quote/new')}>Painting</button>
        </div>
      </div></div>
    </Chrome>
  );
}
