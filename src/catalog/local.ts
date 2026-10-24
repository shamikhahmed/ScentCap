import type { Fragrance } from '@/types';

/**
 * Bundled offline catalog — verified products with self-hosted WebP bottle photos
 * (`public/data/catalog.json` + `public/bottles/`, built by `npm run bottles`).
 * Works with no network; Fraganty stays an optional long-tail supplement.
 */
export type LocalFragrance = Fragrance & { image: string; imageSm: string };

type Index = {
  list: LocalFragrance[];
  byId: Map<string, LocalFragrance>;
  byKey: Map<string, LocalFragrance>;
  byName: Map<string, LocalFragrance>;
  haystack: string[];
};

let indexPromise: Promise<Index> | null = null;

const BUNDLED_PREFIX = 'bottles/';

export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const nameKey = (brand: string, name: string) => `${norm(brand)}|${norm(name)}`;

export function isBundledBottle(image?: string | null): boolean {
  return Boolean(image?.startsWith(BUNDLED_PREFIX));
}

/** Resolve a bundled `bottles/…` path against the deploy base (Pages `/ScentCap/`, Capacitor `/`). */
export function bottleUrl(image: string): string {
  if (!isBundledBottle(image)) return image;
  return `${import.meta.env.BASE_URL}${image}`;
}

/** Small (256px) variant of a bundled bottle path. */
export function bottleSmall(image: string): string {
  return isBundledBottle(image) ? image.replace(/\.webp$/, '-sm.webp') : image;
}

export function loadLocalCatalog(): Promise<Index> {
  indexPromise ??= fetch(`${import.meta.env.BASE_URL}data/catalog.json`)
    .then((r) => (r.ok ? r.json() : { fragrances: [] }))
    .catch(() => ({ fragrances: [] }))
    .then((data: { fragrances: LocalFragrance[] }) => {
      const list = data.fragrances ?? [];
      const byId = new Map<string, LocalFragrance>();
      const byKey = new Map<string, LocalFragrance>();
      const byName = new Map<string, LocalFragrance>();
      for (const f of list) {
        byId.set(f.id, f);
        byKey.set(`${nameKey(f.brand, f.name)}|${f.concentration}`, f);
        if (!byName.has(nameKey(f.brand, f.name))) byName.set(nameKey(f.brand, f.name), f);
      }
      const haystack = list.map((f) => norm(`${f.brand} ${f.name} ${f.concentration}`));
      // Failed/empty load (offline first boot before SW cache) → allow a retry next call.
      if (!list.length) indexPromise = null;
      return { list, byId, byKey, byName, haystack };
    });
  return indexPromise;
}

/** Best bundled match for any fragrance (id, then brand+name+concentration, then brand+name). */
export async function findLocalFragrance(
  f: Pick<Fragrance, 'brand' | 'name'> & Partial<Pick<Fragrance, 'id' | 'concentration'>>,
): Promise<LocalFragrance | null> {
  if (!f.brand || !f.name) return null;
  const idx = await loadLocalCatalog();
  return (
    (f.id ? idx.byId.get(f.id) : undefined) ??
    (f.concentration ? idx.byKey.get(`${nameKey(f.brand, f.name)}|${f.concentration}`) : undefined) ??
    idx.byName.get(nameKey(f.brand, f.name)) ??
    null
  );
}

/** Token search over the bundled catalog — every token must appear; prefix hits rank first. */
export async function searchLocalCatalog(query: string, limit = 48): Promise<LocalFragrance[]> {
  const q = norm(query);
  if (!q) return [];
  const tokens = q.split(' ');
  const idx = await loadLocalCatalog();
  const hits: { f: LocalFragrance; score: number; order: number }[] = [];
  idx.haystack.forEach((h, i) => {
    if (!tokens.every((t) => h.includes(t))) return;
    const f = idx.list[i];
    const nm = norm(f.name);
    let score = 0;
    if (nm === q || `${norm(f.brand)} ${nm}` === q) score += 4;
    if (nm.startsWith(tokens[0]) || norm(f.brand).startsWith(tokens[0])) score += 2;
    if (tokens.every((t) => ` ${h} `.includes(` ${t} `))) score += 1;
    hits.push({ f, score, order: i });
  });
  hits.sort((a, b) => b.score - a.score || a.order - b.order);
  return hits.slice(0, limit).map((h) => h.f);
}

/** Copy bundled art onto a fragrance that only has placeholder / remote art. Keeps identity + user data. */
export async function withLocalBottle(f: Fragrance): Promise<Fragrance> {
  if (isBundledBottle(f.image)) return f;
  const local = await findLocalFragrance(f);
  if (!local) return f;
  return {
    ...f,
    image: local.image,
    top_notes: f.top_notes?.length ? f.top_notes : local.top_notes,
    heart_notes: f.heart_notes?.length ? f.heart_notes : local.heart_notes,
    base_notes: f.base_notes?.length ? f.base_notes : local.base_notes,
  };
}

const POPULAR_PICKS = [
  'dior|sauvage', 'chanel|bleu de chanel', 'creed|aventus', 'tom ford|oud wood', 'yves saint laurent|y',
  'maison francis kurkdjian|baccarat rouge 540', 'parfums de marly|layton', 'giorgio armani|acqua di gio',
  'dior|miss dior', 'chanel|coco mademoiselle', 'lattafa|khamrah', 'versace|eros', 'le labo|santal 33',
  'paco rabanne|1 million', 'jean paul gaultier|le male', 'byredo|gypsy water', 'initio|oud for greatness',
  'xerjoff|naxos', 'armaf|club de nuit intense man', 'prada|luna rossa carbon', 'gucci|bloom',
  'dolce and gabbana|light blue', 'hermes|terre d hermes', 'kilian|angels share',
];

/** Curated well-known picks for the empty Add screen; tops up with catalog order. */
export async function popularLocal(limit = 18): Promise<LocalFragrance[]> {
  const idx = await loadLocalCatalog();
  const out: LocalFragrance[] = [];
  const seen = new Set<string>();
  for (const key of POPULAR_PICKS) {
    const f = idx.byName.get(key);
    if (f && !seen.has(f.id)) {
      out.push(f);
      seen.add(f.id);
    }
  }
  for (const f of idx.list) {
    if (out.length >= limit) break;
    if (!seen.has(f.id)) {
      out.push(f);
      seen.add(f.id);
    }
  }
  return out.slice(0, limit);
}
