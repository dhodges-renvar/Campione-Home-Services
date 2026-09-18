'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';

const slaClass = (s: string) => s === 'ON TARGET' ? 'ok' : s === 'LATE' ? 'warn' : 'bad';
const since = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

function LeadsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<'leads' | 'builders'>(
    params.get('tab') === 'builders' ? 'builders' : 'leads');

  // leads
  const [leadFilter, setLeadFilter] = useState<'uncontacted' | 'all'>('uncontacted');
  const [leads, setLeads] = useState<any[]>([]);
  // builders
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('all');
  const [pros, setPros] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (tab !== 'leads') return;
    const view = leadFilter === 'uncontacted' ? 'v_leads_needing_contact' : 'v_speed_to_lead';
    supabase.from(view).select('*').limit(100).then(({ data }) => setLeads(data || []));
  }, [tab, leadFilter]);

  useEffect(() => {
    if (tab !== 'builders') return;
    let req = supabase.from('prospects')
      .select('id,company,contact_name,city,phone,email,status,kind,source,rating', { count: 'exact' })
      .order('company').limit(60);
    if (kind !== 'all') req = req.eq('kind', kind);
    if (q.trim().length >= 2) req = req.ilike('company', `%${q.trim()}%`);
    req.then(({ data, count }) => { setPros(data || []); setTotal(count || 0); });
  }, [tab, q, kind]);

  async function logCall(leadId: string) {
    await supabase.from('lead_activities').insert({
      lead_id: leadId, kind: 'outbound_call', occurred_at: new Date().toISOString() });
  }

  return (
    <Chrome>
      <div className="bar">
        <div>
          <h1>{tab === 'leads' ? 'Leads' : 'Builders'}</h1>
          <div className="sub">
            {tab === 'leads' ? 'Whoever calls first usually wins.' : `${total} in the database`}
          </div>
        </div>
        <button className="barbtn"
          onClick={() => router.push(tab === 'leads' ? '/leads/new' : '/prospects/new')}>+ New</button>
      </div>

      <div className="chips" style={{ padding: '14px 20px 0' }}>
        <button className="chip" data-on={tab === 'leads' ? '1' : '0'} onClick={() => setTab('leads')}>Leads</button>
        <button className="chip" data-on={tab === 'builders' ? '1' : '0'} onClick={() => setTab('builders')}>Builders</button>
      </div>

      {tab === 'leads' ? (
        <>
          <div className="chips" style={{ padding: '10px 20px 0' }}>
            <button className="chip" data-on={leadFilter === 'uncontacted' ? '1' : '0'}
              onClick={() => setLeadFilter('uncontacted')}>Needs a call</button>
            <button className="chip" data-on={leadFilter === 'all' ? '1' : '0'}
              onClick={() => setLeadFilter('all')}>All</button>
          </div>
          <div className="main">
            {leads.length === 0 ? (
              <div className="empty"><strong>Nobody waiting</strong>Every lead has been contacted.</div>
            ) : leads.map((l) => (
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
        </>
      ) : (
        <>
          <div className="field" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by company" />
          </div>
          <div className="chips" style={{ padding: '12px 20px 0' }}>
            {[['all','All'],['home_builder','Builders'],['remodeler','Remodelers'],
              ['general_contractor','GCs'],['property_manager','Property mgrs']].map(([v, l]) => (
              <button key={v} className="chip" data-on={kind === v ? '1' : '0'}
                onClick={() => setKind(v)}>{l}</button>
            ))}
          </div>
          <div className="main">
            {pros.length === 0 ? (
              <div className="empty">
                <strong>Nothing here yet</strong>
                Add one with the button up top, or import the GAHBA list.
              </div>
            ) : pros.map((p) => (
              <div className="lead" key={p.id}>
                <div className="body" style={{ cursor: 'pointer' }} onClick={() => router.push(`/prospects/${p.id}`)}>
                  <div className="t1">{p.company}</div>
                  <div className="t2">
                    {[p.contact_name, p.city].filter(Boolean).join(' · ')}
                  </div>
                  <div className="t2" style={{ marginTop: 3 }}>
                    {p.status?.replace(/_/g, ' ')}
                    {p.rating ? ` · ${'\u2605'.repeat(p.rating)}` : ''}
                    {p.source ? ` · ${p.source}` : ''}
                  </div>
                </div>
                {p.phone && <a className="callbtn" href={`tel:${p.phone}`}>Call</a>}
              </div>
            ))}
            {pros.length >= 60 && (
              <div className="empty" style={{ padding: '24px' }}>
                Showing the first 60. Search to narrow it down.
              </div>
            )}
          </div>
        </>
      )}
    </Chrome>
  );
}

export default function Leads() {
  return <Suspense fallback={null}><LeadsInner /></Suspense>;
}
