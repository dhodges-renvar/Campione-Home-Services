'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import PeoplePanel from '@/components/PeoplePanel';

const STATUSES = ['new','researching','contacted','responded','meeting_set','quoting',
                  'won','not_interested','bad_fit','do_not_contact'];

export default function ProspectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [p, setP] = useState<any>(null);
  const [acts, setActs] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState('');
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1500); };
  const [edit, setEdit] = useState(false);
  const [ef, setEf] = useState<any>({});
  const [conflict, setConflict] = useState('');

  function startEdit() {
    setConflict('');
    setEf({ company: p.company ?? '', phone: p.phone ?? '', email: p.email ?? '',
            website: p.website ?? '', address_line1: p.address_line1 ?? '',
            city: p.city ?? '', postal_code: p.postal_code ?? '', kind: p.kind,
            segment: p.segment ?? '' });
    setEdit(true);
  }

  async function saveEdit() {
    setConflict('');
    const { data: hits } = await supabase.rpc('check_prospect_conflict', {
      p_id: id, p_company: ef.company || null,
      p_phone: ef.phone || null, p_email: ef.email || null });
    if (hits && hits.length) {
      const h = hits[0];
      setConflict(`That ${h.field} already belongs to ${h.other_company}.`);
      return;
    }
    const patch: any = {};
    for (const k of Object.keys(ef)) patch[k] = ef[k] === '' ? null : ef[k];
    const { error } = await supabase.from('prospects').update(patch).eq('id', id);
    if (error) { setConflict(error.message); return; }
    setP((x: any) => ({ ...x, ...patch })); setEdit(false); flash('Saved');
  }

  async function load() {
    const { data } = await supabase.from('prospects').select('*').eq('id', id).single();
    setP(data);
    const { data: a } = await supabase.from('prospect_activities').select('*')
      .eq('prospect_id', id).order('occurred_at', { ascending: false });
    setActs(a || []);
  }
  useEffect(() => { load(); }, [id]);

  async function log(kind: string, body?: string) {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from('prospect_activities').insert({
      prospect_id: id, kind, body: body || null, user_id: u.user?.id ?? null });
    await supabase.from('prospects').update({
      last_contacted_at: new Date().toISOString(),
      status: p?.status === 'new' ? 'contacted' : p?.status }).eq('id', id);
    load(); flash('Logged');
  }

  async function setField(patch: any) {
    await supabase.from('prospects').update(patch).eq('id', id);
    setP((x: any) => ({ ...x, ...patch })); flash('Saved');
  }

  async function convertToLead() {
    const { data: contactId } = await supabase.rpc('find_or_create_contact', {
      p_phone: p.phone || null, p_email: p.email || null,
      p_first: (p.contact_name || p.company).split(' ')[0] || null,
      p_last: (p.contact_name || '').split(' ').slice(1).join(' ') || null,
    });
    const { data: acct } = await supabase.from('accounts')
      .insert({ name: p.company, business_type: 'small_builder' }).select('id').single();
    const { data: lead } = await supabase.from('leads').insert({
      contact_id: contactId, account_id: acct?.id ?? null,
      division: 'painting', source_code: 'referral_builder', status: 'new',
      requested_service: `Builder opportunity — ${p.company}`,
    }).select('id').single();
    await supabase.from('prospects').update({ status: 'quoting', converted_lead_id: lead?.id }).eq('id', id);
    router.push(lead ? `/leads/${lead.id}` : '/leads');
  }

  if (!p) return null;
  const when = (iso: string) => new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <Chrome>
      <div className="bar">
        <button className="back" onClick={() => router.push('/leads?tab=builders')}>{'\u2190'} Builders</button>
        <div>
          <h1>{p.company}</h1>
          <div className="sub">
            {[p.segment, p.city, p.priority ? `Priority ${p.priority}` : null]
              .filter(Boolean).join(' · ')}
          </div>
        </div>
        {!edit && <button className="barbtn" onClick={startEdit}>Edit</button>}
      </div>

      <div className="main">
        {edit && (
          <>
            <div className="section-label">Company</div>
            {([['company','Company name'],['phone','Main phone'],['email','General email'],
               ['website','Website'],['address_line1','Address'],['city','City'],['postal_code','Zip']] as const)
              .map(([k, lbl]) => (
                <div className="field" key={k}>
                  <label>{lbl}</label>
                  <input value={ef[k]} onChange={(e) => setEf({ ...ef, [k]: e.target.value })}
                    inputMode={k==='phone'?'tel':k==='email'?'email':k==='postal_code'?'numeric':undefined}
                    autoCapitalize={k==='email'||k==='website'?'none':'words'} />
                </div>
            ))}
            <div className="setting">
              <label>Type</label>
              <select value={ef.kind} onChange={(e) => setEf({ ...ef, kind: e.target.value })}>
                {['home_builder','remodeler','general_contractor','property_manager','realtor','commercial','other']
                  .map((k) => <option key={k} value={k}>{k.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            {conflict && (
              <div style={{ background: 'var(--no-bg)', color: 'var(--no)', padding: '14px 20px',
                            fontWeight: 650, fontSize: 14.5 }}>{conflict}</div>
            )}
            <div className="field" style={{ display: 'flex', gap: 10 }}>
              <button className="btn ghost" onClick={() => setEdit(false)}>Cancel</button>
              <button className="btn" onClick={saveEdit} disabled={!ef.company?.trim()}>Save</button>
            </div>
          </>
        )}

        <div className="setting">
          <label>Status</label>
          <select value={p.status} onChange={(e) => setField({ status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="setting">
          <label>Worth chasing?</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1,2,3,4,5].map((n) => (
              <button key={n} className="chip" data-on={p.rating >= n ? '1' : '0'}
                style={{ minWidth: 38, padding: '8px 0', textAlign: 'center' }}
                onClick={() => setField({ rating: n })}>{n}</button>
            ))}
          </div>
        </div>

        <PeoplePanel prospectId={id} onLogged={(k, b) => log(k, b)} />

        {(p.address_line1 || p.spotted_at) && (
          <>
            <div className="section-label">Location</div>
            {p.address_line1 && <div className="lead"><div className="body">
              <div className="t2">{p.address_line1}</div>
              <div className="t2">{p.city}, {p.state} {p.postal_code}</div></div></div>}
            {p.spotted_at && <div className="lead"><div className="body">
              <div className="t2">Spotted: {p.spotted_at}</div></div></div>}
          </>
        )}

        <div className="section-label">Company line</div>
        <div className="field">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {p.phone && <a className="btn ghost" style={{ flex: 1, minWidth: 120 }}
              href={`tel:${p.phone}`} onClick={() => log('outbound_call')}>Call</a>}
            {p.email && <a className="btn ghost" style={{ flex: 1, minWidth: 120 }}
              href={`mailto:${p.email}`} onClick={() => log('email_out')}>Email</a>}
            {p.latitude && <a className="btn ghost" style={{ flex: 1, minWidth: 120 }}
              href={`https://maps.google.com/?q=${p.latitude},${p.longitude}`} target="_blank">Map</a>}
          </div>
          {p.website && <div style={{ marginTop: 12 }}>
            <a href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
               target="_blank" style={{ fontWeight: 640 }}>{p.website}</a></div>}
        </div>

        <div className="section-label">Add a note</div>
        <div className="field">
          <textarea className="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Spoke to the super, they sub all paint" />
          <button className="btn ghost" style={{ marginTop: 12 }} disabled={!note.trim()}
            onClick={() => { log('note', note); setNote(''); }}>Save note</button>
        </div>

        {(p.entry_point || p.scale_signal || p.next_ask) && (
          <>
            <div className="section-label">How to get in</div>
            {p.scale_signal && <div className="field"><label>Scale</label>
              <div className="t2">{p.scale_signal}</div></div>}
            {p.entry_point && <div className="field"><label>Best entry point</label>
              <div className="t2">{p.entry_point}</div></div>}
            {p.next_ask && <div className="field"><label>The ask</label>
              <div className="t2">{p.next_ask}</div></div>}
          </>
        )}

        {p.notes && <><div className="section-label">Background</div>
          <div className="field"><div className="t2" style={{ whiteSpace: 'pre-wrap' }}>{p.notes}</div></div></>}

        <div className="section-label">History</div>
        {acts.length === 0
          ? <div className="empty" style={{ padding: '28px' }}>Nothing logged yet.</div>
          : acts.map((a) => (
            <div className="lead" key={a.id}><div className="body">
              <div className="t1" style={{ fontSize: 15.5 }}>{a.kind.replace(/_/g, ' ')}</div>
              <div className="t2">{when(a.occurred_at)}{a.body ? ` — ${a.body}` : ''}</div>
            </div></div>
          ))}
      </div>

      <div className="dock"><div className="inner">
        {p.converted_lead_id
          ? <button className="btn" onClick={() => router.push(`/leads/${p.converted_lead_id}`)}>Open the lead</button>
          : <button className="btn" onClick={convertToLead}>They want a quote</button>}
      </div></div>
      {toast && <div className="saved">{toast}</div>}
    </Chrome>
  );
}
