'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import { accentStyle } from '@/lib/theme';
import FollowUpForm from '@/components/FollowUpForm';

const STATUSES = ['new','contacted','estimate_scheduled','estimated','won','lost','dead'];
const LOST = ['price','went with someone else','no response','out of area','not ready','wrong scope'];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [acts, setActs] = useState<any[]>([]);
  const [appts, setAppts] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState('');
  const [booking, setBooking] = useState(false);
  const [when, setWhen] = useState('');
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1600); };
  const [edit, setEdit] = useState(false);
  const [cf, setCf] = useState<any>({});

  function startEdit() {
    const c = lead?.contacts || {}; const pr = lead?.properties || {};
    setCf({ first: c.first_name ?? '', last: c.last_name ?? '', phone: c.phone ?? '',
            email: c.email ?? '', address: pr.address_line1 ?? '', city: pr.city ?? '',
            zip: pr.postal_code ?? '' });
    setEdit(true);
  }

  async function saveEdit() {
    if (lead.contact_id) {
      await supabase.from('contacts').update({
        first_name: cf.first || null, last_name: cf.last || null,
        phone: cf.phone || null, email: cf.email || null }).eq('id', lead.contact_id);
    }
    if (lead.property_id) {
      await supabase.from('properties').update({
        address_line1: cf.address || null, city: cf.city || null,
        postal_code: cf.zip || null }).eq('id', lead.property_id);
    } else if (cf.address) {
      const { data } = await supabase.from('properties')
        .insert({ address_line1: cf.address, city: cf.city || null, postal_code: cf.zip || null })
        .select('id').single();
      if (data) await supabase.from('leads').update({ property_id: data.id }).eq('id', id);
    }
    setEdit(false); load(); flash('Saved');
  }

  async function load() {
    const { data } = await supabase.from('leads')
      .select('*,contacts(first_name,last_name,phone,email),properties(address_line1,city,postal_code)')
      .eq('id', id).single();
    setLead(data);
    supabase.from('lead_activities').select('*').eq('lead_id', id)
      .order('occurred_at', { ascending: false }).then((r) => setActs(r.data || []));
    supabase.from('appointments').select('*').eq('lead_id', id)
      .order('starts_at').then((r) => setAppts(r.data || []));
  }
  useEffect(() => { load(); }, [id]);

  async function logActivity(kind: string, body?: string) {
    await supabase.from('lead_activities').insert({
      lead_id: id, contact_id: lead?.contact_id, kind,
      occurred_at: new Date().toISOString(), body: body || null, qualified: true,
    });
    load(); flash('Logged');
  }

  async function setStatus(s: string, reason?: string) {
    await supabase.from('leads').update({ status: s, lost_reason: reason ?? null }).eq('id', id);
    setLead((l: any) => ({ ...l, status: s, lost_reason: reason ?? null }));
    flash('Updated');
  }

  async function book() {
    if (!when) return;
    const { data: u } = await supabase.auth.getUser();
    await supabase.from('appointments').insert({
      lead_id: id, contact_id: lead.contact_id, property_id: lead.property_id,
      kind: 'estimate', status: 'scheduled', assigned_to: u.user?.id,
      starts_at: new Date(when).toISOString(),
      address_snapshot: lead.properties
        ? `${lead.properties.address_line1}, ${lead.properties.city ?? ''}` : null,
    });
    setBooking(false); setWhen(''); load(); flash('Estimate booked');
  }

  if (!lead) return null;
  const c = lead.contacts, p = lead.properties;
  const name = `${c?.first_name ?? ''} ${c?.last_name ?? ''}`.trim() || 'Unknown caller';
  const when2 = (iso: string) => new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <Chrome>
      <div style={accentStyle(lead.division)}>
        <div className="bar">
          <button className="back" onClick={() => router.push('/leads')}>{'\u2190'} B2C</button>
          <div>
            <h1>{name}</h1>
            <div className="sub">{p?.address_line1 ?? 'No address yet'}{p?.city ? `, ${p.city}` : ''}</div>
          </div>
          {!edit && <button className="barbtn" onClick={startEdit}>Edit</button>}
        </div>
        <div className="divstrip" />

        <div className="main">
          {edit && (
            <>
              <div className="section-label">Contact</div>
              <div className="field">
                <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div><label>First</label><input value={cf.first} onChange={(e) => setCf({ ...cf, first: e.target.value })} /></div>
                  <div><label>Last</label><input value={cf.last} onChange={(e) => setCf({ ...cf, last: e.target.value })} /></div>
                </div>
              </div>
              <div className="field"><label>Phone</label>
                <input type="tel" inputMode="tel" value={cf.phone} onChange={(e) => setCf({ ...cf, phone: e.target.value })} /></div>
              <div className="field"><label>Email</label>
                <input inputMode="email" autoCapitalize="none" value={cf.email} onChange={(e) => setCf({ ...cf, email: e.target.value })} /></div>
              <div className="section-label">Property</div>
              <div className="field"><label>Address</label>
                <input value={cf.address} onChange={(e) => setCf({ ...cf, address: e.target.value })} /></div>
              <div className="field">
                <div className="grid3" style={{ gridTemplateColumns: '2fr 1fr' }}>
                  <div><label>City</label><input value={cf.city} onChange={(e) => setCf({ ...cf, city: e.target.value })} /></div>
                  <div><label>Zip</label><input inputMode="numeric" value={cf.zip} onChange={(e) => setCf({ ...cf, zip: e.target.value })} /></div>
                </div>
              </div>
              <div className="field" style={{ display: 'flex', gap: 10 }}>
                <button className="btn ghost" onClick={() => setEdit(false)}>Cancel</button>
                <button className="btn" onClick={saveEdit}>Save</button>
              </div>
            </>
          )}

          <div className="setting">
            <label>Status</label>
            <select value={lead.status} onChange={(e) =>
              e.target.value === 'lost' ? setStatus('lost') : setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          {lead.status === 'lost' && (
            <div className="field">
              <label>Why did we lose it</label>
              <select value={lead.lost_reason ?? ''} onChange={(e) => setStatus('lost', e.target.value)}>
                <option value="">Pick one</option>
                {LOST.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="hintl" style={{ marginTop: 8, color: 'var(--ink-3)', fontSize: 13 }}>
                Worth being honest here. It is the only way to find out whether losses are price or speed.
              </div>
            </div>
          )}

          <div className="section-label">Reach out</div>
          <div className="field">
            <div className="pair" style={{ display: 'flex', gap: 10 }}>
              {c?.phone && (
                <a className="btn accent" href={`tel:${c.phone}`} onClick={() => logActivity('outbound_call')}>Call</a>
              )}
              {c?.phone && (
                <a className="btn ghost" href={`sms:${c.phone}`} onClick={() => logActivity('sms_out')}>Text</a>
              )}
            </div>
            {!c?.phone && <div className="hintl" style={{ color: 'var(--ink-3)' }}>No phone number on file.</div>}
          </div>

          <div className="section-label">Estimate appointment</div>
          {appts.map((a) => (
            <div className="lead" key={a.id}>
              <div className="body">
                <div className="t1">{when2(a.starts_at)}</div>
                <div className="t2">{a.kind} · {a.status}</div>
              </div>
            </div>
          ))}
          {booking ? (
            <div className="field">
              <label>When</label>
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
              <div className="pair" style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="btn ghost" onClick={() => setBooking(false)}>Cancel</button>
                <button className="btn" onClick={book} disabled={!when}>Book it</button>
              </div>
            </div>
          ) : (
            <div className="field">
              <button className="btn ghost" onClick={() => setBooking(true)}>Book an estimate</button>
            </div>
          )}

          <div className="section-label">Next step</div>
          <FollowUpForm leadId={id} phone={c?.phone}
            defaultTitle={`Call ${name}`} onSaved={() => flash('Follow-up set')} />

          <div className="section-label">Add a note</div>
          <div className="field">
            <textarea className="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="What they said" />
            <button className="btn ghost" style={{ marginTop: 12 }}
              disabled={!note.trim()}
              onClick={() => { logActivity('note', note); setNote(''); }}>Save note</button>
          </div>

          <div className="section-label">History</div>
          {acts.length === 0 ? (
            <div className="empty" style={{ padding: '32px 28px' }}>Nothing logged yet.</div>
          ) : acts.map((a) => (
            <div className="lead" key={a.id}>
              <div className="body">
                <div className="t1" style={{ fontSize: 15.5 }}>{a.kind.replace(/_/g, ' ')}</div>
                <div className="t2">{when2(a.occurred_at)}{a.body ? ` — ${a.body}` : ''}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dock">
          <div className="inner">
            <button className="btn" onClick={() => router.push(`/quote/new?lead=${id}`)}>
              Build a quote
            </button>
          </div>
        </div>
        {toast && <div className="saved">{toast}</div>}
      </div>
    </Chrome>
  );
}
