import { getRecentAdditions, putFragrance } from '@/db';
import { norm, searchLocalCatalog } from '@/catalog/local';
import { buildSearchCandidates, suggestFromResults } from '@/lib/spellSuggest';
import {
  enrichFragranceFromOnline,
  fetchFragranceBySlug,
  groupFragrancesByProduct,
  parseBaseName,
  searchOnlineCatalog,
} from '@/services/onlineCatalog';
import { enrichFragranceOnce } from '@/services/seed';
import type { Fragrance } from '@/types';

export type FragranceGroup = {
  key: string;
  brand: string;
  name: string;
  variants: Fragrance[];
};

export type CatalogSearchResult = {
  groups: FragranceGroup[];
  fromOnline: boolean;
  /** Corrected query that returned results (when original had none). */
  searchedAs: string | null;
  /** Suggested spelling — tap to re-search. */
  didYouMean: string | null;
};

/** Instant offline-only search (bundled catalog) — render this first, then merge the live result. */
export async function searchCatalogLocal(query: string, limit = 24): Promise<CatalogSearchResult> {
  const local = await searchLocalCatalog(query.trim(), limit * 2);
  await Promise.all(local.map((f) => putFragrance(f)));
  const groups = groupFragrancesByProduct(local)
    .slice(0, limit)
    .map((g) => ({ key: g.key, brand: g.brand, name: g.baseName, variants: g.variants }));
  return { groups, fromOnline: false, searchedAs: null, didYouMean: null };
}

/** Offline bundled catalog first, merged with live API results (when reachable), plus spell hints. */
export async function searchCatalogWithImages(
  query: string,
  limit = 24,
): Promise<CatalogSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { groups: [], fromOnline: false, searchedAs: null, didYouMean: null };
  }

  const [local, liveFirst] = await Promise.all([
    searchLocalCatalog(trimmed, limit * 2),
    searchOnlineCatalog(trimmed, limit * 2),
  ]);
  let online = liveFirst;
  let searchedAs: string | null = null;
  let didYouMean: string | null = null;

  if (!online.length && !local.length) {
    for (const candidate of buildSearchCandidates(trimmed).slice(1)) {
      const retryLocal = await searchLocalCatalog(candidate, limit * 2);
      const retry = retryLocal.length ? retryLocal : await searchOnlineCatalog(candidate, limit * 2);
      if (retry.length) {
        online = retry;
        searchedAs = candidate;
        didYouMean = candidate;
        break;
      }
    }
  } else {
    const suggestion = suggestFromResults(
      trimmed,
      [...local, ...online].map((f) => ({ brand: f.brand, name: f.name })),
    );
    if (suggestion && normalizeLoose(suggestion) !== normalizeLoose(trimmed)) {
      didYouMean = suggestion;
    }
  }

  // Bundled entries win on duplicates — they carry self-hosted photos and full profiles.
  const seen = new Set(local.map((f) => `${norm(f.brand)}|${norm(f.name)}|${f.concentration}`));
  const merged = [
    ...local,
    ...online.filter((f) => !seen.has(`${norm(f.brand)}|${norm(parseBaseNameSafe(f.name))}|${f.concentration}`)),
  ];

  await Promise.all(merged.map((f) => putFragrance(f)));

  const grouped = groupFragrancesByProduct(merged);
  const groups = grouped.slice(0, limit).map((g) => ({
    key: g.key,
    brand: g.brand,
    name: g.baseName,
    variants: g.variants,
  }));

  return {
    groups,
    fromOnline: merged.length > local.length,
    searchedAs,
    didYouMean,
  };
}

function parseBaseNameSafe(name: string): string {
  return parseBaseName(name) || name;
}

function normalizeLoose(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

export async function getRecentAdditionsWithImages(): Promise<Fragrance[]> {
  const recents = await getRecentAdditions();
  return Promise.all(recents.map((f) => enrichFragranceOnce(f)));
}

/** Load and persist catalog art onto the local fragrance id (never swap demo ids). */
export async function ensureFragranceCatalogEntry(f: Fragrance): Promise<Fragrance> {
  const enriched = await enrichFragranceFromOnline(f);
  await putFragrance(enriched);
  return enriched;
}

/** @deprecated use ensureFragranceCatalogEntry */
export async function ensureFragranceImage(f: Fragrance): Promise<Fragrance> {
  return ensureFragranceCatalogEntry(f);
}

export async function loadCatalogBySlug(slug: string): Promise<Fragrance | null> {
  const f = await fetchFragranceBySlug(slug);
  if (f) await putFragrance(f);
  return f;
}
