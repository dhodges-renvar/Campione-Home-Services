'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { startFlushLoop, pending } from '@/lib/queue';
import { t, useLang } from '@/lib/i18n';
import OfflineBar from '@/components/OfflineBar';
import Chrome from '@/components/Chrome';
import { divisionColor } from '@/lib/theme';

type Job = {
  id: string; job_number: number; service_type: string; status: string;
  scheduled_start: string | null; scope_summary: string | null;
  properties: { address_line1: string; city: string } | null;
  contacts: { first_name: string; last_name: string } | null;
};

export default function Today() {
  const router = useRouter();
  const [lang, setLang] = useLang();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [queued, setQueued] = useState(0);
  const [qcReady, setQcReady] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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
        <button className="lang" onClick={() => setLang(lang === 'en' ? 'es' : 'en')}>
          {lang === 'en' ? 'Espanol' : 'English'}
        </button>
      </div>
      <OfflineBar />
      {queued > 0 && <div className="offline">{queued} photo{queued > 1 ? 's' : ''} waiting to send</div>}
      <div className="main">
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
