export type Concentration = 'EDT' | 'EDP' | 'Parfum' | 'Cologne' | 'Extrait';
export type Projection = 'soft' | 'moderate' | 'strong' | 'beast';
export type Longevity = 'short' | 'medium' | 'long' | 'eternal';
export type DayNight = 'day' | 'night' | 'versatile';
export type GenderLean = 'masculine' | 'feminine' | 'unisex';
export type BottleLevel = 'full' | '75' | '50' | '25' | '10' | 'empty';
export type BottleType = 'full' | 'decant' | 'travel';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type LayeringTag = 'citrus' | 'woody' | 'amber' | 'vanilla' | 'musky' | 'clean' | 'fresh' | 'spicy' | 'sweet' | 'oud' | 'floral' | 'leather' | 'smoky';

export interface Fragrance {
  id: string;
  name: string;
  brand: string;
  category?: string;
  concentration: Concentration;
  family: string;
  subfamily: string;
  projection: Projection;
  longevity: Longevity;
  seasonality: Season[];
  day_night: DayNight;
  gender_lean: GenderLean;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  office_score: number;
  heat_score: number;
  cold_score: number;
  date_score: number;
  formal_score: number;
  casual_score: number;
  layering_tags: string[];
  image?: string;
}

export interface CollectionItem {
  id: string;
  fragranceId: string;
  bottleLevel: BottleLevel;
  /** Full bottle, decant sample, or travel-size linked to a parent bottle */
  bottleType?: BottleType;
  /** Parent collection item ID when bottleType is decant or travel */
  parentCollectionId?: string;
  bottleSizeMl?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  openedDate?: string;
  isFavorite: boolean;
  isSignature: boolean;
  signatureRole?: SignatureRole;
  seasonalStatus?: Season[];
  photoBlobId?: string;
  addedAt: string;
  estimatedWearsRemaining?: number;
}

export type SignatureRole = 'work' | 'date' | 'summer' | 'winter' | 'weekend';

export interface WearRecord {
  id: string;
  collectionId: string;
  fragranceId: string;
  wornAt: string;
  occasion?: string;
  dressLevel?: string;
  sprays?: number;
  rating?: number;
  compliment?: boolean;
  notes?: string;
  layeredWith?: string;
}

export interface UserProfile {
  id: 'profile';
  gender: 'man' | 'woman' | 'nonbinary' | 'prefer_not';
  ageRange: 'under18' | '18-24' | '25-34' | '35-44' | '45plus';
  skinType: 'dry' | 'normal' | 'oily';
  sensitivity: boolean;
  workContext: 'office' | 'hybrid' | 'wfh' | 'student' | 'other';
  dressStyle: 'casual' | 'smart_casual' | 'formal';
  projectionComfort: 'skin_scent' | 'moderate' | 'bold';
  lat?: number;
  lon?: number;
  cityLabel?: string;
  onboardingComplete: boolean;
}

export type WishlistList = 'want' | 'tested';

export interface WishlistItem {
  id: string;
  fragranceId: string;
  list: WishlistList;
  addedAt: string;
  notes?: string;
}

export interface Preferences {
  id: 'preferences';
  officeMaxSprays: number;
  officeSafeMode: boolean;
  theme: 'dark' | 'light' | 'system';
  signatures: Partial<Record<SignatureRole, string>>;
  demoMode?: boolean;
  /** Bumped when bundled catalog is regenerated — triggers merge reload */
  seedVersion?: number;
  /** Last 5 fragrance IDs added to collection (for catalog recents) */
  recentAdditions?: string[];
}

export const CONCENTRATIONS: Concentration[] = ['Cologne', 'EDT', 'EDP', 'Parfum', 'Extrait'];

export interface WeatherCache {
  id: string;
  date: string;
  tempC: number;
  humidity: number;
  windKmh: number;
  condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'windy' | 'hot' | 'cold';
  fetchedAt: string;
}

export interface LayeringProfile {
  id: string;
  primaryId: string;
  secondaryId: string;
  score: number;
  order: string;
  guidance: string;
  savedAt?: string;
  name?: string;
}

export interface AdvisorInput {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  occasion: 'work' | 'casual' | 'date' | 'event' | 'home' | 'gym';
  dressLevel: 'casual' | 'smart_casual' | 'semi_formal' | 'formal' | 'professional';
  vibe: 'fresh' | 'warm' | 'bold' | 'subtle' | 'romantic' | 'confident';
}

export interface SprayGuidance {
  totalSprays: number;
  pulsePoints: string[];
  skinAreas: string[];
  clothingAreas: string[];
  warnings: string[];
  concentrationNote: string;
}

export interface AdvisorResult {
  primary: { collectionId: string; fragrance: Fragrance; score: number };
  backups: { collectionId: string; fragrance: Fragrance; score: number }[];
  layering?: {
    primary: Fragrance;
    secondary: Fragrance;
    order: string;
    guidance: string;
    compatibilityScore: number;
  };
  spray: SprayGuidance;
  reasoning: string[];
  fragranceScore: number;
}

export interface CollectionStats {
  totalBottles: number;
  totalValue: number;
  totalVolumeMl: number;
  designerCount: number;
  nicheCount: number;
  middleEasternCount: number;
}
