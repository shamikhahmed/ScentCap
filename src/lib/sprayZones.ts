import type { UserProfile } from '@/types';

export type BodyVariant = 'male' | 'female' | 'neutral';
export type SprayZoneId =
  | 'ear-left'
  | 'ear-right'
  | 'neck-back'
  | 'neck-left'
  | 'neck-right'
  | 'chest'
  | 'wrist-left'
  | 'wrist-right'
  | 'elbow-left'
  | 'elbow-right'
  | 'collar'
  | 'hair'
  | 'abdomen';

export type SprayZoneType = 'pulse' | 'skin' | 'clothing';

export interface SprayZoneDef {
  id: SprayZoneId;
  label: string;
  shortLabel: string;
  type: SprayZoneType;
  /** Position in viewBox coordinates (240 × 520) */
  x: number;
  y: number;
}

export interface ActiveSprayZone {
  id: SprayZoneId;
  label: string;
  shortLabel: string;
  type: SprayZoneType;
  /** 0 = optional / not counted in totalSprays */
  sprayNumber: number;
  optional?: boolean;
  /** Set when layering — which scent goes here */
  fragranceRole?: 'base' | 'accent';
  fragranceName?: string;
  fragranceBrand?: string;
}

const MALE_ZONES: SprayZoneDef[] = [
  { id: 'ear-left', label: 'Behind left ear', shortLabel: 'L ear', type: 'pulse', x: 92, y: 68 },
  { id: 'ear-right', label: 'Behind right ear', shortLabel: 'R ear', type: 'pulse', x: 148, y: 68 },
  { id: 'neck-back', label: 'Back of neck (nape)', shortLabel: 'Nape', type: 'pulse', x: 120, y: 82 },
  { id: 'neck-left', label: 'Left side of neck', shortLabel: 'L neck', type: 'pulse', x: 108, y: 98 },
  { id: 'neck-right', label: 'Right side of neck', shortLabel: 'R neck', type: 'pulse', x: 132, y: 98 },
  { id: 'chest', label: 'Center chest', shortLabel: 'Chest', type: 'skin', x: 120, y: 168 },
  { id: 'wrist-left', label: 'Inner left wrist', shortLabel: 'L wrist', type: 'pulse', x: 52, y: 268 },
  { id: 'wrist-right', label: 'Inner right wrist', shortLabel: 'R wrist', type: 'pulse', x: 188, y: 268 },
  { id: 'elbow-left', label: 'Inner left elbow', shortLabel: 'L elbow', type: 'pulse', x: 64, y: 228 },
  { id: 'elbow-right', label: 'Inner right elbow', shortLabel: 'R elbow', type: 'pulse', x: 176, y: 228 },
  { id: 'collar', label: 'Shirt collar / lapels', shortLabel: 'Collar', type: 'clothing', x: 120, y: 142 },
  { id: 'hair', label: 'Hair mist (20 cm away)', shortLabel: 'Hair', type: 'skin', x: 120, y: 38 },
  { id: 'abdomen', label: 'Upper abdomen', shortLabel: 'Torso', type: 'skin', x: 120, y: 218 },
];

const FEMALE_ZONES: SprayZoneDef[] = [
  { id: 'ear-left', label: 'Behind left ear', shortLabel: 'L ear', type: 'pulse', x: 94, y: 66 },
  { id: 'ear-right', label: 'Behind right ear', shortLabel: 'R ear', type: 'pulse', x: 146, y: 66 },
  { id: 'neck-back', label: 'Back of neck (nape)', shortLabel: 'Nape', type: 'pulse', x: 120, y: 80 },
  { id: 'neck-left', label: 'Left side of neck', shortLabel: 'L neck', type: 'pulse', x: 110, y: 96 },
  { id: 'neck-right', label: 'Right side of neck', shortLabel: 'R neck', type: 'pulse', x: 130, y: 96 },
  { id: 'chest', label: 'Décolletage / upper chest', shortLabel: 'Chest', type: 'skin', x: 120, y: 162 },
  { id: 'wrist-left', label: 'Inner left wrist', shortLabel: 'L wrist', type: 'pulse', x: 54, y: 262 },
  { id: 'wrist-right', label: 'Inner right wrist', shortLabel: 'R wrist', type: 'pulse', x: 186, y: 262 },
  { id: 'elbow-left', label: 'Inner left elbow', shortLabel: 'L elbow', type: 'pulse', x: 66, y: 222 },
  { id: 'elbow-right', label: 'Inner right elbow', shortLabel: 'R elbow', type: 'pulse', x: 174, y: 222 },
  { id: 'collar', label: 'Blouse collar / scarf', shortLabel: 'Collar', type: 'clothing', x: 120, y: 138 },
  { id: 'hair', label: 'Hair mist (20 cm away)', shortLabel: 'Hair', type: 'skin', x: 120, y: 38 },
];

const NEUTRAL_ZONES: SprayZoneDef[] = MALE_ZONES.map((z) => ({ ...z }));

export function genderToBodyVariant(gender: UserProfile['gender']): BodyVariant {
  if (gender === 'woman') return 'female';
  if (gender === 'man') return 'male';
  return 'neutral';
}

export function bodyVariantLabel(variant: BodyVariant): string {
  if (variant === 'female') return 'Female body map';
  if (variant === 'male') return 'Male body map';
  return 'Body map';
}

export function getZoneCatalog(variant: BodyVariant): SprayZoneDef[] {
  if (variant === 'female') return FEMALE_ZONES;
  if (variant === 'male') return MALE_ZONES;
  return NEUTRAL_ZONES;
}

export function zoneById(variant: BodyVariant, id: SprayZoneId): SprayZoneDef | undefined {
  return getZoneCatalog(variant).find((z) => z.id === id);
}

function uniqueIds(ids: SprayZoneId[]): SprayZoneId[] {
  return [...new Set(ids)];
}

export type SprayContext = {
  office: boolean;
  dateOrEvent: boolean;
  concentrationHeavy: boolean;
  concentrationLight: boolean;
  clothingPreferred: boolean;
  hairMist: boolean;
  strongProjection: boolean;
};

/** Base zones — warm skin (layering step 1), full neck + chest */
export function baseLayerZoneIds(variant: BodyVariant, count: number, office: boolean): SprayZoneId[] {
  if (count <= 0) return [];
  const chain: SprayZoneId[] = office
    ? ['neck-back', 'neck-left', 'neck-right', 'chest', 'collar']
    : variant === 'female'
      ? ['neck-back', 'neck-left', 'neck-right', 'chest']
      : ['neck-back', 'neck-left', 'neck-right', 'chest'];
  return uniqueIds(chain).slice(0, Math.max(count, office ? 2 : 3));
}

/** Accent zones — pulse, hair, clothing (layering step 2) */
export function accentLayerZoneIds(
  variant: BodyVariant,
  count: number,
  office: boolean,
  _clothingPreferred: boolean,
): SprayZoneId[] {
  if (count <= 0) return [];
  const chain: SprayZoneId[] = office
    ? ['ear-left', 'ear-right', 'wrist-left', 'wrist-right', 'collar']
    : ['ear-left', 'ear-right', 'wrist-left', 'wrist-right', 'hair', 'collar'];
  if (variant === 'male') {
    chain.splice(chain.indexOf('hair'), 1);
  }
  return uniqueIds(chain).slice(0, Math.max(count, office ? 3 : 4));
}

/** Full application guide — every standard point shown; first N are numbered sprays. */
export function buildComprehensiveSprayPlan(
  variant: BodyVariant,
  totalSprays: number,
  opts: SprayContext,
): ActiveSprayZone[] {
  const catalog = getZoneCatalog(variant);

  // Complete bilateral routine (always visible on the map)
  let guideOrder: SprayZoneId[] = [
    'neck-back',
    'neck-left',
    'neck-right',
    'ear-left',
    'ear-right',
    'wrist-left',
    'wrist-right',
    'chest',
    'collar',
    'hair',
  ];

  if (opts.office || opts.clothingPreferred) {
    guideOrder = [
      'neck-back',
      'neck-left',
      'neck-right',
      'ear-left',
      'ear-right',
      'wrist-left',
      'wrist-right',
      'collar',
      'hair',
    ];
  }

  if (opts.concentrationHeavy) {
    guideOrder = [
      'neck-back',
      'neck-left',
      'neck-right',
      'ear-left',
      'ear-right',
      'wrist-left',
      'wrist-right',
      'collar',
    ];
  }

  if (opts.dateOrEvent) {
    guideOrder = [
      'neck-back',
      'neck-left',
      'neck-right',
      'ear-left',
      'ear-right',
      'chest',
      'wrist-left',
      'wrist-right',
      'hair',
      'collar',
    ];
  }

  if (opts.office || opts.strongProjection || opts.concentrationHeavy) {
    guideOrder = guideOrder.filter((id) => id !== 'chest');
  }
  if (opts.office && !opts.hairMist) {
    // Still show hair as optional tip
  }
  if (variant === 'male' && !opts.dateOrEvent && !opts.hairMist) {
    // Keep hair in guide as optional for longevity tip
  }

  guideOrder = uniqueIds(guideOrder);

  let sprayCounter = 0;
  return guideOrder
    .map((id) => {
      const def = catalog.find((z) => z.id === id);
      if (!def) return null;
      const isActive = sprayCounter < totalSprays;
      if (isActive) sprayCounter += 1;
      return {
        id: def.id,
        label: def.label,
        shortLabel: def.shortLabel,
        type: def.type,
        sprayNumber: isActive ? sprayCounter : 0,
        optional: !isActive,
      };
    })
    .filter(Boolean) as ActiveSprayZone[];
}

/** @deprecated use buildComprehensiveSprayPlan */
export function pickActiveZoneIds(
  variant: BodyVariant,
  totalSprays: number,
  opts: SprayContext,
): SprayZoneId[] {
  return buildComprehensiveSprayPlan(variant, totalSprays, opts)
    .filter((z) => !z.optional)
    .map((z) => z.id);
}

export function buildActiveZones(
  variant: BodyVariant,
  ids: SprayZoneId[],
  meta?: Partial<Pick<ActiveSprayZone, 'fragranceRole' | 'fragranceName' | 'fragranceBrand'>>,
): ActiveSprayZone[] {
  const catalog = getZoneCatalog(variant);
  return ids
    .map((id, i) => {
      const def = catalog.find((z) => z.id === id);
      if (!def) return null;
      return {
        id: def.id,
        label: def.label,
        shortLabel: def.shortLabel,
        type: def.type,
        sprayNumber: i + 1,
        ...meta,
      };
    })
    .filter(Boolean) as ActiveSprayZone[];
}

export function buildLayeredActiveZones(
  variant: BodyVariant,
  baseIds: SprayZoneId[],
  accentIds: SprayZoneId[],
  base: { name: string; brand: string },
  accent: { name: string; brand: string },
): ActiveSprayZone[] {
  const baseShort = shortFragranceName(base.name, base.brand);
  const accentShort = shortFragranceName(accent.name, accent.brand);
  const catalog = getZoneCatalog(variant);
  const baseSet = new Set(baseIds);
  const accentSet = new Set(accentIds);

  const orderedActive = uniqueIds([...baseIds, ...accentIds.filter((id) => !baseSet.has(id))]);
  const extras: SprayZoneId[] = [];
  for (const extra of ['collar', 'hair'] as SprayZoneId[]) {
    if (!orderedActive.includes(extra) && catalog.some((z) => z.id === extra)) {
      extras.push(extra);
    }
  }
  const allIds = [...orderedActive, ...extras];

  let step = 0;
  return allIds
    .map((id) => {
      const def = catalog.find((z) => z.id === id);
      if (!def) return null;
      const isBase = baseSet.has(id);
      const isAccent = accentSet.has(id);
      const isActive = isBase || isAccent;
      if (isActive) step += 1;
      return {
        id: def.id,
        label: def.label,
        shortLabel: def.shortLabel,
        type: def.type,
        sprayNumber: isActive ? step : 0,
        optional: !isActive,
        fragranceRole: isBase ? ('base' as const) : isAccent ? ('accent' as const) : undefined,
        fragranceName: isBase ? baseShort : isAccent ? accentShort : undefined,
        fragranceBrand: isBase ? base.brand : isAccent ? accent.brand : undefined,
      };
    })
    .filter(Boolean) as ActiveSprayZone[];
}

function shortFragranceName(name: string, brand: string): string {
  const stripped = name.replace(new RegExp(`^${brand}\\s*`, 'i'), '').trim();
  const words = (stripped || name).split(/\s+/);
  return words.slice(0, 2).join(' ');
}
