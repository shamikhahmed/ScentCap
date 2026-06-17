import { getWeatherCache, saveWeatherCache } from '@/db';
import type { UserProfile, WeatherCache } from '@/types';
import { todayKey } from '@/lib/utils';

export type WeatherUnavailableReason = 'no_location' | 'fetch_failed' | 'unsupported' | 'city_not_found';

export interface WeatherResult {
  weather: WeatherCache | null;
  unavailableReason?: WeatherUnavailableReason;
}

export interface CityLocation {
  lat: number;
  lon: number;
  label: string;
}

export const WEATHER_UNAVAILABLE_MESSAGES: Record<WeatherUnavailableReason, string> = {
  no_location: 'Add your city in Settings for weather-aware picks — no GPS required.',
  fetch_failed: 'Weather is temporarily unavailable — recommendations still work without it.',
  unsupported: 'This browser can’t access GPS — enter your city in Settings instead.',
  city_not_found: 'City not found. Try “Paris, France” or “Austin, TX”.',
};

export function weatherUnavailableMessage(reason?: WeatherUnavailableReason): string | null {
  if (!reason) return null;
  return WEATHER_UNAVAILABLE_MESSAGES[reason];
}

function weatherCacheId(date: string, lat: number, lon: number): string {
  return `${date}@${lat.toFixed(3)},${lon.toFixed(3)}`;
}

function classifyWeather(tempC: number, humidity: number, wind: number, code: number): WeatherCache['condition'] {
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71) return 'snow';
  if (wind > 30) return 'windy';
  if (tempC >= 28) return 'hot';
  if (tempC <= 8) return 'cold';
  if (humidity >= 75) return 'cloudy';
  return 'clear';
}

function formatCityLabel(name: string, admin1?: string, country?: string): string {
  const region = admin1 && admin1 !== name ? admin1 : country;
  return region ? `${name}, ${region}` : name;
}

/** Free geocoding via Open-Meteo — no API key. */
export async function geocodeCity(query: string): Promise<CityLocation | null> {
  const q = query.trim();
  if (q.length < 2) return null;

  try {
    const params = new URLSearchParams({ name: q, count: '1', language: 'en', format: 'json' });
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
    if (!res.ok) return null;
    const data = await res.json() as {
      results?: Array<{
        name?: string;
        latitude?: number;
        longitude?: number;
        admin1?: string;
        country?: string;
      }>;
    };
    const hit = data.results?.[0];
    if (!hit?.latitude || !hit?.longitude || !hit.name) return null;
    return {
      lat: hit.latitude,
      lon: hit.longitude,
      label: formatCityLabel(hit.name, hit.admin1, hit.country),
    };
  } catch {
    return null;
  }
}

export async function getDailyWeather(profile: UserProfile, force = false): Promise<WeatherResult> {
  const date = todayKey();

  if (profile.lat == null || profile.lon == null) {
    return {
      weather: null,
      unavailableReason: 'no_location',
    };
  }

  const cacheId = weatherCacheId(date, profile.lat, profile.lon);
  const cached = await getWeatherCache(cacheId);
  if (cached && !force) return { weather: cached };

  try {
    const params = new URLSearchParams({
      latitude: String(profile.lat),
      longitude: String(profile.lon),
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
      timezone: 'auto',
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) {
      return {
        weather: cached ?? null,
        unavailableReason: cached ? undefined : 'fetch_failed',
      };
    }
    const data = await res.json();
    const c = data.current;
    const entry: WeatherCache = {
      id: cacheId,
      date,
      tempC: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      windKmh: c.wind_speed_10m,
      condition: classifyWeather(c.temperature_2m, c.relative_humidity_2m, c.wind_speed_10m, c.weather_code),
      fetchedAt: new Date().toISOString(),
    };
    await saveWeatherCache(entry);
    return { weather: entry };
  } catch {
    return {
      weather: cached ?? null,
      unavailableReason: cached ? undefined : 'fetch_failed',
    };
  }
}

export async function requestLocation(): Promise<CityLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        label: 'Current location',
      }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  });
}

/** Apply manual city search → profile coords + label. */
export async function applyCityToProfile(
  profile: UserProfile,
  cityQuery: string,
): Promise<{ profile: UserProfile; error?: WeatherUnavailableReason }> {
  const loc = await geocodeCity(cityQuery);
  if (!loc) {
    return { profile, error: 'city_not_found' };
  }
  return {
    profile: {
      ...profile,
      lat: loc.lat,
      lon: loc.lon,
      cityLabel: loc.label,
    },
  };
}

/** Apply GPS coords to profile. */
export function applyGpsToProfile(profile: UserProfile, loc: CityLocation): UserProfile {
  return {
    ...profile,
    lat: loc.lat,
    lon: loc.lon,
    cityLabel: loc.label,
  };
}
