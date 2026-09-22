'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { startFlushLoop, pending } from '@/lib/queue';
import { t, useLang } from '@/lib/i18n';
import OfflineBar from '@/components/OfflineBar';
import Chrome from '@/components/Chrome';
import { downloadReminder } from '@/lib/ics';
import { divisionColor } from '@/lib/theme';

type Job = {
  id: string; job_number: number; service_type: string; status: string;
  scheduled_start: string | null; scope_summary: string | null;
  properties: { address_line1: string; city: string } | null;
  contacts: { first_name: string; last_name: string } | null;
};

export default function Today() {
  const router = useRouter();
  const [lang] = useLang();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [queued, setQueued] = useState(0);
  const [qcReady, setQcReady] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<any[]>([]);

  async function loadTodos() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase.from('v_my_followups').select('*')
      .eq('assigned_to', u.user.id)
      .lte('due_at', new Date(Date.now() + 36 * 3600 * 1000).toISOString())
      .limit(20);
    setTodos(data || []);
  }

  async function closeTodo(id: string) {
    await supabase.from('follow_ups').update({ status: 'done' }).eq('id', id);
    setTodos((t) => t.filter((x) => x.id !== id));
  }

  async function snooze(id: string, hours: number) {
    const d = new Date(Date.now() + hours * 3600 * 1000);
    await supabase.from('follow_ups').update({ due_at: d.toISOString() }).eq('id', id);
    loadTodos();
  }

  useEffect(() => {
    startFlushLoop();
    pending().then((p) => setQueued(p.length));
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { router.replace('/login'); return; }
      const { data } = await supabase
        .from('jobs')
        .select('id,job_number,division,service_type,status,scheduled_start,scope_summary,properties(address_line1,city),contacts(first_name,last_name)')
        .in('status', ['scheduled', 'in_progress', 'qc_failed'])
        .order('scheduled_start', { ascending: true });
      setJobs((data as any) || []);
      const { data: open } = await supabase
        .from('time_entries').select('job_id').is('ended_at', null);
      setOpenIds(new Set((open || []).map((r: any) => r.job_id)));
      const { data: cs } = await supabase
        .from('checklist_submissions').select('job_id').is('submitted_at', null);
      setQcReady(new Set((cs || []).map((r: any) => r.job_id)));
      setLoading(false);
      loadTodos();
    })();
  }, [router]);

  return (
    <Chrome>
      <div className="bar">
        <div>
          <h1>{t('todayJobs', lang)}</h1>
          <div className="sub">{new Date().toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US',
            { weekday: 'long', month: 'short', day: 'numeric' })}</div>
        </div>
        <button className="barbtn" onClick={() => router.push('/account')}
          aria-label="Account">Account</button>
      </div>
      <OfflineBar />
      {queued > 0 && <div className="offline">{queued} photo{queued > 1 ? 's' : ''} waiting to send</div>}
      <div className="main">
        {todos.length > 0 && (
          <>
            <div className="section-label">
              Follow up{todos.some((t) => t.overdue) ? ' — some are overdue' : ''}
            </div>
            {todos.map((td) => (
              <div className="lead" key={td.id}
                   style={{ borderLeft: `4px solid ${td.overdue ? 'var(--no)' : 'var(--accent)'}` }}>
                <div className="body">
                  <div className="t1">{td.title}</div>
                  <div className="t2">
                    {[td.about, td.person].filter(Boolean).join(' · ')}
                  </div>
                  <div className="t2" style={{ color: td.overdue ? 'var(--no)' : 'var(--ink-3)',
                                               fontWeight: td.overdue ? 650 : 400, marginTop: 3 }}>
                    {new Date(td.due_at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                    {td.overdue ? ' · overdue' : ''}
                  </div>
                  {td.notes && <div className="t2" style={{ marginTop: 4 }}>{td.notes}</div>}
                  <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 13.5, fontWeight: 650 }}>
                    <button onClick={() => closeTodo(td.id)}>Done</button>
                    <button onClick={() => snooze(td.id, 24)}>Tomorrow</button>
                    <button onClick={() => downloadReminder({
                      title: td.title, when: new Date(td.due_at),
                      notes: td.notes || '', phone: td.phone })}>Add to calendar</button>
                    {td.prospect_id && <button onClick={() => router.push(`/prospects/${td.prospect_id}`)}>Open</button>}
                    {td.lead_id && <button onClick={() => router.push(`/leads/${td.lead_id}`)}>Open</button>}
                  </div>
                </div>
                {td.phone && <a className="callbtn" href={`tel:${td.phone}`}>Call</a>}
              </div>
            ))}
            <div className="section-label">Jobs</div>
          </>
        )}
        {loading ? null : jobs.length === 0 ? (
          <div className="empty">
            <strong>{t('noJobs', lang)}</strong>
            {t('noJobsBody', lang)}
          </div>
        ) : jobs.map((j) => (
          <button key={j.id} className="row" onClick={() => router.push(`/job/${j.id}`)}>
            <div className="t1"><span className="pip" style={{ background: divisionColor((j as any).division) }} />{j.properties?.address_line1 || `Job #${j.job_number}`}</div>
            <div className="t2">
              {j.properties?.city}
              {j.contacts ? ` · ${j.contacts.first_name} ${j.contacts.last_name}` : ''}
            </div>
            {j.scope_summary && <div className="t2">{j.scope_summary}</div>}
            <div className="tagrow">
              <span className="tag">{j.service_type.replace('_', ' ')}</span>
              {openIds.has(j.id) && <span className="tag live">{t('working', lang)}</span>}
              {j.status === 'qc_failed' && <span className="tag due">Needs fixing</span>}
              {qcReady.has(j.id) && <span className="tag">Closeout ready</span>}
            </div>
          </button>
        ))}
      </div>
    </Chrome>
  );
}
