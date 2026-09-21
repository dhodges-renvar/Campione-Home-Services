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
    (async () => {
      // read the SIGNED-IN user's own row, not whichever row comes first
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setRole('crew_lead'); return; }
      const { data } = await supabase.from('app_users').select('role')
        .eq('id', u.user.id).maybeSingle();
      setRole(data?.role ?? 'crew_lead');
    })();
  }, []);
  return (
    <div className={role ? 'has-tabs' : ''} style={{ display: 'contents' }}>
      {children}
      {role && <TabBar role={role} lang={lang} />}
    </div>
  );
}
