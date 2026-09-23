import type { Concentration } from '@/types';

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
  return map[c] ?? c;
}
