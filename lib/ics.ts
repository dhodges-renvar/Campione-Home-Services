'use client';
/* Download a calendar event with an alarm.
   On iPhone this opens the Calendar import sheet, so Jorge gets a real
   reminder on his own phone. The database follow-up is still the source of
   truth — this is a convenience for whoever taps it. */

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
  `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
const esc = (s: string) =>
  (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

export function downloadReminder(opts: {
  title: string; when: Date; minutes?: number; notes?: string; phone?: string;
}) {
  const { title, when, minutes = 30, notes = '', phone } = opts;
  const end = new Date(when.getTime() + 15 * 60000);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@campionehomeservices.com`;
  const body = [notes, phone ? `Phone: ${phone}` : ''].filter(Boolean).join('\n');

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Campione//Field//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(when)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(title)}`,
    body ? `DESCRIPTION:${esc(body)}` : '',
    'BEGIN:VALARM',
    `TRIGGER:-PT${minutes}M`,
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)}`,
    'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^\w ]/g, '').slice(0, 40) || 'reminder'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
