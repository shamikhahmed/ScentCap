#!/usr/bin/env node
/** Integrity check for the bundled catalog: schema, unique ids, image files present and small. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/catalog.json'), 'utf8'));
const CONC = new Set(['EDT', 'EDP', 'Parfum', 'Cologne', 'Extrait']);
const PROJ = new Set(['soft', 'moderate', 'strong', 'beast']);
const LONG = new Set(['short', 'medium', 'long', 'eternal']);
const errors = [];
const ids = new Set();
let bytes = 0;

for (const f of data.fragrances) {
  const where = `${f.id}`;
  if (ids.has(f.id)) errors.push(`${where}: duplicate id`);
  ids.add(f.id);
  if (!f.name || !f.brand) errors.push(`${where}: missing name/brand`);
  if (!CONC.has(f.concentration)) errors.push(`${where}: bad concentration ${f.concentration}`);
  if (!PROJ.has(f.projection)) errors.push(`${where}: bad projection`);
  if (!LONG.has(f.longevity)) errors.push(`${where}: bad longevity`);
  for (const k of ['office_score', 'heat_score', 'cold_score', 'date_score', 'formal_score', 'casual_score']) {
    if (typeof f[k] !== 'number' || f[k] < 0 || f[k] > 100) errors.push(`${where}: bad ${k}`);
  }
  for (const img of [f.image, f.imageSm]) {
    const p = path.join(ROOT, 'public', img ?? '');
    if (!img?.startsWith('bottles/') || !fs.existsSync(p)) errors.push(`${where}: missing image ${img}`);
    else {
      const size = fs.statSync(p).size;
      bytes += size;
      if (size > 80_000) errors.push(`${where}: image too large (${size} B)`);
    }
  }
}

if (data.count !== data.fragrances.length) errors.push(`count ${data.count} != ${data.fragrances.length}`);
if (data.fragrances.length < 50) errors.push(`catalog suspiciously small (${data.fragrances.length})`);

if (errors.length) {
  console.error(`catalog: ${errors.length} problem(s)\n` + errors.slice(0, 30).join('\n'));
  process.exit(1);
}
console.log(`catalog OK — ${data.fragrances.length} fragrances, ${(bytes / 1024 / 1024).toFixed(1)} MB of bottle images`);
