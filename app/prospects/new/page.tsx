'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';

const KINDS: [string, string][] = [
  ['home_builder', 'Home builder'],
  ['remodeler', 'Remodeler'],
  ['general_contractor', 'General contractor'],
  ['property_manager', 'Property manager'],
  ['realtor', 'Realtor'],
  ['commercial', 'Commercial'],
];

export default function NewProspect() {
  const router = useRouter();
  const [f, setF] = useState({
    company: '', kind: 'home_builder', contact: '', phone: '', email: '',
    website: '', address: '', city: '', zip: '', spotted: '', notes: '',
  });
  const [dupes, setDupes] = useState<any[]>([]);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<any>(null);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  // live duplicate check as he types the name
  useEffect(() => {
    clearTimeout(timer.current);
    if (f.company.trim().length < 3) { setDupes([]); return; }
    timer.current = setTimeout(async () => {
      const { data } = await supabase.rpc('find_similar_prospects', {
        p_company: f.company.trim(),
        p_phone: f.phone || null,
        p_email: f.email || null,
      });
      setDupes(data || []);
    }, 350);
    return () => clearTimeout(timer.current);
  }, [f.company, f.phone, f.email]);

  function grabLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setGeo({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}, { enableHighAccuracy: true, timeout: 8000 }
    );
  }
  useEffect(() => { grabLocation(); }, []);

  async function save() {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.rpc('upsert_prospect', {
      p_company: f.company.trim(), p_kind: f.kind,
      p_contact: f.contact || null, p_phone: f.phone || null, p_email: f.email || null,
      p_website: f.website || null, p_address: f.address || null,
      p_city: f.city || null, p_state: 'GA', p_zip: f.zip || null,
      p_source: 'Spotted in the field', p_notes: f.notes || null,
      p_lat: geo?.lat ?? null, p_lng: geo?.lng ?? null,
      p_spotted: f.spotted || null, p_user: u.user?.id ?? null,
    });
    setBusy(false);
    const row = Array.isArray(data) ? data[0] : data;
    router.push(row?.id ? `/prospects/${row.id}` : '/prospects');
  }

  const exact = dupes.find((d) => d.exact);

  return (
    <Chrome>
      <div className="bar">
        <button className="back" onClick={() => router.push('/prospects')}>{'\u2190'} B2B</button>
        <div><h1>Add a builder</h1><div className="sub">Company name is enough to start</div></div>
      </div>

      <div className="main">
        <div className="field">
          <label>Company</label>
          <input value={f.company} onChange={(e) => set('company', e.target.value)}
            autoCapitalize="words" placeholder="Name on the sign" />
        </div>

        {dupes.length > 0 && (
          <div style={{ background: exact ? 'var(--no-bg)' : 'var(--amber-bg)',
                        borderTop: `3px solid ${exact ? 'var(--no)' : 'var(--amber)'}`,
                        padding: '15px 20px' }}>
            <div style={{ fontSize: 14.5, fontWeight: 700,
                          color: exact ? 'var(--no)' : 'var(--amber)', marginBottom: 10 }}>
              {exact ? 'You already have this one' : 'Similar to what you already have'}
            </div>
            {dupes.map((d) => (
              <button key={d.id} onClick={() => router.push(`/prospects/${d.id}`)}
                style={{ display: 'block', textAlign: 'left', width: '100%', padding: '8px 0' }}>
                <div style={{ fontWeight: 640, fontSize: 16 }}>{d.company}</div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>
                  {d.city} · {d.status?.replace(/_/g, ' ')} · {d.why} · from {d.source}
                </div>
              </button>
            ))}
            {exact && (
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>
                Saving will fill in anything blank on that record instead of creating a second one.
              </div>
            )}
          </div>
        )}

        <div className="setting">
          <label>Type</label>
          <select value={f.kind} onChange={(e) => set('kind', e.target.value)}>
            {KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <div className="section-label">Where you saw them</div>
        <div className="field">
          <label>Subdivision or street</label>
          <input value={f.spotted} onChange={(e) => set('spotted', e.target.value)}
            placeholder="Highland Reserve, off Hwy 11" />
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>
            {geo ? `Location captured (${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)})`
                 : 'Location not captured'}
            {!geo && <button onClick={grabLocation} style={{ marginLeft: 10, fontWeight: 650, color: 'var(--ink)' }}>Try again</button>}
          </div>
        </div>

        <div className="section-label">Anything else you have</div>
        <div className="field"><label>Contact name</label>
          <input value={f.contact} onChange={(e) => set('contact', e.target.value)} autoCapitalize="words" /></div>
        <div className="field"><label>Phone</label>
          <input type="tel" inputMode="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></div>
        <div className="field"><label>Email</label>
          <input inputMode="email" autoCapitalize="none" value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
        <div className="field"><label>Website</label>
          <input inputMode="url" autoCapitalize="none" value={f.website} onChange={(e) => set('website', e.target.value)} /></div>
        <div className="field">
          <div className="grid3" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <div><label>City</label><input value={f.city} onChange={(e) => set('city', e.target.value)} autoCapitalize="words" /></div>
            <div><label>Zip</label><input inputMode="numeric" value={f.zip} onChange={(e) => set('zip', e.target.value)} /></div>
          </div>
        </div>
        <div className="field"><label>Notes</label>
          <textarea className="note" rows={3} value={f.notes} onChange={(e) => set('notes', e.target.value)}
            placeholder="Framing 6 houses, signs on two lots" /></div>
      </div>

      <div className="dock"><div className="inner">
        <button className="btn" onClick={save} disabled={busy || f.company.trim().length < 3}>
          {exact ? 'Add what I have to that record' : 'Save builder'}
        </button>
      </div></div>
    </Chrome>
  );
}
