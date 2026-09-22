'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import { useRouter } from 'next/navigation';
import { divisionColor, DIVISION_LABEL } from '@/lib/theme';

type Panel = 'margins' | 'paint' | 'rates' | 'modifiers' | 'business' | 'checklists' | 'people';

const PANELS: [Panel, string, string][] = [
  ['margins',    'Margins & minimums', 'What you charge by customer type'],
  ['paint',      'Paint prices',       'Cost per gallon by product'],
  ['rates',      'Production rates',   'How fast the crews cover ground'],
  ['modifiers',  'Job conditions',     'Prep, coats, access, sheen multipliers'],
  ['business',   'Labor & overhead',   'Hourly cost, mileage, sundries'],
  ['checklists', 'QC checklists',      'What crews check before closing a job'],
  ['people',     'People & access',    'Who can use the app and what they see'],
];

const money = (n: any) => '$' + (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function Setup() {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [toast, setToast] = useState('');
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1600); };

  return (
    <Chrome>
      <div className="bar">
        <div>
          <h1>{panel ? PANELS.find((p) => p[0] === panel)![1] : 'Setup'}</h1>
          <div className="sub">{panel ? 'Changes apply to the next quote' : 'Everything the app runs on'}</div>
        </div>
        {panel && <button className="barbtn" onClick={() => setPanel(null)}>Done</button>}
      </div>

      <div className="main">
        {!panel && PANELS.map(([k, title, sub]) => (
          <button className="row" key={k} onClick={() => setPanel(k)}>
            <div className="t1">{title}</div>
            <div className="t2">{sub}</div>
          </button>
        ))}
        {!panel && (
          <button className="row" onClick={() => router.push('/account')}>
            <div className="t1">My account</div>
            <div className="t2">Who you are signed in as, language, sign out</div>
          </button>
        )}
        {panel === 'margins'    && <Margins flash={flash} />}
        {panel === 'paint'      && <Paint flash={flash} />}
        {panel === 'rates'      && <Rates flash={flash} />}
        {panel === 'modifiers'  && <Mods flash={flash} />}
        {panel === 'business'   && <Business flash={flash} />}
        {panel === 'checklists' && <Checklists flash={flash} />}
        {panel === 'people'     && <People flash={flash} />}
      </div>
      {toast && <div className="saved">{toast}</div>}
    </Chrome>
  );
}

/* ---------- reusable inline number editor ---------- */
function Num({ value, onSave, step = 'any', prefix, suffix, pct }: any) {
  const shown = (x: any) => String(pct ? Math.round(Number(x) * 100) : Number(x));
  const [v, setV] = useState<string>(shown(value));
  useEffect(() => { setV(shown(value)); }, [value, pct]);
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {prefix && <span style={{ color: 'var(--grey)' }}>{prefix}</span>}
      <input type="number" step={step} inputMode="decimal" value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { const n = Number(v); if (!Number.isNaN(n)) onSave(pct ? n / 100 : n); }} />
      {suffix && <span style={{ color: 'var(--grey)' }}>{suffix}</span>}
    </span>
  );
}

function Margins({ flash }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [labor, setLabor] = useState(35.75);
  useEffect(() => {
    supabase.from('business_types').select('*').order('sort_order').then(({ data }) => setRows(data || []));
    supabase.from('business_settings').select('value').eq('key', 'loaded_labor_rate').single()
      .then(({ data }) => data && setLabor(Number(data.value)));
  }, []);
  async function save(code: string, patch: any) {
    await supabase.from('business_types').update(patch).eq('code', code);
    setRows((r) => r.map((x) => (x.code === code ? { ...x, ...patch } : x)));
    flash('Saved');
  }
  return (
    <>
      <div className="section-label">Target margin by customer type</div>
      {rows.map((b) => (
        <div key={b.code}>
          <div className="setting">
            <div>
              <label>{b.label}</label>
              <div className="hintl">bills at {money(labor / (1 - Number(b.target_margin)))}/hr</div>
            </div>
            <Num value={b.target_margin} pct suffix="%" onSave={(v: number) => save(b.code, { target_margin: v })} />
          </div>
          <div className="setting" style={{ paddingLeft: 34 }}>
            <label style={{ fontSize: 14, color: 'var(--grey)' }}>Minimum charge</label>
            <Num value={b.minimum_charge} prefix="$" onSave={(v: number) => save(b.code, { minimum_charge: v })} />
          </div>
        </div>
      ))}
      <div className="field" style={{ background: 'var(--paper)', borderBottom: 'none' }}>
        <div className="hintl">
          Production builder work carries no minimum on purpose — phase tickets run $100–150.
        </div>
      </div>
    </>
  );
}

function Paint({ flash }: any) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { supabase.from('paint_products').select('*').order('sort_order').then(({ data }) => setRows(data || [])); }, []);
  async function save(id: string, patch: any) {
    await supabase.from('paint_products').update(patch).eq('id', id);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x))); flash('Saved');
  }
  return (
    <>
      <div className="section-label">Cost per gallon</div>
      {rows.map((p) => (
        <div className="setting" key={p.id}>
          <div><label>{p.product}</label><div className="hintl">{p.tier}</div></div>
          <Num value={p.cost_per_gallon} prefix="$" onSave={(v: number) => save(p.id, { cost_per_gallon: v })} />
        </div>
      ))}
    </>
  );
}

function Rates({ flash }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [cat, setCat] = useState('interior');
  useEffect(() => { supabase.from('rate_items').select('*').eq('active', true).order('sort_order').then(({ data }) => setRows(data || [])); }, []);
  async function save(id: string, patch: any) {
    await supabase.from('rate_items').update(patch).eq('id', id);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x))); flash('Saved');
  }
  const cats = ['interior', 'exterior', 'cabinets', 'repairs'];
  return (
    <>
      <div className="chips" style={{ padding: '14px 20px' }}>
        {cats.map((c) => (
          <button key={c} className="chip" data-on={cat === c ? '1' : '0'} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      {rows.filter((r) => r.category === cat).map((r) => (
        <div key={r.id}>
          <div className="setting">
            <div><label>{r.label}</label><div className="hintl">{r.unit} per hour, per coat</div></div>
            <Num value={r.production_rate} onSave={(v: number) => save(r.id, { production_rate: v })} />
          </div>
          {r.coverage != null && (
            <div className="setting" style={{ paddingLeft: 34 }}>
              <label style={{ fontSize: 14, color: 'var(--grey)' }}>{r.unit} per gallon</label>
              <Num value={r.coverage} onSave={(v: number) => save(r.id, { coverage: v })} />
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function Mods({ flash }: any) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { supabase.from('modifiers').select('*').order('group_code').order('sort_order').then(({ data }) => setRows(data || [])); }, []);
  async function save(id: string, v: number) {
    await supabase.from('modifiers').update({ multiplier: v }).eq('id', id);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, multiplier: v } : x))); flash('Saved');
  }
  const groups = Array.from(new Set(rows.map((r) => r.group_code)));
  return (
    <>
      {groups.map((g) => (
        <div key={g}>
          <div className="section-label">{g.replace(/_/g, ' ')}</div>
          {rows.filter((r) => r.group_code === g).map((r) => (
            <div className="setting" key={r.id}>
              <div><label>{r.label}</label>{r.notes && <div className="hintl">{r.notes}</div>}</div>
              <Num value={r.multiplier} step="0.01" onSave={(v: number) => save(r.id, v)} />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function Business({ flash }: any) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { supabase.from('business_settings').select('*').then(({ data }) => setRows(data || [])); }, []);
  async function save(key: string, v: number) {
    await supabase.from('business_settings').update({ value: v }).eq('key', key);
    setRows((r) => r.map((x) => (x.key === key ? { ...x, value: v } : x))); flash('Saved');
  }
  return (
    <>
      <div className="section-label">What an hour actually costs</div>
      {rows.map((s) => (
        <div className="setting" key={s.key}>
          <div><label>{s.label}</label>{s.notes && <div className="hintl">{s.notes}</div>}</div>
          <Num value={s.value} step="0.001" onSave={(v: number) => save(s.key, v)} />
        </div>
      ))}
    </>
  );
}

function Checklists({ flash }: any) {
  const [tpl, setTpl] = useState<any[]>([]);
  const [sel, setSel] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [adding, setAdding] = useState('');
  useEffect(() => {
    supabase.from('checklist_templates').select('*').eq('active', true).order('code')
      .then(({ data }) => { setTpl(data || []); if (data?.[0]) setSel(data[0].id); });
  }, []);
  useEffect(() => {
    if (!sel) return;
    supabase.from('checklist_items').select('*').eq('template_id', sel).order('sort_order')
      .then(({ data }) => setItems(data || []));
  }, [sel]);
  async function save(id: string, patch: any) {
    await supabase.from('checklist_items').update(patch).eq('id', id);
    setItems((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x))); flash('Saved');
  }
  async function add() {
    if (!adding.trim()) return;
    const { data } = await supabase.from('checklist_items')
      .insert({ template_id: sel, item_text: adding.trim(), sort_order: items.length + 1 })
      .select().single();
    if (data) setItems((r) => [...r, data]);
    setAdding(''); flash('Added');
  }
  async function remove(id: string) {
    await supabase.from('checklist_items').update({ active: false }).eq('id', id);
    setItems((r) => r.filter((x) => x.id !== id)); flash('Removed');
  }
  return (
    <>
      <div className="field">
        <label>Checklist</label>
        <select value={sel} onChange={(e) => setSel(e.target.value)}>
          {tpl.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      {items.map((i) => (
        <div className="field" key={i.id}>
          <textarea rows={2} defaultValue={i.item_text} onBlur={(e) => save(i.id, { item_text: e.target.value })} />
          <textarea rows={1} placeholder="Espanol" defaultValue={i.item_text_es || ''}
            style={{ marginTop: 8, color: 'var(--grey)' }}
            onBlur={(e) => save(i.id, { item_text_es: e.target.value })} />
          <div style={{ display: 'flex', gap: 14, marginTop: 10, alignItems: 'center' }}>
            <button className="chip" data-on={i.photo_required_on_no ? '1' : '0'}
              onClick={() => save(i.id, { photo_required_on_no: !i.photo_required_on_no })}>
              Photo if No
            </button>
            <button className="rmdel" style={{ marginLeft: 'auto' }} onClick={() => remove(i.id)}>Remove</button>
          </div>
        </div>
      ))}
      <div className="field">
        <label>Add an item</label>
        <textarea rows={2} value={adding} onChange={(e) => setAdding(e.target.value)} />
        <button className="btn ghost" style={{ marginTop: 12 }} onClick={add} disabled={!adding.trim()}>Add</button>
      </div>
    </>
  );
}

function People({ flash }: any) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { supabase.from('app_users').select('*').order('full_name').then(({ data }) => setRows(data || [])); }, []);
  async function save(id: string, patch: any) {
    await supabase.from('app_users').update(patch).eq('id', id);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x))); flash('Saved');
  }
  const ROLES = ['owner', 'admin', 'estimator', 'crew_lead', 'sub', 'viewer'];
  return (
    <>
      <div className="section-label">Who can use the app</div>
      {rows.map((u) => (
        <div className="setting" key={u.id}>
          <div>
            <label>{u.full_name}</label>
            <div className="hintl">{u.email}{u.sub_company ? ` · ${u.sub_company}` : ''}</div>
          </div>
          <select value={u.role} onChange={(e) => save(u.id, { role: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
        </div>
      ))}
      <div className="field" style={{ background: 'var(--paper)' }}>
        <div className="hintl">
          To add someone: Supabase → Authentication → Add user. They appear here automatically
          as a crew lead, then set their role above.
        </div>
      </div>
    </>
  );
}
