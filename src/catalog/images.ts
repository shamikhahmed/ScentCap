import { getCachedImage, putCachedImage, touchCachedImage } from '@/db';

const inflight = new Map<string, Promise<string | null>>();
let active = 0;
const queue: Array<() => void> = [];
const MAX_CONCURRENT = 3;

function imageIdFromUrl(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  return `cat-img-${Math.abs(h).toString(36)}`;
}

async function runQueued<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => queue.push(resolve));
  }
  active++;
  try {
    return await fn();
  } finally {
    active--;
    queue.shift()?.();
  }
}

/** Fetch remote bottle art into IndexedDB; return object URL or null. */
export async function ensureCatalogImageBlob(imageUrl: string, preferredId?: string): Promise<string | null> {
  if (!imageUrl || !imageUrl.startsWith('http')) return null;
  const id = preferredId || imageIdFromUrl(imageUrl);

  const existing = await getCachedImage(id);
  if (existing?.blob) {
    await touchCachedImage(id);
    return URL.createObjectURL(existing.blob);
  }

  const pending = inflight.get(id);
  if (pending) return pending;

  const job = runQueued(async () => {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) return null;
      const blob = await res.blob();
      const now = Date.now();
      await putCachedImage({
        id,
        type: 'catalog',
        blob,
        mimeType: blob.type || 'image/jpeg',
        size: blob.size,
        createdAt: now,
        lastUsed: now,
      });
      return URL.createObjectURL(blob);
    } catch {
      return null;
    } finally {
      inflight.delete(id);
    }
  });

  inflight.set(id, job);
  return job;
}
