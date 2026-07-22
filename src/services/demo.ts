import {
  addToCollection,
  clearUserData,
  logWear,
  putFragrance,
  savePreferences,
  saveProfile,
  saveWeatherCache,
} from '@/db';
import { DEMO_BOTTLE_META, DEMO_FRAGRANCES } from '@/data/demoFragrances';
import { markDemoSession } from '@/lib/demoMode';
import { todayKey, uid } from '@/lib/utils';
import type { CollectionItem, Preferences, UserProfile, WearRecord } from '@/types';

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

/** Load offline demo wardrobe — no network calls (fixes onboarding loader hang). */
export async function loadDemoData(): Promise<void> {
  await clearUserData();
  markDemoSession();

  const bySlug = new Map(DEMO_FRAGRANCES.map((f) => [f.catalogSlug!, f]));
  for (const f of DEMO_FRAGRANCES) {
    await putFragrance(f);
  }

  const now = new Date().toISOString();
  const collection: CollectionItem[] = [];

  for (const meta of DEMO_BOTTLE_META) {
    const f = bySlug.get(meta.catalogSlug);
    if (!f) continue;
    const item: CollectionItem = {
      id: uid(),
      fragranceId: f.id,
      bottleLevel: meta.level,
      bottleSizeMl: 100,
      purchasePrice: meta.purchasePrice,
      isFavorite: Boolean(meta.favorite),
      isSignature: Boolean(meta.signature),
      signatureRole: meta.signature ? 'work' as const : undefined,
      addedAt: now,
    };
    collection.push(item);
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

  // Best-effort catalog bottle art when online — never block demo open.
  void import('@/services/seed').then(({ enrichFragranceImages }) =>
    enrichFragranceImages(DEMO_FRAGRANCES.map((f) => f.id)),
  );
}

export async function exitDemo(): Promise<void> {
  const { clearDemoSession } = await import('@/lib/demoMode');
  clearDemoSession();
  await clearUserData();
}
