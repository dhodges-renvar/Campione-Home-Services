'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';

export default function NewLead() {
  const router = useRouter();
  const [sources, setSources] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    first: '', last: '', phone: '', email: '',
    address: '', city: '', zip: '',
    division: 'painting', source: 'walk_in',
    service: '', notes: '',
  });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    supabase.from('lead_sources').select('*').order('sort_order')
      .then(({ data }) => setSources(data || []));
  }, []);

  async function save(alsoQuote = false) {
    setBusy(true);
    const { data: contactId } = await supabase.rpc('find_or_create_contact', {
      p_phone: f.phone || null, p_email: f.email || null,
      p_first: f.first || null, p_last: f.last || null,
    });

    let propertyId: string | null = null;
    if (f.address) {
      const { data } = await supabase.from('properties')
        .insert({ address_line1: f.address, city: f.city || null, postal_code: f.zip || null })
        .select('id').single();
      propertyId = data?.id ?? null;
      if (propertyId && contactId)
        await supabase.from('property_contacts').insert({ property_id: propertyId, contact_id: contactId });
    }

    const { data: lead } = await supabase.from('leads').insert({
      contact_id: contactId, property_id: propertyId,
      division: f.division, source_code: f.source, status: 'new',
      requested_service: f.service || null, raw_message: f.notes || null,
    }).select('id').single();

    setBusy(false);
    if (alsoQuote && lead) router.push(`/quote/new?lead=${lead.id}`);
    else router.push(lead ? `/leads/${lead.id}` : '/leads');
  }

  const ok = (f.first || f.phone) && f.source;

  return (
    <Chrome>
      <div className="bar">
        <button className="back" onClick={() => router.push('/leads')}>{'\u2190'} B2C</button>
        <div><h1>New lead</h1><div className="sub">Log it the moment the phone rings</div></div>
      </div>
      <div className="main">
        <div className="section-label">Who called</div>
        <div className="field">
          <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div><label>First name</label><input value={f.first} onChange={(e) => set('first', e.target.value)} /></div>
            <div><label>Last name</label><input value={f.last} onChange={(e) => set('last', e.target.value)} /></div>
          </div>
        </div>
        <div className="field">
          <label>Phone</label>
          <input inputMode="tel" type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input inputMode="email" autoCapitalize="none" value={f.email} onChange={(e) => set('email', e.target.value)} />
        </div>

        <div className="section-label">Property</div>
        <div className="field">
          <label>Address</label>
          <input value={f.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div className="field">
          <div className="grid3" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <div><label>City</label><input value={f.city} onChange={(e) => set('city', e.target.value)} /></div>
            <div><label>Zip</label><input inputMode="numeric" value={f.zip} onChange={(e) => set('zip', e.target.value)} /></div>
          </div>
        </div>

        <div className="section-label">The job</div>
        <div className="setting">
          <label>Division</label>
          <select value={f.division} onChange={(e) => set('division', e.target.value)}>
            <option value="painting">Painting</option>
            <option value="pressure_washing">Pressure washing</option>
            <option value="cleaning">Cleaning</option>
            <option value="exteriors">Exteriors</option>
          </select>
        </div>
        <div className="setting">
          <label>How did they find us</label>
          <select value={f.source} onChange={(e) => set('source', e.target.value)}>
            {sources.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>What they want</label>
          <input value={f.service} onChange={(e) => set('service', e.target.value)}
            placeholder="Whole house interior repaint" />
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea className="note" rows={3} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>
      <div className="dock">
        <div className="inner">
          <div className="pair">
            <button className="btn ghost" onClick={() => save(false)} disabled={busy || !ok}>Save lead</button>
            <button className="btn" onClick={() => save(true)} disabled={busy || !ok}>Save &amp; quote</button>
          </div>
          {!ok && <div className="hint">A name or a phone number is enough to start</div>}
        </div>
      </div>
    </Chrome>
  );
}
