'use client';
/* Offline photo queue.
   Crews work in basements and rural Walton County. A failed upload that loses
   30 photos ends adoption on day one, so photos go to IndexedDB first and
   upload when signal returns. */
import { supabase } from './supabase';

const DB = 'campione-queue';
const STORE = 'photos';

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains(STORE))
        r.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export type QueuedPhoto = {
  id?: number;
  blob: Blob;
  jobId: string;
  submissionId?: string;
  responseId?: string;
  progressId?: string;
  caption?: string;
  takenAt: string;
};

export async function enqueue(p: QueuedPhoto) {
  const db = await open();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(p);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function pending(): Promise<QueuedPhoto[]> {
  const db = await open();
  return new Promise((res, rej) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result as QueuedPhoto[]);
    req.onerror = () => rej(req.error);
  });
}

async function remove(id: number) {
  const db = await open();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(id);
}

/* Shrink before upload. Crews shoot 40 photos a job; unmanaged that is a
   storage bill and a slow app. */
export async function compress(file: File, maxPx = 1600, quality = 0.72): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxPx / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b!), 'image/jpeg', quality));
}

export async function flush(): Promise<number> {
  if (!navigator.onLine) return 0;
  const items = await pending();
  let sent = 0;
  for (const p of items) {
    try {
      const path = `${p.jobId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const up = await supabase.storage.from('job-photos')
        .upload(path, p.blob, { contentType: 'image/jpeg' });
      if (up.error) continue;
      const { data: u } = await supabase.auth.getUser();
      await supabase.from('photos').insert({
        job_id: p.jobId,
        submission_id: p.submissionId ?? null,
        response_id: p.responseId ?? null,
        progress_id: p.progressId ?? null,
        storage_path: path,
        caption: p.caption ?? null,
        taken_at: p.takenAt,
        uploaded_by: u?.user?.id ?? null,
      });
      if (p.id != null) await remove(p.id);
      sent++;
    } catch { /* keep it queued */ }
  }
  return sent;
}

export function startFlushLoop() {
  const go = () => { flush(); };
  window.addEventListener('online', go);
  setInterval(go, 30000);
  go();
}
