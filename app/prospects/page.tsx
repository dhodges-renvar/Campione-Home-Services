'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';

const FILTERS: [string, string][] = [
  ['all', 'All'], ['home_builder', 'Builders'], ['property_manager', 'Property mgrs'],
  ['interior_designer', 'Designers'], ['remodeler', 'Remodelers'],
  ['general_contractor', 'GCs'], ['realtor', 'Realtors'], ['architect', 'Architects'],
  ['stager', 'Stagers'], ['commercial', 'Commercial'], ['__enrich', 'Needs research'],
];

export default function Builders() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('all');
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      let req = supabase.from('prospects')
        .select('id,company,contact_name,city,phone,email,status,kind,segment,priority,source,rating,needs_enrichment',
                { count: 'exact' })
        .order('priority', { nullsFirst: false }).order('company').limit(60);
      if (kind === '__enrich') req = req.eq('needs_enrichment', true);
      else if (kind !== 'all') req = req.eq('kind', kind);
      if (q.trim().length >= 2) req = req.ilike('company', `%${q.trim()}%`);
      const { data, count, error } = await req;
      setLoading(false);
      if (error) {
        setRows([]); setTotal(0);
        setErr(/column .* does not exist/i.test(error.message)
          ? 'The database is missing columns this screen needs. Run campione_prospects_v2.sql.'
          : error.message);
        return;
      }
      setErr(''); setRows(data || []); setTotal(count || 0);
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, kind]);

  return (
    <Chrome>
      <div className="bar">
        <div>
          <h1>B2B</h1>
          <div className="sub">
            {loading ? 'Loading…' : `Builders, property managers, GCs · ${total} in the database`}
          </div>
        </div>
        <button className="barbtn" onClick={() => router.push('/prospects/new')}>+ New</button>
      </div>

      <div className="field" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by company" />
      </div>
      <div className="chips" style={{ padding: '12px 20px 0' }}>
        {FILTERS.map(([v, l]) => (
          <button key={v} className="chip" data-on={kind === v ? '1' : '0'} onClick={() => setKind(v)}>{l}</button>
        ))}
      </div>

      <div className="main">
        {err ? (
          <div className="empty">
            <strong>Could not load builders</strong>
            <span style={{ display: 'block', marginTop: 8, color: 'var(--no)', fontWeight: 600 }}>{err}</span>
          </div>
        ) : !loading && rows.length === 0 ? (
          <div className="empty">
            <strong>Nothing here yet</strong>
            {q || kind !== 'all' ? 'Nothing matches that filter.' : 'Add one with the button up top.'}
          </div>
        ) : rows.map((p) => (
          <div className="lead" key={p.id}>
            <div className="body" style={{ cursor: 'pointer' }} onClick={() => router.push(`/prospects/${p.id}`)}>
              <div className="t1">{p.company}</div>
              <div className="t2">{[p.contact_name, p.city].filter(Boolean).join(' · ')}</div>
              <div className="t2" style={{ marginTop: 3 }}>
                {p.priority && <span className="sla ok" style={{ marginRight: 8 }}>{p.priority}</span>}
                {p.segment || p.kind?.replace(/_/g, ' ')}
                {' · '}{p.status?.replace(/_/g, ' ')}
                {p.rating ? ` · ${'\u2605'.repeat(p.rating)}` : ''}
              </div>
              {p.needs_enrichment && (
                <div className="t2" style={{ color: 'var(--amber)', fontWeight: 620, marginTop: 4 }}>
                  No phone or email yet
                </div>
              )}
            </div>
            {p.phone && <a className="callbtn" href={`tel:${p.phone}`}>Call</a>}
          </div>
        ))}
        {rows.length >= 60 && (
          <div className="empty" style={{ padding: 24 }}>Showing the first 60. Search to narrow it down.</div>
        )}
      </div>
    </Chrome>
  );
}
