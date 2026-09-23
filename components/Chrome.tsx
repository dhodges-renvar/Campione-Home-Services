'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import TabBar from './TabBar';
import { startFlushLoop } from '@/lib/queue';

export default function Chrome({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<any>(null);
  const [lang] = useLang();
  // The dock varies a lot in height — the drywall quote's is three times the
  // height of a plain button. Measure it instead of guessing in CSS, or the
  // last fields on a long form end up underneath it.
  useEffect(() => {
    const root = document.documentElement;
    const measure = () => {
      const dock = document.querySelector('.dock') as HTMLElement | null;
      const tabs = document.querySelector('.tabs') as HTMLElement | null;
      root.style.setProperty('--dock-h', `${dock?.offsetHeight ?? 0}px`);
      root.style.setProperty('--tabs-h', `${tabs?.offsetHeight ?? 0}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    const mo = new MutationObserver(measure);
    const dock = document.querySelector('.dock');
    const tabs = document.querySelector('.tabs');
    if (dock) ro.observe(dock);
    if (tabs) ro.observe(tabs);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect(); mo.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

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
