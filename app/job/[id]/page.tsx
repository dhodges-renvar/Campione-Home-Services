'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { compress, enqueue, flush } from '@/lib/queue';
import { t, useLang } from '@/lib/i18n';
import OfflineBar from '@/components/OfflineBar';
import Chrome from '@/components/Chrome';
import { accentStyle } from '@/lib/theme';

export default function JobScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lang] = useLang();
  const [job, setJob] = useState<any>(null);
  const [entry, setEntry] = useState<any>(null);
  const [hours, setHours] = useState(0);
  const [pct, setPct] = useState<number | ''>('');
  const [summary, setSummary] = useState('');
  const [blocker, setBlocker] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: j } = await supabase.from('jobs')
        .select('*,properties(address_line1,city,postal_code),contacts(first_name,last_name,phone)')
        .eq('id', id).single();
      setJob(j);
      const { data: te } = await supabase.from('time_entries')
        .select('*').eq('job_id', id).is('ended_at', null).limit(1).maybeSingle();
      setEntry(te);
      const { data: all } = await supabase.from('time_entries')
        .select('hours').eq('job_id', id).eq('work_date', new Date().toISOString().slice(0, 10));
      setHours((all || []).reduce((s: number, r: any) => s + (r.hours || 0), 0));
    })();
  }, [id]);

  async function toggleClock() {
    const { data: u } = await supabase.auth.getUser();
    if (!entry) {
      const { data } = await supabase.from('time_entries')
        .insert({ job_id: id, user_id: u.user?.id, started_at: new Date().toISOString() })
        .select().single();
      setEntry(data);
      await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', id);
    } else {
      const ended = new Date();
      const h = (ended.getTime() - new Date(entry.started_at).getTime()) / 3600000;
      await supabase.from('time_entries')
        .update({ ended_at: ended.toISOString(), hours: Math.round(h * 100) / 100 })
        .eq('id', entry.id);
      setEntry(null); setHours((x) => x + Math.round(h * 100) / 100);
    }
  }

  async function addProgressPhotos(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const blob = await compress(f);
      await enqueue({ blob, jobId: id, takenAt: new Date().toISOString() });
    }
    flush();
  }

  async function saveProgress() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    await supabase.from('job_progress').insert({
      job_id: id, user_id: u.user?.id,
      percent_complete: pct === '' ? null : Number(pct),
      summary: summary || null, blocker: blocker || null,
    });
    setSaving(false); setSummary(''); setBlocker(''); setPct('');
  }

  if (!job) return null;

  return (
    <Chrome>
      <div style={accentStyle(job.division)}>
      <div className="bar">
        <button className="back" onClick={() => router.push('/today')}>{'\u2190'} {t('back', lang)}</button>
        <div>
          <h1>{job.properties?.address_line1}</h1>
          <div className="sub">{job.properties?.city} · #{job.job_number}</div>
        </div>
      </div>
      <div className="divstrip" />
      <OfflineBar />
      <div className="main">
        <div className="field">
          <label>{t('hoursToday', lang)}</label>
          <div style={{ fontSize: 34, fontWeight: 680, letterSpacing: '-1px' }}>
            {hours.toFixed(1)}
          </div>
        </div>

        <div className="section-label">{t('progressPhotos', lang)}</div>
        <div className="field">
          <input type="file" accept="image/*" capture="environment" multiple
            onChange={(e) => addProgressPhotos(e.target.files)} />
        </div>

        <div className="section-label">Update</div>
        <div className="field">
          <label>Percent complete</label>
          <input type="number" min={0} max={100} inputMode="numeric"
            value={pct} onChange={(e) => setPct(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
        <div className="field" style={{ paddingTop: 0 }}>
          <label>What got done</label>
          <textarea className="note" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
        <div className="field" style={{ paddingTop: 0 }}>
          <label>Anything blocking you</label>
          <textarea className="note" rows={2} value={blocker} onChange={(e) => setBlocker(e.target.value)} />
        </div>
        <div className="field" style={{ paddingTop: 0 }}>
          <button className="btn ghost" onClick={saveProgress}
            disabled={saving || (!summary && !blocker && pct === '')}>Save update</button>
        </div>
      </div>

      <div className="dock">
        <div className="inner">
          <div className="row">
            <button className={entry ? 'btn stop' : 'btn ghost'} onClick={toggleClock}>
              {entry ? t('clockOut', lang) : t('clockIn', lang)}
            </button>
            <button className="btn" onClick={() => router.push(`/job/${id}/qc`)}>
              {t('closeout', lang)}
            </button>
          </div>
        </div>
      </div>
      </div>
    </Chrome>
  );
}
