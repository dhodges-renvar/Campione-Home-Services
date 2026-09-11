'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import TabBar from './TabBar';
import { startFlushLoop } from '@/lib/queue';

export default function Chrome({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<any>(null);
  const [lang] = useLang();
  useEffect(() => {
    startFlushLoop();
    supabase.from('app_users').select('role').limit(1).maybeSingle()
      .then(({ data }) => setRole(data?.role ?? 'crew_lead'));
  }, []);
  return (
    <div className={role ? 'has-tabs' : ''} style={{ display: 'contents' }}>
      {children}
      {role && <TabBar role={role} lang={lang} />}
    </div>
  );
}
