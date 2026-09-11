'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import { accentStyle } from '@/lib/theme';
import {
  Room, emptyRoom, roomQuantities, priceEstimate,
  JobSettings, Rate, Modifier, Settings,
} from '@/lib/pricing';

const money = (n: number) => '$' + Math.round(n || 0).toLocaleString();

function NewQuoteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const leadId = params.get('lead');
  const [rates, setRates] = useState<Rate[]>([]);
  const [mods, setMods] = useState<Modifier[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [paints, setPaints] = useState<any[]>([]);
  const [btypes, setBtypes] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([emptyRoom(1)]);
  const [saving, setSaving] = useState(false);
  const [who, setWho] = useState({ name: '', phone: '', address: '', city: '' });

  const [job, setJob] = useState<JobSettings>({
    condition: 'minor_patch', coats: '2', color: 'same', occupancy: 'occupied_light',
    access: 'standard', texture: 'smooth', sheen: 'eggshell', project_type: 'repaint',
    paint_tier: 'standard', primer: false,
    door_scope: 'door_full', window_scope: 'window_casing_sill',
    business_type: 'consumer', miles: 40, days_on_site: 3,
  });

  useEffect(() => {
    if (!leadId) return;
    supabase.from('leads')
      .select('contact_id,property_id,contacts(first_name,last_name,phone),properties(address_line1,city)')
      .eq('id', leadId).single()
      .then(({ data }: any) => {
        if (!data) return;
        setWho({
          name: `${data.contacts?.first_name ?? ''} ${data.contacts?.last_name ?? ''}`.trim(),
          phone: data.contacts?.phone ?? '',
          address: data.properties?.address_line1 ?? '',
          city: data.properties?.city ?? '',
        });
      });
  }, [leadId]);

  useEffect(() => {
    (async () => {
      const [r, m, s, p, b] = await Promise.all([
        supabase.from('rate_items').select('*').eq('active', true),
        supabase.from('modifiers').select('*'),
        supabase.from('business_settings').select('key,value'),
        supabase.from('paint_products').select('*').order('sort_order'),
        supabase.from('business_types').select('*').order('sort_order'),
      ]);
      setRates((r.data as any) || []);
      setMods((m.data as any) || []);
      setSettings(Object.fromEntries((s.data || []).map((x: any) => [x.key, Number(x.value)])));
      setPaints(p.data || []);
      setBtypes(b.data || []);
      if (s.data) setJob((j) => ({
        ...j,
        miles: Number((s.data as any).find((x: any) => x.key === 'default_round_trip_miles')?.value ?? 40),
        days_on_site: Number((s.data as any).find((x: any) => x.key === 'default_days_on_site')?.value ?? 3),
      }));
    })();
  }, []);

  const bt = btypes.find((x) => x.code === job.business_type);
  const paintCost = Number(paints.find((p) => p.tier === job.paint_tier)?.cost_per_gallon ?? 52);

  const out = useMemo(() => {
    if (!rates.length) return null;
    return priceEstimate({
      rooms, rates, mods, settings, job, paintCost,
      margin: Number(bt?.target_margin ?? 0.45),
      minimum: Number(bt?.minimum_charge ?? 750),
    });
  }, [rooms, rates, mods, settings, job, paintCost, bt]);

  const opts = (g: string) => mods.filter((m) => m.group_code === g);
  const upd = (k: string, v: any) => setJob((j) => ({ ...j, [k]: v }));
  const setRoom = (k: string, patch: Partial<Room>) =>
    setRooms((rs) => rs.map((r) => (r.key === k ? { ...r, ...patch } : r)));

  async function save() {
    setSaving(true);
    const contactId = who.phone || who.name
      ? (await supabase.rpc('find_or_create_contact', {
          p_phone: who.phone || null, p_email: null,
          p_first: who.name.split(' ')[0] || null,
          p_last: who.name.split(' ').slice(1).join(' ') || null,
        })).data
      : null;

    let propertyId = null;
    if (who.address) {
      const { data } = await supabase.from('properties')
        .insert({ address_line1: who.address, city: who.city || null }).select('id').single();
      propertyId = data?.id ?? null;
      if (contactId && propertyId)
        await supabase.from('property_contacts').insert({ property_id: propertyId, contact_id: contactId });
    }

    const { data: est } = await supabase.from('estimates').insert({
      lead_id: leadId,
      contact_id: contactId, property_id: propertyId,
      division: 'painting', service_type: 'interior',
      business_type: job.business_type, status: 'draft',
      settings: job as any,
      labor_hours: out!.totalHours, labor_multiplier: out!.multiplier,
      finish_gallons: out!.finishGal, primer_gallons: out!.primerGal,
      labor_cost: out!.laborCost, material_cost: out!.paint + out!.sundries,
      travel_cost: out!.travel, direct_cost: out!.direct,
      target_margin: bt?.target_margin, price: out!.price,
    }).select('id').single();

    if (est) {
      await supabase.from('estimate_rooms').insert(rooms.map((r, i) => ({
        estimate_id: est.id, room_name: r.name,
        length_ft: r.length, width_ft: r.width, ceiling_ht_ft: r.height,
        door_count: r.doors, window_count: r.windows, closet_count: r.closets,
        paint_walls: r.walls, paint_ceiling: r.ceiling, paint_base: r.base,
        paint_crown: r.crown, paint_doors: r.paintDoors,
        paint_window_trim: r.paintWindows, paint_closets: r.paintClosets,
        sort_order: i,
      })));
    }
    setSaving(false);
    router.push('/quote');
  }

  return (
    <Chrome>
      <div style={accentStyle('painting')}>
        <div className="bar">
          <button className="back" onClick={() => router.push('/quote')}>{'\u2190'} Quotes</button>
          <div><h1>New quote</h1><div className="sub">Interior painting</div></div>
        </div>
        <div className="divstrip" />
        <div className="main">
          <div className="section-label">Customer</div>
          <div className="grid3" style={{ padding: 18, gridTemplateColumns: '1fr 1fr' }}>
            <div><label>Name</label><input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></div>
            <div><label>Phone</label><input inputMode="tel" value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} /></div>
            <div><label>Address</label><input value={who.address} onChange={(e) => setWho({ ...who, address: e.target.value })} /></div>
            <div><label>City</label><input value={who.city} onChange={(e) => setWho({ ...who, city: e.target.value })} /></div>
          </div>

          <div className="section-label">Rooms — measure, do not do math</div>
          {rooms.map((r, i) => {
            const q = roomQuantities(r);
            return (
              <div className="roomcard" key={r.key}>
                <div className="rname">
                  <input value={r.name} onChange={(e) => setRoom(r.key, { name: e.target.value })} />
                  {rooms.length > 1 && (
                    <button className="rmdel" onClick={() => setRooms((rs) => rs.filter((x) => x.key !== r.key))}>Remove</button>
                  )}
                </div>
                <div className="grid3">
                  <div><label>Length</label><input type="number" inputMode="decimal" value={r.length || ''} onChange={(e) => setRoom(r.key, { length: +e.target.value })} /></div>
                  <div><label>Width</label><input type="number" inputMode="decimal" value={r.width || ''} onChange={(e) => setRoom(r.key, { width: +e.target.value })} /></div>
                  <div><label>Ceiling</label><input type="number" inputMode="decimal" value={r.height || ''} onChange={(e) => setRoom(r.key, { height: +e.target.value })} /></div>
                </div>
                <div className="grid3" style={{ marginTop: 10 }}>
                  <div><label>Doors</label><input type="number" inputMode="numeric" value={r.doors || ''} onChange={(e) => setRoom(r.key, { doors: +e.target.value })} /></div>
                  <div><label>Windows</label><input type="number" inputMode="numeric" value={r.windows || ''} onChange={(e) => setRoom(r.key, { windows: +e.target.value })} /></div>
                  <div><label>Closets</label><input type="number" inputMode="numeric" value={r.closets || ''} onChange={(e) => setRoom(r.key, { closets: +e.target.value })} /></div>
                </div>
                <div className="chips">
                  {([['walls','Walls'],['ceiling','Ceiling'],['base','Base'],['crown','Crown'],
                     ['paintDoors','Doors'],['paintWindows','Window trim'],['paintClosets','Closets']] as const).map(([k, lbl]) => (
                    <button key={k} className="chip" data-on={(r as any)[k] ? '1' : '0'}
                      onClick={() => setRoom(r.key, { [k]: !(r as any)[k] } as any)}>{lbl}</button>
                  ))}
                </div>
                <div className="t2" style={{ marginTop: 12 }}>
                  {Math.round(q.wallSF)} sf walls · {Math.round(q.ceilingSF)} sf ceiling · {Math.round(q.baseLF)} lf base
                </div>
              </div>
            );
          })}
          <button className="addroom" onClick={() => setRooms((rs) => [...rs, emptyRoom(rs.length + 1)])}>
            Add a room
          </button>

          <div className="section-label">Job settings</div>
          {([
            ['Customer type', 'business_type', btypes.map((b) => [b.code, b.label])],
            ['Condition', 'condition', opts('condition').map((o) => [o.option_code, o.label])],
            ['Coats', 'coats', opts('coats').map((o) => [o.option_code, o.label])],
            ['Color change', 'color', opts('color').map((o) => [o.option_code, o.label])],
            ['Occupancy', 'occupancy', opts('occupancy').map((o) => [o.option_code, o.label])],
            ['Access', 'access', opts('access').map((o) => [o.option_code, o.label])],
            ['Texture', 'texture', opts('texture').map((o) => [o.option_code, o.label])],
            ['Sheen', 'sheen', opts('sheen').map((o) => [o.option_code, o.label])],
            ['Paint', 'paint_tier', paints.map((p) => [p.tier, `${p.product} · $${p.cost_per_gallon}/gal`])],
            ['Doors', 'door_scope', rates.filter((r) => r.scope_group === 'door').map((r) => [r.code, r.label])],
            ['Windows', 'window_scope', rates.filter((r) => r.scope_group === 'window').map((r) => [r.code, r.label])],
          ] as [string, string, any[]][]).map(([label, key, options]) => (
            <div className="setting" key={key}>
              <label>{label}</label>
              <select value={(job as any)[key]} onChange={(e) => upd(key, e.target.value)}>
                {options.map(([v, l]: any) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
          <div className="setting">
            <label>Primer coat</label>
            <button className="chip" data-on={job.primer ? '1' : '0'} onClick={() => upd('primer', !job.primer)}>
              {job.primer ? 'Yes' : 'No'}
            </button>
          </div>
          <div className="setting">
            <label>Round-trip miles</label>
            <input type="number" value={job.miles} onChange={(e) => upd('miles', +e.target.value)} />
          </div>
          <div className="setting">
            <label>Days on site</label>
            <input type="number" value={job.days_on_site} onChange={(e) => upd('days_on_site', +e.target.value)} />
          </div>

          {out && (
            <div className="field">
              <div className="section-label" style={{ margin: '0 -18px 12px' }}>Cost breakdown</div>
              {[
                ['Labor', out.laborCost], ['Paint', out.paint],
                ['Sundries', out.sundries], ['Travel', out.travel],
                ['Direct cost', out.direct], ['Gross profit', out.grossProfit],
              ].map(([l, v]: any) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 16 }}>
                  <span style={{ color: 'var(--grey)' }}>{l}</span><b>{money(v)}</b>
                </div>
              ))}
            </div>
          )}
        </div>

        {out && (
          <div className="dock">
            <div className="inner">
              <div className="readout">
                <div className="big">{money(out.price)}</div>
                <div className="r2">
                  <span><b>{out.totalHours.toFixed(1)}</b> hrs</span>
                  <span><b>{out.manDays.toFixed(1)}</b> man days</span>
                  <span><b>{out.finishGal.toFixed(1)}</b> gal</span>
                  <span><b>{money(out.effectiveRate)}</b>/hr</span>
                </div>
              </div>
              <button className="btn" onClick={save} disabled={saving || !rooms.some((r) => r.length && r.width)}>
                Save quote
              </button>
            </div>
          </div>
        )}
      </div>
    </Chrome>
  );
}

export default function NewQuote() {
  return (
    <Suspense fallback={null}>
      <NewQuoteInner />
    </Suspense>
  );
}
