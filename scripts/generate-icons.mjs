import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c9a87c"/>
      <stop offset="100%" stop-color="#8b6914"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#0c0a09"/>
  <path d="M256 92c-41 72-112 143-112 215a112 112 0 0 0 224 0c0-72-71-143-112-215z" fill="url(#g)" opacity=".95"/>
  <ellipse cx="256" cy="368" rx="92" ry="31" fill="#c9a87c" opacity=".25"/>
</svg>`;

for (const size of [192, 512]) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  writeFileSync(join(publicDir, `icon-${size}.png`), buf);
  console.log(`Wrote icon-${size}.png`);
}
