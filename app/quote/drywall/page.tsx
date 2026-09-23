'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import { accentStyle } from '@/lib/theme';
import { priceDrywall, defaultPicks, newLine, DrywallJob, BoardLine, Board, Material, Mod } from '@/lib/drywall';

const money = (n: any) => '$' + Math.round(Number(n) || 0).toLocaleString();
const BEADS = ['bead_metal', 'bead_paper', 'bead_bull', 'bead_l', 'bead_j', 'bead_arch'];
const GROUP_LABEL: Record<string, string> = {
  tape: 'Joint tape',
  bed_coat: 'Bedding coat',
  finish_coat: 'Finish coats',
};


export default function DrywallQuote() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [mods, setMods] = useState<Mod[]>([]);
  const [settings, setSettings] = useState<Record<string, number>>({});
  const [btypes, setBtypes] = useState<any[]>([]);
  const [who, setWho] = useState({ name: '', phone: '', address: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [job, setJob] = useState<DrywallJob>({
    turnkey: true,
    wallLines: [newLine('std_12_4x12')],
    ceilingLines: [newLine('std_12_4x12')],
    level: '4', access: 'standard', openings: 0,
    beads: BEADS.map((code) => ({ code, pieces: 0 })),
    dumpster: 0, touchPrime: 4, touchFinal: 4, touchQc: 3, touchHome: 3,
    wastePct: 0.12, businessType: 'consumer', picks: {},
  });
  const set = (k: keyof DrywallJob, v: any) => setJob((j) => ({ ...j, [k]: v }));
  const setLine = (which: 'wallLines' | 'ceilingLines', key: string, patch: Partial<BoardLine>) =>
    setJob((j) => ({ ...j, [which]: j[which].map((l) => (l.key === key ? { ...l, ...patch } : l)) }));

  useEffect(() => {
    (async () => {
      const [b, m, md, s, bt] = await Promise.all([
        supabase.from('drywall_boards').select('*').eq('active', true).order('sort_order'),
        supabase.from('drywall_materials').select('*').eq('active', true).order('sort_order'),
        supabase.from('modifiers').select('*').like('group_code', 'dw_%'),
        supabase.from('business_settings').select('key,value'),
        supabase.from('business_types').select('*').order('sort_order'),
      ]);
      const mats = ((m.data as any) || []) as Material[];
      setBoards((b.data as any) || []); setMaterials(mats);
      setMods((md.data as any) || []); setBtypes(bt.data || []);
      const sx = Object.fromEntries((s.data || []).map((x: any) => [x.key, Number(x.value)]));
      setSettings(sx);
      setJob((j) => ({
        ...j,
        picks: defaultPicks(mats),
        wastePct: sx['dw_waste_pct'] ?? 0.12,
        touchPrime: sx['dw_touchup_prime'] ?? 4,
        touchFinal: sx['dw_touchup_final'] ?? 4,
        touchQc: sx['dw_touchup_qc'] ?? 3,
        touchHome: sx['dw_touchup_homeowner'] ?? 3,
      }));
    })();
  }, []);

  const bt = btypes.find((x) => x.code === job.businessType);
  const out = useMemo(() => {
    if (!boards.length) return null;
    return priceDrywall({
      job, boards, materials, mods,
      laborRate: settings['loaded_labor_rate'] ?? 35.75,
      sundriesPerHour: settings['sundries_per_hour'] ?? 3.5,
      margin: Number(bt?.target_margin ?? 0.45),
      minimum: Number(bt?.minimum_charge ?? 750),
    });
  }, [job, boards, materials, mods, settings, bt]);

  const opt = (g: string) => mods.filter((m) => m.group_code === g);
  const beadRows = materials.filter((m) => BEADS.includes(m.code));

  async function save() {
    setSaving(true);
    const contactId = who.phone || who.name
      ? (await supabase.rpc('find_or_create_contact', {
          p_phone: who.phone || null, p_email: null,
          p_first: who.name.split(' ')[0] || null,
          p_last: who.name.split(' ').slice(1).join(' ') || null })).data
      : null;
    let propertyId = null;
    if (who.address) {
      const { data } = await supabase.from('properties')
        .insert({ address_line1: who.address, city: who.city || null }).select('id').single();
      propertyId = data?.id ?? null;
    }
    await supabase.from('estimates').insert({
      contact_id: contactId, property_id: propertyId,
      division: 'painting', service_type: 'other',
      business_type: job.businessType, status: 'draft',
      settings: { trade: 'drywall', ...job } as any,
      labor_hours: out!.impliedHours, labor_cost: out!.laborCost,
      material_cost: out!.materialCost + out!.sundries,
      direct_cost: out!.direct, target_margin: bt?.target_margin, price: out!.price,
      notes: `Drywall — ${out!.totalBoards} boards, Level ${job.level}, ${job.turnkey ? 'turnkey' : 'labor only'}`,
    });
    setSaving(false);
    router.push('/quote');
  }

  return (
    <Chrome>
      <div style={accentStyle('painting')}>
        <div className="bar">
          <button className="back" onClick={() => router.push('/quote')}>{'\u2190'} Quotes</button>
          <div><h1>Drywall</h1><div className="sub">{job.turnkey ? 'Turnkey' : 'Labor only'}</div></div>
        </div>
        <div className="divstrip" />

        <div className="main">
          <div className="setting">
            <label>What are we quoting</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="chip" data-on={job.turnkey ? '1' : '0'} onClick={() => set('turnkey', true)}>Turnkey</button>
              <button className="chip" data-on={!job.turnkey ? '1' : '0'} onClick={() => set('turnkey', false)}>Labor only</button>
            </div>
          </div>

          <div className="section-label">Customer</div>
          <div className="field">
            <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div><label>Name</label><input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></div>
              <div><label>Phone</label><input inputMode="tel" value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} /></div>
              <div><label>Address</label><input value={who.address} onChange={(e) => setWho({ ...who, address: e.target.value })} /></div>
              <div><label>City</label><input value={who.city} onChange={(e) => setWho({ ...who, city: e.target.value })} /></div>
            </div>
          </div>

          <div className="section-label">Walls — board type and square footage</div>
          {job.wallLines.map((l, i) => (
            <div className="field" key={l.key}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                  <label>Board</label>
                  <select value={l.code} onChange={(e) => setLine('wallLines', l.key, { code: e.target.value })}>
                    {boards.map((b) => <option key={b.code} value={b.code}>{b.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>SF</label>
                  <input type="number" inputMode="decimal" style={{ textAlign: 'center' }}
                    value={l.sf || ''} onChange={(e) => setLine('wallLines', l.key, { sf: +e.target.value })} />
                </div>
                {job.wallLines.length > 1 && (
                  <button className="rmdel" style={{ paddingBottom: 14 }}
                    onClick={() => setJob((j) => ({ ...j, wallLines: j.wallLines.filter((x) => x.key !== l.key) }))}>
                    &times;
                  </button>
                )}
              </div>
              {i === 0 && (
                <div className="t2" style={{ marginTop: 8 }}>
                  Add a line for wet walls. Baths, laundry and garage usually need moisture resistant.
                </div>
              )}
            </div>
          ))}
          <button className="addroom"
            onClick={() => setJob((j) => ({ ...j, wallLines: [...j.wallLines, newLine('mr_12_4x8')] }))}>
            Add a wall board type
          </button>

          <div className="section-label">Ceilings — board type and square footage</div>
          {job.ceilingLines.map((l, i) => (
            <div className="field" key={l.key}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                  <label>Board</label>
                  <select value={l.code} onChange={(e) => setLine('ceilingLines', l.key, { code: e.target.value })}>
                    {boards.filter((b) => b.ceiling_ok).map((b) => <option key={b.code} value={b.code}>{b.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>SF</label>
                  <input type="number" inputMode="decimal" style={{ textAlign: 'center' }}
                    value={l.sf || ''} onChange={(e) => setLine('ceilingLines', l.key, { sf: +e.target.value })} />
                </div>
                {job.ceilingLines.length > 1 && (
                  <button className="rmdel" style={{ paddingBottom: 14 }}
                    onClick={() => setJob((j) => ({ ...j, ceilingLines: j.ceilingLines.filter((x) => x.key !== l.key) }))}>
                    &times;
                  </button>
                )}
              </div>
              {i === 0 && (
                <div className="t2" style={{ marginTop: 8 }}>
                  Garage ceilings are 5/8 Type X by code. Bath ceilings usually moisture resistant.
                </div>
              )}
            </div>
          ))}
          <button className="addroom"
            onClick={() => setJob((j) => ({ ...j, ceilingLines: [...j.ceilingLines, newLine('x_58_4x8')] }))}>
            Add a ceiling board type
          </button>

          <div className="setting">
            <label>Waste factor</label>
            <input type="number" step="1" value={Math.round(job.wastePct * 100)}
              onChange={(e) => set('wastePct', (+e.target.value) / 100)} />
          </div>

          <div className="section-label">The job</div>
          <div className="setting">
            <label>Finish level</label>
            <select value={job.level} onChange={(e) => set('level', e.target.value)}>
              {opt('dw_level').map((m) => <option key={m.option_code} value={m.option_code}>{m.label}</option>)}
            </select>
          </div>
          <div className="setting">
            <label>Access</label>
            <select value={job.access} onChange={(e) => set('access', e.target.value)}>
              {opt('dw_access').map((m) => <option key={m.option_code} value={m.option_code}>{m.label}</option>)}
            </select>
          </div>
          <div className="setting">
            <label>Customer type</label>
            <select value={job.businessType} onChange={(e) => set('businessType', e.target.value)}>
              {btypes.map((b) => <option key={b.code} value={b.code}>{b.label}</option>)}
            </select>
          </div>
          <div className="setting">
            <label>Openings<div className="hintl">windows, doors, large openings</div></label>
            <input type="number" inputMode="numeric" value={job.openings || ''}
              onChange={(e) => set('openings', +e.target.value)} />
          </div>

          <div className="section-label">Materials</div>
          {Array.from(new Set(materials.filter((m) => m.option_group).map((m) => m.option_group!)))
            .map((g) => (
            <div className="setting" key={g}>
              <label>{GROUP_LABEL[g] || g}</label>
              <select value={job.picks[g] ?? ''}
                onChange={(e) => set('picks', { ...job.picks, [g]: e.target.value })}>
                {materials.filter((m) => m.option_group === g).map((m) => (
                  <option key={m.code} value={m.code}>{m.label}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="field">
            <div className="t2">
              Always included and worked out from the board count:{' '}
              {materials.filter((m) => !m.option_group && m.basis !== 'per_job' && m.basis !== 'per_piece')
                .map((m) => m.label.replace(/\s+\d.*$/, '')).join(', ')}.
            </div>
          </div>

          <div className="section-label">Corner bead — pieces</div>
          {beadRows.map((m) => (
            <div className="setting" key={m.code}>
              <label>{m.label.replace(' 8 ft', '')}<div className="hintl">{money(m.price_each)} each</div></label>
              <input type="number" inputMode="numeric"
                value={job.beads.find((b) => b.code === m.code)?.pieces || ''}
                onChange={(e) => set('beads', job.beads.map((b) =>
                  b.code === m.code ? { ...b, pieces: +e.target.value } : b))} />
            </div>
          ))}

          <div className="section-label">Touch-up budget — hours</div>
          {([['touchPrime','After prime'],['touchFinal','Final walk'],
             ['touchQc','QC walk'],['touchHome','Homeowner walk']] as const).map(([k, l]) => (
            <div className="setting" key={k}>
              <label>{l}</label>
              <input type="number" step="0.5" value={(job as any)[k] || ''}
                onChange={(e) => set(k, +e.target.value)} />
            </div>
          ))}
          <div className="setting">
            <label>Debris removal</label>
            <input type="number" value={job.dumpster || ''} onChange={(e) => set('dumpster', +e.target.value)} />
          </div>

          {out && (
            <>
              <button className="acc" onClick={() => setShowDetail(!showDetail)}>
                <span>Take-off and cost</span>
                <span className="r">{out.totalBoards} boards {showDetail ? '\u2212' : '+'}</span>
              </button>
              {showDetail && (
                <div className="field">
                  {out.lines.map((l, i) => (
                    <div key={i} style={{ padding: '6px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15.5 }}>
                        <span style={{ color: 'var(--ink-3)' }}>{l.qty} {l.unit} · {l.label}</span>
                        <b>{l.cost ? money(l.cost) : 'by others'}</b>
                      </div>
                      {l.why && <div className="t2" style={{ fontSize: 12.5 }}>{l.why}</div>}
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--line)', marginTop: 10, paddingTop: 10 }}>
                    {[['Hang', out.hang], ['Tape and finish', out.finish],
                      ['Touch-ups and openings', out.hourlyLabor],
                      ['Materials', out.materialCost], ['Sundries', out.sundries],
                      ['Direct cost', out.direct], ['Gross profit', out.grossProfit]].map(([l, v]: any) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 15.5 }}>
                        <span style={{ color: 'var(--ink-3)' }}>{l}</span><b>{money(v)}</b>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {out && (
          <div className="dock"><div className="inner">
            <div className="readout">
              <div className="big">{money(out.price)}</div>
              <div className="r2">
                <span><b>{out.totalBoards}</b> boards</span>
                <span><b>{money(out.perSf)}</b>/sf</span>
                <span><b>{money(out.perBoard)}</b>/board</span>
                <span><b>{out.impliedHours.toFixed(0)}</b> hrs</span>
              </div>
            </div>
            <button className="btn" onClick={save} disabled={saving || out.totalBoards === 0}>Save quote</button>
          </div></div>
        )}
      </div>
    </Chrome>
  );
}
