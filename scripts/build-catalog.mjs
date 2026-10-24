#!/usr/bin/env node
/**
 * Build the bundled offline catalog of REAL fragrances with self-hosted bottle photos.
 *
 *  1. For each house in HOUSES, read Parfumo's brand listing (most-rated first; allowed by robots.txt —
 *     search endpoints are never used) → top N perfumes with page URL, image, gender.
 *  2. Fetch each perfume page → main accords, notes, longevity + sillage community scores.
 *  3. Derive ScentCap wear profile (family, scores, seasons, layering tags).
 *  4. Download the 720px product shot → WebP 512 + 256 in public/bottles/.
 *  5. Write public/data/catalog.json.
 *
 * Polite: ~1 request / 1.1s, everything cached in scripts/.cache/ (re-runs are offline-fast).
 * Usage: node scripts/build-catalog.mjs [--per-house 30] [--force-images]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'scripts/.cache');
const PAGES = path.join(CACHE, 'pages');
const RAW = path.join(CACHE, 'raw');
const OUT_IMG = path.join(ROOT, 'public/bottles');
const OUT_JSON = path.join(ROOT, 'public/data/catalog.json');

const args = process.argv.slice(2);
const PER_HOUSE = Number(args[args.indexOf('--per-house') + 1]) || 30;
const FORCE_IMAGES = args.includes('--force-images');
const DELAY_MS = 1100;
const UA = 'ScentCapCatalogBuilder/1.0 (+https://shamikhahmed.github.io/ScentCap/)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Display name → Parfumo slug(s). */
const HOUSES = {
  Dior: ['Dior'], Chanel: ['Chanel'], 'Tom Ford': ['Tom_Ford'], 'Yves Saint Laurent': ['Yves_Saint_Laurent'],
  'Giorgio Armani': ['Giorgio_Armani'], Versace: ['Versace'], Gucci: ['Gucci'], Prada: ['Prada'],
  'Dolce & Gabbana': ['Dolce_Gabbana'], Burberry: ['Burberry'], 'Hermès': ['Hermes'], Givenchy: ['Givenchy'],
  Valentino: ['Valentino'], Bulgari: ['Bvlgari', 'Bulgari'], Cartier: ['Cartier'], Montblanc: ['Montblanc'],
  'Ralph Lauren': ['Ralph_Lauren'], 'Calvin Klein': ['Calvin_Klein'], 'Hugo Boss': ['Hugo_Boss'],
  'Paco Rabanne': ['Paco_Rabanne', 'Rabanne'], 'Jean Paul Gaultier': ['Jean_Paul_Gaultier'],
  'Carolina Herrera': ['Carolina_Herrera'], 'Viktor & Rolf': ['Viktor_Rolf'], 'Issey Miyake': ['Issey_Miyake'],
  'Lancôme': ['Lancome'], Guerlain: ['Guerlain'], 'Azzaro': ['Azzaro'], 'Mugler': ['Mugler', 'Thierry_Mugler'],
  'Narciso Rodriguez': ['Narciso_Rodriguez'], 'Marc Jacobs': ['Marc_Jacobs'], 'Jo Malone': ['Jo_Malone'],
  Creed: ['Creed'], 'Maison Francis Kurkdjian': ['Maison_Francis_Kurkdjian'], Xerjoff: ['Xerjoff'],
  'Parfums de Marly': ['Parfums_de_Marly'], Amouage: ['Amouage'], Byredo: ['Byredo'], 'Le Labo': ['Le_Labo'],
  Diptyque: ['Diptyque'],
  Nasomatto: ['Nasomatto'], Nishane: ['Nishane'], 'Roja Parfums': ['Roja_Parfums', 'Roja_Dove'],
  "Penhaligon's": ['Penhaligon_s'], Initio: ['Initio_Parfums_Prives', 'Initio'], Kilian: ['By_Kilian', 'Kilian'],
  'Memo Paris': ['Memo', 'Memo_Paris'], 'Maison Margiela': ['Maison_Margiela'], 'Serge Lutens': ['Serge_Lutens'],
  Mancera: ['Mancera'], Montale: ['Montale'], 'Acqua di Parma': ['Acqua_di_Parma'], 'Louis Vuitton': ['Louis_Vuitton'],
  'Juliette Has a Gun': ['Juliette_Has_A_Gun'], 'Kayali': ['Kayali'],
  Lattafa: ['Lattafa'], Rasasi: ['Rasasi'], Armaf: ['Armaf'], 'Swiss Arabian': ['Swiss_Arabian'], Ajmal: ['Ajmal'],
  'Al Haramain': ['Al_Haramain'], 'Arabian Oud': ['Arabian_Oud'], 'Abdul Samad Al Qurashi': ['Abdul_Samad_Al_Qurashi'],
  Afnan: ['Afnan_Perfumes', 'Afnan'],
  'Al Rehab': ['Al_Rehab'], Rave: ['Rave'],
  Nabeel: ['Nabeel'], Khadlaj: ['Khadlaj'], 'Al Wataniah': ['Al_Wataniah'], Rihanah: ['Rihanah'],
};

const CONC = [
  [/extrait/i, 'Extrait'],
  [/eau de parfum|edp/i, 'EDP'],
  [/eau de toilette|edt/i, 'EDT'],
  [/cologne/i, 'Cologne'],
  [/\bparfum\b|perfume|elixir/i, 'Parfum'],
];

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;|&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .trim();
}

function slugify(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function cachedGet(url, file) {
  if (await exists(file)) return fs.readFile(file, 'utf8');
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
      break;
    } catch {
      await sleep(3000 * (attempt + 1));
    }
  }
  await sleep(DELAY_MS);
  if (!res?.ok) return null;
  const html = await res.text();
  await fs.writeFile(file, html);
  return html;
}

// ---------- 1. listings ----------

function parseListing(html) {
  const out = [];
  const re = /<div class="image">\s*<a href="(https:\/\/www\.parfumo\.com\/Perfumes\/[^"]+)"><img src="(https:\/\/media\.parfumo\.com\/perfumes\/[^"?]+)[^"]*" alt="([^"]+)"[\s\S]*?<div class="name">([\s\S]*?)<\/div>/g;
  for (const m of html.matchAll(re)) {
    const nameBlock = m[4];
    const gender = /fa-mars/.test(nameBlock) && /fa-venus/.test(nameBlock) ? 'unisex' : /fa-mars/.test(nameBlock) ? 'masculine' : /fa-venus/.test(nameBlock) ? 'feminine' : 'unisex';
    const year = (nameBlock.match(/Release_Years\/(\d{4})/) ?? [])[1];
    out.push({ url: m[1], image: m[2], alt: decode(m[3]), gender, year: year ? Number(year) : undefined });
  }
  return out;
}

async function listHouse(house) {
  for (const slug of HOUSES[house]) {
    const items = [];
    for (let page = 1; items.length < PER_HOUSE && page <= 3; page++) {
      const url = `https://www.parfumo.com/Perfumes/${slug}?current_page=${page}&v=grid&o=nr_desc&g_f=1&g_m=1&g_u=1`;
      const html = await cachedGet(url, path.join(PAGES, `list-${slug}-${page}.html`));
      if (!html) break;
      const got = parseListing(html);
      items.push(...got);
      if (got.length < 30) break;
    }
    if (items.length) return items.slice(0, PER_HOUSE);
  }
  return [];
}

// ---------- 2. perfume page ----------

function parsePerfume(html) {
  const flat = html.replace(/\s+/g, ' ');
  const accords = [];
  const accSeg = flat.slice(flat.indexOf('Main accords'), flat.indexOf('Main accords') + 4000);
  for (const m of accSeg.matchAll(/<div class="text-xs grey">([^<]+)<\/div>/g)) accords.push(decode(m[1]));

  const notes = { top: [], heart: [], base: [], flat: [] };
  const nl = flat.indexOf('class="notes_list');
  if (nl > 0) {
    const endIdx = flat.indexOf('Perfumer', nl);
    const seg = flat.slice(nl, endIdx > nl ? endIdx : nl + 15000);
    const layer = { t: 'top', m: 'heart', b: 'base', n: 'flat' };
    for (const m of seg.matchAll(/data-nt="([tmbn])"[^>]*><span class="nowrap pointer">(?:<img[^>]*>)?([^<]+)<\/span>/g)) {
      notes[layer[m[1]]].push(decode(m[2]));
    }
  }
  const score = (type) => {
    const m = flat.match(new RegExp(`data-type="${type}"[\\s\\S]{0,600}?rating-score[^>]*>([\\d.]+)<`));
    return m ? Number(m[1]) : undefined;
  };
  const title = (flat.match(/<meta property="og:title" content="([^"]+)"/) ?? [])[1];
  return { accords, notes, longevity: score('durability'), sillage: score('sillage'), title: title ? decode(title) : undefined };
}

// ---------- 3. profile ----------

const TOP_RX = /citrus|bergamot|lemon|lime|orange|mandarin|grapefruit|yuzu|neroli|petitgrain|mint|basil|apple|pear|pineapple|cassis|blackcurrant|pepper|cardamom|ginger|aldehyde|marine|sea|ozonic|lavender|artemisia|grass|green|fig leaf|juniper|elemi/;
const BASE_RX = /wood|cedar|sandal|vetiver|patchouli|oud|agar|amber|ambr|musk|vanilla|tonka|benzoin|labdanum|incense|olibanum|myrrh|resin|leather|tobacco|moss|castoreum|civet|praline|caramel|chocolate|coffee|cashmeran|iso e|guaiac|birch|smoke/;

function splitFlat(list) {
  const top = [], heart = [], base = [];
  for (const n of list) {
    const l = n.toLowerCase();
    if (BASE_RX.test(l)) base.push(n);
    else if (TOP_RX.test(l)) top.push(n);
    else heart.push(n);
  }
  return { top, heart, base };
}

const FAMILY_OF = [
  [/fresh|citrus|aquatic|green|marine|ozonic|aromatic|fougere/i, 'Fresh'],
  [/floral|powdery|fruity|chypre/i, 'Floral'],
  [/woody|earthy|leather|smoky|mossy/i, 'Woody'],
  [/oriental|resin|spicy|animal|amber|oud/i, 'Oriental'],
  [/sweet|gourmand|creamy|vanilla/i, 'Gourmand'],
];

function familyFrom(accords) {
  for (const a of accords) for (const [rx, fam] of FAMILY_OF) if (rx.test(a)) return fam;
  return 'Fresh';
}

const clamp = (n) => Math.max(20, Math.min(98, Math.round(n)));

function buildProfile({ brand, name, concentration, gender, accords, notes, longevity, sillage }) {
  const family = familyFrom(accords);
  const all = [...notes.top, ...notes.heart, ...notes.base].join(' ').toLowerCase() + ' ' + accords.join(' ').toLowerCase();
  let heat = 62, cold = 62, office = 64, date = 66, formal = 62, casual = 68;
  const tags = new Set();
  let seasons = new Set(['spring', 'fall']);

  if (/fresh|citrus|aquatic|marine|green|bergamot|lemon|grapefruit|mint/.test(all)) {
    heat += 22; cold -= 10; office += 12; casual += 16; tags.add('fresh');
    if (/citrus|bergamot|lemon|grapefruit|orange|mandarin/.test(all)) tags.add('citrus');
    seasons = new Set(['spring', 'summer']);
  }
  if (/amber|oud|leather|tobacco|incense|resin|vanilla|benzoin|labdanum/.test(all)) {
    cold += 22; heat -= 14; date += 10; formal += 10; tags.add('amber');
    if (/oud|agar/.test(all)) tags.add('oud');
    if (/leather/.test(all)) tags.add('leather');
    if (/smok|incense|birch/.test(all)) tags.add('smoky');
    seasons = new Set(['fall', 'winter']);
  }
  if (/woody|cedar|sandal|vetiver|guaiac/.test(all)) { tags.add('woody'); formal += 6; office += 4; }
  if (/floral|rose|jasmine|iris|tuberose|ylang|peony|orris|violet/.test(all)) { date += 12; tags.add('floral'); }
  if (/musk|clean|aldehyd|soap|powder|lavender/.test(all)) { office += 12; tags.add('clean'); tags.add('musky'); }
  if (/spic|pepper|cardamom|cinnamon|clove|ginger|saffron|nutmeg/.test(all)) { tags.add('spicy'); casual += 4; cold += 6; }
  if (/sweet|gourmand|caramel|praline|chocolate|coffee|honey|tonka|vanilla/.test(all)) { date += 14; cold += 10; office -= 8; tags.add('sweet'); if (/vanilla/.test(all)) tags.add('vanilla'); }

  const lon = longevity ?? (concentration === 'Extrait' || concentration === 'Parfum' ? 8 : concentration === 'EDP' ? 7 : 6);
  const sil = sillage ?? lon - 0.5;
  const longevityLabel = lon >= 8.6 ? 'eternal' : lon >= 7.3 ? 'long' : lon >= 6 ? 'medium' : 'short';
  const projection = sil >= 8.4 ? 'beast' : sil >= 7.2 ? 'strong' : sil >= 5.8 ? 'moderate' : 'soft';
  if (projection === 'beast') { office -= 18; date += 6; }
  if (projection === 'strong') office -= 8;
  if (projection === 'soft') office += 8;

  const dayNight = (cold - heat > 12 || projection === 'beast') ? 'night' : heat - cold > 12 ? 'day' : 'versatile';
  if (!tags.size) tags.add(family.toLowerCase() === 'fresh' ? 'fresh' : 'woody');

  return {
    id: slugify(`${brand}-${name}-${concentration}`),
    name,
    brand,
    category: undefined,
    concentration,
    family,
    subfamily: accords[1] ?? accords[0] ?? family,
    projection,
    longevity: longevityLabel,
    seasonality: [...seasons],
    day_night: dayNight,
    gender_lean: gender,
    top_notes: notes.top.slice(0, 6),
    heart_notes: notes.heart.slice(0, 6),
    base_notes: notes.base.slice(0, 6),
    office_score: clamp(office),
    heat_score: clamp(heat),
    cold_score: clamp(cold),
    date_score: clamp(date),
    formal_score: clamp((formal + office) / 2),
    casual_score: clamp(casual),
    layering_tags: [...tags].slice(0, 5),
    accords: accords.slice(0, 5),
  };
}

function parseNameConc(alt, house) {
  // "Sauvage (Eau de Parfum) by Dior"
  let body = alt.replace(/\s+by\s+[^()]+$/i, '').replace(/\s*\((19|20)\d\d\)/, '').trim();
  let concentration;
  const m = body.match(/^(.*)\(([^)]+)\)\s*$/);
  if (m) {
    for (const [rx, c] of CONC) if (rx.test(m[2])) { concentration = c; break; }
    if (concentration) body = m[1].trim();
  }
  if (!concentration) for (const [rx, c] of CONC) if (rx.test(body)) { concentration = c; break; }
  body = body.replace(/\s+(19|20)\d\d$/, '').trim();
  return { name: body, concentration: concentration ?? 'EDP', house };
}

// ---------- main ----------

async function main() {
  await Promise.all([PAGES, RAW, OUT_IMG].map((d) => fs.mkdir(d, { recursive: true })));
  const catalog = [];
  const seen = new Set();
  const log = [];

  const houses = process.env.ONLY_HOUSES ? process.env.ONLY_HOUSES.split(',') : Object.keys(HOUSES);
  for (const house of houses) {
    const items = await listHouse(house);
    log.push(`${house}: ${items.length}`);
    console.log(`[house] ${house} → ${items.length}`);
    for (const it of items) {
      const { name, concentration } = parseNameConc(it.alt, house);
      const key = slugify(`${house}-${name}-${concentration}`);
      if (seen.has(key)) continue;
      const pageFile = path.join(PAGES, `p-${slugify(it.url.split('/Perfumes/')[1])}.html`);
      const html = await cachedGet(it.url, pageFile);
      if (!html) continue;
      const p = parsePerfume(html);
      const notes = p.notes.flat.length && !p.notes.top.length ? splitFlat(p.notes.flat) : p.notes;
      if (!p.accords.length && !notes.top.length && !notes.heart.length && !notes.base.length) continue;
      const f = buildProfile({ brand: house, name, concentration, gender: it.gender, accords: p.accords, notes, longevity: p.longevity, sillage: p.sillage });

      const src = `bottles/${f.id}.webp`;
      const outLg = path.join(ROOT, 'public', src);
      const outSm = outLg.replace(/\.webp$/, '-sm.webp');
      if (FORCE_IMAGES || !(await exists(outLg)) || !(await exists(outSm))) {
        const rawPath = path.join(RAW, path.basename(it.image));
        let buf;
        if (await exists(rawPath)) buf = await fs.readFile(rawPath);
        else {
          const res = await fetch(it.image, { headers: { 'User-Agent': UA } }).catch(() => null);
          await sleep(250);
          if (!res?.ok) continue;
          buf = Buffer.from(await res.arrayBuffer());
          await fs.writeFile(rawPath, buf);
        }
        try {
          const base = sharp(buf).flatten({ background: '#ffffff' }).trim({ background: '#ffffff', threshold: 12 });
          const pad = { fit: 'contain', background: '#ffffff' };
          await base.clone().resize(460, 460, pad).extend({ top: 26, bottom: 26, left: 26, right: 26, background: '#ffffff' }).webp({ quality: 74, effort: 6 }).toFile(outLg);
          await base.clone().resize(232, 232, pad).extend({ top: 12, bottom: 12, left: 12, right: 12, background: '#ffffff' }).webp({ quality: 68, effort: 6 }).toFile(outSm);
        } catch (e) {
          console.warn(`  image fail ${f.id}: ${e.message}`);
          continue;
        }
      }
      seen.add(key);
      catalog.push({ ...f, year: it.year, image: src, imageSm: src.replace(/\.webp$/, '-sm.webp'), source: it.url });
    }
    // checkpoint
    await fs.writeFile(OUT_JSON, JSON.stringify({ version: 2, generated: new Date().toISOString().slice(0, 10), count: catalog.length, fragrances: catalog }));
  }

  await fs.writeFile(path.join(CACHE, 'catalog-log.txt'), log.join('\n'));
  console.log(`\ncatalog: ${catalog.length} real fragrances → public/data/catalog.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
