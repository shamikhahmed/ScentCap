import { parseBaseName } from '@/services/onlineCatalog';

const TOKEN_FIXES: Record<string, string> = {
  savage: 'sauvage',
  sauvge: 'sauvage',
  sauvagee: 'sauvage',
  aventous: 'aventus',
  aventis: 'aventus',
  avents: 'aventus',
  chanell: 'chanel',
  chanelle: 'chanel',
  chane: 'chanel',
  diore: 'dior',
  dyor: 'dior',
  tomford: 'tom ford',
  'tom-ford': 'tom ford',
  creed: 'creed',
  baccarat: 'baccarat rouge',
  'baccarat rouge': 'baccarat rouge 540',
  br540: 'baccarat rouge 540',
  acqua: 'acqua di gio',
  'acqua di gio': 'acqua di gio',
  giorgio: 'giorgio armani',
  armani: 'armani',
  bleu: 'bleu de chanel',
  'bleu de': 'bleu de chanel',
  eros: 'eros',
  versace: 'versace',
  versache: 'versace',
  khamra: 'khamrah',
  khambra: 'khamrah',
  lattafa: 'lattafa',
  ysl: 'yves saint laurent',
  'yves saint': 'yves saint laurent',
  parfume: 'parfum',
  toilette: 'toilette',
  ombre: 'ombre leather',
  'ombre lether': 'ombre leather',
  carbon: 'carbon',
  prada: 'prada',
  gucci: 'gucci',
  gucchi: 'gucci',
};

const PHRASE_FIXES: [RegExp, string][] = [
  [/\bsavage\b/i, 'sauvage'],
  [/\bsauvge\b/i, 'sauvage'],
  [/\bchanell?\b/i, 'chanel'],
  [/\baventous\b/i, 'aventus'],
  [/\bbleu de chanell?\b/i, 'bleu de chanel'],
  [/\bacqua di gi\b/i, 'acqua di gio'],
  [/\btom\s*ford\b/i, 'tom ford'],
  [/\bbaccarat rouge\b/i, 'baccarat rouge 540'],
];

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/** Apply known typo fixes to a search query. */
export function fixQuerySpelling(query: string): string {
  let q = normalizeQuery(query);
  for (const [pattern, replacement] of PHRASE_FIXES) {
    q = q.replace(pattern, replacement);
  }
  const tokens = q.split(' ').map((t) => TOKEN_FIXES[t] ?? t);
  return tokens.join(' ').replace(/\s+/g, ' ').trim();
}

/** Ordered unique search candidates — original first, then corrections. */
export function buildSearchCandidates(query: string): string[] {
  const norm = normalizeQuery(query);
  const fixed = fixQuerySpelling(query);
  const variants = new Set<string>([norm]);
  if (fixed && fixed !== norm) variants.add(fixed);

  // Drop last token and retry (partial word typos)
  const parts = norm.split(' ');
  if (parts.length > 1) {
    variants.add(parts.slice(0, -1).join(' '));
    variants.add(fixQuerySpelling(parts.slice(0, -1).join(' ')));
  }

  // First token only (brand search)
  if (parts.length > 1) variants.add(parts[0]);

  return [...variants].filter(Boolean);
}

export type CatalogHit = { brand: string; name: string };

/** Suggest a cleaner label when results exist but query looks misspelled. */
export function suggestFromResults(query: string, hits: CatalogHit[]): string | null {
  if (!hits.length) return null;
  const q = normalizeQuery(query);
  const top = hits[0];
  const label = `${top.brand} ${parseBaseName(top.name)}`.trim();
  const labelNorm = label.toLowerCase();

  if (labelNorm.includes(q) || q.includes(parseBaseName(top.name).toLowerCase())) return null;

  const qCompact = q.replace(/\s/g, '');
  const labelCompact = labelNorm.replace(/\s/g, '').slice(0, Math.max(qCompact.length + 4, 8));
  const dist = levenshtein(qCompact, labelCompact.slice(0, qCompact.length + 2));

  if (dist <= Math.max(2, Math.floor(qCompact.length / 3))) return label;
  return null;
}
