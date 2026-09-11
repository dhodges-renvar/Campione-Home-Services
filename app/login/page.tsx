'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Mark from '@/components/Mark';
import { t, useLang } from '@/lib/i18n';

export default function Login() {
  const router = useRouter();
  const [lang, setLang] = useLang();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.replace('/today');
  }

  return (
    <>
      <div className="bar">
        <h1>Campione</h1>
        <button className="lang" onClick={() => setLang(lang === 'en' ? 'es' : 'en')}>
          {lang === 'en' ? 'Espanol' : 'English'}
        </button>
      </div>
      <div className="main" style={{ paddingTop: 56 }}>
        <Mark size={64} />
        <div className="field">
          <label htmlFor="e">{t('email', lang)}</label>
          <input id="e" type="email" inputMode="email" autoCapitalize="none" autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field" style={{ paddingTop: 0 }}>
          <label htmlFor="p">{t('password', lang)}</label>
          <input id="p" type="password" autoComplete="current-password"
            value={pw} onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()} />
        </div>
        {err && <div className="err">{err}</div>}
      </div>
      <div className="dock">
        <div className="inner">
          <button className="btn" onClick={go} disabled={busy || !email || !pw}>
            {t('signIn', lang)}
          </button>
        </div>
      </div>
    </>
  );
}
