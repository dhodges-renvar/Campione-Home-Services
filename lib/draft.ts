'use client';
/* Nothing should be lost because a phone locked or a thumb hit back.
   Every quote screen writes its working state to this device every few
   seconds. On return the screen offers to pick up where it left off. */
import { useEffect, useRef, useState } from 'react';

const KEY = (trade: string, id?: string | null) => `campione:draft:${trade}:${id ?? 'new'}`;

export type Draft<T> = { at: number; data: T };

export function saveDraft<T>(trade: string, id: string | null, data: T) {
  try {
    localStorage.setItem(KEY(trade, id), JSON.stringify({ at: Date.now(), data }));
  } catch { /* storage full or private mode — not worth failing over */ }
}
export function readDraft<T>(trade: string, id?: string | null): Draft<T> | null {
  try {
    const raw = localStorage.getItem(KEY(trade, id));
    return raw ? (JSON.parse(raw) as Draft<T>) : null;
  } catch { return null; }
}
export function clearDraft(trade: string, id?: string | null) {
  try { localStorage.removeItem(KEY(trade, id)); } catch {}
}

/** Autosave `state` every couple of seconds once it has been touched. */
export function useAutosave<T>(trade: string, id: string | null, state: T, ready: boolean) {
  const first = useRef(true);
  useEffect(() => {
    if (!ready) return;
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => saveDraft(trade, id, state), 1200);
    return () => clearTimeout(t);
  }, [trade, id, state, ready]);
}

/** Was there unfinished work here? Returns it once, then forgets. */
export function useRecovered<T>(trade: string, id: string | null, ready: boolean) {
  const [found, setFound] = useState<Draft<T> | null>(null);
  const checked = useRef(false);
  useEffect(() => {
    if (!ready || checked.current) return;
    checked.current = true;
    const d = readDraft<T>(trade, id);
    // ignore anything older than a week
    if (d && Date.now() - d.at < 7 * 864e5) setFound(d);
  }, [trade, id, ready]);
  return { found, dismiss: () => { clearDraft(trade, id); setFound(null); } };
}

export function whenSaved(at: number) {
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return 'a moment ago';
  if (m < 60) return `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  return `${Math.round(h / 24)} day${h > 23 ? 's' : ''} ago`;
}
