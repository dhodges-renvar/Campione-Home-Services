'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import { divisionColor } from '@/lib/theme';

const money = (n: number) => '$' + Math.round(n || 0).toLocaleString();

export default function QuoteList() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('v_estimate_pipeline').select('*')
      .order('created_at', { ascending: false }).limit(60)
      .then(({ data }) => setRows(data || []));
  }, []);

  return (
    <Chrome>
      <div className="bar">
        <div>
          <h1>Quotes</h1>
          <div className="sub">Price it on site, before you leave.</div>
        </div>
      </div>
      <div className="main">
        {rows.length === 0 ? (
          <div className="empty">
            <strong>No quotes yet</strong>
            Start one and it lands here.
          </div>
        ) : rows.map((e) => (
          <button className="row" key={e.id} onClick={() => router.push(`/quote/new?id=${e.id}`)}>
            <div className="t1">{money(e.price)} · {e.customer?.trim() || 'No name'}</div>
            <div className="t2">{e.address_line1}{e.city ? `, ${e.city}` : ''}</div>
            <div className="tagrow">
              <span className="tag accent" style={{ ["--accent" as any]: divisionColor(e.division) }}>{e.division?.replace('_', ' ')}</span>
              <span className="tag">{e.status}</span>
              {e.days_since_sent != null && <span className="tag">sent {e.days_since_sent}d ago</span>}
            </div>
          </button>
        ))}
      </div>
      <div className="dock"><div className="inner">
        <div className="pair" style={{ display: 'flex', gap: 10 }}>
          <button className="btn ghost" onClick={() => router.push('/quote/drywall')}>Drywall</button>
          <button className="btn" onClick={() => router.push('/quote/new')}>Painting</button>
        </div>
      </div></div>
    </Chrome>
  );
}
