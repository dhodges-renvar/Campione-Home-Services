'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Chrome from '@/components/Chrome';
import Mark from '@/components/Mark';
import { useLang, t } from '@/lib/i18n';
import { pending } from '@/lib/queue';

export default function Account() {
  const router = useRouter();
  const [lang, setLang] = useLang();
  const [me, setMe] = useState<any>(null);
  const [counts, setCounts] = useState<any>({});
  const [queued, setQueued] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { router.replace('/login'); return; }
      const { data: row } = await supabase.from('app_users')
        .select('full_name,role,email,sub_company').eq('id', u.user.id).maybeSingle();
      setMe({ email: u.user.email, hasRow: !!row, ...(row || {}) });
      const c: any = {};
      for (const tbl of ['jobs', 'leads', 'prospects', 'estimates']) {
        const { count, error } = await supabase.from(tbl).select('id', { count: 'exact', head: true });
        c[tbl] = error ? '—' : count;
      }
      setCounts(c);
      pending().then((p) => setQueued(p.length));
    })();
  }, [router]);

  async function signOut() {
    if (queued > 0 && !confirm(
      `${queued} photo${queued > 1 ? 's have' : ' has'} not uploaded yet. They are saved on this phone and will send next time you sign in. Sign out anyway?`
    )) return;
    setBusy(true);
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (!me) return null;
  const initials = (me.full_name || me.email || '?')
    .split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s: string) => s[0]).join('').toUpperCase();

  return (
    <Chrome>
      <div className="bar">
        <button className="back" onClick={() => router.back()}>{'\u2190'} {t('back', lang)}</button>
        <div><h1>{lang === 'es' ? 'Mi cuenta' : 'Account'}</h1></div>
      </div>

      <div className="main">
        <div style={{ textAlign: 'center', padding: '30px 20px 22px', background: 'var(--surface)',
                      borderBottom: '1px solid var(--line)' }}>
          <div style={{ width: 74, height: 74, borderRadius: '50%', background: 'var(--ink)',
                        color: 'var(--paper)', margin: '0 auto 14px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--serif)', fontSize: 27 }}>{initials}</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 21 }}>{me.full_name || me.email}</div>
          <div className="t2" style={{ marginTop: 4 }}>{me.email}</div>
          <div style={{ marginTop: 10 }}>
            <span className={`sla ${me.hasRow ? 'ok' : 'bad'}`}>
              {me.hasRow ? me.role.replace('_', ' ') : 'no access yet'}
            </span>
          </div>
          {me.sub_company && <div className="t2" style={{ marginTop: 8 }}>{me.sub_company}</div>}
        </div>

        {!me.hasRow && (
          <div className="field" style={{ background: 'var(--no-bg)' }}>
            <div style={{ color: 'var(--no)', fontWeight: 650, fontSize: 14.5 }}>
              Your account has not been set up yet. Ask an owner to give you access
              under Setup, People &amp; access.
            </div>
          </div>
        )}

        <div className="setting">
          <label>{lang === 'es' ? 'Idioma' : 'Language'}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="chip" data-on={lang === 'en' ? '1' : '0'} onClick={() => setLang('en')}>English</button>
            <button className="chip" data-on={lang === 'es' ? '1' : '0'} onClick={() => setLang('es')}>Espanol</button>
          </div>
        </div>

        <div className="section-label">{lang === 'es' ? 'Lo que puedes ver' : 'What you can see'}</div>
        <div className="field">
          <div className="t2">
            {counts.jobs ?? '…'} jobs · {counts.leads ?? '…'} leads ·
            {' '}{counts.prospects ?? '…'} builders · {counts.estimates ?? '…'} quotes
          </div>
          {queued > 0 && (
            <div className="t2" style={{ color: 'var(--amber)', fontWeight: 620, marginTop: 8 }}>
              {queued} photo{queued > 1 ? 's' : ''} waiting to upload
            </div>
          )}
        </div>

        <div className="section-label">App</div>
        <div className="field">
          <div className="t2">
            Build {process.env.NEXT_PUBLIC_BUILD} · {process.env.NEXT_PUBLIC_BUILT_AT} UTC
          </div>
          <div className="t2" style={{ marginTop: 6 }}>
            If something looks out of date, close the app fully and reopen it.
          </div>
        </div>

        <div className="field" style={{ background: 'var(--paper)', borderBottom: 'none', paddingTop: 26 }}>
          <button className="btn stop" onClick={signOut} disabled={busy}>
            {lang === 'es' ? 'Cerrar sesion' : 'Sign out'}
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '28px 20px 10px', opacity: 0.35 }}>
          <Mark size={38} />
        </div>
      </div>
    </Chrome>
  );
}
