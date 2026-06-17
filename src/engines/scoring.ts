import type { AdvisorInput, CollectionItem, Fragrance, Preferences, UserProfile, WeatherCache, WearRecord } from '@/types';

export interface ScoreBreakdown {
  total: number;
  occasion: number;
  weather: number;
  dress: number;
  vibe: number;
  profile: number;
  rotation: number;
  repeatPenalty: number;
  projectionPenalty: number;
  signatureBonus: number;
  personalBonus: number;
  reasons: string[];
}

const OCCASION_MAP: Record<AdvisorInput['occasion'], (f: Fragrance) => number> = {
  work: (f) => f.office_score,
  casual: (f) => f.casual_score,
  date: (f) => f.date_score,
  event: (f) => f.formal_score,
  home: (f) => f.casual_score * 0.9,
  gym: (f) => f.heat_score * 0.3,
};

const DRESS_MAP: Record<AdvisorInput['dressLevel'], (f: Fragrance) => number> = {
  casual: (f) => f.casual_score,
  smart_casual: (f) => (f.casual_score + f.formal_score) / 2,
  semi_formal: (f) => f.formal_score * 0.85,
  formal: (f) => f.formal_score,
  professional: (f) => f.office_score,
};

const VIBE_MAP: Record<AdvisorInput['vibe'], (f: Fragrance) => number> = {
  fresh: (f) => (f.heat_score + f.casual_score) / 2,
  warm: (f) => (f.cold_score + f.date_score) / 2,
  bold: (f) => f.projection === 'beast' ? 95 : f.projection === 'strong' ? 80 : 40,
  subtle: (f) => f.projection === 'soft' ? 95 : f.projection === 'moderate' ? 70 : 25,
  romantic: (f) => f.date_score,
  confident: (f) => (f.formal_score + f.date_score) / 2,
};

function weatherScore(f: Fragrance, w?: WeatherCache | null): { score: number; reason?: string } {
  if (!w) return { score: 50 };
  switch (w.condition) {
    case 'hot':
      return { score: f.heat_score, reason: `Heat (${w.tempC}°C) favors lighter scents` };
    case 'cold':
      return { score: f.cold_score, reason: `Cold (${w.tempC}°C) suits richer fragrances` };
    case 'rain':
      return { score: (f.cold_score + f.longevity === 'long' ? 85 : 60), reason: 'Rain calls for better longevity' };
    case 'windy':
      return { score: f.projection === 'strong' || f.projection === 'beast' ? 75 : 55, reason: 'Wind needs moderate projection' };
    default:
      return { score: (f.heat_score + f.cold_score) / 2 };
  }
}

function timeBonus(f: Fragrance, time: AdvisorInput['timeOfDay']): number {
  if (f.day_night === 'versatile') return 70;
  if (time === 'morning' || time === 'afternoon') return f.day_night === 'day' ? 90 : 35;
  return f.day_night === 'night' ? 90 : 40;
}

function profileScore(f: Fragrance, profile: UserProfile): number {
  let s = 50;
  if (profile.gender === 'man' && f.gender_lean === 'masculine') s += 20;
  if (profile.gender === 'woman' && f.gender_lean === 'feminine') s += 20;
  if (profile.gender === 'nonbinary' || f.gender_lean === 'unisex') s += 15;
  if (profile.projectionComfort === 'skin_scent' && f.projection === 'soft') s += 25;
  if (profile.projectionComfort === 'bold' && (f.projection === 'strong' || f.projection === 'beast')) s += 20;
  if (profile.sensitivity && (f.projection === 'beast' || f.projection === 'strong')) s -= 30;
  return Math.max(0, Math.min(100, s));
}

function repeatPenalty(fragranceId: string, history: WearRecord[]): { penalty: number; daysSince?: number } {
  const recent = history
    .filter((h) => h.fragranceId === fragranceId)
    .sort((a, b) => b.wornAt.localeCompare(a.wornAt))[0];
  if (!recent) return { penalty: 0 };
  const days = Math.floor((Date.now() - new Date(recent.wornAt).getTime()) / 86400000);
  if (days === 0) return { penalty: 40, daysSince: 0 };
  if (days === 1) return { penalty: 25, daysSince: 1 };
  if (days <= 3) return { penalty: 12, daysSince: days };
  if (days >= 21) return { penalty: -15, daysSince: days };
  return { penalty: 0, daysSince: days };
}

function personalHistoryBonus(fragranceId: string, history: WearRecord[]): { bonus: number; reason?: string } {
  const wears = history.filter((h) => h.fragranceId === fragranceId);
  if (!wears.length) return { bonus: 0 };

  const rated = wears.filter((h) => h.rating != null);
  if (rated.length >= 2) {
    const avg = rated.reduce((s, h) => s + (h.rating ?? 0), 0) / rated.length;
    if (avg >= 4) return { bonus: 18, reason: `You rate this highly (${avg.toFixed(1)}/5 avg)` };
    if (avg <= 2) return { bonus: -22, reason: `Low past ratings (${avg.toFixed(1)}/5 avg)` };
    if (avg >= 3.5) return { bonus: 8, reason: 'Solid track record in your log' };
  }

  const compliments = wears.filter((h) => h.compliment).length;
  if (compliments >= 2) return { bonus: 12, reason: `${compliments} complimented wears` };
  if (compliments === 1) return { bonus: 6, reason: 'Got compliments before' };

  return { bonus: 0 };
}

function projectionPenalty(f: Fragrance, input: AdvisorInput, _prefs: Preferences): number {
  if (input.occasion !== 'work' && input.dressLevel !== 'professional') return 0;
  const proj = { soft: 0, moderate: 5, strong: 18, beast: 35 }[f.projection];
  if (f.office_score < 50) return proj + 20;
  return proj;
}

function signatureBonus(item: CollectionItem, prefs: Preferences, _input: AdvisorInput): number {
  if (!item.isSignature) return 0;
  const role = item.signatureRole;
  const sigId = role ? prefs.signatures[role] : undefined;
  if (sigId === item.fragranceId) return 25;
  if (item.isSignature) return 12;
  return 0;
}

export function scoreFragrance(
  fragrance: Fragrance,
  item: CollectionItem,
  input: AdvisorInput,
  profile: UserProfile,
  prefs: Preferences,
  weather: WeatherCache | null,
  history: WearRecord[],
): ScoreBreakdown {
  const reasons: string[] = [];
  const occasion = OCCASION_MAP[input.occasion](fragrance) * 0.25;
  const dress = DRESS_MAP[input.dressLevel](fragrance) * 0.2;
  const vibe = VIBE_MAP[input.vibe](fragrance) * 0.15;
  const { score: wScore, reason: wReason } = weatherScore(fragrance, weather);
  const weatherPts = wScore * 0.2;
  const profilePts = profileScore(fragrance, profile) * 0.1;
  const timePts = timeBonus(fragrance, input.timeOfDay) * 0.1;
  const { penalty: repeat, daysSince } = repeatPenalty(fragrance.id, history);
  const projPen = projectionPenalty(fragrance, input, prefs);
  const sigBonus = signatureBonus(item, prefs, input);
  const rotation = daysSince && daysSince >= 14 ? 10 : 0;
  const { bonus: personalBonus, reason: personalReason } = personalHistoryBonus(fragrance.id, history);

  if (wReason) reasons.push(wReason);
  if (repeat > 0) reasons.push(`Worn recently (${daysSince ?? 0}d ago)`);
  if (rotation > 0) reasons.push('Rotation boost — neglected bottle');
  if (sigBonus > 0) reasons.push('Signature scent match');
  if (personalReason) reasons.push(personalReason);

  const total = Math.round(
    occasion + dress + vibe + weatherPts + profilePts + timePts + rotation + sigBonus + personalBonus - repeat - projPen,
  );

  return {
    total: Math.max(0, Math.min(100, total)),
    occasion: Math.round(occasion),
    weather: Math.round(weatherPts),
    dress: Math.round(dress),
    vibe: Math.round(vibe),
    profile: Math.round(profilePts),
    rotation,
    repeatPenalty: repeat,
    projectionPenalty: projPen,
    signatureBonus: sigBonus,
    personalBonus,
    reasons,
  };
}
