import type { CollectionItem, Fragrance, WearRecord } from '@/types';

const PROJECTION_SCORE: Record<Fragrance['projection'], number> = { soft: 1, moderate: 2, strong: 3, beast: 4 };
const LONGEVITY_SCORE: Record<Fragrance['longevity'], number> = { short: 1, medium: 2, long: 3, eternal: 4 };
const PROJECTION_LABEL = ['Soft', 'Moderate', 'Strong', 'Beast'] as const;
const LONGEVITY_LABEL = ['Short', 'Medium', 'Long', 'Eternal'] as const;

export function wearStreak(history: WearRecord[]): number {
  if (!history.length) return 0;
  const days = new Set(history.map((h) => h.wornAt.slice(0, 10)));
  let streak = 0;
  const d = new Date();
  const todayKey = d.toISOString().slice(0, 10);
  if (!days.has(todayKey)) {
    d.setDate(d.getDate() - 1);
  }
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Streak at risk when user hasn't logged today but had a streak yesterday. */
export function streakAtRisk(history: WearRecord[]): boolean {
  if (!history.length) return false;
  const days = new Set(history.map((h) => h.wornAt.slice(0, 10)));
  const today = new Date().toISOString().slice(0, 10);
  if (days.has(today)) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return days.has(yesterday.toISOString().slice(0, 10));
}

export function wearsThisMonth(history: WearRecord[]): number {
  const prefix = new Date().toISOString().slice(0, 7);
  return history.filter((h) => h.wornAt.startsWith(prefix)).length;
}

export function rotationHealth(collection: CollectionItem[], history: WearRecord[]): number {
  if (!collection.length) return 0;
  const worn = new Set(history.map((h) => h.fragranceId));
  return Math.round((worn.size / collection.length) * 100);
}

export function daysSinceWear(fragranceId: string, history: WearRecord[]): number | null {
  const last = history
    .filter((h) => h.fragranceId === fragranceId)
    .sort((a, b) => b.wornAt.localeCompare(a.wornAt))[0];
  if (!last) return null;
  return Math.floor((Date.now() - new Date(last.wornAt).getTime()) / 86400000);
}

export const FAMILY_COLORS: Record<string, string> = {
  Fresh: '#5eead4',
  Floral: '#f9a8d4',
  Woody: '#a78bfa',
  Oriental: '#fb923c',
  Gourmand: '#fcd34d',
};

export function complimentCount(history: WearRecord[]): number {
  return history.filter((h) => h.compliment).length;
}

export function versatileFragranceCount(history: WearRecord[]): number {
  const occasions = new Map<string, Set<string>>();
  for (const h of history) {
    if (!h.occasion) continue;
    const set = occasions.get(h.fragranceId) ?? new Set();
    set.add(h.occasion);
    occasions.set(h.fragranceId, set);
  }
  return [...occasions.values()].filter((s) => s.size >= 2).length;
}

export function avgProjectionLabel(fragrances: Fragrance[]): string {
  if (!fragrances.length) return '—';
  const avg = fragrances.reduce((s, f) => s + PROJECTION_SCORE[f.projection], 0) / fragrances.length;
  return PROJECTION_LABEL[Math.min(3, Math.round(avg) - 1)] ?? 'Moderate';
}

export function avgLongevityLabel(fragrances: Fragrance[]): string {
  if (!fragrances.length) return '—';
  const avg = fragrances.reduce((s, f) => s + LONGEVITY_SCORE[f.longevity], 0) / fragrances.length;
  return LONGEVITY_LABEL[Math.min(3, Math.round(avg) - 1)] ?? 'Medium';
}

export function leastWornIds(collection: CollectionItem[], history: WearRecord[], limit = 5): string[] {
  const counts: Record<string, number> = {};
  for (const c of collection) counts[c.fragranceId] = 0;
  for (const h of history) counts[h.fragranceId] = (counts[h.fragranceId] ?? 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => a[1] - b[1])
    .slice(0, limit)
    .map(([id]) => id);
}

export interface CostPerWearRow {
  collectionId: string;
  fragranceId: string;
  name: string;
  wears: number;
  price: number;
  costPerWear: number | null;
}

export function costPerWearRows(
  collection: CollectionItem[],
  history: WearRecord[],
  nameById: Map<string, string>,
): CostPerWearRow[] {
  const wearCount: Record<string, number> = {};
  for (const h of history) wearCount[h.fragranceId] = (wearCount[h.fragranceId] ?? 0) + 1;

  return collection
    .filter((c) => c.purchasePrice != null && c.purchasePrice > 0)
    .map((c) => {
      const wears = wearCount[c.fragranceId] ?? 0;
      const name = nameById.get(c.fragranceId) ?? 'Unknown';
      return {
        collectionId: c.id,
        fragranceId: c.fragranceId,
        name,
        wears,
        price: c.purchasePrice!,
        costPerWear: wears > 0 ? Math.round((c.purchasePrice! / wears) * 100) / 100 : null,
      };
    })
    .sort((a, b) => {
      if (a.costPerWear == null && b.costPerWear == null) return b.price - a.price;
      if (a.costPerWear == null) return 1;
      if (b.costPerWear == null) return -1;
      return b.costPerWear - a.costPerWear;
    });
}

export interface BlindSpotRow {
  collectionId: string;
  fragranceId: string;
  name: string;
  daysSince: number | null;
  price: number;
}

/** Owned bottles with price but no recent wears — rotation blind spots. */
export function blindSpotBottles(
  collection: CollectionItem[],
  history: WearRecord[],
  nameById: Map<string, string>,
  minPrice = 50,
): BlindSpotRow[] {
  return collection
    .filter((c) => (c.purchasePrice ?? 0) >= minPrice)
    .map((c) => ({
      collectionId: c.id,
      fragranceId: c.fragranceId,
      name: nameById.get(c.fragranceId) ?? 'Unknown',
      daysSince: daysSinceWear(c.fragranceId, history),
      price: c.purchasePrice ?? 0,
    }))
    .filter((r) => r.daysSince === null || r.daysSince >= 30)
    .sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999))
    .slice(0, 8);
}
