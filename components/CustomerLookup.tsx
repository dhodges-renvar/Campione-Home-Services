'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type Who = { name: string; phone: string; address: string; city: string;
                    contactId?: string | null; propertyId?: string | null };

/* Type a name or a phone and pick an existing customer. Repeat work is most of
   the book, so retyping a customer who is already in the database is both slow
   and how duplicates get made. */
export default function CustomerLookup({ who, setWho }:
  { who: Who; setWho: (w: Who) => void }) {
  const [hits, setHits] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => {
    clearTimeout(timer.current);
    const q = who.name.trim();
    if (who.contactId || q.length < 2) { setHits([]); return; }
    timer.current = setTimeout(async () => {
      const digits = q.replace(/\D/g, '');
      let req = supabase.from('contacts')
        .select('id,first_name,last_name,phone,email,business_type,property_contacts(property_id,properties(id,address_line1,city,postal_code))')
        .limit(6);
      req = digits.length >= 4
        ? req.ilike('phone', `%${digits}%`)
        : req.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
      const { data } = await req;
      setHits((data as any) || []); setOpen(true);
    }, 280);
    return () => clearTimeout(timer.current);
  }, [who.name, who.contactId]);

  function choose(c: any) {
    const prop = c.property_contacts?.[0]?.properties;
    setWho({
      name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
      phone: c.phone ?? '', address: prop?.address_line1 ?? '', city: prop?.city ?? '',
      contactId: c.id, propertyId: prop?.id ?? null,
    });
    setHits([]); setOpen(false);
  }

  return (
    <>
      <div className="field">
        <label>Customer</label>
        <input value={who.name} autoCapitalize="words" placeholder="Name or phone"
          onChange={(e) => setWho({ ...who, name: e.target.value, contactId: null, propertyId: null })} />
        {who.contactId && (
          <div className="t2" style={{ marginTop: 8, color: 'var(--yes)', fontWeight: 620 }}>
            Existing customer — details filled in
          </div>
        )}
      </div>

      {open && hits.length > 0 && !who.contactId && (
        <div style={{ borderBottom: '1px solid var(--line)' }}>
          {hits.map((c) => {
            const prop = c.property_contacts?.[0]?.properties;
            return (
              <button className="row" key={c.id} onClick={() => choose(c)}>
                <div className="t1">{`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'No name'}</div>
                <div className="t2">
                  {[c.phone, prop?.address_line1, prop?.city].filter(Boolean).join(' · ')}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="field">
        <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div><label>Phone</label>
            <input inputMode="tel" value={who.phone}
              onChange={(e) => setWho({ ...who, phone: e.target.value })} /></div>
          <div><label>City</label>
            <input value={who.city} autoCapitalize="words"
              onChange={(e) => setWho({ ...who, city: e.target.value })} /></div>
        </div>
      </div>
      <div className="field">
        <label>Address</label>
        <input value={who.address} autoCapitalize="words"
          onChange={(e) => setWho({ ...who, address: e.target.value })} />
      </div>
    </>
  );
}
