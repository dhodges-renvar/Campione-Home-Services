'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { compress, enqueue, flush } from '@/lib/queue';
import { t, useLang } from '@/lib/i18n';
import OfflineBar from '@/components/OfflineBar';
import Chrome from '@/components/Chrome';
import { accentStyle } from '@/lib/theme';

type Item = {
  id: string; item_text: string; item_text_es: string | null;
  section: string | null; sort_order: number;
  photo_required_on_no: boolean; photo_always_required: boolean;
};
type Answer = { response: 'yes' | 'no' | 'na'; note?: string; shots: string[] };

export default function QC() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lang] = useLang();
  const [sub, setSub] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [ans, setAns] = useState<Record<string, Answer>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [division, setDivision] = useState<string>('painting');

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from('checklist_submissions')
        .select('*').eq('job_id', id).is('submitted_at', null)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!s) return;
      setSub(s);
      const { data: jb } = await supabase.from('jobs').select('division').eq('id', id).single();
      if (jb?.division) setDivision(jb.division);
      const { data: it } = await supabase.from('checklist_items')
        .select('*').eq('template_id', s.template_id).eq('active', true)
        .order('sort_order');
      setItems((it as any) || []);
    })();
  }, [id]);

  const answered = Object.keys(ans).length;
  const total = items.length;
  const missingPhotos = useMemo(() =>
    items.filter((i) => {
      const a = ans[i.id];
      if (!a) return false;
      const need = (a.response === 'no' && i.photo_required_on_no) || i.photo_always_required;
      return need && a.shots.length === 0;
    }), [ans, items]);

  function setAnswer(item: Item, r: 'yes' | 'no' | 'na') {
    setAns((p) => ({ ...p, [item.id]: { response: r, note: p[item.id]?.note, shots: p[item.id]?.shots || [] } }));
  }

  async function addShot(item: Item, files: FileList | null) {
    if (!files?.length) return;
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const blob = await compress(f);
      urls.push(URL.createObjectURL(blob));
      await enqueue({ blob, jobId: id, submissionId: sub.id, caption: item.item_text, takenAt: new Date().toISOString() });
    }
    setAns((p) => ({ ...p, [item.id]: { ...(p[item.id] || { response: 'no', shots: [] }), shots: [...(p[item.id]?.shots || []), ...urls] } }));
    flush();
  }

  async function submit() {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const rows = items.filter((i) => ans[i.id]).map((i) => ({
      submission_id: sub.id, item_id: i.id,
      response: ans[i.id].response, note: ans[i.id].note || null,
    }));
    await supabase.from('checklist_responses').insert(rows);
    await supabase.from('checklist_submissions').update({
      submitted_by: u.user?.id,
      submitted_at: new Date().toISOString(),
      crew_lead_signed_at: new Date().toISOString(),
    }).eq('id', sub.id);
    await flush();
    setBusy(false); setDone(true);
  }

  if (done) return (
    <Chrome><div style={accentStyle(division)}>
      <div className="bar"><h1>{t('submitted', lang)}</h1></div>
      <div className="empty">
        <strong>{t('submitted', lang)}</strong>
        {lang === 'es' ? 'La oficina lo revisara.' : 'The office will review it.'}
      </div>
      <div className="dock"><div className="inner">
        <button className="btn" onClick={() => router.push('/today')}>{t('todayJobs', lang)}</button>
      </div></div>
    </div></Chrome>
  );

  if (!sub) return (
    <Chrome><div style={accentStyle(division)}>
      <div className="bar">
        <button className="back" onClick={() => router.back()}>{'\u2190'} {t('back', lang)}</button>
      </div>
      <div className="empty"><strong>No checklist yet</strong>The office attaches one when the job is scheduled.</div>
    </div></Chrome>
  );

  let lastSection = '';
  const blocked = missingPhotos.length > 0 || answered < total;

  return (
    <Chrome><div style={accentStyle(division)}>
      <div className="bar">
        <button className="back" onClick={() => router.back()}>{'\u2190'} {t('back', lang)}</button>
        <div>
          <h1>{t('closeout', lang)}</h1>
          <div className="sub">{total - answered} {t('remaining', lang)}</div>
        </div>
      </div>
      <div className="progress"><i style={{ width: `${total ? (answered / total) * 100 : 0}%` }} /></div>
      <OfflineBar />
      <div className="main">
        {items.map((i) => {
          const a = ans[i.id];
          const showDemand = a && ((a.response === 'no' && i.photo_required_on_no) || i.photo_always_required);
          const header = i.section && i.section !== lastSection ? (lastSection = i.section) : null;
          return (
            <div key={i.id}>
              {header && <div className="section-label">{header}</div>}
              <div className="item">
                <div className="txt">
                  {i.item_text}
                  {i.item_text_es && lang === 'es' && <span className="es">{i.item_text_es}</span>}
                  {i.item_text_es && lang === 'en' && <span className="es">{i.item_text_es}</span>}
                </div>
                <div className="choices">
                  <button data-on={a?.response === 'yes' ? 'yes' : undefined}
                    onClick={() => setAnswer(i, 'yes')}>{t('yes', lang)}</button>
                  <button data-on={a?.response === 'no' ? 'no' : undefined}
                    onClick={() => setAnswer(i, 'no')}>{t('no', lang)}</button>
                  <button data-on={a?.response === 'na' ? 'na' : undefined}
                    onClick={() => setAnswer(i, 'na')}>{t('na', lang)}</button>
                </div>
                {showDemand && (
                  <div className="demand">
                    <p>{t('photoNeeded', lang)}</p>
                    <div className="shots">
                      {a.shots.map((u, n) => <img key={n} className="shot" src={u} alt="" />)}
                      <label className="addshot">
                        +
                        <input type="file" accept="image/*" capture="environment" multiple hidden
                          onChange={(e) => addShot(i, e.target.files)} />
                      </label>
                    </div>
                    <textarea className="note" rows={2} placeholder={t('addNote', lang)}
                      value={a.note || ''}
                      onChange={(e) => setAns((p) => ({ ...p, [i.id]: { ...p[i.id], note: e.target.value } }))} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="dock">
        <div className="inner">
          <button className="btn" onClick={submit} disabled={busy || blocked}>
            {t('submit', lang)}
          </button>
          {blocked && (
            <div className="hint">
              {missingPhotos.length > 0 ? t('needPhotos', lang) : `${total - answered} ${t('remaining', lang)}`}
            </div>
          )}
        </div>
      </div>
    </div></Chrome>
  );
}
