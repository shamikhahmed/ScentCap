import { getDb, getAllCollection, getPreferences, getWishlist, putFragrance, savePreferences } from '@/db';
import { enrichFragranceFromOnline } from '@/services/onlineCatalog';
import { needsCatalogImageRefresh } from '@/lib/catalogImage';
import type { Fragrance } from '@/types';

/** v3: no bundled seed — catalog is built from live Fraganty API + user cache. */
const CATALOG_VERSION = 3;

let seeded = false;

async function referencedFragranceIds(): Promise<Set<string>> {
  const db = await getDb();
  const ids = new Set<string>();
  for (const c of await getAllCollection()) ids.add(c.fragranceId);
  for (const w of await getWishlist()) ids.add(w.fragranceId);
  for (const wear of await db.getAll('wear_history')) ids.add(wear.fragranceId);
  for (const id of (await getPreferences()).recentAdditions ?? []) ids.add(id);
  return ids;
}

/** Drop stale bundled seed entries; re-link wardrobe bottles to live catalog data. */
async function migrateToCatalogV3(): Promise<void> {
  const db = await getDb();
  const keep = await referencedFragranceIds();
  const all = await db.getAll('fragrances');

  for (const f of all) {
    if (!keep.has(f.id)) {
      await db.delete('fragrances', f.id);
    }
  }

  await Promise.all(
    [...keep].slice(0, 24).map(async (id) => {
      const f = await db.get('fragrances', id);
      if (!f) return;
      const enriched = await enrichFragranceFromOnline(f);
      await putFragrance(enriched);
    }),
  );
}

export async function ensureSeedLoaded(): Promise<number> {
  if (seeded) return (await getDb()).count('fragrances');
  const db = await getDb();
  const prefs = await getPreferences();
  const needsMigration = prefs.seedVersion !== CATALOG_VERSION;

  if (needsMigration) {
    await migrateToCatalogV3();
    await savePreferences({ ...prefs, seedVersion: CATALOG_VERSION });
  }

  seeded = true;
  return db.count('fragrances');
}

export async function enrichFragranceOnce(f: Fragrance): Promise<Fragrance> {
  const enriched = needsCatalogImageRefresh(f.image, f.catalogSlug)
    ? await enrichFragranceFromOnline(f)
    : f;
  if (enriched !== f || enriched.image !== f.image || enriched.catalogSlug !== f.catalogSlug) {
    await putFragrance(enriched);
  }
  return enriched;
}

/** Backfill bottle images for wardrobe fragrances missing real catalog art. */
export async function enrichFragranceImages(ids: string[]): Promise<void> {
  const unique = [...new Set(ids)];
  // Cover full demo wardrobe (12) + a few extras.
  const batch = unique.slice(0, 16);
  await Promise.all(
    batch.map(async (id) => {
      const db = await getDb();
      const f = await db.get('fragrances', id);
      if (!f || !needsCatalogImageRefresh(f.image, f.catalogSlug)) return;
      const enriched = await enrichFragranceFromOnline(f);
      await putFragrance(enriched);
    }),
  );
}

/** Ensure advisor picks include live catalog bottle images. */
export async function hydrateAdvisorResult<T extends {
  primary: { fragrance: Fragrance };
  backups: { fragrance: Fragrance }[];
  layering?: { secondary: Fragrance } | null;
}>(result: T): Promise<T> {
  const primaryFragrance = await enrichFragranceOnce(result.primary.fragrance);
  const backups = await Promise.all(
    result.backups.map(async (b) => ({
      ...b,
      fragrance: await enrichFragranceOnce(b.fragrance),
    })),
  );
  const layering = result.layering
    ? { ...result.layering, secondary: await enrichFragranceOnce(result.layering.secondary) }
    : result.layering;
  return {
    ...result,
    primary: { ...result.primary, fragrance: primaryFragrance },
    backups,
    layering,
  };
}
