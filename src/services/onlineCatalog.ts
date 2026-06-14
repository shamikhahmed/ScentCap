/**
 * Optional online catalog search (Fraganty API).
 * Set VITE_FRAGANTY_API_KEY in .env for live search beyond the offline bundle.
 * Free API key: https://fraganty.ai/api-docs
 */
import type { Fragrance } from '@/types';

const API_BASE = 'https://fraganty.ai/api';

function mapAccordToFamily(accords: { name?: string }[] | undefined): string {
  const top = accords?.[0]?.name?.toLowerCase() ?? '';
  if (/citrus|fresh|aquatic|green|aromatic/.test(top)) return 'Fresh';
  if (/floral|rose|white floral/.test(top)) return 'Floral';
  if (/woody|oud|leather/.test(top)) return 'Woody';
  if (/amber|oriental|spicy|balsamic/.test(top)) return 'Oriental';
  if (/sweet|vanilla|gourmand|powdery/.test(top)) return 'Gourmand';
  return 'Fresh';
}

function slugId(brand: string, name: string): string {
  return `${brand}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function hasOnlineCatalog(): boolean {
  return Boolean(import.meta.env.VITE_FRAGANTY_API_KEY);
}

export async function searchOnlineCatalog(query: string, limit = 20): Promise<Fragrance[]> {
  const key = import.meta.env.VITE_FRAGANTY_API_KEY;
  if (!key || !query.trim()) return [];

  try {
    const params = new URLSearchParams({ q: query.trim(), limit: String(limit), api_key: key });
    const res = await fetch(`${API_BASE}/perfumes?${params}`);
    if (!res.ok) return [];
    const rows = await res.json() as Array<{
      name?: string;
      brand?: string | { name?: string };
      accords?: { name?: string; strength?: number }[];
      notes?: { top?: string[]; middle?: string[]; base?: string[] };
      concentration?: string;
    }>;

    return rows.map((row) => {
      const brand = typeof row.brand === 'string' ? row.brand : row.brand?.name ?? 'Unknown';
      const name = row.name ?? 'Unknown';
      const family = mapAccordToFamily(row.accords);
      return {
        id: slugId(brand, name),
        name,
        brand,
        category: 'designer',
        concentration: 'EDP',
        family,
        subfamily: family,
        projection: 'moderate',
        longevity: 'long',
        seasonality: ['spring', 'summer', 'fall', 'winter'],
        day_night: 'versatile',
        gender_lean: 'unisex',
        top_notes: row.notes?.top ?? [],
        heart_notes: row.notes?.middle ?? [],
        base_notes: row.notes?.base ?? [],
        office_score: 70,
        heat_score: 70,
        cold_score: 70,
        date_score: 75,
        formal_score: 70,
        casual_score: 80,
        layering_tags: ['fresh'],
      } satisfies Fragrance;
    });
  } catch {
    return [];
  }
}
