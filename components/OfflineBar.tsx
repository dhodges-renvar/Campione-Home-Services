'use client';
import { useEffect, useState } from 'react';
import { t, useLang } from '@/lib/i18n';

export default function OfflineBar() {
  const [off, setOff] = useState(false);
  const [lang] = useLang();
  useEffect(() => {
    const u = () => setOff(!navigator.onLine);
    u();
    window.addEventListener('online', u);
    window.addEventListener('offline', u);
    return () => { window.removeEventListener('online', u); window.removeEventListener('offline', u); };
  }, []);
  if (!off) return null;
  return <div className="offline">{t('offline', lang)}</div>;
}
