import { getDb, putFragrance } from '@/db';
import type { Fragrance } from '@/types';

let seeded = false;

export async function ensureSeedLoaded(): Promise<number> {
  if (seeded) return (await getDb()).count('fragrances');
  const count = await (await getDb()).count('fragrances');
  if (count > 100) {
    seeded = true;
    return count;
  }
  const url = `${import.meta.env.BASE_URL}data/fragrances.seed.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load fragrance catalog (${res.status})`);
  const data = await res.json() as { fragrances: Fragrance[] };
  const db = await getDb();
  const tx = db.transaction('fragrances', 'readwrite');
  for (const f of data.fragrances) {
    await tx.store.put(f);
  }
  await tx.done;
  seeded = true;
  return data.fragrances.length;
}

export async function enrichFragranceOnce(f: Fragrance): Promise<Fragrance> {
  await putFragrance(f);
  return f;
}
