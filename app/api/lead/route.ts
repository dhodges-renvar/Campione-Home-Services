import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Payload = Record<string, string | undefined>;

const FIELDS = [
  'first_name',
  'last_name',
  'phone',
  'email',
  'address',
  'city',
  'zip',
  'division',
  'service',
  'message',
  'business_type',
  'page',
] as const;

const clean = (v: unknown, max = 2000) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

async function toSupabase(body: Payload) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, reason: 'not_configured' as const };

  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/intake_web_lead`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ p: body }),
    cache: 'no-store',
  });

  if (!res.ok) {
    return { ok: false, reason: 'rejected' as const, detail: await res.text() };
  }
  return { ok: true as const };
}

async function toEmail(body: Payload) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_TO;
  const from = process.env.LEAD_NOTIFY_FROM;
  if (!key || !to || !from) return { ok: false, reason: 'not_configured' as const };

  const rows = FIELDS.filter((f) => body[f])
    .map((f) => `<tr><td style="padding:4px 12px 4px 0;color:#7a828a">${f}</td><td><b>${body[f]}</b></td></tr>`)
    .join('');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from,
      to: to.split(',').map((s) => s.trim()),
      subject: `New website lead — ${body.first_name || 'unknown'} (${body.division || 'general'})`,
      html: `<h2 style="font-family:system-ui">New lead from ${SITE.url}</h2>
<p style="font-family:system-ui">Call them back today. Speed to lead is the whole game.</p>
<table style="font-family:system-ui;font-size:14px;border-collapse:collapse">${rows}</table>`,
    }),
    cache: 'no-store',
  });

  if (!res.ok) return { ok: false, reason: 'rejected' as const, detail: await res.text() };
  return { ok: true as const };
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request.' }, { status: 400 });
  }

  const input = (raw ?? {}) as Record<string, unknown>;

  // --- spam traps -----------------------------------------------------------
  // 1. a hidden field no human ever fills in
  if (clean(input.company_website)) {
    return NextResponse.json({ ok: true, trapped: true });
  }
  // 2. nobody completes a real estimate request in under three seconds
  const started = Number(input.t0);
  if (Number.isFinite(started) && Date.now() - started < 2500) {
    return NextResponse.json({ ok: true, trapped: true });
  }

  const body: Payload = {};
  for (const f of FIELDS) body[f] = clean(input[f], f === 'message' ? 4000 : 200);

  // --- validation -----------------------------------------------------------
  if (!body.first_name) {
    return NextResponse.json({ ok: false, error: 'Please tell us your name.' }, { status: 422 });
  }
  const digits = (body.phone || '').replace(/\D/g, '');
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(body.email || '');
  if (digits.length < 10 && !emailOk) {
    return NextResponse.json(
      { ok: false, error: 'We need a phone number or an email address to reach you.' },
      { status: 422 }
    );
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '';
  body.ip_hash = ip ? createHash('sha256').update(ip).digest('hex').slice(0, 32) : '';
  body.user_agent = clean(req.headers.get('user-agent'), 300);

  const [db, mail] = await Promise.all([toSupabase(body), toEmail(body)]);

  if (!db.ok && !mail.ok) {
    console.error('[lead] not delivered', { db, mail, name: body.first_name });
    return NextResponse.json(
      {
        ok: false,
        error: `Something went wrong on our end and we do not want to lose your request. Please call or text ${SITE.phone}.`,
      },
      { status: 502 }
    );
  }

  if (!db.ok) console.error('[lead] stored by email only', db);
  if (!mail.ok && mail.reason === 'rejected') console.error('[lead] email failed', mail);

  return NextResponse.json({ ok: true });
}
