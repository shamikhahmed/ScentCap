#!/usr/bin/env node
/**
 * Generates 2000+ fragrance seed records for ScentCap offline bundle.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/data/fragrances.seed.json');

const FAMILIES = [
  { family: 'Fresh', subfamilies: ['Citrus', 'Aquatic', 'Green', 'Aromatic'] },
  { family: 'Floral', subfamilies: ['Floral', 'Floral Fruity', 'Floral Woody', 'White Floral'] },
  { family: 'Woody', subfamilies: ['Woody Aromatic', 'Woody Spicy', 'Woody Floral', 'Oud'] },
  { family: 'Oriental', subfamilies: ['Amber', 'Spicy', 'Gourmand', 'Balsamic'] },
  { family: 'Gourmand', subfamilies: ['Vanilla', 'Sweet', 'Gourmand', 'Powdery'] },
];

const CONCENTRATIONS = ['EDT', 'EDP', 'Parfum', 'Cologne', 'Extrait'];
const PROJECTIONS = ['soft', 'moderate', 'strong', 'beast'];
const LONGEVITIES = ['short', 'medium', 'long', 'eternal'];
const DAY_NIGHT = ['day', 'night', 'versatile'];
const GENDER = ['masculine', 'feminine', 'unisex'];
const LAYERING_TAGS = ['citrus', 'woody', 'amber', 'vanilla', 'musky', 'clean', 'fresh', 'spicy', 'sweet', 'oud', 'floral', 'leather', 'smoky'];

const TOP_NOTES = ['Bergamot', 'Lemon', 'Grapefruit', 'Mandarin', 'Pink Pepper', 'Apple', 'Pear', 'Lavender', 'Mint', 'Cardamom'];
const HEART_NOTES = ['Rose', 'Jasmine', 'Iris', 'Geranium', 'Cinnamon', 'Nutmeg', 'Lily', 'Peony', 'Saffron', 'Orris'];
const BASE_NOTES = ['Sandalwood', 'Cedar', 'Vetiver', 'Amber', 'Musk', 'Vanilla', 'Patchouli', 'Oud', 'Tonka', 'Leather'];

const BRANDS = {
  designer: [
    'Dior', 'Chanel', 'Tom Ford', 'Yves Saint Laurent', 'Versace', 'Giorgio Armani', 'Gucci', 'Prada',
    'Dolce & Gabbana', 'Burberry', 'Hermès', 'Givenchy', 'Valentino', 'Bulgari', 'Cartier', 'Montblanc',
    'Ralph Lauren', 'Calvin Klein', 'Hugo Boss', 'Dunhill', 'Davidoff', 'Issey Miyake', 'Lancome', 'Guerlain',
  ],
  niche: [
    'Creed', 'Maison Francis Kurkdjian', 'Xerjoff', 'Parfums de Marly', 'Amouage', 'Byredo', 'Le Labo',
    'Diptyque', 'Frederic Malle', 'Nasomatto', 'Nishane', 'Roja Parfums', 'Penhaligon\'s', 'Initio',
    'Kilian', 'Memo Paris', 'Etat Libre d\'Orange', 'Serge Lutens', 'Mancera', 'Montale',
  ],
  middleEastern: [
    'Lattafa', 'Rasasi', 'Armaf', 'Swiss Arabian', 'Ajmal', 'Al Haramain', 'Rihanah', 'Arabian Oud',
    'Abdul Samad Al Qurashi', 'Nabeel', 'Al Rehab', 'Afnan', 'Fragrance World', 'Paris Corner',
    'Al Wataniah', 'Khadlaj', 'Emir', 'Rave', 'Maison Alhambra', 'French Avenue',
  ],
};

const NAME_PARTS = {
  masculine: ['Noir', 'Intense', 'Sport', 'Homme', 'Man', 'Legend', 'Hero', 'King', 'Elixir', 'Absolu', 'Pure', 'Extreme', 'Night', 'Day', 'Code', 'One', 'Essence', 'Spirit', 'Wild', 'Bold'],
  feminine: ['Rose', 'Bloom', 'Femme', 'Woman', 'Luna', 'Belle', 'Divine', 'Crystal', 'Pearl', 'Velvet', 'Silk', 'Gold', 'Dream', 'Angel', 'Secret', 'Glow', 'Elegance', 'Grace', 'Cherie', 'Nuit'],
  unisex: ['Oud', 'Amber', 'Musk', 'Santal', 'Cedar', 'Iris', 'Neroli', 'Vetiver', 'Tonka', 'Saffron', 'Bergamot', 'Vanilla', 'Leather', 'Smoke', 'Rain', 'Cloud', 'Aura', 'Zen', 'Balance', 'Origin'],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) { const s = new Set(); while (s.size < n) s.add(pick(arr)); return [...s]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function slug(brand, name) {
  return `${brand}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function makeFragrance(i, brand, category) {
  const genderLean = pick(GENDER);
  const parts = NAME_PARTS[genderLean];
  const name = `${pick(parts)} ${pick(['', pick(parts)])}`.trim().replace(/\s+/g, ' ');
  const fam = pick(FAMILIES);
  const subfamily = pick(fam.subfamilies);
  const concentration = pick(CONCENTRATIONS);
  const projection = pick(PROJECTIONS);
  const longevity = pick(LONGEVITIES);
  const dayNight = pick(DAY_NIGHT);
  const layeringTags = pickN(LAYERING_TAGS, rand(2, 4));

  const officeBase = genderLean === 'masculine' ? rand(40, 95) : genderLean === 'feminine' ? rand(35, 90) : rand(45, 92);
  const projPenalty = projection === 'beast' ? -25 : projection === 'strong' ? -10 : projection === 'soft' ? 15 : 0;

  return {
    id: slug(brand, `${name}-${i}`),
    name,
    brand,
    category,
    concentration,
    family: fam.family,
    subfamily,
    projection,
    longevity,
    seasonality: pickN(['spring', 'summer', 'fall', 'winter'], rand(1, 3)),
    day_night: dayNight,
    gender_lean: genderLean,
    top_notes: pickN(TOP_NOTES, 3),
    heart_notes: pickN(HEART_NOTES, 2),
    base_notes: pickN(BASE_NOTES, 2),
    office_score: Math.min(100, Math.max(0, officeBase + projPenalty + rand(-8, 8))),
    heat_score: fam.family === 'Fresh' || fam.family === 'Gourmand' ? rand(70, 98) : rand(30, 75),
    cold_score: fam.family === 'Oriental' || fam.family === 'Woody' ? rand(75, 98) : rand(35, 80),
    date_score: rand(50, 98),
    formal_score: rand(40, 95),
    casual_score: rand(55, 98),
    layering_tags: layeringTags,
  };
}

// Famous real fragrances (hand-curated anchors)
const ICONS = [
  { id: 'dior-sauvage-edp', name: 'Sauvage', brand: 'Dior', category: 'designer', concentration: 'EDP', family: 'Fresh', subfamily: 'Aromatic', projection: 'strong', longevity: 'long', seasonality: ['spring', 'summer', 'fall'], day_night: 'versatile', gender_lean: 'masculine', top_notes: ['Bergamot', 'Pepper'], heart_notes: ['Lavender', 'Geranium'], base_notes: ['Ambroxan', 'Cedar'], office_score: 72, heat_score: 88, cold_score: 65, date_score: 85, formal_score: 70, casual_score: 92, layering_tags: ['fresh', 'spicy', 'musky'] },
  { id: 'chanel-bleu-de-chanel-edp', name: 'Bleu de Chanel', brand: 'Chanel', category: 'designer', concentration: 'EDP', family: 'Woody', subfamily: 'Woody Aromatic', projection: 'moderate', longevity: 'long', seasonality: ['spring', 'summer', 'fall', 'winter'], day_night: 'versatile', gender_lean: 'masculine', top_notes: ['Citrus', 'Mint'], heart_notes: ['Ginger', 'Jasmine'], base_notes: ['Sandalwood', 'Cedar'], office_score: 95, heat_score: 75, cold_score: 80, date_score: 88, formal_score: 92, casual_score: 85, layering_tags: ['woody', 'citrus', 'clean'] },
  { id: 'tom-ford-ombre-leather', name: 'Ombré Leather', brand: 'Tom Ford', category: 'designer', concentration: 'EDP', family: 'Woody', subfamily: 'Leather', projection: 'strong', longevity: 'long', seasonality: ['fall', 'winter'], day_night: 'night', gender_lean: 'unisex', top_notes: ['Cardamom'], heart_notes: ['Leather', 'Jasmine'], base_notes: ['Amber', 'Moss'], office_score: 55, heat_score: 40, cold_score: 92, date_score: 90, formal_score: 75, casual_score: 70, layering_tags: ['leather', 'amber', 'spicy'] },
  { id: 'creed-aventus', name: 'Aventus', brand: 'Creed', category: 'niche', concentration: 'EDP', family: 'Fresh', subfamily: 'Fruity', projection: 'strong', longevity: 'long', seasonality: ['spring', 'summer', 'fall'], day_night: 'day', gender_lean: 'masculine', top_notes: ['Pineapple', 'Bergamot'], heart_notes: ['Birch', 'Jasmine'], base_notes: ['Musk', 'Oakmoss'], office_score: 78, heat_score: 82, cold_score: 70, date_score: 92, formal_score: 80, casual_score: 88, layering_tags: ['fruity', 'woody', 'fresh'] },
  { id: 'lattafa-khamrah', name: 'Khamrah', brand: 'Lattafa', category: 'middleEastern', concentration: 'EDP', family: 'Gourmand', subfamily: 'Spicy', projection: 'beast', longevity: 'eternal', seasonality: ['fall', 'winter'], day_night: 'night', gender_lean: 'unisex', top_notes: ['Cinnamon', 'Nutmeg'], heart_notes: ['Dates', 'Praline'], base_notes: ['Vanilla', 'Amber'], office_score: 35, heat_score: 45, cold_score: 95, date_score: 88, formal_score: 50, casual_score: 75, layering_tags: ['sweet', 'spicy', 'vanilla', 'amber'] },
  { id: 'mfk-baccarat-rouge-540', name: 'Baccarat Rouge 540', brand: 'Maison Francis Kurkdjian', category: 'niche', concentration: 'EDP', family: 'Oriental', subfamily: 'Amber Floral', projection: 'strong', longevity: 'eternal', seasonality: ['fall', 'winter'], day_night: 'night', gender_lean: 'unisex', top_notes: ['Saffron', 'Jasmine'], heart_notes: ['Amberwood', 'Cedar'], base_notes: ['Fir Resin', 'Musk'], office_score: 60, heat_score: 55, cold_score: 90, date_score: 98, formal_score: 85, casual_score: 72, layering_tags: ['amber', 'sweet', 'musky'] },
  { id: 'armani-acqua-di-gio-edp', name: 'Acqua di Giò', brand: 'Giorgio Armani', category: 'designer', concentration: 'EDP', family: 'Fresh', subfamily: 'Aquatic', projection: 'moderate', longevity: 'medium', seasonality: ['spring', 'summer'], day_night: 'day', gender_lean: 'masculine', top_notes: ['Marine', 'Bergamot'], heart_notes: ['Rosemary', 'Jasmine'], base_notes: ['Patchouli', 'Musk'], office_score: 90, heat_score: 95, cold_score: 50, date_score: 75, formal_score: 78, casual_score: 95, layering_tags: ['aquatic', 'fresh', 'clean'] },
  { id: 'ysl-y-edp', name: 'Y', brand: 'Yves Saint Laurent', category: 'designer', concentration: 'EDP', family: 'Fresh', subfamily: 'Aromatic', projection: 'moderate', longevity: 'long', seasonality: ['spring', 'summer', 'fall'], day_night: 'versatile', gender_lean: 'masculine', top_notes: ['Apple', 'Ginger'], heart_notes: ['Sage', 'Juniper'], base_notes: ['Amberwood', 'Cedar'], office_score: 88, heat_score: 80, cold_score: 72, date_score: 82, formal_score: 85, casual_score: 88, layering_tags: ['fresh', 'woody', 'clean'] },
];

const fragrances = [...ICONS];
const seen = new Set(ICONS.map((f) => f.id));
let idx = 0;

for (const [category, brands] of Object.entries(BRANDS)) {
  const perBrand = category === 'middleEastern' ? 45 : category === 'niche' ? 35 : 30;
  for (const brand of brands) {
    for (let j = 0; j < perBrand; j++) {
      idx++;
      let f = makeFragrance(idx, brand, category);
      while (seen.has(f.id)) {
        idx++;
        f = makeFragrance(idx, brand, category);
      }
      seen.add(f.id);
      fragrances.push(f);
    }
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ version: 1, count: fragrances.length, fragrances }, null, 0));
console.log(`Wrote ${fragrances.length} fragrances to ${OUT}`);
