export function timeGreeting(): { period: string; line: string } {
  const h = new Date().getHours();
  if (h < 5) return { period: 'night', line: 'Still awake?' };
  if (h < 12) return { period: 'morning', line: 'Good morning' };
  if (h < 17) return { period: 'afternoon', line: 'Good afternoon' };
  if (h < 21) return { period: 'evening', line: 'Good evening' };
  return { period: 'night', line: 'Good night' };
}

export function scentMood(weather?: { tempC: number; condition: string } | null): string {
  if (!weather) return 'Your wardrobe is ready';
  if (weather.condition === 'hot' || weather.tempC >= 28) return 'Keep it airy today';
  if (weather.condition === 'cold' || weather.tempC <= 10) return 'Rich scents love this chill';
  if (weather.condition === 'rain') return 'Let longevity carry you';
  return 'Balanced weather — full palette open';
}
