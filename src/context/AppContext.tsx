import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getAllCollection,
  getPreferences,
  getProfile,
  getWearHistory,
  savePreferences,
  saveProfile,
} from '@/db';
import { isDemoUrl } from '@/lib/demoMode';
import { loadDemoData } from '@/services/demo';
import { ensureSeedLoaded } from '@/services/seed';
import { getDailyWeather, type WeatherUnavailableReason } from '@/services/weather';
import type { CollectionItem, Preferences, UserProfile, WearRecord, WeatherCache } from '@/types';

interface AppState {
  ready: boolean;
  profile?: UserProfile;
  prefs: Preferences;
  collection: CollectionItem[];
  history: WearRecord[];
  weather: WeatherCache | null;
  weatherUnavailable?: WeatherUnavailableReason;
  refresh: () => Promise<void>;
  setProfile: (p: UserProfile) => Promise<void>;
  setPrefs: (p: Preferences) => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState<UserProfile | undefined>();
  const [prefs, setPrefsState] = useState<Preferences>({ id: 'preferences', officeMaxSprays: 3, officeSafeMode: false, theme: 'light', signatures: {} });
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [history, setHistory] = useState<WearRecord[]>([]);
  const [weather, setWeather] = useState<WeatherCache | null>(null);
  const [weatherUnavailable, setWeatherUnavailable] = useState<WeatherUnavailableReason | undefined>();

  const refresh = useCallback(async () => {
    try {
      await ensureSeedLoaded();
      const [p, pr, col, hist] = await Promise.all([
        getProfile(),
        getPreferences(),
        getAllCollection(),
        getWearHistory(),
      ]);
      setProfileState(p);
      let nextPrefs = { ...pr, officeSafeMode: pr.officeSafeMode ?? false };
      try {
        if (localStorage.getItem('scentcap_atelier_203') !== '1') {
          nextPrefs = { ...nextPrefs, theme: 'light' };
          localStorage.setItem('scentcap_atelier_203', '1');
          void savePreferences(nextPrefs);
        }
      } catch {
        nextPrefs = { ...nextPrefs, theme: nextPrefs.theme ?? 'light' };
      }
      setPrefsState(nextPrefs);
      setCollection(col);
      setHistory(hist);
      if (p?.onboardingComplete) {
        try {
          const { weather: w, unavailableReason } = await getDailyWeather(p);
          setWeather(w);
          setWeatherUnavailable(unavailableReason);
        } catch {
          setWeather(null);
          setWeatherUnavailable('fetch_failed');
        }
      } else {
        setWeather(null);
        setWeatherUnavailable(undefined);
      }
    } catch (err) {
      console.error('[ScentCap] Boot refresh failed', err);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isDemoUrl()) {
        try {
          await loadDemoData();
        } catch (err) {
          console.error('[ScentCap] Demo boot failed', err);
        }
      }
      if (!cancelled) await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    const light = prefs.theme !== 'dark';
    document.body.classList.toggle('light', light);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#e6eaee' : '#0b0e12');
  }, [prefs.theme]);

  const setProfile = useCallback(async (p: UserProfile) => {
    await saveProfile(p);
    setProfileState(p);
    if (p.onboardingComplete) {
      const { weather: w, unavailableReason } = await getDailyWeather(p, true);
      setWeather(w);
      setWeatherUnavailable(unavailableReason);
    }
  }, []);

  const setPrefs = useCallback(async (p: Preferences) => {
    await savePreferences(p);
    setPrefsState(p);
  }, []);

  const value = useMemo(
    () => ({ ready, profile, prefs, collection, history, weather, weatherUnavailable, refresh, setProfile, setPrefs }),
    [ready, profile, prefs, collection, history, weather, weatherUnavailable, refresh, setProfile, setPrefs],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}
