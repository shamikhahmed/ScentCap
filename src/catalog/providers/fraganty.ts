import type { CatalogSnapshot } from '@/types';
import type { CatalogProvider } from '@/catalog/types';
import { putCatalogSnapshot, getCatalogSnapshot } from '@/db';
import { searchOnlineCatalog } from '@/services/onlineCatalog';

const META_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function toSnapshot(f: {
  id: string;
  name: string;
  brand: string;
  image?: string;
  catalogSlug?: string;
  top_notes?: string[];
  heart_notes?: string[];
  base_notes?: string[];
}): CatalogSnapshot {
  const now = Date.now();
  return {
    id: f.id,
    provider: 'fraganty',
    providerId: f.catalogSlug ?? f.id,
    name: f.name,
    brand: f.brand,
    imageUrl: f.image,
    notes: {
      top: f.top_notes,
      middle: f.heart_notes,
      base: f.base_notes,
    },
    fetchedAt: now,
    expiresAt: now + META_TTL_MS,
  };
}

export const fragantyProvider: CatalogProvider = {
  id: 'fraganty',

  async search(q: string) {
    const hits = await searchOnlineCatalog(q);
    const snaps = hits.map(toSnapshot);
    await Promise.all(snaps.map((s) => putCatalogSnapshot(s)));
    return snaps;
  },

  async lookup(id: string) {
    const local = await getCatalogSnapshot(id);
    if (local && local.expiresAt > Date.now()) return local;
    return local ?? null;
  },

  image(snapshot) {
    return snapshot.imageUrl;
  },

  async refresh(id: string) {
    return this.lookup(id);
  },
};
