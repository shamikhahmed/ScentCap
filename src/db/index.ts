import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  CachedImage,
  CatalogSnapshot,
  CollectionItem,
  Fragrance,
  LayeringProfile,
  Preferences,
  UserProfile,
  WearRecord,
  WeatherCache,
  WishlistItem,
  WishlistList,
} from '@/types';

export interface ScentCapDB extends DBSchema {
  fragrances: { key: string; value: Fragrance };
  collection: { key: string; value: CollectionItem; indexes: { 'by-fragrance': string; 'by-parent': string } };
  wear_history: { key: string; value: WearRecord; indexes: { 'by-date': string; 'by-fragrance': string } };
  weather_cache: { key: string; value: WeatherCache };
  user_profile: { key: string; value: UserProfile };
  preferences: { key: string; value: Preferences };
  layering_profiles: { key: string; value: LayeringProfile };
  statistics: { key: string; value: { key: string; data: Record<string, unknown> } };
  photos: { key: string; value: { id: string; blob: Blob } };
  wishlist: { key: string; value: WishlistItem; indexes: { 'by-list': WishlistList; 'by-fragrance': string } };
  catalog: {
    key: string;
    value: CatalogSnapshot;
    indexes: { providerId: string; brand: string; expiresAt: number };
  };
  images: {
    key: string;
    value: CachedImage;
    indexes: { type: string; lastUsed: number };
  };
}

let dbPromise: Promise<IDBPDatabase<ScentCapDB>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<ScentCapDB>('scentcap-v1', 5, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (!db.objectStoreNames.contains('fragrances')) {
          db.createObjectStore('fragrances', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('collection')) {
          const col = db.createObjectStore('collection', { keyPath: 'id' });
          col.createIndex('by-fragrance', 'fragranceId');
          col.createIndex('by-parent', 'parentCollectionId');
        } else if (oldVersion < 2 && transaction) {
          const col = transaction.objectStore('collection');
          if (!col.indexNames.contains('by-parent')) {
            col.createIndex('by-parent', 'parentCollectionId');
          }
        }
        if (!db.objectStoreNames.contains('wear_history')) {
          const wear = db.createObjectStore('wear_history', { keyPath: 'id' });
          wear.createIndex('by-date', 'wornAt');
          wear.createIndex('by-fragrance', 'fragranceId');
        }
        if (!db.objectStoreNames.contains('weather_cache')) {
          db.createObjectStore('weather_cache', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('user_profile')) {
          db.createObjectStore('user_profile', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('layering_profiles')) {
          db.createObjectStore('layering_profiles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('statistics')) {
          db.createObjectStore('statistics', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('wishlist')) {
          const wl = db.createObjectStore('wishlist', { keyPath: 'id' });
          wl.createIndex('by-list', 'list');
          wl.createIndex('by-fragrance', 'fragranceId');
        } else if (oldVersion < 3 && transaction) {
          const wl = transaction.objectStore('wishlist');
          if (!wl.indexNames.contains('by-list')) wl.createIndex('by-list', 'list');
          if (!wl.indexNames.contains('by-fragrance')) wl.createIndex('by-fragrance', 'fragranceId');
        }
        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains('catalog')) {
            const cat = db.createObjectStore('catalog', { keyPath: 'id' });
            cat.createIndex('providerId', 'providerId');
            cat.createIndex('brand', 'brand');
            cat.createIndex('expiresAt', 'expiresAt');
          }
          if (!db.objectStoreNames.contains('images')) {
            const imgs = db.createObjectStore('images', { keyPath: 'id' });
            imgs.createIndex('type', 'type');
            imgs.createIndex('lastUsed', 'lastUsed');
          }
        }
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

/** Case-insensitive substring + token + light fuzzy match on brand or name */
function matchesFragrance(f: Fragrance, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return false;
  const brand = f.brand.toLowerCase();
  const name = f.name.toLowerCase();
  const combined = `${brand} ${name}`;

  if (brand.includes(q) || name.includes(q) || combined.includes(q)) return true;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every((t) => brand.includes(t) || name.includes(t) || combined.includes(t));
  }

  const fuzzy = (hay: string, needle: string) => {
    let hi = 0;
    for (let ni = 0; ni < needle.length; ni++) {
      const pos = hay.indexOf(needle[ni], hi);
      if (pos === -1) return false;
      hi = pos + 1;
    }
    return true;
  };
  return fuzzy(brand, q) || fuzzy(name, q);
}

export async function searchFragrancesLocal(q: string, limit = 60): Promise<Fragrance[]> {
  const query = q.toLowerCase().trim();
  if (!query) return [];
  const all = await (await getDb()).getAll('fragrances');
  return all
    .filter((f) => matchesFragrance(f, query))
    .sort((a, b) => {
      const aBrand = a.brand.toLowerCase().startsWith(query) ? 0 : 1;
      const bBrand = b.brand.toLowerCase().startsWith(query) ? 0 : 1;
      if (aBrand !== bBrand) return aBrand - bBrand;
      const aName = a.name.toLowerCase().startsWith(query) ? 0 : 1;
      const bName = b.name.toLowerCase().startsWith(query) ? 0 : 1;
      return aName - bName || `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`);
    })
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
  await recordRecentAddition(item.fragranceId);
}

const RECENT_LIMIT = 5;

export async function recordRecentAddition(fragranceId: string) {
  const prefs = await getPreferences();
  const existing = prefs.recentAdditions ?? [];
  const next = [fragranceId, ...existing.filter((id) => id !== fragranceId)].slice(0, RECENT_LIMIT);
  await savePreferences({ ...prefs, recentAdditions: next });
}

export async function getRecentAdditions(): Promise<Fragrance[]> {
  const prefs = await getPreferences();
  const ids = prefs.recentAdditions ?? [];
  const db = await getDb();
  const results: Fragrance[] = [];
  for (const id of ids) {
    const f = await db.get('fragrances', id);
    if (f) results.push(f);
  }
  return results;
}

export async function getWishlist(list?: WishlistList): Promise<WishlistItem[]> {
  const db = await getDb();
  if (list) {
    return db.getAllFromIndex('wishlist', 'by-list', list);
  }
  return db.getAll('wishlist');
}

export async function addToWishlist(item: WishlistItem) {
  await (await getDb()).put('wishlist', item);
}

export async function removeFromWishlist(id: string) {
  await (await getDb()).delete('wishlist', id);
}

export async function getWishlistByFragrance(fragranceId: string, list: WishlistList): Promise<WishlistItem | undefined> {
  const items = await (await getDb()).getAllFromIndex('wishlist', 'by-fragrance', fragranceId);
  return items.find((w) => w.list === list);
}

export async function updateCollectionItem(item: CollectionItem) {
  await (await getDb()).put('collection', item);
}

export async function deleteCollectionItem(id: string, options?: { cascadeChildren?: boolean }) {
  const db = await getDb();
  const children = await getCollectionByParent(id);
  if (children.length > 0 && !options?.cascadeChildren) {
    throw new Error('HAS_CHILDREN');
  }
  const toDelete = options?.cascadeChildren ? [id, ...children.map((c) => c.id)] : [id];
  for (const itemId of toDelete) {
    const item = await db.get('collection', itemId);
    if (item?.photoBlobId) await db.delete('photos', item.photoBlobId);
    await db.delete('collection', itemId);
  }
}

export async function getCollectionByParent(parentId: string): Promise<CollectionItem[]> {
  return (await getDb()).getAllFromIndex('collection', 'by-parent', parentId);
}

export async function saveLayeringProfile(profile: LayeringProfile) {
  await (await getDb()).put('layering_profiles', profile);
}

export async function getSavedLayeringProfiles(): Promise<LayeringProfile[]> {
  const rows = await (await getDb()).getAll('layering_profiles');
  return rows.sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''));
}

export async function deleteLayeringProfile(id: string) {
  await (await getDb()).delete('layering_profiles', id);
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

export async function putCatalogSnapshot(snap: CatalogSnapshot) {
  await (await getDb()).put('catalog', snap);
}

export async function getCatalogSnapshot(id: string): Promise<CatalogSnapshot | undefined> {
  return (await getDb()).get('catalog', id);
}

export async function searchCatalogLocal(q: string, limit = 40): Promise<CatalogSnapshot[]> {
  const query = q.toLowerCase().trim();
  if (!query) return [];
  const all = await (await getDb()).getAll('catalog');
  return all
    .filter((c) => c.brand.toLowerCase().includes(query) || c.name.toLowerCase().includes(query))
    .slice(0, limit);
}

export async function putCachedImage(img: CachedImage) {
  await (await getDb()).put('images', img);
}

export async function getCachedImage(id: string): Promise<CachedImage | undefined> {
  return (await getDb()).get('images', id);
}

export async function touchCachedImage(id: string) {
  const row = await getCachedImage(id);
  if (!row) return;
  await putCachedImage({ ...row, lastUsed: Date.now() });
}

export async function clearCatalogImages() {
  const db = await getDb();
  const all = await db.getAll('images');
  for (const img of all) {
    if (img.type === 'catalog') await db.delete('images', img.id);
  }
}

export async function getCatalogImageCacheBytes(): Promise<number> {
  const all = await (await getDb()).getAll('images');
  return all.filter((i) => i.type === 'catalog').reduce((sum, i) => sum + (i.size || 0), 0);
}

export async function exportAllData(): Promise<string> {
  const db = await getDb();
  const photos = await db.getAll('photos');
  const photoExport: Record<string, string> = {};
  for (const p of photos) {
    photoExport[p.id] = await blobToBase64(p.blob);
  }
  const catalog = await db.getAll('catalog');
  const data = {
    version: 5,
    fragrances: await db.getAll('fragrances'),
    collection: await db.getAll('collection'),
    layering_profiles: await db.getAll('layering_profiles'),
    wear_history: await db.getAll('wear_history'),
    user_profile: await db.getAll('user_profile'),
    preferences: await db.getAll('preferences'),
    wishlist: await db.getAll('wishlist'),
    photos: photoExport,
    catalog,
    statistics: await db.getAll('statistics'),
    imageIds: (await db.getAll('images')).map((i) => ({ id: i.id, type: i.type, size: i.size })),
  };
  return JSON.stringify(data);
}

export async function importAllData(json: string) {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(json) as Record<string, unknown>;
  } catch {
    throw new Error('Backup file is not valid JSON.');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Backup file has invalid shape.');
  }
  const version = data.version;
  if (version != null && typeof version !== 'number') {
    throw new Error('Backup version is invalid.');
  }
  if (version != null && (version as number) > 5) {
    throw new Error(`Backup version ${version} is newer than this app supports.`);
  }
  const ensureArray = (key: string): unknown[] => {
    const v = data[key];
    if (v == null) return [];
    if (!Array.isArray(v)) throw new Error(`Backup field "${key}" must be an array.`);
    return v;
  };
  const fragrances = ensureArray('fragrances');
  const collection = ensureArray('collection');
  const layering_profiles = ensureArray('layering_profiles');
  const wear_history = ensureArray('wear_history');
  const user_profile = ensureArray('user_profile');
  const preferences = ensureArray('preferences');
  const wishlist = ensureArray('wishlist');
  const catalog = ensureArray('catalog');
  const statistics = ensureArray('statistics');
  const photos = data.photos;
  if (photos != null && (typeof photos !== 'object' || Array.isArray(photos))) {
    throw new Error('Backup photos map is invalid.');
  }

  const db = await getDb();
  for (const f of fragrances) {
    if (!f || typeof f !== 'object') continue;
    const frag = f as Partial<Fragrance>;
    if (typeof frag.id !== 'string' || !frag.id) continue;
    if (typeof frag.brand !== 'string' || typeof frag.name !== 'string') continue;
    await db.put('fragrances', f as Fragrance);
  }
  for (const c of collection) {
    if (!c || typeof c !== 'object') continue;
    const item = c as Partial<CollectionItem>;
    if (typeof item.id !== 'string' || typeof item.fragranceId !== 'string') continue;
    await db.put('collection', c as CollectionItem);
  }
  for (const lp of layering_profiles) {
    if (!lp || typeof lp !== 'object' || !('id' in lp)) continue;
    await db.put('layering_profiles', lp as LayeringProfile);
  }
  for (const w of wear_history) {
    if (!w || typeof w !== 'object' || !('id' in w)) continue;
    await db.put('wear_history', w as WearRecord);
  }
  for (const p of user_profile) {
    if (!p || typeof p !== 'object') continue;
    await db.put('user_profile', p as UserProfile);
  }
  for (const p of preferences) {
    if (!p || typeof p !== 'object') continue;
    const pref = p as Preferences;
    await db.put('preferences', { ...pref, officeSafeMode: pref.officeSafeMode ?? false });
  }
  for (const w of wishlist) {
    if (!w || typeof w !== 'object' || !('id' in w)) continue;
    await db.put('wishlist', w as WishlistItem);
  }
  for (const [id, b64] of Object.entries((photos as Record<string, string>) ?? {})) {
    if (typeof b64 !== 'string' || !b64) continue;
    try {
      await savePhoto(id, base64ToBlob(b64));
    } catch {
      /* skip corrupt photo entries */
    }
  }
  for (const c of catalog) {
    if (!c || typeof c !== 'object' || !('id' in c)) continue;
    await db.put('catalog', c as CatalogSnapshot);
  }
  for (const s of statistics) {
    if (!s || typeof s !== 'object' || !('key' in s)) continue;
    await db.put('statistics', s as { key: string; data: Record<string, unknown> });
  }
}

export async function updateWearRecord(record: WearRecord) {
  await (await getDb()).put('wear_history', record);
}

export async function getLastWearForFragrance(fragranceId: string): Promise<WearRecord | undefined> {
  const all = await (await getDb()).getAllFromIndex('wear_history', 'by-fragrance', fragranceId);
  return all.sort((a, b) => b.wornAt.localeCompare(a.wornAt))[0];
}

export async function exportWearHistoryCsv(): Promise<string> {
  const history = await getWearHistory();
  const fragCache = new Map<string, string>();
  const rows: string[][] = [['date', 'fragrance', 'occasion', 'rating']];
  for (const w of history.sort((a, b) => a.wornAt.localeCompare(b.wornAt))) {
    let name = fragCache.get(w.fragranceId);
    if (!name) {
      const f = await getFragrance(w.fragranceId);
      name = f ? `${f.brand} ${f.name}` : w.fragranceId;
      fragCache.set(w.fragranceId, name);
    }
    rows.push([
      w.wornAt.slice(0, 10),
      name,
      w.occasion ?? '',
      w.rating != null ? String(w.rating) : '',
    ]);
  }
  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
}

const USER_STORES = [
  'collection',
  'wear_history',
  'user_profile',
  'preferences',
  'weather_cache',
  'layering_profiles',
  'statistics',
  'photos',
  'wishlist',
] as const;

export async function clearUserData() {
  const db = await getDb();
  await Promise.all(USER_STORES.map((store) => db.clear(store)));
}

export interface TravelKitPlan {
  tripName: string;
  startDate: string;
  endDate: string;
  pickedIds?: string[];
  manualMode?: boolean;
}

export async function getTravelKitPlan(): Promise<TravelKitPlan | null> {
  const row = await (await getDb()).get('statistics', 'travel_kit');
  if (!row?.data) return null;
  const d = row.data as unknown as TravelKitPlan;
  return d.tripName || d.startDate || d.endDate ? d : null;
}

export async function saveTravelKitPlan(plan: TravelKitPlan) {
  await (await getDb()).put('statistics', { key: 'travel_kit', data: { ...plan } });
}
