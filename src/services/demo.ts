import {
  addToCollection,
  clearUserData,
  logWear,
  savePreferences,
  saveProfile,
  saveWeatherCache,
} from '@/db';
import { ensureSeedLoaded } from '@/services/seed';
import { todayKey, uid } from '@/lib/utils';
import type { BottleLevel, CollectionItem, Preferences, UserProfile, WearRecord } from '@/types';

const DEMO_FRAGRANCES: { id: string; level: BottleLevel; favorite?: boolean; signature?: boolean }[] = [
  { id: 'dior-sauvage-edp', level: '75', favorite: true, signature: true },
  { id: 'chanel-bleu-de-chanel-edp', level: '50', favorite: true },
  { id: 'armani-acqua-di-gio-edp', level: 'full' },
  { id: 'ysl-y-edp', level: '75' },
  { id: 'creed-aventus', level: '25', favorite: true },
  { id: 'tom-ford-ombre-leather', level: '50' },
  { id: 'mfk-baccarat-rouge-540', level: '25' },
  { id: 'lattafa-khamrah', level: 'full' },
  { id: 'prada-aura-211', level: '75' },
  { id: 'dolce-gabbana-code-241', level: '50' },
  { id: 'versace-nuit-139', level: '75' },
  { id: 'chanel-nuit-rose-51', level: '50' },
];

const OCCASIONS = ['work', 'casual', 'date', 'event', 'home'] as const;
const DRESS_LEVELS = ['casual', 'smart_casual', 'professional', 'formal'] as const;

function wornAtDaysAgo(daysAgo: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 30, 0, 0);
  return d.toISOString();
}

function buildWearHistory(collection: CollectionItem[]): WearRecord[] {
  const records: WearRecord[] = [];
  const wearDays = [0, 1, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 21, 22, 24, 26, 27, 28, 29];
  const hours = [7, 8, 9, 17, 18, 19, 20];

  wearDays.forEach((day, i) => {
    const item = collection[i % collection.length];
    const occasion = OCCASIONS[i % OCCASIONS.length];
    records.push({
      id: uid(),
      collectionId: item.id,
      fragranceId: item.fragranceId,
      wornAt: wornAtDaysAgo(day, hours[i % hours.length]),
      occasion,
      dressLevel: occasion === 'work' ? 'professional' : DRESS_LEVELS[i % DRESS_LEVELS.length],
      sprays: occasion === 'work' ? 2 + (i % 2) : 3 + (i % 3),
      rating: 3 + (i % 3),
      compliment: i % 4 === 0,
    });
  });

  return records.sort((a, b) => b.wornAt.localeCompare(a.wornAt));
}

export async function loadDemoData(): Promise<void> {
  await ensureSeedLoaded();
  await clearUserData();

  const now = new Date().toISOString();
  const collection: CollectionItem[] = DEMO_FRAGRANCES.map((f) => ({
    id: uid(),
    fragranceId: f.id,
    bottleLevel: f.level,
    bottleSizeMl: 100,
    isFavorite: Boolean(f.favorite),
    isSignature: Boolean(f.signature),
    signatureRole: f.signature ? 'work' as const : undefined,
    addedAt: now,
  }));

  for (const item of collection) {
    await addToCollection(item);
  }

  const workSignature = collection.find((c) => c.isSignature);
  const profile: UserProfile = {
    id: 'profile',
    gender: 'man',
    ageRange: '25-34',
    skinType: 'normal',
    sensitivity: false,
    workContext: 'office',
    dressStyle: 'smart_casual',
    projectionComfort: 'moderate',
    lat: 40.7128,
    lon: -74.006,
    cityLabel: 'New York City',
    onboardingComplete: true,
  };
  await saveProfile(profile);

  const prefs: Preferences = {
    id: 'preferences',
    officeMaxSprays: 3,
    officeSafeMode: false,
    theme: 'dark',
    demoMode: true,
    signatures: workSignature ? { work: workSignature.id } : {},
  };
  await savePreferences(prefs);

  const date = todayKey();
  await saveWeatherCache({
    id: date,
    date,
    tempC: 18,
    humidity: 55,
    windKmh: 12,
    condition: 'clear',
    fetchedAt: now,
  });

  for (const record of buildWearHistory(collection)) {
    await logWear(record);
  }
}

export async function exitDemo(): Promise<void> {
  await clearUserData();
}
