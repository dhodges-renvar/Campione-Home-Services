'use client';
import { whenSaved } from '@/lib/draft';

export default function DraftBanner({ at, onRestore, onDiscard }:
  { at: number; onRestore: () => void; onDiscard: () => void }) {
  return (
    <div style={{ background: 'var(--amber-bg)', borderTop: '3px solid var(--amber)',
                  borderBottom: '1px solid var(--line)', padding: '14px 20px' }}>
      <div style={{ fontSize: 15, fontWeight: 680, color: 'var(--amber)' }}>
        You have unfinished work here
      </div>
      <div className="t2" style={{ marginTop: 3 }}>Last change {whenSaved(at)}.</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button className="btn" style={{ minHeight: 46 }} onClick={onRestore}>Pick up where I left off</button>
        <button className="btn ghost" style={{ minHeight: 46 }} onClick={onDiscard}>Start fresh</button>
      </div>
    </div>
  );
}
