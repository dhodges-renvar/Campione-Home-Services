'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { downloadReminder } from '@/lib/ics';

type Props = {
  prospectId?: string; leadId?: string; jobId?: string;
  personId?: string; defaultTitle: string; phone?: string;
  onSaved: () => void;
};

const QUICK: [string, number][] = [
  ['Tomorrow 9am', 1], ['In 3 days', 3], ['Next week', 7], ['In 2 weeks', 14],
];

function atHour(daysOut: number, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() + daysOut);
  d.setHours(hour, 0, 0, 0);
  return d;
}
const localValue = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function FollowUpForm({ prospectId, leadId, jobId, personId,
                                       defaultTitle, phone, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState(localValue(atHour(1)));
  const [title, setTitle] = useState(defaultTitle);
  const [notes, setNotes] = useState('');
  const [people, setPeople] = useState<any[]>([]);
  const [assignee, setAssignee] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from('app_users').select('id,full_name,role')
        .in('role', ['owner', 'admin', 'estimator']).order('full_name');
      setPeople(data || []);
      setAssignee(u.user?.id ?? (data?.[0]?.id ?? ''));
    })();
  }, [open]);

  async function save(alsoCalendar: boolean) {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const due = new Date(when);
    await supabase.from('follow_ups').insert({
      title: title.trim() || defaultTitle,
      due_at: due.toISOString(),
      assigned_to: assignee || u.user?.id,
      created_by: u.user?.id,
      prospect_id: prospectId ?? null,
      prospect_contact_id: personId ?? null,
      lead_id: leadId ?? null,
      job_id: jobId ?? null,
      notes: notes || null,
    });
    if (alsoCalendar) {
      downloadReminder({ title: title.trim() || defaultTitle, when: due, notes, phone });
    }
    setBusy(false); setOpen(false); setNotes(''); onSaved();
  }

  if (!open) return (
    <div className="field">
      <button className="btn ghost" onClick={() => setOpen(true)}>Schedule a callback</button>
    </div>
  );

  return (
    <div className="field" style={{ background: 'var(--paper)' }}>
      <label>What and when</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="chips" style={{ marginTop: 10 }}>
        {QUICK.map(([lbl, d]) => (
          <button key={lbl} className="chip" onClick={() => setWhen(localValue(atHour(d)))}>{lbl}</button>
        ))}
      </div>
      <input type="datetime-local" style={{ marginTop: 10 }}
        value={when} onChange={(e) => setWhen(e.target.value)} />

      <label style={{ marginTop: 14 }}>Who does it</label>
      <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
        {people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
      </select>

      <textarea className="note" rows={2} placeholder="What he said"
        value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn" onClick={() => save(false)} disabled={busy}>Save</button>
      </div>
      <button className="btn ghost" style={{ marginTop: 10 }}
        onClick={() => save(true)} disabled={busy}>
        Save and add to my phone calendar
      </button>
      <div className="t2" style={{ marginTop: 8 }}>
        The reminder shows on the assigned person&apos;s Today screen either way.
      </div>
    </div>
  );
}
