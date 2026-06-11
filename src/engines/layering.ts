import type { Fragrance } from '@/types';

const COMPAT: Record<string, Record<string, number>> = {
  citrus: { woody: 90, musky: 85, fresh: 70, vanilla: 60, amber: 75, oud: 40, sweet: 55 },
  woody: { citrus: 90, amber: 88, musky: 82, vanilla: 80, oud: 75, floral: 70, spicy: 85 },
  amber: { woody: 88, vanilla: 92, musky: 85, spicy: 80, oud: 78, citrus: 75 },
  vanilla: { woody: 80, amber: 92, musky: 70, spicy: 65, citrus: 60, oud: 55 },
  musky: { citrus: 85, woody: 82, clean: 88, fresh: 80, vanilla: 70 },
  clean: { musky: 88, fresh: 90, citrus: 85, woody: 65 },
  fresh: { clean: 90, citrus: 70, musky: 80, woody: 72 },
  spicy: { woody: 85, amber: 80, oud: 82, vanilla: 65 },
  sweet: { vanilla: 88, amber: 75, woody: 60, citrus: 55 },
  oud: { woody: 75, spicy: 82, amber: 78, citrus: 40, vanilla: 55 },
  floral: { woody: 70, musky: 75, citrus: 65, vanilla: 72 },
  leather: { woody: 80, spicy: 78, smoky: 85, citrus: 50 },
  smoky: { leather: 85, woody: 75, oud: 70 },
};

const CLASH: [string, string][] = [
  ['sweet', 'fresh'],
  ['oud', 'citrus'],
  ['leather', 'floral'],
];

function tagCompatibility(a: string[], b: string[]): { score: number; guidance: string; warn?: string } {
  let best = 0;
  let pair = '';
  for (const t1 of a) {
    for (const t2 of b) {
      const s = COMPAT[t1]?.[t2] ?? COMPAT[t2]?.[t1] ?? 50;
      if (s > best) {
        best = s;
        pair = `${t1}+${t2}`;
      }
    }
  }
  for (const [x, y] of CLASH) {
    if (a.includes(x) && b.includes(y)) {
      return { score: 20, guidance: 'Poor layering match — wear separately', warn: `${x} clashes with ${y}` };
    }
  }
  const guidance =
    best >= 85
      ? `Excellent layer (${pair}). Apply richer scent first on skin, lighter on clothes.`
      : best >= 70
        ? `Good layer (${pair}). Space sprays 30 seconds apart.`
        : best >= 50
          ? `Moderate compatibility. Use lightly.`
          : 'Not recommended to layer these.';
  return { score: best, guidance };
}

export function findBestLayering(primary: Fragrance, candidates: Fragrance[]): {
  secondary: Fragrance;
  score: number;
  order: string;
  guidance: string;
  warn?: string;
} | null {
  let best: ReturnType<typeof findBestLayering> = null;
  for (const c of candidates) {
    if (c.id === primary.id) continue;
    const { score, guidance, warn } = tagCompatibility(primary.layering_tags, c.layering_tags);
    if (!best || score > best.score) {
      const primaryFirst = primary.concentration === 'Parfum' || primary.concentration === 'EDP';
      best = {
        secondary: c,
        score,
        order: primaryFirst
          ? `${primary.name} on skin first → ${c.name} on clothes`
          : `${c.name} base → ${primary.name} on pulse points`,
        guidance,
        warn,
      };
    }
  }
  if (best && best.score < 55) return null;
  return best;
}
