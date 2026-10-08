'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import DraftBanner from '@/components/DraftBanner';
import ProposalSections, { Sections, emptySections } from '@/components/ProposalSections';
import CustomerLookup, { Who } from '@/components/CustomerLookup';
import { useAutosave, useRecovered, clearDraft } from '@/lib/draft';
import { accentStyle } from '@/lib/theme';
import { useTradeMargins } from '@/lib/margin';
import {
  priceCleaning, cleanWarnings, newAddon, winCount,
  CleanJob, CleanType, CleanAddon, WindowRate, Mod,
} from '@/lib/cleaning';

const money = (n: any) => '$' + Math.round(Number(n) || 0).toLocaleString();
const NOTE: React.CSSProperties = { fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.4 };
const WARN: React.CSSProperties = {
  background: 'var(--amber-bg)', borderLeft: '4px solid var(--amber)',
  padding: '12px 20px', fontSize: 14.5, fontWeight: 620, color: 'var(--amber)',
};
const CATS: [string, string][] = [
  ['construction', 'Post-construction'], ['kitchen', 'Kitchen'],
  ['detail', 'Detail work'], ['exterior', 'Outside'],
];
/* What a post-construction final almost always includes. Pre-loading these is
   the difference between a quote that holds and a return trip for free. */
const STARTER: Record<string, string[]> = {
  post_final: ['overspray', 'dust_second', 'stickers'],
  move_out:   ['cabinet_int', 'fridge_int', 'oven_int', 'blinds'],
  turn:       ['cabinet_int', 'fridge_int', 'oven_int'],
  comm_final: ['overspray', 'dust_second', 'stickers'],
};

function CleaningInner() {
  const router = useRouter();
  const params = useSearchParams();
  const estimateId = params.get('id');
  const [loaded, setLoaded] = useState(false);

  const [types, setTypes] = useState<CleanType[]>([]);
  const [addons, setAddons] = useState<CleanAddon[]>([]);
  const [winRates, setWinRates] = useState<WindowRate[]>([]);
  const [mods, setMods] = useState<Mod[]>([]);
  const [settings, setSettings] = useState<Record<string, number>>({});
  const { rows: btypes, find: findMargin } = useTradeMargins('cleaning');
  const [who, setWho] = useState<Who>({ name: '', phone: '', address: '', city: '' });
  const [sections, setSections] = useState<Sections>(emptySections());
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [saveErr, setSaveErr] = useState('');
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const [job, setJob] = useState<CleanJob>({
    type: 'post_final', sf: 0,
    condition: 'post_heavy', stories: 'one', occupied: 'empty', frequency: 'one_time',
    addons: [], windows: [], tripCharge: false, businessType: 'consumer',
  });
  const set = (k: keyof CleanJob, v: any) => setJob((j) => ({ ...j, [k]: v }));

  useEffect(() => {
    (async () => {
      const [t, a, w, m, bs] = await Promise.all([
        supabase.from('cleaning_types').select('*').eq('active', true).order('sort_order'),
        supabase.from('cleaning_addons').select('*').eq('active', true).order('sort_order'),
        supabase.from('window_clean_rates').select('*').eq('active', true).order('sort_order'),
        supabase.from('modifiers').select('*').like('group_code', 'clean_%'),
        supabase.from('business_settings').select('key,value'),
      ]);
      setTypes((t.data as any) || []); setAddons((a.data as any) || []);
      setWinRates((w.data as any) || []); setMods((m.data as any) || []);
      setSettings(Object.fromEntries((bs.data || []).map((x: any) => [x.key, Number(x.value)])));

      if (estimateId) {
        const { data: est } = await supabase.from('estimates')
          .select('*,contacts(first_name,last_name,phone),properties(address_line1,city)')
          .eq('id', estimateId).single();
        if (est?.settings) {
          const { trade, ...saved } = est.settings as any;
          setJob((j) => ({ ...j, ...saved }));
          setWho({
            name: `${(est as any).contacts?.first_name ?? ''} ${(est as any).contacts?.last_name ?? ''}`.trim(),
            phone: (est as any).contacts?.phone ?? '',
            address: (est as any).properties?.address_line1 ?? '',
            city: (est as any).properties?.city ?? '',
          });
          setSections({
            scope: est.scope_notes ?? '', exclusions: est.exclusions ?? '',
            customer: est.customer_responsibilities ?? '', internal: est.internal_notes_v2 ?? '',
          });
        }
        setLoaded(true); return;
      }
      setJob((j) => ({ ...j, addons: (STARTER['post_final'] || []).map(newAddon) }));
      setLoaded(true);
    })();
  }, [estimateId]);

  const bt = findMargin(job.businessType);
  const out = useMemo(() => {
    if (!types.length) return null;
    return priceCleaning({
      job, types, addons, windows: winRates, mods,
      laborRate: settings['clean_labor_rate'] ?? 26,
      suppliesPerHour: settings['clean_supplies_per_hour'] ?? 2.25,
      tripCharge: settings['clean_trip_charge'] ?? 0,
      crewSize: settings['clean_crew_size'] ?? 2,
      margin: Number(bt?.target_margin ?? 0.45),
      minimum: Number(bt?.minimum_charge ?? 250),
    });
  }, [job, types, addons, winRates, mods, settings, bt]);

  const warnings = useMemo(() => cleanWarnings(job, types, addons), [job, types, addons]);
  useAutosave('cleaning', estimateId, { job, who, sections }, loaded);
  const { found, dismiss } = useRecovered<any>('cleaning', estimateId, loaded);

  const theType = types.find((t) => t.code === job.type);
  const opt = (g: string) => mods.filter((m) => m.group_code === g);
  const inJob = (code: string) => job.addons.some((a) => a.code === code);
  const canSave = !!out && out.price > 0 && (out.totalHours > 0 || out.windowBill > 0);

  /* Changing the type of clean reloads the sensible starting add-ons and the
     condition that goes with it, unless the rep has already picked things. */
  function pickType(code: string) {
    const t = types.find((x) => x.code === code);
    setJob((j) => ({
      ...j, type: code,
      condition: t?.default_condition ?? j.condition,
      frequency: t?.is_recurring ? (j.frequency === 'one_time' ? 'biweekly' : j.frequency) : 'one_time',
      addons: j.addons.some((a) => a.qty > 0) ? j.addons : (STARTER[code] || []).map(newAddon),
    }));
  }
  function toggle(code: string) {
    set('addons', inJob(code)
      ? job.addons.filter((a) => a.code !== code)
      : [...job.addons, newAddon(code)]);
  }
  const setAddonQty = (key: string, qty: number) =>
    set('addons', job.addons.map((a) => (a.key === key ? { ...a, qty } : a)));
  const setWin = (code: string, count: number) => {
    const rest = job.windows.filter((w) => w.code !== code);
    set('windows', count > 0 ? [...rest, { code, count }] : rest);
  };

  async function save() {
    setSaving(true);
    const payload = {
      settings: { trade: 'cleaning', ...job } as any,
      labor_hours: out!.totalHours, labor_cost: out!.laborCost + out!.windowLabor,
      material_cost: out!.supplies + out!.addonMaterial,
      direct_cost: out!.direct, target_margin: bt?.target_margin, price: out!.price,
      scope_notes: sections.scope || null, exclusions: sections.exclusions || null,
      customer_responsibilities: sections.customer || null, internal_notes_v2: sections.internal || null,
      notes: `${theType?.label ?? 'Cleaning'} — ${Math.round(job.sf).toLocaleString()} sf`
           + (out!.glassUnits ? `, ${out!.glassUnits} windows` : '')
           + (out!.visits > 1 ? `, ${out!.visits}x per year` : ''),
    };
    if (estimateId) {
      const { error } = await supabase.from('estimates').update(payload).eq('id', estimateId);
      setSaving(false);
      if (error) { setSaveErr(error.message); return; }
      clearDraft('cleaning', estimateId); setSaveErr(''); flash('Saved'); return;
    }
    const contactId = who.contactId ?? (who.phone || who.name
      ? (await supabase.rpc('find_or_create_contact', {
          p_phone: who.phone || null, p_email: null,
          p_first: who.name.split(' ')[0] || null,
          p_last: who.name.split(' ').slice(1).join(' ') || null })).data
      : null);
    let propertyId = who.propertyId ?? null;
    if (!propertyId && who.address) {
      const { data } = await supabase.from('properties')
        .insert({ address_line1: who.address, city: who.city || null }).select('id').single();
      propertyId = data?.id ?? null;
    }
    const { data: est, error: insErr } = await (supabase.from('estimates').insert({
      contact_id: contactId, property_id: propertyId,
      division: 'cleaning', service_type: job.type,
      business_type: job.businessType, status: 'draft', ...payload,
    }) as any).select('id').single();
    clearDraft('cleaning', null);
    setSaving(false);
    if (insErr) { setSaveErr(insErr.message); return; }
    if (est && est.id) { setSaveErr(''); flash('Saved'); router.replace(`/quote/cleaning?id=${est.id}`); }
  }

  return (
    <Chrome>
      <div style={accentStyle('cleaning')}>
        <div className="bar">
          <button className="back" onClick={() => router.push('/quote')}>{'←'} Quotes</button>
          <div>
            <h1>Cleaning</h1>
            <div className="sub">
              {estimateId ? 'Editing a saved quote' : 'Final cleans, turns, recurring and glass'}
            </div>
          </div>
        </div>
        <div className="divstrip" />

        <div className="main">
          {found && (
            <DraftBanner at={found.at}
              onRestore={() => { setJob(found.data.job); setWho(found.data.who);
                                 if (found.data.sections) setSections(found.data.sections); dismiss(); }}
              onDiscard={dismiss} />
          )}

          <div className="section-label">Customer</div>
          <CustomerLookup who={who} setWho={setWho} />

          <div className="section-label">What kind of clean</div>
          <div className="field">
            <label>Type</label>
            <select value={job.type} onChange={(e) => pickType(e.target.value)}>
              {types.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
            {theType?.notes && <div style={{ ...NOTE, marginTop: 9 }}>{theType.notes}</div>}
          </div>

          <div className="field">
            <label>Square footage to be cleaned</label>
            <input type="number" inputMode="numeric" value={job.sf || ''}
              placeholder="0"
              onChange={(e) => set('sf', Math.max(0, +e.target.value))} />
            <div style={{ ...NOTE, marginTop: 9 }}>
              Finished area only. Leave the garage out unless it is on the checklist —
              there is an add-on for it.
            </div>
          </div>

          {([['Condition', 'condition', 'clean_condition'],
             ['Height', 'stories', 'clean_stories'],
             ['Furniture', 'occupied', 'clean_occupied']] as const).map(([lbl, key, grp]) => (
            <div className="setting" key={key}>
              <label>{lbl}</label>
              <select value={(job as any)[key]} onChange={(e) => set(key as any, e.target.value)}>
                {opt(grp).map((m) => <option key={m.option_code} value={m.option_code}>{m.label}</option>)}
              </select>
            </div>
          ))}

          {theType?.is_recurring && (
            <div className="setting">
              <label>
                How often
                <div className="hintl">A house on a schedule stays cleaner, so the per-visit rate drops.</div>
              </label>
              <select value={job.frequency} onChange={(e) => set('frequency', e.target.value)}>
                {opt('clean_frequency').filter((m) => m.option_code !== 'one_time')
                  .map((m) => <option key={m.option_code} value={m.option_code}>{m.label}</option>)}
              </select>
            </div>
          )}

          <div className="setting">
            <label>Customer type</label>
            <select value={job.businessType} onChange={(e) => set('businessType', e.target.value)}>
              {btypes.map((b) => <option key={b.business_type} value={b.business_type}>{b.label}</option>)}
            </select>
          </div>

          {settings['clean_trip_charge'] > 0 && (
            <div className="setting">
              <label>Trip charge ({money(settings['clean_trip_charge'])})</label>
              <button className="chip" data-on={job.tripCharge ? '1' : '0'}
                onClick={() => set('tripCharge', !job.tripCharge)}>
                {job.tripCharge ? 'Yes' : 'No'}
              </button>
            </div>
          )}

          {/* ---------------------------------------------------- add-ons */}
          <div className="section-label">
            What the square-foot rate does not cover
          </div>
          <div className="field">
            <div style={NOTE}>
              The rate above buys the standard checklist for this type of clean. Anything
              here is genuinely on top of it — which is why you can see it, and why the
              customer can too.
            </div>
          </div>
          {CATS.map(([cat, label]) => {
            const list = addons.filter((a) => a.category === cat);
            if (!list.length) return null;
            const on = list.filter((a) => inJob(a.code)).length;
            return (
              <div key={cat}>
                <button className="acc" onClick={() => setOpenCat(openCat === cat ? null : cat)}>
                  <span>{label}</span>
                  <span className="r">{on ? `${on} on` : ''} {openCat === cat ? '−' : '+'}</span>
                </button>
                {openCat === cat && (
                  <div className="field">
                    <div className="chips" style={{ marginTop: 0 }}>
                      {list.map((a) => (
                        <button key={a.code} className="chip" data-on={inJob(a.code) ? '1' : '0'}
                          onClick={() => toggle(a.code)}>{a.label}</button>
                      ))}
                    </div>
                  </div>
                )}
                {job.addons.filter((l) => list.some((x) => x.code === l.code)).map((l) => {
                  const a = addons.find((x) => x.code === l.code)!;
                  return (
                    <div className="roomcard" key={l.key}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 750,
                                          letterSpacing: 1.2, textTransform: 'uppercase',
                                          color: 'var(--grey)', marginBottom: 9 }}>
                            {a.label} · {a.unit}
                          </label>
                          <input type="number" inputMode="numeric" value={l.qty || ''}
                            placeholder="0"
                            style={{ width: '100%', padding: 13, border: '1px solid var(--line-2)',
                                     borderRadius: 5, fontSize: 18, background: 'var(--surface)' }}
                            onChange={(e) => setAddonQty(l.key, Math.max(0, +e.target.value))} />
                        </div>
                        <button className="rmdel" style={{ paddingBottom: 14 }}
                          onClick={() => toggle(l.code)}>&times;</button>
                      </div>
                      {a.notes && <div style={{ ...NOTE, marginTop: 8 }}>{a.notes}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* ---------------------------------------------------- windows */}
          <div className="section-label">Windows</div>
          <div className="field">
            <div style={NOTE}>
              Counted as glass units — a transom over a door is its own unit. Billed off the
              published list, not through the job margin.
            </div>
          </div>
          {winRates.filter((w) => w.code !== 'grid').map((w) => (
            <div className="setting" key={w.code}>
              <label>
                {w.label}
                <div className="hintl">{money(w.bill_each)} each{w.notes ? ` · ${w.notes}` : ''}</div>
              </label>
              <input type="number" inputMode="numeric" value={winCount(job, w.code) || ''}
                placeholder="0"
                onChange={(e) => setWin(w.code, Math.max(0, +e.target.value))} />
            </div>
          ))}
          {winRates.filter((w) => w.code === 'grid').map((w) => (
            <div className="setting" key={w.code}>
              <label>
                {w.label}
                <div className="hintl">
                  {money(w.bill_each)} per window with grids. Count windows, not lites.
                </div>
              </label>
              <input type="number" inputMode="numeric" value={winCount(job, w.code) || ''}
                placeholder="0"
                onChange={(e) => setWin(w.code, Math.max(0, +e.target.value))} />
            </div>
          ))}

          {warnings.length > 0 && (
            <>
              <div className="section-label">Worth a look</div>
              {warnings.map((wn, i) => <div key={i} style={WARN}>{wn}</div>)}
            </>
          )}

          <div className="section-label">Proposal</div>
          <ProposalSections trade="cleaning" value={sections} onChange={setSections} />

          {out && (
            <>
              <button className="acc" onClick={() => setShowDetail(!showDetail)}>
                <span>Breakdown</span>
                <span className="r">{out.totalHours.toFixed(1)} hrs {showDetail ? '−' : '+'}</span>
              </button>
              {showDetail && (
                <div className="field">
                  {out.rows.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 15 }}>
                      <span style={{ color: 'var(--ink-3)' }}>
                        {r.detail || `${r.qty} ${r.unit}`} · {r.label}
                      </span>
                      <b>{r.hours.toFixed(1)} hr</b>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--line)', marginTop: 10, paddingTop: 10 }}>
                    {[['Condition, height, furniture, frequency', `× ${out.labourMult.toFixed(2)}`],
                      ['Labor', money(out.laborCost)],
                      ['Supplies', money(out.supplies + out.addonMaterial)],
                      ['Cleaning price', money(out.cleanPrice) + (out.minApplied ? ' (minimum)' : '')],
                     ].map(([l, v]: any) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 15 }}>
                        <span style={{ color: 'var(--ink-3)' }}>{l}</span><b>{v}</b>
                      </div>
                    ))}
                  </div>
                  {out.windowRows.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--line)', marginTop: 10, paddingTop: 10 }}>
                      {out.windowRows.map((w, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 15 }}>
                          <span style={{ color: 'var(--ink-3)' }}>{w.count} × {w.label}</span>
                          <b>{money(w.bill)}</b>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 15 }}>
                        <span style={{ color: 'var(--ink-3)' }}>Glass margin</span>
                        <b>{(out.windowMargin * 100).toFixed(0)}%</b>
                      </div>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid var(--line)', marginTop: 10, paddingTop: 10 }}>
                    {[['Direct cost', money(out.direct)],
                      ['Gross profit', money(out.grossProfit)],
                      ['Blended margin', `${(out.marginPct * 100).toFixed(0)}%`],
                      ['Effective rate', `${money(out.effectiveRate)}/hr`],
                     ].map(([l, v]: any) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 15 }}>
                        <span style={{ color: 'var(--ink-3)' }}>{l}</span><b>{v}</b>
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
              <div className="big">
                {money(out.price)}
                {out.visits > 1 && <span style={{ fontSize: 15, fontFamily: 'inherit' }}> / visit</span>}
              </div>
              <div className="r2">
                {job.sf > 0 && <span><b>{Math.round(job.sf).toLocaleString()}</b> sf</span>}
                <span><b>{out.totalHours.toFixed(1)}</b> hrs</span>
                <span><b>{out.crewDays.toFixed(1)}</b> crew-days</span>
                {out.perSf > 0 && <span><b>${out.perSf.toFixed(2)}</b>/sf</span>}
                {out.glassUnits > 0 && <span><b>{out.glassUnits}</b> glass</span>}
                {out.visits > 1 && <span><b>{money(out.annual)}</b>/yr</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn ghost" onClick={() => router.push('/quote')}>Done</button>
              <button className="btn" onClick={save} disabled={saving || !canSave}>
                {saving ? 'Saving…' : estimateId ? 'Save changes' : 'Save quote'}
              </button>
            </div>
            {!canSave && <div className="hint">Enter square footage or a window count before saving</div>}
            {saveErr && <div className="hint" style={{ color: 'var(--no)', fontWeight: 620 }}>Could not save — {saveErr}</div>}
          </div></div>
        )}
        {toast && <div className="saved">{toast}</div>}
      </div>
    </Chrome>
  );
}

export default function CleaningQuote() {
  return <Suspense fallback={null}><CleaningInner /></Suspense>;
}
