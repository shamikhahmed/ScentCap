import { getWeatherCache, saveWeatherCache } from '@/db';
import type { UserProfile, WeatherCache } from '@/types';
import { todayKey } from '@/lib/utils';

export type WeatherUnavailableReason = 'no_location' | 'fetch_failed' | 'unsupported';

export interface WeatherResult {
  weather: WeatherCache | null;
  unavailableReason?: WeatherUnavailableReason;
}

export const WEATHER_UNAVAILABLE_MESSAGES: Record<WeatherUnavailableReason, string> = {
  no_location: 'Enable location in Settings to tailor picks to today’s weather.',
  fetch_failed: 'Weather is temporarily unavailable — recommendations still work without it.',
  unsupported: 'This browser can’t access location — add your city in Settings for weather-aware picks.',
};

export function weatherUnavailableMessage(reason?: WeatherUnavailableReason): string | null {
  if (!reason) return null;
  return WEATHER_UNAVAILABLE_MESSAGES[reason];
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

export async function getDailyWeather(profile: UserProfile, force = false): Promise<WeatherResult> {
  const date = todayKey();
  const cached = await getWeatherCache(date);
  if (cached && !force) return { weather: cached };

  if (profile.lat == null || profile.lon == null) {
    return {
      weather: cached ?? null,
      unavailableReason: cached ? undefined : 'no_location',
    };
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${profile.lat}&longitude=${profile.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        weather: cached ?? null,
        unavailableReason: cached ? undefined : 'fetch_failed',
      };
    }
    const data = await res.json();
    const c = data.current;
    const entry: WeatherCache = {
      id: date,
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

export async function requestLocation(): Promise<{ lat: number; lon: number; label: string } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: 'Current location' }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  });
}
