import { expect, type Locator, type Page } from '@playwright/test';

/** ScentCap 3 onboarding: welcome → "About your days" → "Your weather". */
export const ONBOARDING_WELCOME = /Your fragrance wardrobe, beautifully kept/i;

/** Primary navigation (sidebar >= md/700px, floating `.ui-tabbar` below). Only the visible one resolves. */
export function navLink(page: Page, label: string): Locator {
  return page
    .locator('[data-testid="desktop-sidebar"], nav.ui-tabbar')
    .getByRole('link', { name: label, exact: true });
}

/** Click a primary tab (Today · Collection · Advisor · Diary · Settings) in whichever shell is visible. */
export async function goTab(page: Page, label: 'Today' | 'Collection' | 'Advisor' | 'Diary' | 'Settings') {
  await navLink(page, label).click();
}

/** The Today hero's single primary action. */
export function wearTodayButton(page: Page): Locator {
  return page.getByRole('button', { name: /^Wear today$/i });
}

export async function installTestMocks(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('scentcap-splash-seen', '1');
    } catch {
      /* ignore */
    }

    navigator.geolocation.getCurrentPosition = (success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 1,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    };

    const originalFetch = window.fetch.bind(window);
    const slugify = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    /** Realistic catalog stubs so enrich never paints "Demo … Eau de Parfum". */
    const CATALOG: Record<string, { brand: string; name: string; color: string }> = {
      'sauvage-eau-de-parfum': { brand: 'Dior', name: 'Sauvage', color: '#1a5c4a' },
      'bleu-de-chanel-eau-de-parfum': { brand: 'Chanel', name: 'Bleu de Chanel', color: '#1e3a5f' },
      'acqua-di-gio': { brand: 'Giorgio Armani', name: 'Acqua di Giò', color: '#2a7a8c' },
      'y-eau-de-parfum': { brand: 'Yves Saint Laurent', name: 'Y', color: '#2d4a3e' },
      aventus: { brand: 'Creed', name: 'Aventus', color: '#3d5c2e' },
      'ombre-leather-16': { brand: 'Tom Ford', name: 'Ombré Leather', color: '#5c3d2e' },
      'baccarat-rouge-540': { brand: 'Maison Francis Kurkdjian', name: 'Baccarat Rouge 540', color: '#8b2942' },
      khamrah: { brand: 'Lattafa', name: 'Khamrah', color: '#8b5a2b' },
      'luna-rossa-carbon': { brand: 'Prada', name: 'Luna Rossa Carbon', color: '#2a3038' },
      'light-blue-pour-homme-dolce-gabbana-cologne': { brand: 'Dolce & Gabbana', name: 'Light Blue', color: '#3a7ca5' },
      'eros-eau-de-parfum': { brand: 'Versace', name: 'Eros', color: '#1a4d8c' },
      'coco-mademoiselle-parfum': { brand: 'Chanel', name: 'Coco Mademoiselle', color: '#6b3a4a' },
      layton: { brand: 'Parfums de Marly', name: 'Layton', color: '#4a3728' },
      'interlude-man': { brand: 'Amouage', name: 'Interlude Man', color: '#2a3540' },
      'green-irish-tweed': { brand: 'Creed', name: 'Green Irish Tweed', color: '#2f6b3c' },
      'tobacco-vanille': { brand: 'Tom Ford', name: 'Tobacco Vanille', color: '#6b4423' },
      'erba-pura': { brand: 'Xerjoff', name: 'Erba Pura', color: '#3d6b5c' },
    };

    const bottleSvg = (brand: string, name: string, color: string) => {
      const initials = `${brand.charAt(0)}${name.charAt(0)}`.toUpperCase();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="360" viewBox="0 0 240 360">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0.35"/>
          </linearGradient>
        </defs>
        <rect width="240" height="360" fill="#f4f6f7"/>
        <rect x="95" y="28" width="50" height="28" rx="4" fill="${color}"/>
        <rect x="85" y="56" width="70" height="18" rx="3" fill="${color}" opacity="0.55"/>
        <path d="M70 90 C70 78 90 70 120 70 C150 70 170 78 170 90 L185 280 C185 310 155 330 120 330 C85 330 55 310 55 280 Z" fill="url(#g)" stroke="${color}" stroke-width="2"/>
        <text x="120" y="200" text-anchor="middle" fill="#fff" font-size="36" font-family="Georgia,serif" font-weight="700">${initials}</text>
        <text x="120" y="300" text-anchor="middle" fill="${color}" font-size="14" font-family="system-ui,sans-serif" font-weight="600">${brand.slice(0, 18)}</text>
      </svg>`;
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    };

    const productImageUrl = (slug: string) => `https://img.fraganty.ai/perfume/mock-${slug}.jpg`;
    const tinyJpeg = Uint8Array.from(
      atob(
        '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k=',
      ),
      (c) => c.charCodeAt(0),
    );

    const resolveEntry = (slug: string, q?: string) => {
      if (CATALOG[slug]) return { slug, ...CATALOG[slug] };
      const hit = Object.entries(CATALOG).find(([k]) => slug.includes(k) || k.includes(slug));
      if (hit) return { slug: hit[0], ...hit[1] };
      const label = (q ?? slug).replace(/-/g, ' ');
      const words = label.split(/\s+/).filter(Boolean);
      return {
        slug,
        brand: words[0] ? words[0].replace(/\b\w/g, (c) => c.toUpperCase()) : 'House',
        name: words.slice(1).join(' ').replace(/\beau de parfum\b/gi, '').trim() || label,
        color: '#0c6b5c',
      };
    };

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.includes('open-meteo.com')) {
        return new Response(
          JSON.stringify({
            current: { temperature_2m: 20, relative_humidity_2m: 50, wind_speed_10m: 10, weather_code: 0 },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('geocoding-api.open-meteo.com')) {
        return new Response(
          JSON.stringify({
            results: [{ name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006 }],
          }),
          { headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('img.fraganty.ai')) {
        return new Response(tinyJpeg, { headers: { 'Content-Type': 'image/jpeg' } });
      }
      if (url.includes('fraganty.ai')) {
        if (url.includes('/search')) {
          const q = new URL(url, 'https://fraganty.ai').searchParams.get('q') ?? 'fragrance';
          const slug = slugify(q);
          const demoSlug = Object.keys(CATALOG).find((k) => {
            const spaced = k.replace(/-/g, ' ');
            const qLower = q.toLowerCase();
            return qLower === spaced || qLower.includes(spaced.split(' ').slice(0, 3).join(' ')) || k === slug;
          });
          const entry = demoSlug ? { slug: demoSlug, ...CATALOG[demoSlug] } : resolveEntry(slug, q);
          return new Response(
            JSON.stringify({
              perfumes: [{
                brand: entry.brand,
                name: entry.name,
                slug: entry.slug ?? demoSlug ?? slug,
                image: productImageUrl(entry.slug ?? demoSlug ?? slug),
              }],
            }),
            { headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes('/perfumes/')) {
          const slug = decodeURIComponent(url.split('/perfumes/')[1]?.split('?')[0] ?? 'demo');
          const entry = resolveEntry(slug);
          return new Response(
            JSON.stringify({
              brand: entry.brand,
              name: entry.name,
              slug: entry.slug,
              image: productImageUrl(entry.slug),
              accords: [{ name: 'Fresh' }],
              notes: { top: ['Bergamot'], middle: ['Lavender'], base: ['Musk'] },
            }),
            { headers: { 'Content-Type': 'application/json' } },
          );
        }
      }
      return originalFetch(input, init);
    };

    void bottleSvg;
  });
}

export async function loadDemoWardrobe(page: Page) {
  await page.goto('./onboarding');
  await expect(page.getByRole('heading', { name: ONBOARDING_WELCOME })).toBeVisible();
  await page.getByRole('button', { name: /Explore a sample wardrobe/i }).click();
  await expect(page.getByRole('button', { name: /Explore a sample wardrobe/i })).toBeHidden({ timeout: 60_000 });
  await expect(page).not.toHaveURL(/onboarding/, { timeout: 60_000 });
  await expect(page.getByTestId('demo-banner')).toBeVisible({ timeout: 15_000 });
}

/** Quick onboarding (Office, Balanced, skip city). Lands on /add — the first-bottle step. */
export async function completeOnboarding(page: Page) {
  await page.goto('./onboarding');
  await expect(page.getByRole('heading', { name: ONBOARDING_WELCOME })).toBeVisible();
  await page.getByRole('button', { name: /^Get started$/i }).click();

  await expect(page.getByRole('heading', { name: /About your days/i })).toBeVisible();
  await page.getByRole('button', { name: 'Office', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Office', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('radio', { name: /Balanced/i }).click();
  await expect(page.getByRole('radio', { name: /Balanced/i })).toHaveAttribute('aria-checked', 'true');
  // Office Safe defaults on for Office; turn it off so a freshly-added bottle is never filtered from Today.
  const officeSafe = page.getByRole('checkbox', { name: /Office Safe/i });
  if (await officeSafe.isChecked()) await officeSafe.click();
  await expect(officeSafe).not.toBeChecked();
  await page.getByRole('button', { name: /^Continue$/i }).click();

  await expect(page.getByRole('heading', { name: /Your weather/i })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /Add my first bottles/i }).click();

  await expect(page).toHaveURL(/\/add/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: /Add fragrance/i })).toBeVisible({ timeout: 15_000 });
}

/** Add one bottle through the "Add manually" sheet. Lands on the new bottle's detail page. */
export async function addFragranceFromSearch(page: Page, query: string) {
  if (!/\/add/.test(page.url())) {
    await page.goto('./add');
  }
  await expect(page.getByRole('heading', { name: /Add fragrance/i })).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: /Add manually/i }).click();
  const brand = /bleu/i.test(query) ? 'Chanel' : 'Dior';
  const name = /bleu/i.test(query) ? 'Bleu de Chanel' : 'Sauvage';

  const sheet = page.getByRole('dialog', { name: /Add manually/i });
  await expect(sheet).toBeVisible();
  await sheet.getByLabel('Brand', { exact: true }).fill(brand);
  await sheet.getByLabel('Name', { exact: true }).fill(name);
  await sheet.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page).toHaveURL(/\/fragrance\//, { timeout: 20_000 });
}
