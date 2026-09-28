'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import { divisionColor, DIVISION_LABEL } from '@/lib/theme';

const money = (n: any) => '$' + Math.round(Number(n) || 0).toLocaleString();
const num = (n: any, d = 0) => (Number(n) || 0).toFixed(d);

export default function Dashboard() {
  const router = useRouter();
  const [period, setPeriod] = useState('month');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const PERIODS: [string, string, number][] = [
    ['today', 'Today', 1], ['week', 'Week', 7], ['month', 'Month', 30],
    ['quarter', 'Quarter', 91], ['ytd', 'YTD', 0], ['custom', 'Custom', 0],
  ];
  const daysFor = () => {
    if (period === 'ytd') {
      const jan = new Date(new Date().getFullYear(), 0, 1);
      return Math.max(1, Math.ceil((Date.now() - jan.getTime()) / 864e5));
    }
    if (period === 'custom') {
      if (!custom.from) return 30;
      const from = new Date(custom.from).getTime();
      const to = custom.to ? new Date(custom.to).getTime() : Date.now();
      return Math.max(1, Math.ceil((to - from) / 864e5));
    }
    return PERIODS.find((p) => p[0] === period)?.[2] ?? 30;
  };
  const days = daysFor();
  const [k, setK] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [live, setLive] = useState<any[]>([]);
  const [appts, setAppts] = useState<any[]>([]);
  const [qc, setQc] = useState<any[]>([]);
  const [pl, setPl] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc('dashboard_kpis', { p_days: days }).then(({ data }) => setK(data?.[0] ?? null));
  }, [days]);

  useEffect(() => {
    supabase.from('v_quotes_detail').select('*').in('status', ['sent', 'viewed'])
      .order('price', { ascending: false }).limit(25).then(({ data }) => setQuotes(data || []));
    supabase.from('v_jobs_live').select('*').in('status', ['in_progress', 'scheduled'])
      .order('scheduled_start').limit(25).then(({ data }) => setLive(data || []));
    supabase.from('v_appointments_upcoming').select('*').limit(10).then(({ data }) => setAppts(data || []));
    supabase.from('v_qc_exceptions').select('*').limit(10).then(({ data }) => setQc(data || []));
    supabase.from('v_division_pl').select('*').then(({ data }) => setPl(data || []));
    supabase.from('v_my_followups').select('*').eq('overdue', true).limit(15)
      .then(({ data }) => setOverdue(data || []));
  }, []);

  const Tile = ({ label, value, sub, tone, onClick }: any) => (
    <button className="tile" data-tone={tone} onClick={onClick} disabled={!onClick}>
      <span className="tv">{value}</span>
      <span className="tl">{label}</span>
      {sub && <span className="ts">{sub}</span>}
    </button>
  );

  const Section = ({ id, title, count, children }: any) => (
    <>
      <button className="acc" onClick={() => setOpen(open === id ? null : id)}>
        <span>{title}</span>
        <span className="r">{count}{open === id ? '  \u2212' : '  +'}</span>
      </button>
      {open === id && <div>{children}</div>}
    </>
  );

  return (
    <Chrome>
      <div className="bar">
        <div>
          <h1>Numbers</h1>
          <div className="sub">
            {period === 'today' ? 'Today'
              : period === 'ytd' ? `Year to date · ${days} days`
              : period === 'custom' && custom.from ? `${custom.from} to ${custom.to || 'today'}`
              : `Last ${days} days`}
          </div>
        </div>

      </div>

      <div className="chips" style={{ padding: '14px 20px 0' }}>
        {PERIODS.map(([v, l]) => (
          <button key={v} className="chip" data-on={period === v ? '1' : '0'}
            onClick={() => setPeriod(v)}>{l}</button>
        ))}
      </div>
      {period === 'custom' && (
        <div className="field">
          <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div><label>From</label><input type="date" value={custom.from}
              onChange={(e) => setCustom({ ...custom, from: e.target.value })} /></div>
            <div><label>To</label><input type="date" value={custom.to}
              onChange={(e) => setCustom({ ...custom, to: e.target.value })} /></div>
          </div>
        </div>
      )}

      <div className="main">
        {qc.length > 0 && (
          <div className="alert">
            {qc.length} job{qc.length === 1 ? '' : 's'} failed quality control
          </div>
        )}
        {overdue.length > 0 && (
          <button className="alert warn" onClick={() => router.push('/today')}>
            {overdue.length} follow-up{overdue.length === 1 ? '' : 's'} past due
          </button>
        )}
        {k && Number(k.leads_uncontacted) > 0 && (
          <button className="alert warn" onClick={() => router.push('/leads')}>
            {k.leads_uncontacted} lead{Number(k.leads_uncontacted) === 1 ? '' : 's'} nobody has called yet
          </button>
        )}

        {!k ? null : (
          <>
            <div className="tiles">
              <Tile label="New B2C leads" value={k.leads_new}
                sub={k.median_response_min != null ? `${num(k.median_response_min)}m to first call` : 'no responses yet'}
                tone={Number(k.leads_uncontacted) > 0 ? 'warn' : ''} onClick={() => router.push('/leads')} />
              <Tile label="Appointments" value={k.appts_booked} sub={`${k.appts_upcoming} upcoming`} />
              <Tile label="Close rate" value={`${num(k.close_rate_pct, 0)}%`} sub={`${k.quotes_won} of ${Number(k.quotes_won) + (Number(k.quotes_sent) - Number(k.quotes_won))} decided`} />
              <Tile label="Quoted" value={money(k.quoted_dollars)} sub={`${k.quotes_sent} quotes · ${money(k.avg_quote)} avg`} />
              <Tile label="Won" value={money(k.won_dollars)} sub={`${k.quotes_won} jobs sold`} tone="good" />
              <Tile label="Open pipeline" value={money(k.pipeline_dollars)} sub={`${k.pipeline_open} waiting on an answer`} />
              <Tile label="In progress" value={k.jobs_in_progress} sub={`${k.jobs_scheduled} scheduled next`} />
              <Tile label="Completed" value={k.jobs_completed} sub={money(k.completed_dollars)} />
              <Tile label="Hours logged" value={num(k.hours_logged, 0)} sub={`${num(Number(k.hours_logged) / 8, 1)} man days`} />
            </div>

            <Section id="pipeline" title="Quotes waiting on an answer" count={money(k.pipeline_dollars)}>
              {quotes.map((q) => (
                <div className="lead" key={q.id}>
                  <div className="body">
                    <div className="t1">{money(q.price)} · {q.customer?.trim() || 'No name'}</div>
                    <div className="t2">{q.address_line1}{q.city ? `, ${q.city}` : ''}</div>
                    <div className="t2">
                      {q.service_type?.replace('_', ' ')} · {q.business_type?.replace('_', ' ')}
                      {q.days_out != null && ` · out ${q.days_out}d`}
                      {q.gross_profit != null && ` · ${money(q.gross_profit)} profit`}
                    </div>
                  </div>
                  <span className={`sla ${q.days_out > 14 ? 'bad' : q.days_out > 7 ? 'warn' : 'ok'}`}>
                    {q.status}
                  </span>
                </div>
              ))}
            </Section>

            <Section id="jobs" title="Jobs running" count={live.length}>
              {live.map((j) => (
                <div className="lead" key={j.id}>
                  <div className="body">
                    <div className="t1">
                      <span className="pip" style={{ background: divisionColor(j.division) }} />
                      {j.address_line1 || `Job #${j.job_number}`}
                    </div>
                    <div className="t2">{j.customer?.trim()} · {j.sub_company || j.crew_lead || 'unassigned'}</div>
                    <div className="t2">
                      {money(j.contract_price)}
                      {j.percent_complete != null && ` · ${j.percent_complete}% done`}
                      {j.hours_ratio != null && ` · ${Math.round(j.hours_ratio * 100)}% of estimated hours`}
                    </div>
                  </div>
                  <span className={`sla ${j.hours_ratio > 1 ? 'bad' : j.status === 'in_progress' ? 'ok' : ''}`}>
                    {j.status === 'in_progress' ? 'running' : 'scheduled'}
                  </span>
                </div>
              ))}
            </Section>

            <Section id="appts" title="On the calendar" count={appts.length}>
              {appts.map((a) => (
                <div className="lead" key={a.id}>
                  <div className="body">
                    <div className="t1">{new Date(a.starts_at).toLocaleString([], {
                      weekday: 'short', hour: 'numeric', minute: '2-digit' })}</div>
                    <div className="t2">{a.customer?.trim()} · {a.address}</div>
                    <div className="t2">{a.kind} · {a.assigned_to || 'unassigned'}</div>
                  </div>
                  {a.phone && <a className="callbtn" href={`tel:${a.phone}`}>Call</a>}
                </div>
              ))}
            </Section>

            <Section id="qc" title="Quality control misses" count={qc.length}>
              {qc.map((q) => (
                <div className="lead" key={q.id}>
                  <div className="body">
                    <div className="t1">{q.address_line1 || `Job #${q.job_number}`}</div>
                    <div className="t2">{q.sub_company || q.submitted_by} · {q.fail_count} item{q.fail_count === 1 ? '' : 's'} failed</div>
                  </div>
                  <span className="sla bad">failed</span>
                </div>
              ))}
            </Section>

            <Section id="fu" title="Follow-ups past due" count={overdue.length}>
              {overdue.map((o) => (
                <div className="lead" key={o.id}>
                  <div className="body">
                    <div className="t1">{o.title}</div>
                    <div className="t2">{[o.about, o.assigned_name].filter(Boolean).join(' · ')}</div>
                    <div className="t2">
                      due {new Date(o.due_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric' })}
                    </div>
                  </div>
                  <span className="sla bad">late</span>
                </div>
              ))}
            </Section>

            <Section id="div" title="By division" count={pl.length}>
              {pl.map((d) => (
                <div className="lead" key={d.division}>
                  <div className="body">
                    <div className="t1">
                      <span className="pip" style={{ background: divisionColor(d.division) }} />
                      {DIVISION_LABEL[d.division] || d.division}
                    </div>
                    <div className="t2">
                      {d.jobs_complete || 0} jobs · {money(d.revenue)}
                      {d.avg_margin != null && ` · ${Math.round(d.avg_margin * 100)}% margin`}
                    </div>
                  </div>
                </div>
              ))}
            </Section>
          </>
        )}
      </div>
    </Chrome>
  );
}
