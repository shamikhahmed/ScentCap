/** House / flacon monogram helpers (SCNT-P1-01). */

const SKIP = new Set([
  'a', 'an', 'the', 'and', 'of', '&',
  'de', 'di', 'du', 'des', 'da', 'do',
  'la', 'le', 'les', 'el', 'los', 'las',
  'von', 'van', 'der', 'den', 'ter', 'ten',
  'y', 'e',
]);

/**
 * Initials from brand (+ optional fragrance name), skipping & / articles / particles.
 * Caps at 3 characters for the etched flacon mark.
 */
export function flaconInitials(brand?: string, name?: string): string {
  const source = [brand, name].filter(Boolean).join(' ');
  if (!source.trim()) return 'SC';
  const parts = source
    .split(/[\s/|,+]+|(?=&)|(?<=&)/)
    .map((p) => p.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean)
    .filter((p) => !SKIP.has(p.toLowerCase()));
  const letters = parts.map((p) => p.charAt(0).toUpperCase());
  const joined = letters.join('').slice(0, 3);
  return joined || 'SC';
}

/** Short etched label under the monogram — decorative; keep short for fit. */
export function flaconEtchedLabel(brand?: string): string {
  const raw = (brand ?? 'ScentCap').trim();
  if (raw.length <= 14) return raw;
  return `${raw.slice(0, 13)}…`;
}
