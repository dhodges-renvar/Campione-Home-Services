'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import ProposalSections, { Sections, emptySections } from '@/components/ProposalSections';
import DraftBanner from '@/components/DraftBanner';
import { useAutosave, useRecovered, clearDraft } from '@/lib/draft';
import { accentStyle } from '@/lib/theme';
import { useTradeMargins } from '@/lib/margin';
import { priceSiding, sidingWarnings, newSidingLine, SidingJob, SidingItem } from '@/lib/siding';

const money = (n: any) => '$' + Math.round(Number(n) || 0).toLocaleString();
const CATS: [string, string][] = [
  ['prep', 'Prep and wrap'], ['field', 'Field siding'], ['cornice', 'Cornice'],
  ['soffit', 'Soffit'], ['trim', 'Trim'], ['porch', 'Porch, posts and columns'],
  ['ceiling', 'Ceilings'], ['specialty', 'Specialty'],
];
/* A new house, preloaded — the job Campione actually bids most. */
const STARTER = ['house_wrap', 'board_batten', 'cornice_frieze', 'soffit_hardie',
                 'window_trim_ea', 'corner_single'];

function SidingQuoteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const estimateId = params.get('id');
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState<SidingItem[]>([]);
  const [settings, setSettings] = useState<Record<string, number>>({});
  const { rows: btypes, find: findMargin } = useTradeMargins('siding');
  const [who, setWho] = useState({ name: '', phone: '', address: '', city: '' });
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [saveErr, setSaveErr] = useState('');
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1800); };
  const [sections, setSections] = useState<Sections>(emptySections());

  const [job, setJob] = useState<SidingJob>({
    lines: [], materialBy: 'builder', selfPerform: false, businessType: 'small_builder',
  });
  const set = (k: keyof SidingJob, v: any) => setJob((j) => ({ ...j, [k]: v }));

  useEffect(() => {
    (async () => {
      const [it, bs] = await Promise.all([
        supabase.from('siding_items').select('*').eq('active', true).order('sort_order'),
        supabase.from('business_settings').select('key,value'),
      ]);
      const list = ((it.data as any) || []) as SidingItem[];
      setItems(list);
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
        lines: STARTER.filter((c) => list.some((x) => x.code === c)).map((c) => newSidingLine(c)),
      }));
      setLoaded(true);
    })();
  }, [estimateId]);

  const bt = findMargin(job.businessType);
  const out = useMemo(() => {
    if (!items.length) return null;
    return priceSiding({
      job, items,
      laborRate: settings['loaded_labor_rate'] ?? 35.75,
      margin: Number(bt?.target_margin ?? 0.38),
      minimum: Number(bt?.minimum_charge ?? 750),
    });
  }, [job, items, settings, bt]);

  const warnings = useMemo(
    () => sidingWarnings(job, items, { unvalidatedShare: out?.unvalidatedShare ?? 0, stackedCornice: 0 }),
    [job, items, out]);

  useAutosave('siding', estimateId, { job, who }, loaded);
  const { found, dismiss } = useRecovered<{ job: any; who: any }>('siding', estimateId, loaded);
  const inJob = (code: string) => job.lines.some((l) => l.code === code);

  function toggle(code: string) {
    setJob((j) => inJob(code)
      ? { ...j, lines: j.lines.filter((l) => l.code !== code) }
      : { ...j, lines: [...j.lines, newSidingLine(code)] });
  }
  const setLine = (key: string, patch: any) =>
    setJob((j) => ({ ...j, lines: j.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));

  async function save() {
    setSaving(true);
    const payload = {
      scope_notes: sections.scope || null, exclusions: sections.exclusions || null,
      customer_responsibilities: sections.customer || null, internal_notes_v2: sections.internal || null,
      settings: { trade: 'siding', ...job } as any,
      labor_hours: out!.hours, labor_cost: out!.direct - out!.material,
      material_cost: out!.material,
      direct_cost: out!.direct, target_margin: bt?.target_margin, price: out!.price,
      notes: `Siding — ${money(out!.direct)} cost, `
           + `${Math.round(out!.unvalidatedShare * 100)}% on unquoted rates`,
    };
    if (estimateId) {
      const { error } = await supabase.from('estimates').update(payload).eq('id', estimateId);
      setSaving(false);
      if (error) { setSaveErr(error.message); return; }
      clearDraft('siding', estimateId); setSaveErr(''); flash('Saved');
      return;
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
    const { data: est, error: insErr } = await (supabase.from('estimates').insert({
      contact_id: contactId, property_id: propertyId,
      division: 'exteriors', service_type: 'siding',
      business_type: job.businessType, status: 'draft', ...payload,
    }) as any).select('id').single();
    clearDraft('siding', null);
    setSaving(false);
    if (insErr) { setSaveErr(insErr.message); return; }
    if (est && est.id) { setSaveErr(''); flash('Saved'); router.replace(`/quote/siding?id=${est.id}`); }
  }

  return (
    <Chrome>
      <div style={accentStyle('exteriors')}>
        <div className="bar">
          <button className="back" onClick={() => router.push('/quote')}>{'←'} Quotes</button>
          <div>
            <h1>Siding</h1>
            <div className="sub">{estimateId ? 'Editing a saved quote' : 'Siding, cornice, trim and porch'}</div>
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

          <div className="section-label">How this one is being bought</div>
          <div className="setting">
            <div>
              <label>Customer type</label>
              {bt && <div className="hintl">siding margin {Math.round(bt.target_margin * 100)}%</div>}
            </div>
            <select value={job.businessType} onChange={(e) => set('businessType', e.target.value)}>
              {btypes.map((b) => <option key={b.business_type} value={b.business_type}>{b.label}</option>)}
            </select>
          </div>
          <div className="setting">
            <div>
              <label>Material supplied by</label>
              <div className="hintl">builder on almost every job so far</div>
            </div>
            <select value={job.materialBy} onChange={(e) => set('materialBy', e.target.value)}>
              <option value="builder">Builder / owner</option>
              <option value="campione">Campione</option>
            </select>
          </div>
          <div className="setting">
            <div>
              <label>Who does the work</label>
              <div className="hintl">
                {job.selfPerform ? 'our crew, at our hourly' : 'sub rate card — the normal case'}
              </div>
            </div>
            <button className="chip" data-on={job.selfPerform ? '1' : '0'}
              onClick={() => set('selfPerform', !job.selfPerform)}>
              {job.selfPerform ? 'Our crew' : 'Sub'}
            </button>
          </div>

          {warnings.length > 0 && warnings.map((w, i) => (
            <div key={i} style={{ background: 'var(--amber-bg)', borderLeft: '4px solid var(--amber)',
                                  padding: '12px 20px', fontSize: 14.5, fontWeight: 620, color: 'var(--amber)' }}>
              {w}
            </div>
          ))}

          {CATS.map(([cat, label]) => {
            const inCat = items.filter((s) => s.category === cat);
            const active = job.lines.filter((l) => inCat.some((s) => s.code === l.code));
            if (!inCat.length) return null;
            return (
              <div key={cat}>
                <button className="acc" onClick={() => setOpenCat(openCat === cat ? null : cat)}>
                  <span>{label}</span>
                  <span className="r">{active.length ? `${active.length} on` : 'add'} {openCat === cat ? '−' : '+'}</span>
                </button>
                {openCat === cat && (
                  <div className="chips" style={{ padding: '12px 20px' }}>
                    {inCat.map((s) => (
                      <button key={s.code} className="chip" data-on={inJob(s.code) ? '1' : '0'}
                        onClick={() => toggle(s.code)}
                        title={s.status === 'confirmed' ? 'Quoted by Miguel' : 'Never quoted — built rate'}>
                        {s.label}{s.status === 'confirmed' ? '' : ' · ?'}
                      </button>
                    ))}
                  </div>
                )}
                {active.map((l) => {
                  const s = items.find((x) => x.code === l.code)!;
                  return (
                    <div className="field" key={l.key}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                        <div style={{ flex: 1.4 }}>
                          <label>
                            {s.label}
                            <span style={{ color: s.status === 'confirmed' ? 'var(--yes)' : 'var(--amber)',
                                           fontWeight: 700, marginLeft: 6 }}>
                              ${s.sub_rate}/{s.unit}
                            </span>
                          </label>
                          <input type="number" inputMode="decimal" placeholder={s.unit}
                            value={l.qty || ''} onChange={(e) => setLine(l.key, { qty: +e.target.value })} />
                        </div>
                        <button className="rmdel" style={{ paddingBottom: 14 }}
                          onClick={() => toggle(l.code)}>&times;</button>
                      </div>
                      {s.status !== 'confirmed' && (
                        <div className="t2" style={{ marginTop: 8, color: 'var(--amber)' }}>
                          Built rate — Miguel has never quoted this one.
                        </div>
                      )}
                      {s.notes && <div className="t2" style={{ marginTop: 8 }}>{s.notes}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="section-label">Proposal</div>
          <ProposalSections trade="siding" value={sections} onChange={setSections} />

          {out && (
            <>
              <button className="acc" onClick={() => setShowDetail(!showDetail)}>
                <span>Breakdown</span>
                <span className="r">{money(out.direct)} cost {showDetail ? '−' : '+'}</span>
              </button>
              {showDetail && (
                <div className="field">
                  {out.rows.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 15 }}>
                      <span style={{ color: 'var(--ink-3)' }}>
                        {r.qty} {r.unit} · {r.label}
                        {r.status !== 'confirmed' && <b style={{ color: 'var(--amber)' }}> ?</b>}
                      </span>
                      <b>{money(r.cost)}</b>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--line)', marginTop: 10, paddingTop: 10 }}>
                    {[...(job.materialBy === 'campione' ? [['Material', money(out.material)]] : []),
                      ['Direct cost', money(out.direct)],
                      ['On rates Miguel has quoted',
                       money(out.direct - out.unvalidated)
                         + ` · ${Math.round((1 - out.unvalidatedShare) * 100)}%`],
                      ['On built rates', money(out.unvalidated)
                         + ` · ${Math.round(out.unvalidatedShare * 100)}%`],
                      ['Gross profit', money(out.grossProfit)],
                      ...(out.minimumApplied ? [['Minimum charge applied', money(out.price)]] : []),
                      [job.selfPerform ? 'Same job on the sub card' : 'Same job on our own crew',
                       `${money(out.altDirect)} cost → ${money(out.altPrice)}`],
                      ...(out.hours > 0 ? [['Crew hours behind it', `${out.hours.toFixed(1)} hr`]] : []),
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
              <div className="big">{money(out.price)}</div>
              <div className="r2">
                <span><b>{money(out.direct)}</b> cost</span>
                <span><b>{Math.round((bt?.target_margin ?? 0) * 100)}%</b> margin</span>
                <span style={{ color: out.unvalidatedShare > 0.4 ? 'var(--amber)' : undefined }}>
                  <b>{Math.round(out.unvalidatedShare * 100)}%</b> unquoted
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn ghost" onClick={() => router.push('/quote')}>Done</button>
              <button className="btn" onClick={save} disabled={saving || !(out.price > 0)}>
                {saving ? 'Saving…' : estimateId ? 'Save changes' : 'Save quote'}
              </button>
            </div>
            {!(out.price > 0) && <div className="hint">Enter a measurement before saving</div>}
            {saveErr && <div className="hint" style={{ color: 'var(--no)', fontWeight: 620 }}>Could not save — {saveErr}</div>}
          </div></div>
        )}
        {toast && <div className="saved">{toast}</div>}
      </div>
    </Chrome>
  );
}

export default function SidingQuote() {
  return <Suspense fallback={null}><SidingQuoteInner /></Suspense>;
}
