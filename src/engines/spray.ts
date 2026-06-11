import type { AdvisorInput, Fragrance, SprayGuidance, UserProfile } from '@/types';

const CONC_SPRAYS: Record<string, number> = {
  Cologne: 5,
  EDT: 4,
  EDP: 3,
  Parfum: 2,
  Extrait: 1,
};

export function computeSprayGuidance(
  fragrance: Fragrance,
  input: AdvisorInput,
  profile: UserProfile,
  officeMax: number,
): SprayGuidance {
  let sprays = CONC_SPRAYS[fragrance.concentration] ?? 3;
  const warnings: string[] = [];

  if (input.occasion === 'work' || input.dressLevel === 'professional') {
    sprays = Math.min(sprays, officeMax);
    if (fragrance.projection === 'beast' || fragrance.projection === 'strong') {
      sprays = Math.max(1, sprays - 1);
      warnings.push('Strong projection — reduce sprays for office');
    }
  }
  if (input.occasion === 'date' || input.occasion === 'event') {
    sprays = Math.min(sprays + 1, 6);
  }
  if (input.occasion === 'gym') {
    return {
      totalSprays: 0,
      pulsePoints: [],
      skinAreas: [],
      clothingAreas: [],
      warnings: ['Skip fragrance or use one light spray on clothes only'],
      concentrationNote: 'Active settings need minimal scent',
    };
  }
  if (profile.sensitivity) {
    sprays = Math.max(1, sprays - 1);
    warnings.push('Sensitivity mode — fewer sprays');
  }
  if (profile.projectionComfort === 'skin_scent') {
    sprays = Math.max(1, Math.min(sprays, 2));
  }

  const skinHeavy = ['Parfum', 'EDP'].includes(fragrance.concentration);
  const pulsePoints = ['Neck (sides)', 'Behind ears', 'Inner wrists'];
  const skinAreas = skinHeavy ? ['Chest (1 spray)', 'Neck'] : ['Pulse points only'];
  const clothingAreas =
    fragrance.projection === 'soft' || fragrance.family === 'Oriental'
      ? ['Outer shirt collar', 'Scarf']
      : [];

  return {
    totalSprays: sprays,
    pulsePoints,
    skinAreas,
    clothingAreas,
    warnings,
    concentrationNote: `${fragrance.concentration} typically needs ${CONC_SPRAYS[fragrance.concentration] ?? 3} sprays; adjusted for context`,
  };
}
