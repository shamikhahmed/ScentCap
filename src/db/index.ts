import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  CollectionItem,
  Fragrance,
  LayeringProfile,
  Preferences,
  UserProfile,
  WearRecord,
  WeatherCache,
} from '@/types';

export interface ScentCapDB extends DBSchema {
  fragrances: { key: string; value: Fragrance };
  collection: { key: string; value: CollectionItem; indexes: { 'by-fragrance': string } };
  wear_history: { key: string; value: WearRecord; indexes: { 'by-date': string; 'by-fragrance': string } };
  weather_cache: { key: string; value: WeatherCache };
  user_profile: { key: string; value: UserProfile };
  preferences: { key: string; value: Preferences };
  layering_profiles: { key: string; value: LayeringProfile };
  statistics: { key: string; value: { key: string; data: Record<string, unknown> } };
  photos: { key: string; value: { id: string; blob: Blob } };
}

let dbPromise: Promise<IDBPDatabase<ScentCapDB>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<ScentCapDB>('scentcap-v1', 1, {
      upgrade(db) {
        db.createObjectStore('fragrances', { keyPath: 'id' });
        const col = db.createObjectStore('collection', { keyPath: 'id' });
        col.createIndex('by-fragrance', 'fragranceId');
        const wear = db.createObjectStore('wear_history', { keyPath: 'id' });
        wear.createIndex('by-date', 'wornAt');
        wear.createIndex('by-fragrance', 'fragranceId');
        db.createObjectStore('weather_cache', { keyPath: 'id' });
        db.createObjectStore('user_profile', { keyPath: 'id' });
        db.createObjectStore('preferences', { keyPath: 'id' });
        db.createObjectStore('layering_profiles', { keyPath: 'id' });
        db.createObjectStore('statistics', { keyPath: 'key' });
        db.createObjectStore('photos', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function getProfile(): Promise<UserProfile | undefined> {
  return (await getDb()).get('user_profile', 'profile');
}

export async function saveProfile(profile: UserProfile) {
  await (await getDb()).put('user_profile', profile);
}

export async function getPreferences(): Promise<Preferences> {
  const p = await (await getDb()).get('preferences', 'preferences');
  return p ?? { id: 'preferences', officeMaxSprays: 3, officeSafeMode: false, theme: 'dark', signatures: {} };
}

export async function savePreferences(prefs: Preferences) {
  await (await getDb()).put('preferences', prefs);
}

export async function getAllCollection(): Promise<CollectionItem[]> {
  return (await getDb()).getAll('collection');
}

export async function getFragrance(id: string): Promise<Fragrance | undefined> {
  return (await getDb()).get('fragrances', id);
}

export async function putFragrance(f: Fragrance) {
  await (await getDb()).put('fragrances', f);
}

export async function searchFragrancesLocal(q: string, limit = 60): Promise<Fragrance[]> {
  const query = q.toLowerCase().trim();
  if (!query) return [];
  const all = await (await getDb()).getAll('fragrances');
  return all
    .filter((f) => `${f.brand} ${f.name}`.toLowerCase().includes(query))
    .slice(0, limit);
}

/** Group search hits by brand+name for concentration variant picker */
export async function searchFragranceGroups(q: string, limit = 20): Promise<{ key: string; brand: string; name: string; variants: Fragrance[] }[]> {
  const hits = await searchFragrancesLocal(q, 120);
  const map = new Map<string, Fragrance[]>();
  for (const f of hits) {
    const key = `${f.brand}::${f.name}`;
    const arr = map.get(key) ?? [];
    arr.push(f);
    map.set(key, arr);
  }
  return [...map.entries()]
    .slice(0, limit)
    .map(([key, variants]) => {
      const [brand, name] = key.split('::');
      variants.sort((a, b) => a.concentration.localeCompare(b.concentration));
      return { key, brand, name, variants };
    });
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBlob(b64: string, type = 'image/jpeg'): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

export async function addToCollection(item: CollectionItem) {
  await (await getDb()).put('collection', item);
}

export async function getWearHistory(): Promise<WearRecord[]> {
  return (await getDb()).getAllFromIndex('wear_history', 'by-date');
}

export async function logWear(record: WearRecord) {
  await (await getDb()).put('wear_history', record);
}

export async function getWeatherCache(date: string): Promise<WeatherCache | undefined> {
  return (await getDb()).get('weather_cache', date);
}

export async function saveWeatherCache(w: WeatherCache) {
  await (await getDb()).put('weather_cache', w);
}

export async function savePhoto(id: string, blob: Blob) {
  await (await getDb()).put('photos', { id, blob });
}

export async function getPhoto(id: string): Promise<Blob | undefined> {
  const row = await (await getDb()).get('photos', id);
  return row?.blob;
}

export async function exportAllData(): Promise<string> {
  const db = await getDb();
  const photos = await db.getAll('photos');
  const photoExport: Record<string, string> = {};
  for (const p of photos) {
    photoExport[p.id] = await blobToBase64(p.blob);
  }
  const data = {
    version: 2,
    fragrances: await db.getAll('fragrances'),
    collection: await db.getAll('collection'),
    wear_history: await db.getAll('wear_history'),
    user_profile: await db.getAll('user_profile'),
    preferences: await db.getAll('preferences'),
    photos: photoExport,
  };
  return JSON.stringify(data);
}

export async function importAllData(json: string) {
  const data = JSON.parse(json);
  const db = await getDb();
  for (const f of data.fragrances ?? []) await db.put('fragrances', f);
  for (const c of data.collection ?? []) await db.put('collection', c);
  for (const w of data.wear_history ?? []) await db.put('wear_history', w);
  for (const p of data.user_profile ?? []) await db.put('user_profile', p);
  for (const p of data.preferences ?? []) await db.put('preferences', { officeSafeMode: false, ...p });
  for (const [id, b64] of Object.entries(data.photos ?? {})) {
    await savePhoto(id, base64ToBlob(b64 as string));
  }
}

export async function updateWearRecord(record: WearRecord) {
  await (await getDb()).put('wear_history', record);
}

export async function getLastWearForFragrance(fragranceId: string): Promise<WearRecord | undefined> {
  const all = await (await getDb()).getAllFromIndex('wear_history', 'by-fragrance', fragranceId);
  return all.sort((a, b) => b.wornAt.localeCompare(a.wornAt))[0];
}
