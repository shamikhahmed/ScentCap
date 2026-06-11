import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getAllCollection,
  getPreferences,
  getProfile,
  getWearHistory,
  savePreferences,
  saveProfile,
} from '@/db';
import { ensureSeedLoaded } from '@/services/seed';
import { getDailyWeather } from '@/services/weather';
import type { CollectionItem, Preferences, UserProfile, WearRecord, WeatherCache } from '@/types';

interface AppState {
  ready: boolean;
  profile?: UserProfile;
  prefs: Preferences;
  collection: CollectionItem[];
  history: WearRecord[];
  weather: WeatherCache | null;
  refresh: () => Promise<void>;
  setProfile: (p: UserProfile) => Promise<void>;
  setPrefs: (p: Preferences) => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState<UserProfile | undefined>();
  const [prefs, setPrefsState] = useState<Preferences>({ id: 'preferences', officeMaxSprays: 3, officeSafeMode: false, theme: 'dark', signatures: {} });
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [history, setHistory] = useState<WearRecord[]>([]);
  const [weather, setWeather] = useState<WeatherCache | null>(null);

  const refresh = useCallback(async () => {
    await ensureSeedLoaded();
    const [p, pr, col, hist] = await Promise.all([
      getProfile(),
      getPreferences(),
      getAllCollection(),
      getWearHistory(),
    ]);
    setProfileState(p);
    setPrefsState({ ...pr, officeSafeMode: pr.officeSafeMode ?? false });
    setCollection(col);
    setHistory(hist);
    if (p?.onboardingComplete) {
      const w = await getDailyWeather(p);
      setWeather(w);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    document.body.classList.toggle('light', prefs.theme === 'light');
  }, [prefs.theme]);

  const setProfile = useCallback(async (p: UserProfile) => {
    await saveProfile(p);
    setProfileState(p);
    if (p.onboardingComplete) {
      const w = await getDailyWeather(p);
      setWeather(w);
    }
  }, []);

  const setPrefs = useCallback(async (p: Preferences) => {
    await savePreferences(p);
    setPrefsState(p);
  }, []);

  const value = useMemo(
    () => ({ ready, profile, prefs, collection, history, weather, refresh, setProfile, setPrefs }),
    [ready, profile, prefs, collection, history, weather, refresh, setProfile, setPrefs],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}
