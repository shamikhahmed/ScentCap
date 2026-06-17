import type { Fragrance, Season } from '@/types';

/** Derive wear scores and tags from notes/family when API data is sparse. */
export function applyFragranceProfile(f: Fragrance): Fragrance {
  const notes = [...f.top_notes, ...f.heart_notes, ...f.base_notes].join(' ').toLowerCase();
  const family = f.family.toLowerCase();

  let heat = f.heat_score;
  let cold = f.cold_score;
  let office = f.office_score;
  let date = f.date_score;
  let formal = f.formal_score;
  let casual = f.casual_score;
  let seasonality = [...f.seasonality] as Season[];
  let projection = f.projection;
  let longevity = f.longevity;
  let dayNight = f.day_night;
  const tags = new Set<string>(f.layering_tags);

  if (/citrus|bergamot|lemon|grapefruit|aquatic|mint/.test(notes) || family === 'fresh') {
    heat = Math.max(heat, 82);
    cold = Math.min(cold, 65);
    tags.add('citrus');
    tags.add('fresh');
    seasonality = ['spring', 'summer'];
  }
  if (/vanilla|amber|oud|leather|tobacco|incense/.test(notes) || family === 'oriental' || family === 'woody') {
    cold = Math.max(cold, 82);
    heat = Math.min(heat, 68);
    tags.add('amber');
    if (/oud|leather|smoke/.test(notes)) tags.add('oud');
    seasonality = ['fall', 'winter'];
  }
  if (/rose|jasmine|ylang|floral|peony/.test(notes) || family === 'floral') {
    date = Math.max(date, 85);
    tags.add('floral');
  }
  if (/lavender|musk|clean|aldehyd/.test(notes)) {
    office = Math.max(office, 78);
    tags.add('clean');
    tags.add('musky');
  }
  if (/pepper|ginger|cardamom|spice/.test(notes)) {
    tags.add('spicy');
    casual = Math.max(casual, 80);
  }
  if (/gourmand|coffee|chocolate|caramel|praline/.test(notes) || family === 'gourmand') {
    date = Math.max(date, 88);
    cold = Math.max(cold, 75);
    tags.add('sweet');
  }

  if (f.concentration === 'Parfum' || f.concentration === 'Extrait') {
    projection = projection === 'soft' ? 'moderate' : projection;
    longevity = longevity === 'short' ? 'long' : longevity;
    dayNight = 'night';
  }
  if (f.concentration === 'Cologne' || f.concentration === 'EDT') {
    office = Math.max(office, 75);
    heat = Math.max(heat, 78);
    if (projection === 'beast' || projection === 'strong') projection = 'moderate';
  }

  formal = Math.round((formal + office) / 2);

  return {
    ...f,
    heat_score: clamp(heat),
    cold_score: clamp(cold),
    office_score: clamp(office),
    date_score: clamp(date),
    formal_score: clamp(formal),
    casual_score: clamp(casual),
    seasonality: [...new Set(seasonality.length ? seasonality : f.seasonality)],
    projection,
    longevity,
    day_night: dayNight,
    layering_tags: [...tags],
  };
}

function clamp(n: number): number {
  return Math.max(35, Math.min(98, Math.round(n)));
}
