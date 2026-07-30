/**
 * Live fragrance catalog via Fraganty (https://fraganty.ai).
 * - Keyless GET /api/search — names, brands, slugs, bottle images.
 * - Optional VITE_FRAGANTY_API_KEY — notes, accords, longevity via /api/perfumes/:slug
 */
import type { Concentration, Fragrance, GenderLean, Longevity, Projection, Season } from '@/types';
import { applyFragranceProfile } from '@/services/fragranceProfile';
import { isPlaceholderCatalogImage } from '@/lib/catalogImage';

const API_BASE = 'https://fraganty.ai/api';

export type OpenHit = {
  name?: string;
  brand?: string;
  slug?: string;
  image?: string;
  imageTransparent?: string;
};

type FullPerfume = {
  name?: string;
  brand?: string | { name?: string };
  accords?: { name?: string; strength?: number }[];
  notes?: { top?: string[]; middle?: string[]; base?: string[] };
  concentration?: string;
  image?: string;
  imageTransparent?: string;
  gender?: string;
  longevity?: string;
  sillage?: string;
};

export function catalogIdFromSlug(slug: string): string {
  return `frag-${slug}`;
}

export function slugId(brand: string, name: string): string {
  return `${brand}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function pickImage(hit: { image?: string; imageTransparent?: string }): string | undefined {
  // Prefer opaque product JPG — skip perfume-nobg / empty (blanks on light atelier).
  if (hit.image && !isPlaceholderCatalogImage(hit.image)) return hit.image;
  if (hit.imageTransparent && !isPlaceholderCatalogImage(hit.imageTransparent)) return hit.imageTransparent;
  return undefined;
}

export function parseConcentrationFromName(name: string): Concentration {
  const n = name.toLowerCase();
  if (/eau de toilette|\bedt\b/.test(n)) return 'EDT';
  if (/eau de cologne|\bedc\b/.test(n)) return 'Cologne';
  if (/extrait de parfum|\bextrait\b/.test(n)) return 'Extrait';
  if (/eau de parfum|\bedp\b/.test(n)) return 'EDP';
  if (/\bparfum\b/.test(n) && !/eau de parfum/.test(n)) return 'Parfum';
  return 'EDP';
}

export function parseBaseName(fullName: string): string {
  return fullName
    .replace(/\s+Eau de (Parfum|Toilette|Cologne)(\s+Eau de (Parfum|Toilette|Cologne))*$/i, '')
    .replace(/\s+Eau de (Parfum|Toilette|Cologne)(\s|$).*$/i, '')
    .replace(/\s+(Parfum|Extrait|Eau Forte)(\s|$).*$/i, '')
    .replace(/\s+(EDP|EDT|EDC)(\s+(EDP|EDT|EDC))*$/i, '')
    .replace(/\s+(EDP|EDT|EDC)$/i, '')
    .trim();
}

/** UI label: clean bottle name, never double concentration. */
export function fragranceDisplayName(name: string): string {
  return parseBaseName(name) || name.trim();
}

export function concentrationLabel(c: Concentration): string {
  const map: Record<Concentration, string> = {
    EDP: 'Eau de Parfum',
    EDT: 'Eau de Toilette',
    Cologne: 'Eau de Cologne',
    Parfum: 'Parfum',
    Extrait: 'Extrait de Parfum',
  };
  return map[c];
}

function mapAccordToFamily(accords: { name?: string }[] | undefined): string {
  const top = accords?.[0]?.name?.toLowerCase() ?? '';
  if (/citrus|fresh|aquatic|green|aromatic/.test(top)) return 'Fresh';
  if (/floral|rose|white floral/.test(top)) return 'Floral';
  if (/woody|oud|leather/.test(top)) return 'Woody';
  if (/amber|oriental|spicy|balsamic/.test(top)) return 'Oriental';
  if (/sweet|vanilla|gourmand|powdery/.test(top)) return 'Gourmand';
  return 'Fresh';
}

function mapGender(raw?: string): GenderLean {
  const g = raw?.toLowerCase() ?? '';
  if (/women|female|feminine/.test(g)) return 'feminine';
  if (/men|male|masculine/.test(g)) return 'masculine';
  return 'unisex';
}

function mapProjection(raw?: string, concentration?: Concentration): Projection {
  const s = raw?.toLowerCase() ?? '';
  if (/beast|enormous|heavy/.test(s)) return 'beast';
  if (/strong|moderate to strong/.test(s)) return 'strong';
  if (/soft|intimate|light/.test(s)) return 'soft';
  if (concentration === 'Parfum' || concentration === 'Extrait') return 'strong';
  if (concentration === 'Cologne' || concentration === 'EDT') return 'moderate';
  return 'moderate';
}

function mapLongevity(raw?: string, concentration?: Concentration): Longevity {
  const s = raw?.toLowerCase() ?? '';
  if (/eternal|very long|long lasting/.test(s)) return 'eternal';
  if (/long/.test(s)) return 'long';
  if (/short|weak/.test(s)) return 'short';
  if (concentration === 'Parfum' || concentration === 'Extrait') return 'long';
  if (concentration === 'Cologne') return 'short';
  return 'medium';
}

function layeringTagsFromNotes(top: string[], heart: string[], base: string[]): string[] {
  const all = [...top, ...heart, ...base].join(' ').toLowerCase();
  const tags: string[] = [];
  if (/citrus|bergamot|lemon|grapefruit/.test(all)) tags.push('citrus', 'fresh');
  if (/wood|cedar|sandal|vetiver/.test(all)) tags.push('woody');
  if (/amber|vanilla|tonka/.test(all)) tags.push('amber', 'sweet');
  if (/rose|jasmine|floral|iris/.test(all)) tags.push('floral');
  if (/oud|leather|smoke|tobacco/.test(all)) tags.push('oud', 'leather', 'smoky');
  if (/musk|clean|lavender/.test(all)) tags.push('musky', 'clean');
  if (/pepper|spice|ginger/.test(all)) tags.push('spicy');
  return [...new Set(tags.length ? tags : ['fresh'])];
}

function defaultSeasonality(family: string): Season[] {
  if (family === 'Fresh' || family === 'Floral') return ['spring', 'summer'];
  if (family === 'Woody' || family === 'Oriental') return ['fall', 'winter'];
  return ['spring', 'summer', 'fall', 'winter'];
}

/** Build a catalog record from a single API hit — image and identity stay tied to this slug. */
export function fragranceFromOpenHit(hit: OpenHit): Fragrance {
  const brand = hit.brand ?? 'Unknown';
  const name = hit.name ?? 'Unknown';
  const concentration = parseConcentrationFromName(name);
  const id = hit.slug ? catalogIdFromSlug(hit.slug) : slugId(brand, name);
  const family = 'Fresh';

  const base: Fragrance = {
    id,
    name,
    brand,
    category: 'designer',
    concentration,
    family,
    subfamily: family,
    projection: mapProjection(undefined, concentration),
    longevity: mapLongevity(undefined, concentration),
    seasonality: defaultSeasonality(family),
    day_night: 'versatile',
    gender_lean: 'unisex',
    top_notes: [],
    heart_notes: [],
    base_notes: [],
    office_score: 70,
    heat_score: 70,
    cold_score: 70,
    date_score: 75,
    formal_score: 70,
    casual_score: 80,
    layering_tags: ['fresh'],
    image: pickImage(hit),
    catalogSlug: hit.slug,
  };

  return applyFragranceProfile(base);
}

function mergeFullDetails(stub: Fragrance, row: FullPerfume): Fragrance {
  const brand = typeof row.brand === 'string' ? row.brand : row.brand?.name ?? stub.brand;
  const name = row.name ?? stub.name;
  const concentration = row.concentration
    ? parseConcentrationFromName(row.concentration)
    : parseConcentrationFromName(name);
  const family = mapAccordToFamily(row.accords);
  const top = row.notes?.top ?? stub.top_notes;
  const heart = row.notes?.middle ?? stub.heart_notes;
  const baseNotes = row.notes?.base ?? stub.base_notes;

  const merged: Fragrance = {
    ...stub,
    name,
    brand,
    concentration,
    family,
    subfamily: family,
    top_notes: top,
    heart_notes: heart,
    base_notes: baseNotes,
    image: pickImage(row) ?? stub.image,
    gender_lean: mapGender(row.gender as string | undefined),
    projection: mapProjection(row.sillage, concentration),
    longevity: mapLongevity(row.longevity, concentration),
    seasonality: defaultSeasonality(family),
    layering_tags: layeringTagsFromNotes(top, heart, baseNotes) as Fragrance['layering_tags'],
  };

  return applyFragranceProfile(merged);
}

export function hasOnlineCatalog(): boolean {
  return true;
}

async function searchFragantyOpen(query: string, limit: number): Promise<OpenHit[]> {
  if (!query.trim()) return [];
  try {
    const params = new URLSearchParams({ q: query.trim(), limit: String(limit) });
    const res = await fetch(`${API_BASE}/search?${params}`);
    if (!res.ok) return [];
    const data = await res.json() as { perfumes?: OpenHit[] };
    return data.perfumes ?? [];
  } catch {
    return [];
  }
}

function slugToSearchQueries(slug: string): string[] {
  const spaced = slug.replace(/-/g, ' ').trim();
  const words = spaced.split(/\s+/).filter(Boolean);
  const short = words.slice(0, Math.min(4, words.length)).join(' ');
  const titleCase = (s: string) =>
    s.replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/\bDe\b/g, 'de')
      .replace(/\bDu\b/g, 'du')
      .replace(/\bLa\b/g, 'la')
      .replace(/\bLe\b/g, 'le');
  const titled = titleCase(spaced);
  const shortTitled = titleCase(short);
  return [...new Set([spaced, titled, short, shortTitled])];
}

async function findHitBySlug(slug: string): Promise<OpenHit | null> {
  for (const q of slugToSearchQueries(slug)) {
    const hits = await searchFragantyOpen(q, 16);
    const exact = hits.find((h) => h.slug === slug);
    if (exact) return exact;
  }
  return null;
}

async function fetchFullPerfume(slug: string, key: string): Promise<FullPerfume | null> {
  try {
    const res = await fetch(`${API_BASE}/perfumes/${encodeURIComponent(slug)}`, {
      headers: { 'X-API-Key': key },
    });
    if (!res.ok) return null;
    return await res.json() as FullPerfume;
  } catch {
    return null;
  }
}

function concentrationInHitName(concentration: Concentration, hitName: string): boolean {
  const n = hitName.toLowerCase();
  if (concentration === 'EDP') return /eau de parfum|\bedp\b/.test(n);
  if (concentration === 'EDT') return /eau de toilette|\bedt\b/.test(n);
  if (concentration === 'Cologne') return /eau de cologne|\bedc\b|cologne/.test(n);
  if (concentration === 'Parfum') return /\bparfum\b/.test(n) && !/eau de parfum/.test(n);
  if (concentration === 'Extrait') return /extrait/.test(n);
  return true;
}

function matchScore(brand: string, name: string, concentration: Concentration | undefined, hit: OpenHit): number {
  const b = brand.toLowerCase().trim();
  const base = parseBaseName(name).toLowerCase();
  const hb = (hit.brand ?? '').toLowerCase();
  const hn = (hit.name ?? '').toLowerCase();
  let score = 0;
  if (b && (hb.includes(b) || b.includes(hb))) score += 6;
  if (base && hn.includes(base)) score += 5;
  if (concentration && concentrationInHitName(concentration, hn)) score += 4;
  if (hit.slug && concentration && concentrationInHitName(concentration, hit.slug.replace(/-/g, ' '))) score += 2;
  return score;
}

/** Find exact catalog hit by Fraganty slug. */
export async function fetchFragranceBySlug(slug: string): Promise<Fragrance | null> {
  const hit = await findHitBySlug(slug);
  if (!hit?.slug) return null;

  let f = fragranceFromOpenHit(hit);
  const key = import.meta.env.VITE_FRAGANTY_API_KEY as string | undefined;
  if (key) {
    const full = await fetchFullPerfume(hit.slug, key);
    if (full) f = mergeFullDetails(f, full);
  }
  return f;
}

/** Search live catalog — each result is an exact slug + bottle image pair. */
export async function searchOnlineCatalog(query: string, limit = 24): Promise<Fragrance[]> {
  if (!query.trim()) return [];

  const hits = await searchFragantyOpen(query, limit);
  if (!hits.length) return [];

  const key = import.meta.env.VITE_FRAGANTY_API_KEY as string | undefined;
  const results: Fragrance[] = [];

  for (const hit of hits) {
    if (!hit.slug) continue;
    let f = fragranceFromOpenHit(hit);
    if (key) {
      const full = await fetchFullPerfume(hit.slug, key);
      if (full) f = mergeFullDetails(f, full);
    }
    results.push(f);
  }

  return results;
}

/** Resolve image for legacy seed records — requires brand + concentration match. */
export async function resolveFragranceImage(
  brand: string,
  name: string,
  concentration?: string,
  catalogSlug?: string,
): Promise<{ image?: string; slug?: string }> {
  if (catalogSlug) {
    const hit = await findHitBySlug(catalogSlug);
    const image = pickImage(hit ?? {});
    if (image) return { image, slug: hit?.slug };
  }

  const conc = concentration as Concentration | undefined;
  const queries = [
    `${brand} ${name} ${concentrationLabel(conc ?? 'EDP')}`,
    `${parseBaseName(name)} ${concentrationLabel(conc ?? 'EDP')}`,
    `${brand} ${parseBaseName(name)}`,
  ].filter(Boolean);

  let best: { score: number; image: string; slug?: string } | null = null;
  for (const q of queries) {
    const hits = await searchFragantyOpen(q, 10);
    for (const hit of hits) {
      const image = pickImage(hit);
      if (!image) continue;
      const score = matchScore(brand, name, conc, hit);
      if (score >= 10 && (!best || score > best.score)) {
        best = { score, image, slug: hit.slug };
      }
    }
    if (best && best.score >= 14) break;
  }

  return { image: best?.image, slug: best?.slug };
}

/** Upgrade catalog record from API — never swaps images across different slugs. Preserves local id. */
export async function enrichFragranceFromOnline(f: Fragrance): Promise<Fragrance> {
  const key = import.meta.env.VITE_FRAGANTY_API_KEY as string | undefined;

  const mergeImageOnly = (remote: Fragrance): Fragrance => ({
    ...f,
    image: remote.image ?? f.image,
    catalogSlug: remote.catalogSlug ?? f.catalogSlug,
    top_notes: f.top_notes.length ? f.top_notes : remote.top_notes,
    heart_notes: f.heart_notes.length ? f.heart_notes : remote.heart_notes,
    base_notes: f.base_notes.length ? f.base_notes : remote.base_notes,
    // Keep curated identity — remote search stubs often garbage ("Demo", "slug Eau de Parfum").
    brand: f.brand,
    name: f.name,
    concentration: f.concentration,
    family: f.family || remote.family,
    office_score: f.office_score,
    heat_score: f.heat_score,
    cold_score: f.cold_score,
    date_score: f.date_score,
    formal_score: f.formal_score,
    casual_score: f.casual_score,
    layering_tags: f.layering_tags?.length ? f.layering_tags : remote.layering_tags,
  });

  if (f.catalogSlug) {
    const exact = await fetchFragranceBySlug(f.catalogSlug);
    if (exact && !isPlaceholderCatalogImage(exact.image)) return mergeImageOnly(exact);
  }

  const needsImage = isPlaceholderCatalogImage(f.image);
  if (!needsImage && f.top_notes.length > 0) return f;

  const resolved = await resolveFragranceImage(f.brand, f.name, f.concentration, f.catalogSlug);
  if (!resolved.image && !resolved.slug) return f;

  let enriched: Fragrance = {
    ...f,
    image: resolved.image ?? f.image,
    catalogSlug: resolved.slug ?? f.catalogSlug,
  };

  if (key && resolved.slug) {
    const full = await fetchFullPerfume(resolved.slug, key);
    if (full) {
      // Notes/image from full; never overwrite brand/name/concentration from stub.
      const merged = mergeFullDetails(enriched, full);
      enriched = mergeImageOnly(merged);
    }
  } else {
    enriched = applyFragranceProfile(enriched);
  }

  return enriched;
}

export type FragranceProductGroup = {
  key: string;
  brand: string;
  baseName: string;
  variants: Fragrance[];
};

/** Group API results by product line (brand + base name). */
export function groupFragrancesByProduct(fragrances: Fragrance[]): FragranceProductGroup[] {
  const map = new Map<string, Fragrance[]>();
  for (const f of fragrances) {
    const baseName = parseBaseName(f.name);
    const key = `${f.brand}::${baseName}`;
    const arr = map.get(key) ?? [];
    if (!arr.some((v) => v.catalogSlug && v.catalogSlug === f.catalogSlug)) {
      arr.push(f);
    }
    map.set(key, arr);
  }

  return [...map.entries()].map(([key, variants]) => {
    const [brand, baseName] = key.split('::');
    variants.sort((a, b) => a.concentration.localeCompare(b.concentration));
    return { key, brand, baseName, variants };
  });
}
