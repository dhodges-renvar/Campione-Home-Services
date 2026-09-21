'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Person = {
  id: string; name: string; title: string | null; phone: string | null;
  email: string | null; is_primary: boolean; status: string; notes: string | null;
};
const blank = { name: '', title: '', phone: '', email: '', notes: '' };

export default function PeoplePanel({ prospectId, onLogged }:
  { prospectId: string; onLogged: (kind: string, body?: string) => void }) {
  const [rows, setRows] = useState<Person[]>([]);
  const [editing, setEditing] = useState<string | null>(null);   // id, or 'new'
  const [f, setF] = useState<any>(blank);
  const [err, setErr] = useState('');

  async function load() {
    const { data } = await supabase.from('prospect_contacts').select('*')
      .eq('prospect_id', prospectId)
      .order('is_primary', { ascending: false }).order('status').order('name');
    setRows((data as any) || []);
  }
  useEffect(() => { load(); }, [prospectId]);

  function open(p?: Person) {
    setErr('');
    if (p) { setEditing(p.id); setF({ name: p.name, title: p.title ?? '', phone: p.phone ?? '',
                                       email: p.email ?? '', notes: p.notes ?? '' }); }
    else { setEditing('new'); setF(blank); }
  }

  async function save() {
    if (!f.name.trim()) { setErr('A name is required'); return; }
    const row = { name: f.name.trim(), title: f.title || null, phone: f.phone || null,
                  email: f.email || null, notes: f.notes || null };
    const res = editing === 'new'
      ? await supabase.from('prospect_contacts').insert({
          ...row, prospect_id: prospectId, is_primary: rows.length === 0 })
      : await supabase.from('prospect_contacts').update(row).eq('id', editing!);
    if (res.error) {
      setErr(res.error.code === '23505' ? 'That email is already on someone at this company.'
                                        : res.error.message);
      return;
    }
    setEditing(null); load();
  }

  async function setStatus(id: string, status: string) {
    await supabase.from('prospect_contacts').update({ status }).eq('id', id); load();
  }
  async function makePrimary(id: string) {
    await supabase.rpc('set_primary_contact', { p_contact: id }); load();
  }
  async function remove(id: string) {
    if (!confirm('Remove this person?')) return;
    await supabase.from('prospect_contacts').delete().eq('id', id); load();
  }

  const statusLabel: Record<string, string> =
    { active: '', wrong_person: 'Wrong person', left_company: 'Left the company' };

  return (
    <>
      <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>People</span>
        {editing === null && (
          <button onClick={() => open()} style={{ fontWeight: 700, color: 'var(--ink)', letterSpacing: 0 }}>
            + Add person
          </button>
        )}
      </div>

      {rows.length === 0 && editing === null && (
        <div className="field"><div className="t2">
          Nobody yet. Add whoever actually buys painting — often not the name on the listing.
        </div></div>
      )}

      {rows.map((p) => editing === p.id ? null : (
        <div className="lead" key={p.id} style={{ opacity: p.status === 'active' ? 1 : 0.55 }}>
          <div className="body">
            <div className="t1">
              {p.name}
              {p.is_primary && <span className="sla ok" style={{ marginLeft: 8 }}>Primary</span>}
              {p.status !== 'active' && <span className="sla bad" style={{ marginLeft: 8 }}>{statusLabel[p.status]}</span>}
            </div>
            {p.title && <div className="t2">{p.title}</div>}
            <div className="t2">{[p.phone, p.email].filter(Boolean).join(' · ') || 'No phone or email'}</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap', fontSize: 13.5, fontWeight: 650 }}>
              <button onClick={() => open(p)}>Edit</button>
              {!p.is_primary && p.status === 'active' && <button onClick={() => makePrimary(p.id)}>Make primary</button>}
              {p.status === 'active'
                ? <button onClick={() => setStatus(p.id, 'wrong_person')}>Wrong person</button>
                : <button onClick={() => setStatus(p.id, 'active')}>Mark active</button>}
              <button style={{ color: 'var(--no)' }} onClick={() => remove(p.id)}>Remove</button>
            </div>
          </div>
          {p.phone && p.status === 'active' && (
            <a className="callbtn" href={`tel:${p.phone}`}
               onClick={() => onLogged('outbound_call', `Called ${p.name}`)}>Call</a>
          )}
        </div>
      ))}

      {editing !== null && (
        <div className="field" style={{ background: 'var(--paper)' }}>
          <label>{editing === 'new' ? 'New person' : 'Edit person'}</label>
          <input placeholder="Name" value={f.name} autoCapitalize="words"
            onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input placeholder="Title — purchasing, vendor manager, super"
            style={{ marginTop: 8 }} value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })} />
          <input placeholder="Direct phone" type="tel" inputMode="tel" style={{ marginTop: 8 }}
            value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <input placeholder="Email" inputMode="email" autoCapitalize="none" style={{ marginTop: 8 }}
            value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <textarea className="note" rows={2} placeholder="Notes"
            value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          {err && <div style={{ color: 'var(--no)', fontSize: 14, fontWeight: 620, marginTop: 10 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn" onClick={save}>Save</button>
          </div>
        </div>
      )}
    </>
  );
}
