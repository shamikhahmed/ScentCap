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
import { SC_META_LIGHT, SC_META_DARK } from '@/design/tokens';

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
        // One-time atelier default to light for existing installs — skip in demo so
        // prefers-color-scheme / theme=system can be audited in both themes.
        if (!isDemoUrl() && !nextPrefs.demoMode && localStorage.getItem('scentcap_atelier_203') !== '1') {
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
          // Demo seeds today's weather into IDB; avoid network on the boot critical path.
          const { weather: w, unavailableReason } = await getDailyWeather(p, false);
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
      try {
        (window as Window & { __APP_READY__?: boolean }).__APP_READY__ = true;
        document.documentElement.dataset.appReady = 'true';
        document.getElementById('sc-boot')?.setAttribute('hidden', '');
      } catch { /* ignore */ }
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
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const isLight =
        prefs.theme === 'light' ? true : prefs.theme === 'dark' ? false : mq.matches;
      document.body.classList.toggle('light', isLight);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', isLight ? SC_META_LIGHT : SC_META_DARK);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
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
