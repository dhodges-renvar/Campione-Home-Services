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
    <div className="auth">
      <div className="brandblock">
        <Mark size={86} outer="#F7F4EF" inner="#8B939B" />
        <div className="wordmark">CAMPIONE</div>
        <div className="tagline">Home Services</div>
      </div>

      <label htmlFor="e">{t('email', lang)}</label>
      <input id="e" type="email" inputMode="email" autoCapitalize="none" autoComplete="username"
        value={email} onChange={(e) => setEmail(e.target.value)} />

      <label htmlFor="p">{t('password', lang)}</label>
      <input id="p" type="password" autoComplete="current-password"
        value={pw} onChange={(e) => setPw(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && go()} />

      {err && <div className="err">{err}</div>}

      <button className="go" onClick={go} disabled={busy || !email || !pw}>
        {busy ? '…' : t('signIn', lang)}
      </button>

      <button className="lang" onClick={() => setLang(lang === 'en' ? 'es' : 'en')}>
        {lang === 'en' ? 'Ver en espanol' : 'View in English'}
      </button>
    </div>
  );
}
