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
import { computeSprayGuidance } from './spray';

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

  const spray = computeSprayGuidance(top.fragrance, input, profile, prefs.officeMaxSprays);
  const reasoning = [
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
    },
    backups,
    layering: layering
      ? {
          primary: top.fragrance,
          secondary: layering.secondary,
          order: layering.order,
          guidance: layering.guidance,
          compatibilityScore: layering.score,
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
