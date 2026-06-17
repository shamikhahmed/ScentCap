import { getRecentAdditions, putFragrance } from '@/db';
import { buildSearchCandidates, suggestFromResults } from '@/lib/spellSuggest';
import {
  enrichFragranceFromOnline,
  fetchFragranceBySlug,
  groupFragrancesByProduct,
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

/** Live API search with spell correction and "did you mean" hints. */
export async function searchCatalogWithImages(
  query: string,
  limit = 24,
): Promise<CatalogSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { groups: [], fromOnline: false, searchedAs: null, didYouMean: null };
  }

  let online = await searchOnlineCatalog(trimmed, limit * 2);
  let searchedAs: string | null = null;
  let didYouMean: string | null = null;

  if (!online.length) {
    for (const candidate of buildSearchCandidates(trimmed).slice(1)) {
      const retry = await searchOnlineCatalog(candidate, limit * 2);
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
      online.map((f) => ({ brand: f.brand, name: f.name })),
    );
    if (suggestion && normalizeLoose(suggestion) !== normalizeLoose(trimmed)) {
      didYouMean = suggestion;
    }
  }

  await Promise.all(online.map((f) => putFragrance(f)));

  const grouped = groupFragrancesByProduct(online);
  const groups = grouped.slice(0, limit).map((g) => ({
    key: g.key,
    brand: g.brand,
    name: g.baseName,
    variants: g.variants,
  }));

  return {
    groups,
    fromOnline: online.length > 0,
    searchedAs,
    didYouMean,
  };
}

function normalizeLoose(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

export async function getRecentAdditionsWithImages(): Promise<Fragrance[]> {
  const recents = await getRecentAdditions();
  return Promise.all(recents.map((f) => enrichFragranceOnce(f)));
}

/** Load and persist exact catalog entry (used when picking a variant). */
export async function ensureFragranceCatalogEntry(f: Fragrance): Promise<Fragrance> {
  if (f.catalogSlug) {
    const exact = await fetchFragranceBySlug(f.catalogSlug);
    if (exact) {
      await putFragrance(exact);
      return exact;
    }
  }
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
