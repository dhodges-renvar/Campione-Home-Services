'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import DraftBanner from '@/components/DraftBanner';
import { useAutosave, useRecovered, clearDraft } from '@/lib/draft';
import { accentStyle } from '@/lib/theme';
import { useTradeMargins } from '@/lib/margin';
import { priceDeck, deckWarnings, newDeckLine, DeckJob, Surface, Product, Mod } from '@/lib/deck';

const money = (n: any) => '$' + Math.round(Number(n) || 0).toLocaleString();
const CATS: [string, string][] = [
  ['prep', 'Prep'], ['floor', 'Floor'], ['rail', 'Rail'], ['stair', 'Stairs'],
  ['structure', 'Covered / structure'], ['screen', 'Screens'], ['repair', 'Repairs'],
];
/* A plain deck, preloaded. Everything else is one tap away. */
const STARTER = ['wash', 'floor', 'rail_cap', 'spindles_coat', 'stair_tread', 'fascia'];

function DeckQuoteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const estimateId = params.get('id');
  const [loaded, setLoaded] = useState(false);
  const [surfaces, setSurfaces] = useState<Surface[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mods, setMods] = useState<Mod[]>([]);
  const [settings, setSettings] = useState<Record<string, number>>({});
  const { rows: btypes, find: findMargin } = useTradeMargins('deck');
  const [who, setWho] = useState({ name: '', phone: '', address: '', city: '' });
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const [job, setJob] = useState<DeckJob>({
    lines: [], condition: 'good', prevFinish: 'semi', access: 'ground',
    secondTrip: true, furniture: true, landscape: true, businessType: 'consumer',
  });
  const set = (k: keyof DeckJob, v: any) => setJob((j) => ({ ...j, [k]: v }));

  useEffect(() => {
    (async () => {
      const [s, p, m, bs] = await Promise.all([
        supabase.from('deck_surfaces').select('*').eq('active', true).order('sort_order'),
        supabase.from('deck_products').select('*').eq('active', true).order('sort_order'),
        supabase.from('modifiers').select('*').like('group_code', 'deck_%'),
        supabase.from('business_settings').select('key,value'),
      ]);
      const surf = ((s.data as any) || []) as Surface[];
      setSurfaces(surf); setProducts((p.data as any) || []); setMods((m.data as any) || []);
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
          setLoaded(true);
          return;
        }
      }
      setJob((j) => ({
        ...j,
        lines: STARTER.map((c) => {
          const sf = surf.find((x) => x.code === c);
          return newDeckLine(c, sf?.default_coats ?? 2,
            c === 'rail_cap' || c === 'spindles_coat' ? 'semi_trans' : 'semi_trans');
        }).filter((l) => surf.some((x) => x.code === l.code)),
      }));
      setLoaded(true);
    })();
  }, [estimateId]);

  const bt = findMargin(job.businessType);
  const out = useMemo(() => {
    if (!surfaces.length) return null;
    return priceDeck({
      job, surfaces, products, mods,
      laborRate: settings['loaded_labor_rate'] ?? 35.75,
      sundriesPerHour: settings['sundries_per_hour'] ?? 3.5,
      margin: Number(bt?.target_margin ?? 0.5),
      minimum: Number(bt?.minimum_charge ?? 650),
    });
  }, [job, surfaces, products, mods, settings, bt]);

  const warnings = useMemo(() => deckWarnings(job, surfaces), [job, surfaces]);
  useAutosave('deck', estimateId, { job, who }, loaded);
  const { found, dismiss } = useRecovered<{ job: any; who: any }>('deck', estimateId, loaded);
  const opt = (g: string) => mods.filter((m) => m.group_code === g);
  const inJob = (code: string) => job.lines.some((l) => l.code === code);

  function toggle(code: string) {
    const s = surfaces.find((x) => x.code === code);
    setJob((j) => inJob(code)
      ? { ...j, lines: j.lines.filter((l) => l.code !== code) }
      : { ...j, lines: [...j.lines, newDeckLine(code, s?.default_coats ?? 2)] });
  }
  const setLine = (key: string, patch: any) =>
    setJob((j) => ({ ...j, lines: j.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));

  async function save() {
    setSaving(true);
    const payload = {
      settings: { trade: 'deck', ...job } as any,
      labor_hours: out!.totalHours, labor_cost: out!.laborCost,
      material_cost: out!.materialCost + out!.sundries,
      direct_cost: out!.direct, target_margin: bt?.target_margin, price: out!.price,
      notes: `Deck — ${out!.totalHours.toFixed(0)} hrs, ${out!.totalGallons.toFixed(1)} gal`,
    };
    if (estimateId) {
      await supabase.from('estimates').update(payload).eq('id', estimateId);
      clearDraft('deck', estimateId);
      setSaving(false); router.push('/quote'); return;
    }
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
      division: 'painting', service_type: 'exterior',
      business_type: job.businessType, status: 'draft', ...payload,
    });
    clearDraft('deck', null);
    setSaving(false); router.push('/quote');
  }

  return (
    <Chrome>
      <div style={accentStyle('painting')}>
        <div className="bar">
          <button className="back" onClick={() => router.push('/quote')}>{'\u2190'} Quotes</button>
          <div>
            <h1>Deck</h1>
            <div className="sub">{estimateId ? 'Editing a saved quote' : 'Decks, porches and screened rooms'}</div>
          </div>
        </div>
        <div className="divstrip" />

        <div className="main">
          {found && (
            <DraftBanner at={found.at}
              onRestore={() => { setJob(found.data.job); setWho(found.data.who); dismiss(); }}
              onDiscard={dismiss} />
          )}
          <div className="section-label">Customer</div>
          <div className="field">
            <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div><label>Name</label><input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} /></div>
              <div><label>Phone</label><input inputMode="tel" value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} /></div>
              <div><label>Address</label><input value={who.address} onChange={(e) => setWho({ ...who, address: e.target.value })} /></div>
              <div><label>City</label><input value={who.city} onChange={(e) => setWho({ ...who, city: e.target.value })} /></div>
            </div>
          </div>

          <div className="section-label">What you are looking at</div>
          {([['Wood condition', 'condition', 'deck_condition'],
             ['Existing finish', 'prevFinish', 'deck_prev'],
             ['Height and access', 'access', 'deck_access']] as const).map(([lbl, key, grp]) => (
            <div className="setting" key={key}>
              <label>{lbl}</label>
              <select value={(job as any)[key]} onChange={(e) => set(key as any, e.target.value)}>
                {opt(grp).map((m) => <option key={m.option_code} value={m.option_code}>{m.label}</option>)}
              </select>
            </div>
          ))}
          <div className="setting">
            <div>
              <label>Customer type</label>
              {bt && <div className="hintl">deck margin {Math.round(bt.target_margin * 100)}%</div>}
            </div>
            <select value={job.businessType} onChange={(e) => set('businessType', e.target.value)}>
              {btypes.map((b) => <option key={b.business_type} value={b.business_type}>{b.label}</option>)}
            </select>
          </div>

          {warnings.length > 0 && warnings.map((w, i) => (
            <div key={i} style={{ background: 'var(--amber-bg)', borderLeft: '4px solid var(--amber)',
                                  padding: '12px 20px', fontSize: 14.5, fontWeight: 620, color: 'var(--amber)' }}>
              {w}
            </div>
          ))}

          {CATS.map(([cat, label]) => {
            const inCat = surfaces.filter((s) => s.category === cat);
            const active = job.lines.filter((l) => inCat.some((s) => s.code === l.code));
            return (
              <div key={cat}>
                <button className="acc" onClick={() => setOpenCat(openCat === cat ? null : cat)}>
                  <span>{label}</span>
                  <span className="r">{active.length ? `${active.length} on` : 'add'} {openCat === cat ? '\u2212' : '+'}</span>
                </button>
                {openCat === cat && (
                  <div className="chips" style={{ padding: '12px 20px' }}>
                    {inCat.map((s) => (
                      <button key={s.code} className="chip" data-on={inJob(s.code) ? '1' : '0'}
                        onClick={() => toggle(s.code)}>{s.label}</button>
                    ))}
                  </div>
                )}
                {active.map((l) => {
                  const s = surfaces.find((x) => x.code === l.code)!;
                  return (
                    <div className="field" key={l.key}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                        <div style={{ flex: 1.4 }}>
                          <label>{s.label}</label>
                          <input type="number" inputMode="decimal" placeholder={s.unit}
                            value={l.qty || ''} onChange={(e) => setLine(l.key, { qty: +e.target.value })} />
                        </div>
                        {s.coverage && (
                          <div style={{ width: 74 }}>
                            <label>Coats</label>
                            <input type="number" inputMode="numeric" style={{ textAlign: 'center' }}
                              value={l.coats} onChange={(e) => setLine(l.key, { coats: +e.target.value })} />
                          </div>
                        )}
                        <button className="rmdel" style={{ paddingBottom: 14 }}
                          onClick={() => toggle(l.code)}>&times;</button>
                      </div>
                      {s.coverage && (
                        <select style={{ marginTop: 8 }} value={l.product}
                          onChange={(e) => setLine(l.key, { product: e.target.value })}>
                          {products.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
                        </select>
                      )}
                      {s.notes && <div className="t2" style={{ marginTop: 8 }}>{s.notes}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="section-label">Time that is not on a surface</div>
          {([['secondTrip', 'Second trip to stain after drying'],
             ['furniture', 'Move furniture and planters'],
             ['landscape', 'Protect landscaping']] as const).map(([k, l]) => (
            <div className="setting" key={k}>
              <label>{l}</label>
              <button className="chip" data-on={(job as any)[k] ? '1' : '0'}
                onClick={() => set(k as any, !(job as any)[k])}>{(job as any)[k] ? 'Yes' : 'No'}</button>
            </div>
          ))}

          {out && (
            <>
              <button className="acc" onClick={() => setShowDetail(!showDetail)}>
                <span>Breakdown</span>
                <span className="r">{out.totalHours.toFixed(0)} hrs {showDetail ? '\u2212' : '+'}</span>
              </button>
              {showDetail && (
                <div className="field">
                  {out.rows.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 15 }}>
                      <span style={{ color: 'var(--ink-3)' }}>{r.qty} {r.unit} · {r.label}</span>
                      <b>{r.hours.toFixed(1)} hr{r.gallons ? ` · ${r.gallons.toFixed(1)} gal` : ''}</b>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--line)', marginTop: 10, paddingTop: 10 }}>
                    {[['Condition, finish and access', `× ${out.labourMult.toFixed(2)}`],
                      ['Trips and protection', `${out.extras.toFixed(2)} hr`],
                      ['Labor', money(out.laborCost)], ['Material', money(out.materialCost)],
                      ['Direct cost', money(out.direct)], ['Gross profit', money(out.grossProfit)]].map(([l, v]: any) => (
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
              <div className="big">{money(out.price)}</div>
              <div className="r2">
                <span><b>{out.totalHours.toFixed(0)}</b> hrs</span>
                <span><b>{out.totalGallons.toFixed(1)}</b> gal</span>
                {out.perSf > 0 && <span><b>{money(out.perSf)}</b>/sf</span>}
                <span><b>{money(out.effectiveRate)}</b>/hr</span>
              </div>
            </div>
            <button className="btn" onClick={save} disabled={saving || out.totalHours === 0}>Save quote</button>
          </div></div>
        )}
      </div>
    </Chrome>
  );
}

export default function DeckQuote() {
  return <Suspense fallback={null}><DeckQuoteInner /></Suspense>;
}
