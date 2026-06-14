import { saveLayeringProfile } from '@/db';
import type { AdvisorResult, LayeringProfile } from '@/types';
import { uid } from '@/lib/utils';

/** Save an advisor layering suggestion to Layering Lab */
export async function saveAdvisorLayering(result: AdvisorResult): Promise<LayeringProfile | null> {
  if (!result.layering) return null;
  const profile: LayeringProfile = {
    id: uid(),
    primaryId: result.primary.fragrance.id,
    secondaryId: result.layering.secondary.id,
    score: result.layering.compatibilityScore,
    order: result.layering.order,
    guidance: result.layering.guidance,
    savedAt: new Date().toISOString(),
    name: `${result.primary.fragrance.name} + ${result.layering.secondary.name}`,
  };
  await saveLayeringProfile(profile);
  return profile;
}
