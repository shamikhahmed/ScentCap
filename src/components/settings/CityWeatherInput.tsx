import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import {
  applyCityToProfile,
  applyGpsToProfile,
  getDailyWeather,
  requestLocation,
  weatherUnavailableMessage,
} from '@/services/weather';
import { inputFieldLg, textSubtle } from '@/lib/ui-classes';

export function CityWeatherInput({ compact }: { compact?: boolean }) {
  const { profile, weather, weatherUnavailable, setProfile, refresh } = useApp();
  const [cityInput, setCityInput] = useState(
    profile?.cityLabel && profile.cityLabel !== 'Current location' ? profile.cityLabel : '',
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (profile?.cityLabel && profile.cityLabel !== 'Current location') {
      setCityInput(profile.cityLabel);
    }
  }, [profile?.cityLabel]);

  const applyLocation = async (loc: { lat: number; lon: number; label: string }) => {
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      const next = applyGpsToProfile(profile, loc);
      await setProfile(next);
      if (loc.label !== 'Current location') setCityInput(loc.label);
      setStatus(`Weather updated for ${next.cityLabel ?? 'your location'}.`);
    } finally {
      setBusy(false);
    }
  };

  const saveCity = async (query: string) => {
    if (!profile || !query.trim()) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const { profile: next, error: cityError } = await applyCityToProfile(profile, query);
      if (cityError) {
        setError(weatherUnavailableMessage(cityError));
        return;
      }
      await setProfile(next);
      setStatus(`Weather updated for ${next.cityLabel}.`);
    } finally {
      setBusy(false);
    }
  };

  const onCityChange = (value: string) => {
    setCityInput(value);
    setError(null);
    setStatus(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) return;
    debounceRef.current = setTimeout(() => {
      void saveCity(value);
    }, 700);
  };

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const useGps = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const loc = await requestLocation();
      if (!loc) {
        setError(weatherUnavailableMessage('unsupported'));
        return;
      }
      await applyLocation(loc);
      setCityInput('');
    } finally {
      setBusy(false);
    }
  };

  const refreshWeather = async () => {
    if (!profile?.lat || profile.lon == null) return;
    setBusy(true);
    try {
      await getDailyWeather(profile, true);
      await refresh();
      setStatus('Weather refreshed.');
    } finally {
      setBusy(false);
    }
  };

  if (!profile) return null;

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div>
        <label htmlFor="city-weather-input" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          City
        </label>
        <div className="relative mt-2">
          <MapPin size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${textSubtle}`} />
          <input
            id="city-weather-input"
            className={`${inputFieldLg} pl-11`}
            placeholder="e.g. London, Tokyo, Austin TX"
            value={cityInput}
            onChange={(e) => onCityChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                void saveCity(cityInput);
              }
            }}
            autoComplete="address-level2"
          />
        </div>
        <p className={`text-xs mt-2 ${textSubtle}`}>
          No GPS needed — weather is fetched automatically from your city (Open-Meteo, free).
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="ghost" className="flex-1 gap-2" onClick={useGps} disabled={busy}>
          <Navigation size={16} />
          Use device location
        </Button>
        <Button variant="outline" className="flex-1" onClick={refreshWeather} disabled={busy || profile.lat == null}>
          Refresh weather
        </Button>
      </div>

      {profile.cityLabel && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Active: <span className="font-medium text-[var(--color-text-primary)]">{profile.cityLabel}</span>
          {weather && (
            <span className="text-[var(--color-text-tertiary)]">
              {' '}· {Math.round(weather.tempC)}° · {weather.humidity}% humidity
            </span>
          )}
        </p>
      )}

      {status && <p className="text-xs text-[var(--color-accent)]">{status}</p>}
      {error && <p className="text-xs text-amber-400">{error}</p>}
      {!weather && weatherUnavailable && !error && (
        <p className="text-xs text-[var(--color-text-tertiary)]">{weatherUnavailableMessage(weatherUnavailable)}</p>
      )}
    </div>
  );
}
