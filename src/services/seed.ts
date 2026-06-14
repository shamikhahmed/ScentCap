import { getDb, getPreferences, putFragrance, savePreferences } from '@/db';
import type { Fragrance } from '@/types';

const BUNDLED_SEED_VERSION = 2;

let seeded = false;

export async function ensureSeedLoaded(): Promise<number> {
  if (seeded) return (await getDb()).count('fragrances');
  const db = await getDb();
  const count = await db.count('fragrances');
  const prefs = await getPreferences();
  const needsReload = prefs.seedVersion !== BUNDLED_SEED_VERSION;

  if (count > 100 && !needsReload) {
    seeded = true;
    return count;
  }

  const url = `${import.meta.env.BASE_URL}data/fragrances.seed.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load fragrance catalog (${res.status})`);
  const data = await res.json() as { version: number; fragrances: Fragrance[] };

  const tx = db.transaction('fragrances', 'readwrite');
  for (const f of data.fragrances) {
    await tx.store.put(f);
  }
  await tx.done;

  await savePreferences({ ...prefs, seedVersion: BUNDLED_SEED_VERSION });
  seeded = true;
  return data.fragrances.length;
}

export async function enrichFragranceOnce(f: Fragrance): Promise<Fragrance> {
  await putFragrance(f);
  return f;
}
