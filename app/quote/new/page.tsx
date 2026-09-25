'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import DraftBanner from '@/components/DraftBanner';
import { useAutosave, useRecovered, clearDraft } from '@/lib/draft';
import { accentStyle } from '@/lib/theme';
import { useTradeMargins } from '@/lib/margin';
import {
  Room, emptyRoom, roomQuantities, roomWarnings, priceEstimate, newSpecialty,
  JobSettings, Rate, Modifier, Settings, MeasureMode, SpecialtyLine,
} from '@/lib/pricing';
import CustomerLookup, { Who } from '@/components/CustomerLookup';

const money = (n: number) => '$' + Math.round(n || 0).toLocaleString();
const TAKEOFF_FIELDS: [string, string][] = [
  ['walls_smooth', 'Wall SF'],
  ['ceiling_smooth', 'Ceiling SF'],
  ['baseboard', 'Baseboard LF'],
  ['crown', 'Crown LF'],
  ['shoe_mold', 'Shoe mold LF'],
  ['closet', 'Closets'],
];


function NewQuoteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const leadId = params.get('lead');
  const estimateId = params.get('id');
  const [loaded, setLoaded] = useState(false);
  const [rates, setRates] = useState<Rate[]>([]);
  const [mods, setMods] = useState<Modifier[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [paints, setPaints] = useState<any[]>([]);
  const { rows: btypes, find: findMargin } = useTradeMargins('painting');
  const [rooms, setRooms] = useState<Room[]>([emptyRoom(1)]);
  const [saving, setSaving] = useState(false);
  const [who, setWho] = useState<Who>({ name: '', phone: '', address: '', city: '' });
  const [specOpen, setSpecOpen] = useState(false);
  const [heatedSf, setHeatedSf] = useState(0);

  const [job, setJob] = useState<JobSettings>({
    condition: 'minor_patch', coats: '2', color: 'same', occupancy: 'occupied_light',
    access: 'standard', texture: 'smooth', sheen: 'eggshell', project_type: 'repaint',
    paint_tier: 'standard', primer: false,
    door_scope: 'door_full', window_scope: 'window_casing_sill',
    business_type: 'consumer', miles: 40, days_on_site: 3,
    mode: 'room', takeoff: {}, specialty: [], notes: '',
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
      const [r, m, s, p] = await Promise.all([
        supabase.from('rate_items').select('*').eq('active', true),
        supabase.from('modifiers').select('*'),
        supabase.from('business_settings').select('key,value'),
        supabase.from('paint_products').select('*').order('sort_order'),
      ]);
      setRates((r.data as any) || []);
      setMods((m.data as any) || []);
      setSettings(Object.fromEntries((s.data || []).map((x: any) => [x.key, Number(x.value)])));
      setPaints(p.data || []);
      if (estimateId) {
        const { data: est } = await supabase.from('estimates')
          .select('*,contacts(first_name,last_name,phone),properties(address_line1,city)')
          .eq('id', estimateId).single();
        const { data: rm } = await supabase.from('estimate_rooms')
          .select('*').eq('estimate_id', estimateId).order('sort_order');
        if (est?.settings) setJob((j) => ({
          ...j, ...(est.settings as any),
          mode: (est as any).takeoff_mode ?? (est.settings as any).mode ?? 'room',
          takeoff: (est as any).takeoff?.takeoff ?? (est.settings as any).takeoff ?? {},
          specialty: (est as any).takeoff?.specialty ?? (est.settings as any).specialty ?? [],
          notes: (est as any).project_notes ?? (est.settings as any).notes ?? '',
        }));
        if (est) setWho({
          name: `${(est as any).contacts?.first_name ?? ''} ${(est as any).contacts?.last_name ?? ''}`.trim(),
          phone: (est as any).contacts?.phone ?? '',
          address: (est as any).properties?.address_line1 ?? '',
          city: (est as any).properties?.city ?? '',
        });
        if (rm?.length) setRooms(rm.map((r: any) => ({
          key: r.id, name: r.room_name, mode: r.mode ?? 'rect',
          length: Number(r.length_ft) || 0, width: Number(r.width_ft) || 0,
          height: Number(r.ceiling_ht_ft) || 9,
          perimeterFt: Number(r.perimeter_ft) || 0,
          wallRuns: r.walls ?? [{ len: 0, ht: Number(r.ceiling_ht_ft) || 9 }],
          ceilingSf: r.ceiling_sf != null ? Number(r.ceiling_sf) : null,
          deductSf: Number(r.deduct_sf) || 0, vaultAddSf: Number(r.vault_add_sf) || 0,
          doors: r.door_count ?? 0, windows: r.window_count ?? 0, closets: r.closet_count ?? 0,
          walls: r.paint_walls, ceiling: r.paint_ceiling, base: r.paint_base,
          crown: r.paint_crown, paintDoors: r.paint_doors,
          paintWindows: r.paint_window_trim, paintClosets: r.paint_closets,
        })));
        setLoaded(true);
        return;
      }
      setLoaded(true);
      if (s.data) setJob((j) => ({
        ...j,
        miles: Number((s.data as any).find((x: any) => x.key === 'default_round_trip_miles')?.value ?? 40),
        days_on_site: Number((s.data as any).find((x: any) => x.key === 'default_days_on_site')?.value ?? 3),
      }));
    })();
  }, []);

  const bt = findMargin(job.business_type);
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
    const priced = {
      settings: job as any,
      takeoff_mode: job.mode,
      takeoff: { takeoff: job.takeoff, specialty: job.specialty } as any,
      project_notes: job.notes || null,
      labor_hours: out!.totalHours, labor_multiplier: out!.multiplier,
      finish_gallons: out!.finishGal, primer_gallons: out!.primerGal,
      labor_cost: out!.laborCost, material_cost: out!.paint + out!.sundries,
      travel_cost: out!.travel, direct_cost: out!.direct,
      target_margin: bt?.target_margin, price: out!.price,
    };
    const roomRows = (eid: string) => rooms.map((r, i) => ({
      estimate_id: eid, room_name: r.name, mode: r.mode,
      perimeter_ft: r.mode === 'perimeter' ? r.perimeterFt : null,
      walls: r.mode === 'walls' ? r.wallRuns : null,
      ceiling_sf: r.ceilingSf, deduct_sf: r.deductSf, vault_add_sf: r.vaultAddSf,
      length_ft: r.length, width_ft: r.width, ceiling_ht_ft: r.height,
      door_count: r.doors, window_count: r.windows, closet_count: r.closets,
      paint_walls: r.walls, paint_ceiling: r.ceiling, paint_base: r.base,
      paint_crown: r.crown, paint_doors: r.paintDoors,
      paint_window_trim: r.paintWindows, paint_closets: r.paintClosets,
      sort_order: i,
    }));
    if (estimateId) {
      await supabase.from('estimates').update(priced).eq('id', estimateId);
      await supabase.from('estimate_rooms').delete().eq('estimate_id', estimateId);
      if (job.mode === 'room') await supabase.from('estimate_rooms').insert(roomRows(estimateId));
      clearDraft('painting', estimateId);
      setSaving(false); router.push('/quote'); return;
    }
    const contactId = who.contactId ?? (who.phone || who.name
      ? (await supabase.rpc('find_or_create_contact', {
          p_phone: who.phone || null, p_email: null,
          p_first: who.name.split(' ')[0] || null,
          p_last: who.name.split(' ').slice(1).join(' ') || null,
        })).data
      : null);

    let propertyId = who.propertyId ?? null;
    if (!propertyId && who.address) {
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
      takeoff_mode: job.mode, takeoff: { takeoff: job.takeoff, specialty: job.specialty } as any,
      project_notes: job.notes || null,
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
        mode: r.mode,
        perimeter_ft: r.mode === 'perimeter' ? r.perimeterFt : null,
        walls: r.mode === 'walls' ? r.wallRuns : null,
        ceiling_sf: r.ceilingSf, deduct_sf: r.deductSf, vault_add_sf: r.vaultAddSf,
        length_ft: r.length, width_ft: r.width, ceiling_ht_ft: r.height,
        door_count: r.doors, window_count: r.windows, closet_count: r.closets,
        paint_walls: r.walls, paint_ceiling: r.ceiling, paint_base: r.base,
        paint_crown: r.crown, paint_doors: r.paintDoors,
        paint_window_trim: r.paintWindows, paint_closets: r.paintClosets,
        sort_order: i,
      })));
    }
    clearDraft('painting', null);
    setSaving(false);
    router.push('/quote');
  }

  useAutosave('painting', estimateId, { job, who, rooms }, loaded);
  const { found, dismiss } = useRecovered<{ job: any; who: any; rooms: any[] }>(
    'painting', estimateId, loaded);

  return (
    <Chrome>
      <div style={accentStyle('painting')}>
        <div className="bar">
          <button className="back" onClick={() => router.push('/quote')}>{'\u2190'} Quotes</button>
          <div>
            <h1>{estimateId ? 'Edit quote' : 'New quote'}</h1>
            <div className="sub">Interior painting</div>
          </div>
        </div>
        <div className="divstrip" />
        <div className="main">
          {found && (
            <DraftBanner at={found.at}
              onRestore={() => {
                setJob(found.data.job); setWho(found.data.who);
                if (found.data.rooms?.length) setRooms(found.data.rooms);
                dismiss();
              }}
              onDiscard={dismiss} />
          )}
          <div className="section-label">Customer</div>
          <CustomerLookup who={who} setWho={setWho} />

          <div className="setting">
            <div>
              <label>How are you measuring</label>
              <div className="hintl">
                {job.mode === 'room'
                  ? 'Room by room. Best for a straightforward repaint.'
                  : 'Actual surfaces. Best for open plans and big custom homes.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="chip" data-on={job.mode === 'room' ? '1' : '0'}
                onClick={() => upd('mode', 'room')}>Rooms</button>
              <button className="chip" data-on={job.mode === 'takeoff' ? '1' : '0'}
                onClick={() => upd('mode', 'takeoff')}>Takeoff</button>
            </div>
          </div>

          {job.mode === 'takeoff' && (
            <>
              <div className="section-label">Measured quantities</div>
              {TAKEOFF_FIELDS.map(([code, label]) => (
                <div className="setting" key={code}>
                  <label>{label}</label>
                  <input type="number" inputMode="decimal"
                    value={job.takeoff[code] || ''}
                    onChange={(e) => upd('takeoff', { ...job.takeoff, [code]: +e.target.value })} />
                </div>
              ))}
              <div className="section-label">Doors and windows</div>
              {rates.filter((r) => r.scope_group === 'door' || r.scope_group === 'window')
                .map((r) => (
                <div className="setting" key={r.code}>
                  <div><label>{r.label}</label>{r.notes && <div className="hintl">{r.notes}</div>}</div>
                  <input type="number" inputMode="numeric"
                    value={job.takeoff[r.code] || ''}
                    onChange={(e) => upd('takeoff', { ...job.takeoff, [r.code]: +e.target.value })} />
                </div>
              ))}
            </>
          )}

          {job.mode === 'room' && <div className="section-label">Rooms — measure, do not do math</div>}
          {job.mode === 'room' && rooms.map((r) => {
            const q2 = roomQuantities(r);
            const warn = roomWarnings(r);
            return (
              <div className="roomcard" key={r.key}>
                <div className="rname">
                  <input value={r.name} onChange={(e) => setRoom(r.key, { name: e.target.value })} />
                  {rooms.length > 1 && (
                    <button className="rmdel" onClick={() => setRooms((rs) => rs.filter((x) => x.key !== r.key))}>Remove</button>
                  )}
                </div>

                <div className="chips" style={{ marginTop: 0, marginBottom: 14 }}>
                  {([['rect','Four walls'],['perimeter','Measure the run'],['walls','Wall by wall']] as [MeasureMode,string][])
                    .map(([m, lbl]) => (
                      <button key={m} className="chip" data-on={r.mode === m ? '1' : '0'}
                        onClick={() => setRoom(r.key, { mode: m })}>{lbl}</button>
                  ))}
                </div>

                {r.mode === 'rect' && (
                  <div className="grid3">
                    <div><label>Length</label><input type="number" inputMode="decimal" value={r.length || ''} onChange={(e) => setRoom(r.key, { length: +e.target.value })} /></div>
                    <div><label>Width</label><input type="number" inputMode="decimal" value={r.width || ''} onChange={(e) => setRoom(r.key, { width: +e.target.value })} /></div>
                    <div><label>Ceiling</label><input type="number" inputMode="decimal" value={r.height || ''} onChange={(e) => setRoom(r.key, { height: +e.target.value })} /></div>
                  </div>
                )}

                {r.mode === 'perimeter' && (
                  <>
                    <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div><label>Wall run (LF)</label><input type="number" inputMode="decimal" value={r.perimeterFt || ''} onChange={(e) => setRoom(r.key, { perimeterFt: +e.target.value })} /></div>
                      <div><label>Ceiling ht</label><input type="number" inputMode="decimal" value={r.height || ''} onChange={(e) => setRoom(r.key, { height: +e.target.value })} /></div>
                    </div>
                    <div className="hintl" style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>
                      Walk the walls with a measuring wheel or laser. Works for L-shapes, open concept, bays and angles.
                    </div>
                  </>
                )}

                {r.mode === 'walls' && (
                  <>
                    {(r.wallRuns || []).map((w, wi) => (
                      <div className="grid3" key={wi} style={{ gridTemplateColumns: '1fr 1fr auto', marginBottom: 8, alignItems: 'end' }}>
                        <div><label>Wall {wi + 1} length</label>
                          <input type="number" inputMode="decimal" value={w.len || ''}
                            onChange={(e) => setRoom(r.key, { wallRuns: r.wallRuns.map((x, j) => j === wi ? { ...x, len: +e.target.value } : x) })} /></div>
                        <div><label>Height</label>
                          <input type="number" inputMode="decimal" value={w.ht || ''}
                            onChange={(e) => setRoom(r.key, { wallRuns: r.wallRuns.map((x, j) => j === wi ? { ...x, ht: +e.target.value } : x) })} /></div>
                        <button className="rmdel" style={{ paddingBottom: 14 }}
                          onClick={() => setRoom(r.key, { wallRuns: r.wallRuns.filter((_, j) => j !== wi) })}>&times;</button>
                      </div>
                    ))}
                    <button className="chip" onClick={() => setRoom(r.key, { wallRuns: [...(r.wallRuns || []), { len: 0, ht: r.height || 9 }] })}>
                      + Add a wall
                    </button>
                    <div className="hintl" style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>
                      Each wall gets its own height. Use this for two-story foyers, half walls and stairwells.
                    </div>
                  </>
                )}

                <div className="grid3" style={{ marginTop: 12 }}>
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

                <details style={{ marginTop: 12 }}>
                  <summary style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-3)', cursor: 'pointer' }}>
                    Adjustments
                  </summary>
                  <div className="grid3" style={{ marginTop: 10 }}>
                    <div><label>Ceiling SF</label>
                      <input type="number" inputMode="decimal" placeholder={r.mode === 'rect' ? 'auto' : 'enter'}
                        value={r.ceilingSf ?? ''} onChange={(e) => setRoom(r.key, { ceilingSf: e.target.value === '' ? null : +e.target.value })} /></div>
                    <div><label>Vault add SF</label>
                      <input type="number" inputMode="decimal" value={r.vaultAddSf || ''} onChange={(e) => setRoom(r.key, { vaultAddSf: +e.target.value })} /></div>
                    <div><label>Deduct SF</label>
                      <input type="number" inputMode="decimal" value={r.deductSf || ''} onChange={(e) => setRoom(r.key, { deductSf: +e.target.value })} /></div>
                  </div>
                  <div className="hintl" style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 8 }}>
                    Deduct only large openings — pass-throughs, missing walls, sliders, fireplaces.
                    Never deduct doors or windows; cut-in labor offsets the paint saved and they are already priced separately.
                  </div>
                </details>

                <div className="t2" style={{ marginTop: 12 }}>
                  {Math.round(q2.wallSF)} sf walls · {Math.round(q2.ceilingSF)} sf ceiling · {Math.round(q2.baseLF)} lf base · {Math.round(q2.perimeter)} lf perimeter
                </div>
                {warn.map((w, i2) => (
                  <div key={i2} style={{ marginTop: 8, fontSize: 13.5, fontWeight: 620, color: 'var(--amber)' }}>{w}</div>
                ))}
              </div>
            );
          })}
          {job.mode === 'room' && (
            <button className="addroom" onClick={() => setRooms((rs) => [...rs, emptyRoom(rs.length + 1)])}>
              Add a room
            </button>
          )}

          <button className="acc" onClick={() => setSpecOpen(!specOpen)}>
            <span>Specialty items</span>
            <span className="r">
              {job.specialty.filter((x) => x.qty > 0).length || 'add'} {specOpen ? '\u2212' : '+'}
            </span>
          </button>
          {specOpen && (
            <div className="chips" style={{ padding: '12px 20px' }}>
              {rates.filter((r) => r.category === 'specialty').map((r) => (
                <button key={r.code} className="chip"
                  data-on={job.specialty.some((x) => x.code === r.code) ? '1' : '0'}
                  onClick={() => upd('specialty', job.specialty.some((x) => x.code === r.code)
                    ? job.specialty.filter((x) => x.code !== r.code)
                    : [...job.specialty, newSpecialty(r.code)])}>{r.label}</button>
              ))}
            </div>
          )}
          {job.specialty.map((sp) => {
            const r = rates.find((x) => x.code === sp.code);
            if (!r) return null;
            return (
              <div className="setting" key={sp.key}>
                <div><label>{r.label}</label>
                  <div className="hintl">{r.unit}{r.notes ? ` · ${r.notes}` : ''}</div></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" inputMode="decimal" value={sp.qty || ''}
                    onChange={(e) => upd('specialty', job.specialty.map((x) =>
                      x.key === sp.key ? { ...x, qty: +e.target.value } : x))} />
                  <button className="rmdel"
                    onClick={() => upd('specialty', job.specialty.filter((x) => x.key !== sp.key))}>&times;</button>
                </div>
              </div>
            );
          })}

          <div className="section-label">Job settings</div>
          {([
            ['Customer type', 'business_type', btypes.map((b) => [b.business_type, b.label])],
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

          <div className="setting">
            <div>
              <label>Heated square feet</label>
              <div className="hintl">Optional. Used only as a sanity check on the price.</div>
            </div>
            <input type="number" inputMode="numeric" value={heatedSf || ''}
              onChange={(e) => setHeatedSf(+e.target.value)} />
          </div>
          {heatedSf > 0 && out && (() => {
            const psf = out.price / heatedSf;
            const lo = settings['bench_interior_low'] ?? 2.4;
            const hi = settings['bench_interior_high'] ?? 4.6;
            const off = psf < lo || psf > hi;
            return (
              <div className="field" style={{ background: off ? 'var(--amber-bg)' : 'var(--paper)' }}>
                <div style={{ fontSize: 14.5, fontWeight: 620, color: off ? 'var(--amber)' : 'var(--ink-3)' }}>
                  {money(psf)}/sf against a {money(lo)}&ndash;{money(hi)} range
                  {off ? psf < lo ? ' — low. Check for a surface you missed.'
                                  : ' — high. Fine on a complex house, worth a second look.'
                       : ' — in range.'}
                </div>
              </div>
            );
          })()}

          <div className="section-label">Project notes</div>
          <div className="field">
            <textarea className="note" rows={4} value={job.notes}
              onChange={(e) => upd('notes', e.target.value)}
              placeholder="Specifications, exclusions, anything the proposal needs to say" />
            <div className="t2" style={{ marginTop: 8 }}>
              These carry onto the proposal. Be specific about what is not included.
            </div>
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
                  {heatedSf > 0 && <span><b>{money(out.price / heatedSf)}</b>/sf</span>}
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
