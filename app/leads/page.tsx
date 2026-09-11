'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import { useRouter } from 'next/navigation';

type Lead = {
  id: string; division: string; source_code: string; status: string;
  received_at: string; first_contact_at: string | null;
  minutes_to_contact: number | null; sla: string;
  customer: string | null; phone: string | null;
};

const slaClass = (s: string) => s === 'ON TARGET' ? 'ok' : s === 'LATE' ? 'warn' : 'bad';

export default function Leads() {
  const router = useRouter();
  const [rows, setRows] = useState<Lead[]>([]);
  const [tab, setTab] = useState<'uncontacted' | 'all'>('uncontacted');

  async function load() {
    const view = tab === 'uncontacted' ? 'v_leads_needing_contact' : 'v_speed_to_lead';
    const { data } = await supabase.from(view).select('*').limit(100);
    setRows((data as any) || []);
  }
  useEffect(() => { load(); }, [tab]);

  async function logCall(l: Lead) {
    await supabase.from('lead_activities').insert({
      lead_id: l.id, kind: 'outbound_call', occurred_at: new Date().toISOString(),
    });
    setTimeout(load, 400);
  }

  const since = (iso: string) => {
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.round(m / 60)}h ago`;
    return `${Math.round(m / 1440)}d ago`;
  };

  return (
    <Chrome>
      <div className="bar">
        <div>
          <h1>Leads</h1>
          <div className="sub">Whoever calls first usually wins.</div>
        </div>
        <button className="barbtn" onClick={() => router.push('/leads/new')}>+ New</button>
      </div>
      <div className="chips" style={{ padding: '12px 18px 0' }}>
        <button className="chip" data-on={tab === 'uncontacted' ? '1' : '0'}
          onClick={() => setTab('uncontacted')}>Needs a call</button>
        <button className="chip" data-on={tab === 'all' ? '1' : '0'}
          onClick={() => setTab('all')}>All</button>
      </div>
      <div className="main">
        {rows.length === 0 ? (
          <div className="empty">
            <strong>Nobody waiting</strong>
            Every lead has been contacted.
          </div>
        ) : rows.map((l) => (
          <div className="lead" key={l.id}>
            <div className="body" onClick={() => router.push(`/leads/${l.id}`)} style={{ cursor: 'pointer' }}>
              <div className="t1">{l.customer?.trim() || 'Unknown caller'}</div>
              <div className="t2">
                {l.division?.replace('_', ' ')} · {l.source_code?.replace(/_/g, ' ')} · {since(l.received_at)}
              </div>
              <div style={{ marginTop: 8 }}>
                <span className={`sla ${slaClass(l.sla)}`}>{l.sla}</span>
              </div>
            </div>
            {l.phone && (
              <a className="callbtn" href={`tel:${l.phone}`} onClick={() => logCall(l)}>Call</a>
            )}
          </div>
        ))}
      </div>
      <div className="dock">
        <div className="inner">
          <button className="btn" onClick={() => router.push('/leads/new')}>Log a new lead</button>
        </div>
      </div>
    </Chrome>
  );
}
