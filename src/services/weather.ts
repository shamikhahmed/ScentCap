import { getWeatherCache, saveWeatherCache } from '@/db';
import type { UserProfile, WeatherCache } from '@/types';
import { todayKey } from '@/lib/utils';

function classifyWeather(tempC: number, humidity: number, wind: number, code: number): WeatherCache['condition'] {
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71) return 'snow';
  if (wind > 30) return 'windy';
  if (tempC >= 28) return 'hot';
  if (tempC <= 8) return 'cold';
  if (humidity >= 75) return 'cloudy';
  return 'clear';
}

export async function getDailyWeather(profile: UserProfile, force = false): Promise<WeatherCache | null> {
  const date = todayKey();
  const cached = await getWeatherCache(date);
  if (cached && !force) return cached;

  if (profile.lat == null || profile.lon == null) return cached ?? null;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${profile.lat}&longitude=${profile.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return cached ?? null;
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
    return entry;
  } catch {
    return cached ?? null;
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
