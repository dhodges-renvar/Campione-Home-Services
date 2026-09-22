'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';

const slaClass = (s: string) => s === 'ON TARGET' ? 'ok' : s === 'LATE' ? 'warn' : 'bad';
const since = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

export default function Leads() {
  const router = useRouter();
  const [filter, setFilter] = useState<'uncontacted' | 'all'>('uncontacted');
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    const view = filter === 'uncontacted' ? 'v_leads_needing_contact' : 'v_speed_to_lead';
    supabase.from(view).select('*').limit(100).then(({ data, error }) => {
      setErr(error ? error.message : ''); setRows(data || []);
    });
  }, [filter]);

  async function logCall(leadId: string) {
    await supabase.from('lead_activities').insert({
      lead_id: leadId, kind: 'outbound_call', occurred_at: new Date().toISOString() });
  }

  return (
    <Chrome>
      <div className="bar">
        <div>
          <h1>Leads</h1>
          <div className="sub">Whoever calls first usually wins.</div>
        </div>
        <button className="barbtn" onClick={() => router.push('/leads/new')}>+ New</button>
      </div>

      <div className="chips" style={{ padding: '14px 20px 0' }}>
        <button className="chip" data-on={filter === 'uncontacted' ? '1' : '0'}
          onClick={() => setFilter('uncontacted')}>Needs a call</button>
        <button className="chip" data-on={filter === 'all' ? '1' : '0'}
          onClick={() => setFilter('all')}>All</button>
      </div>

      <div className="main">
        {err ? (
          <div className="empty"><strong>Could not load leads</strong>
            <span style={{ display: 'block', marginTop: 8, color: 'var(--no)', fontWeight: 600 }}>{err}</span></div>
        ) : rows.length === 0 ? (
          <div className="empty"><strong>Nobody waiting</strong>Every lead has been contacted.</div>
        ) : rows.map((l) => (
          <div className="lead" key={l.id}>
            <div className="body" style={{ cursor: 'pointer' }} onClick={() => router.push(`/leads/${l.id}`)}>
              <div className="t1">{l.customer?.trim() || 'Unknown caller'}</div>
              <div className="t2">
                {l.division?.replace('_', ' ')} · {l.source_code?.replace(/_/g, ' ')} · {since(l.received_at)}
              </div>
              <div style={{ marginTop: 8 }}><span className={`sla ${slaClass(l.sla)}`}>{l.sla}</span></div>
            </div>
            {l.phone && <a className="callbtn" href={`tel:${l.phone}`} onClick={() => logCall(l.id)}>Call</a>}
          </div>
        ))}
      </div>
    </Chrome>
  );
}
