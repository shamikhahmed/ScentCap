import { getFragrance } from '@/db';
import type {
  AdvisorInput,
  AdvisorResult,
  CollectionItem,
  Fragrance,
  Preferences,
  UserProfile,
  WeatherCache,
  WearRecord,
} from '@/types';
import { findBestLayering } from './layering';
import { scoreFragrance } from './scoring';
import { computeLayeringSprayGuidance, computeSprayGuidance } from './spray';

export async function runAdvisor(
  collection: CollectionItem[],
  input: AdvisorInput,
  profile: UserProfile,
  prefs: Preferences,
  weather: WeatherCache | null,
  history: WearRecord[],
): Promise<AdvisorResult | null> {
  const pairs: { item: CollectionItem; fragrance: Fragrance; breakdown: ReturnType<typeof scoreFragrance> }[] = [];

  for (const item of collection) {
    if (item.bottleLevel === 'empty') continue;
    const fragrance = await getFragrance(item.fragranceId);
    if (!fragrance) continue;
    if (prefs.officeSafeMode && (input.occasion === 'work' || input.dressLevel === 'professional')) {
      if (fragrance.office_score < 65 || fragrance.projection === 'beast') continue;
    }
    const breakdown = scoreFragrance(fragrance, item, input, profile, prefs, weather, history);
    pairs.push({ item, fragrance, breakdown });
  }

  if (!pairs.length) return null;

  pairs.sort((a, b) => b.breakdown.total - a.breakdown.total);
  const top = pairs[0];
  const backups = pairs.slice(1, 4).map((p) => ({
    collectionId: p.item.id,
    fragrance: p.fragrance,
    score: p.breakdown.total,
  }));

  const layering = findBestLayering(
    top.fragrance,
    pairs.slice(1, 8).map((p) => p.fragrance),
  );

  const spray = layering
    ? computeLayeringSprayGuidance(
        top.fragrance,
        layering.secondary,
        input,
        profile,
        prefs.officeMaxSprays,
      )
    : computeSprayGuidance(top.fragrance, input, profile, prefs.officeMaxSprays);
  const reasoning = [
    summarizePick(top.fragrance, input, weather, history, top.item.id),
    `${top.fragrance.brand} ${top.fragrance.name} scored ${top.breakdown.total}/100`,
    ...top.breakdown.reasons,
    `Occasion fit: ${top.breakdown.occasion}/25`,
    `Weather fit: ${top.breakdown.weather}/20`,
  ];

  return {
    primary: {
      collectionId: top.item.id,
      fragrance: top.fragrance,
      score: top.breakdown.total,
      breakdown: top.breakdown,
    },
    backups,
    layering: layering
      ? {
          primary: top.fragrance,
          secondary: layering.secondary,
          order: layering.order,
          guidance: layering.guidance,
          compatibilityScore: layering.score,
          baseFragranceId: layering.baseFragranceId,
          accentFragranceId: layering.accentFragranceId,
        }
      : undefined,
    spray,
    reasoning,
    fragranceScore: top.breakdown.total,
  };
}

export function defaultAdvisorInput(): AdvisorInput {
  const h = new Date().getHours();
  const timeOfDay =
    h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
  return {
    timeOfDay,
    occasion: 'work',
    dressLevel: 'smart_casual',
    vibe: 'fresh',
  };
}

const OCCASION_PHRASE: Record<AdvisorInput['occasion'], string> = {
  work: 'at work',
  casual: 'for an easy day',
  date: 'for a date',
  event: 'for the event',
  home: 'around the house',
  gym: 'after the gym',
};

/** One human sentence explaining the pick (first line of reasoning; shown on the Today card). */
export function summarizePick(
  f: Fragrance,
  input: AdvisorInput,
  weather: WeatherCache | null,
  history: WearRecord[],
  collectionId: string,
): string {
  const character =
    f.family === 'Fresh' ? 'Bright and clean' :
    f.family === 'Floral' ? 'Soft and floral' :
    f.family === 'Woody' ? 'Warm, dry woods' :
    f.family === 'Gourmand' ? 'Rich and inviting' :
    'Warm and spiced';
  let when = `${input.timeOfDay}`;
  if (weather) {
    const t = Math.round(weather.tempC);
    const feel = t >= 28 ? 'hot' : t >= 20 ? 'warm' : t >= 12 ? 'mild' : 'cold';
    when = `a ${feel} ${t}° ${input.timeOfDay}`;
  }
  const last = history
    .filter((h) => h.collectionId === collectionId)
    .sort((a, b) => b.wornAt.localeCompare(a.wornAt))[0];
  const days = last ? Math.floor((Date.now() - new Date(last.wornAt).getTime()) / 86_400_000) : null;
  const tail =
    days === null ? ' — and you haven’t worn it yet.' :
    days >= 10 ? ` — last worn ${days} days ago.` :
    '.';
  return `${character}, right for ${when} ${OCCASION_PHRASE[input.occasion]}${tail}`;
}
