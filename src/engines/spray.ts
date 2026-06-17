import type { AdvisorInput, Concentration, Fragrance, SprayGuidance, UserProfile } from '@/types';
import {
  accentLayerZoneIds,
  baseLayerZoneIds,
  buildComprehensiveSprayPlan,
  buildLayeredActiveZones,
  genderToBodyVariant,
  type ActiveSprayZone,
} from '@/lib/sprayZones';

const BASE_SPRAYS: Record<string, number> = {
  Cologne: 6,
  EDT: 5,
  EDP: 4,
  Parfum: 3,
  Extrait: 2,
};

const CONC_RANK: Record<string, number> = {
  Cologne: 1,
  EDT: 2,
  EDP: 3,
  Parfum: 4,
  Extrait: 5,
};

const HEAVY_TAGS = new Set(['oud', 'amber', 'woody', 'vanilla', 'leather', 'smoky', 'sweet']);
const LIGHT_TAGS = new Set(['citrus', 'fresh', 'clean', 'musky', 'floral']);

function zonesToLegacyLists(active: ActiveSprayZone[]) {
  const pulsePoints = active.filter((z) => z.type === 'pulse').map((z) => z.label);
  const skinAreas = active.filter((z) => z.type === 'skin').map((z) => z.label);
  const clothingAreas = active.filter((z) => z.type === 'clothing').map((z) => z.label);
  return { pulsePoints, skinAreas, clothingAreas };
}

function isHeavyConcentration(c: Concentration): boolean {
  return c === 'Parfum' || c === 'Extrait';
}

function isLightConcentration(c: Concentration): boolean {
  return c === 'Cologne' || c === 'EDT';
}

function fragranceWeight(f: Fragrance): number {
  let w = CONC_RANK[f.concentration] ?? 3;
  for (const t of f.layering_tags) {
    if (HEAVY_TAGS.has(t)) w += 0.6;
    if (LIGHT_TAGS.has(t)) w -= 0.35;
  }
  if (f.projection === 'beast' || f.projection === 'strong') w += 0.4;
  if (f.projection === 'soft') w -= 0.2;
  return w;
}

function resolveBaseAccent(a: Fragrance, b: Fragrance): { base: Fragrance; accent: Fragrance } {
  const wa = fragranceWeight(a);
  const wb = fragranceWeight(b);
  if (wa >= wb) return { base: a, accent: b };
  return { base: b, accent: a };
}

function buildApplicationSteps(activeZones: ActiveSprayZone[], layering: boolean): string[] {
  const steps: string[] = ['Hold the bottle 15–20 cm (6–8 in) from skin — press firmly for a full mist.'];

  if (layering) {
    const baseZones = activeZones.filter((z) => z.fragranceRole === 'base' && !z.optional);
    const accentZones = activeZones.filter((z) => z.fragranceRole === 'accent' && !z.optional);
    if (baseZones.length) {
      steps.push(`Step 1 — Base (${baseZones[0].fragranceName ?? 'heavier scent'}):`);
      baseZones.forEach((z) => {
        steps.push(`  · ${z.label}`);
      });
      steps.push('Wait 30 seconds for the base to settle on skin.');
    }
    if (accentZones.length) {
      steps.push(`Step 2 — Top (${accentZones[0].fragranceName ?? 'lighter scent'}):`);
      accentZones.forEach((z) => {
        steps.push(`  · ${z.label}`);
      });
    }
  } else {
    activeZones.filter((z) => !z.optional).forEach((z) => {
      steps.push(`Spray ${z.sprayNumber} — ${z.label}.`);
    });
  }

  const optional = activeZones.filter((z) => z.optional);
  if (optional.length) {
    steps.push('Optional for extra longevity or softer projection:');
    optional.forEach((z) => {
      const kind = z.type === 'clothing' ? ' (on clothes)' : z.id === 'hair' ? ' (hair mist)' : '';
      steps.push(`  · ${z.label}${kind}`);
    });
  }

  if (activeZones.some((z) => z.id.includes('wrist'))) {
    steps.push("Don't rub wrists together — it breaks the top notes.");
  }
  if (activeZones.some((z) => z.type === 'clothing')) {
    steps.push('For clothing, mist outward from 20 cm — one light pass on collar or scarf.');
  }
  if (activeZones.some((z) => z.id === 'hair')) {
    steps.push('Hair: one light pass from 20–25 cm — never soak strands.');
  }

  return steps;
}

function computeSprayCount(
  fragrance: Fragrance,
  input: AdvisorInput,
  profile: UserProfile,
  officeMax: number,
): { sprays: number; warnings: string[] } {
  let sprays = BASE_SPRAYS[fragrance.concentration] ?? 2;
  const warnings: string[] = [];
  const office = input.occasion === 'work' || input.dressLevel === 'professional';

  if (office) {
    sprays = Math.min(sprays, officeMax);
    if (fragrance.projection === 'beast' || fragrance.projection === 'strong') {
      sprays = Math.max(1, sprays - 1);
      warnings.push('Strong projection — use pulse points only in office settings');
    }
  }
  if (input.occasion === 'date' || input.occasion === 'event') {
    sprays = Math.min(sprays + 1, isHeavyConcentration(fragrance.concentration) ? 3 : 5);
  }
  if (profile.sensitivity) {
    sprays = Math.max(1, sprays - 1);
    warnings.push('Sensitivity mode — fewer sprays, avoid chest and hair');
  }
  if (profile.projectionComfort === 'skin_scent') {
    sprays = Math.max(1, Math.min(sprays, 2));
    warnings.push('Skin-scent preference — keep to 1–2 pulse sprays');
  }
  if (isHeavyConcentration(fragrance.concentration)) {
    sprays = Math.min(sprays, 3);
  }

  return { sprays, warnings };
}

export function computeSprayGuidance(
  fragrance: Fragrance,
  input: AdvisorInput,
  profile: UserProfile,
  officeMax: number,
): SprayGuidance {
  const warnings: string[] = [];
  const bodyVariant = genderToBodyVariant(profile.gender);
  const office = input.occasion === 'work' || input.dressLevel === 'professional';
  const dateOrEvent = input.occasion === 'date' || input.occasion === 'event';

  if (input.occasion === 'gym') {
    return {
      totalSprays: 0,
      pulsePoints: [],
      skinAreas: [],
      clothingAreas: [],
      warnings: ['Skip fragrance at the gym — or one light pass on gym shirt only, never skin while sweating'],
      concentrationNote: 'Heat and sweat amplify scent unpredictably',
      bodyVariant,
      activeZones: [],
      applicationSteps: [],
      techniqueNote: 'Best to shower first, then apply after cooling down if needed.',
      isLayered: false,
    };
  }

  const { sprays, warnings: countWarnings } = computeSprayCount(fragrance, input, profile, officeMax);
  warnings.push(...countWarnings);

  const clothingPreferred =
    office ||
    profile.projectionComfort === 'skin_scent' ||
    fragrance.projection === 'soft';
  const hairMist =
    bodyVariant === 'female' &&
    dateOrEvent &&
    !profile.sensitivity &&
    (fragrance.family === 'Floral' || fragrance.gender_lean === 'feminine');

  const zonePlan = buildComprehensiveSprayPlan(bodyVariant, sprays, {
    office,
    dateOrEvent,
    concentrationHeavy: isHeavyConcentration(fragrance.concentration),
    concentrationLight: isLightConcentration(fragrance.concentration),
    clothingPreferred,
    hairMist: hairMist || bodyVariant === 'female' || bodyVariant === 'male',
    strongProjection: fragrance.projection === 'beast' || fragrance.projection === 'strong',
  });

  const activeZones = zonePlan;
  const { pulsePoints, skinAreas, clothingAreas } = zonesToLegacyLists(
    activeZones.filter((z) => !z.optional),
  );

  const techniqueNote = isHeavyConcentration(fragrance.concentration)
    ? `${fragrance.concentration} is concentrated — cover nape, both sides of neck, wrists; skip chest if office.`
    : isLightConcentration(fragrance.concentration)
      ? `${fragrance.concentration} is lighter — full pulse routine plus optional collar or hair for longevity.`
      : 'Full routine: nape, both neck sides, both ears, both wrists — optional chest, collar, or hair mist.';

  return {
    totalSprays: sprays,
    pulsePoints,
    skinAreas,
    clothingAreas,
    warnings,
    concentrationNote: `${fragrance.concentration}: ${sprays} spray${sprays !== 1 ? 's' : ''} for ${office ? 'office' : input.occasion.replace('_', ' ')}`,
    bodyVariant,
    activeZones,
    applicationSteps: buildApplicationSteps(activeZones, false),
    techniqueNote,
    isLayered: false,
  };
}

/** Combined spray map when wearing two fragrances — base on skin, accent on pulse/clothes. */
export function computeLayeringSprayGuidance(
  primary: Fragrance,
  secondary: Fragrance,
  input: AdvisorInput,
  profile: UserProfile,
  _officeMax: number,
): SprayGuidance {
  const bodyVariant = genderToBodyVariant(profile.gender);
  const office = input.occasion === 'work' || input.dressLevel === 'professional';
  const warnings: string[] = ['Layering: use less of each scent than when worn alone'];

  const { base, accent } = resolveBaseAccent(primary, secondary);

  let baseSprays = isHeavyConcentration(base.concentration) ? 2 : 3;
  let accentSprays = isHeavyConcentration(accent.concentration) ? 2 : 3;

  if (office) {
    baseSprays = 2;
    accentSprays = 2;
    warnings.push('Office layering — lighter sprays; collar counts as clothing, not skin');
  }
  if (profile.sensitivity) {
    baseSprays = 2;
    accentSprays = 2;
  }
  if (profile.projectionComfort === 'skin_scent') {
    baseSprays = 2;
    accentSprays = 2;
  }

  const clothingPreferred = office || profile.projectionComfort === 'skin_scent';

  const baseIds = baseLayerZoneIds(bodyVariant, baseSprays, office);
  const accentIds = accentLayerZoneIds(bodyVariant, accentSprays, office, clothingPreferred);

  const activeZones = buildLayeredActiveZones(bodyVariant, baseIds, accentIds, base, accent);
  const totalSprays = activeZones.filter((z) => !z.optional).length;
  const { pulsePoints, skinAreas, clothingAreas } = zonesToLegacyLists(
    activeZones.filter((z) => !z.optional),
  );

  const baseLabel = base.name.split(' ').slice(0, 3).join(' ');
  const accentLabel = accent.name.split(' ').slice(0, 3).join(' ');

  return {
    totalSprays,
    pulsePoints,
    skinAreas,
    clothingAreas,
    warnings,
    concentrationNote: `Layer: ${baseSprays}× ${base.concentration} base + ${accentSprays}× ${accent.concentration} top`,
    bodyVariant,
    activeZones,
    applicationSteps: buildApplicationSteps(activeZones, true),
    techniqueNote: `Apply ${baseLabel} on warm skin first, then ${accentLabel} on pulse points after 30 seconds.`,
    isLayered: true,
    layeringRoles: {
      base: {
        fragranceId: base.id,
        name: base.name,
        brand: base.brand,
        sprays: activeZones.filter((z) => z.fragranceRole === 'base' && !z.optional).length,
      },
      accent: {
        fragranceId: accent.id,
        name: accent.name,
        brand: accent.brand,
        sprays: activeZones.filter((z) => z.fragranceRole === 'accent' && !z.optional).length,
      },
    },
  };
}

export { resolveBaseAccent, fragranceWeight };
