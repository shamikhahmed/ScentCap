import { expect, type Page } from '@playwright/test';

export const ONBOARDING_STEPS = [
  { heading: /Where do you spend most days/i, choice: 'Office daily' },
  { heading: /How bold should scents be/i, choice: 'Moderate' },
] as const;

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
      if (url.includes('fraganty.ai')) {
        if (url.includes('/search')) {
          const q = new URL(url, 'https://fraganty.ai').searchParams.get('q') ?? 'fragrance';
          const slug = slugify(q);
          return new Response(
            JSON.stringify({
              perfumes: [{ brand: 'Demo', name: `${q} Eau de Parfum`, slug }],
            }),
            { headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (url.includes('/perfumes/')) {
          const slug = decodeURIComponent(url.split('/perfumes/')[1]?.split('?')[0] ?? 'demo');
          const label = slug.replace(/-/g, ' ');
          return new Response(
            JSON.stringify({
              brand: 'Demo',
              name: `${label} Eau de Parfum`,
              slug,
              accords: [{ name: 'Fresh' }],
              notes: { top: ['Bergamot'], middle: ['Lavender'], base: ['Musk'] },
            }),
            { headers: { 'Content-Type': 'application/json' } },
          );
        }
      }
      return originalFetch(input, init);
    };
  });
}

export async function loadDemoWardrobe(page: Page) {
  await page.goto('./onboarding');
  await expect(page.getByRole('heading', { name: /Your scent counter/i })).toBeVisible();
  await page.getByRole('button', { name: /Try demo collection/i }).click();
  await expect(page.getByRole('button', { name: /Try demo collection/i })).toBeHidden({ timeout: 60_000 });
  await expect(page).not.toHaveURL(/onboarding/, { timeout: 60_000 });
  await expect(page.getByText(/demo mode|sample wardrobe/i)).toBeVisible({ timeout: 15_000 });
}

export async function completeOnboarding(page: Page) {
  await page.goto('./onboarding');
  await expect(page.getByRole('heading', { name: /Your scent counter/i })).toBeVisible();
  await page.getByRole('button', { name: /Quick setup/i }).click();
  await expect(page.getByRole('heading', { name: ONBOARDING_STEPS[0].heading })).toBeVisible();

  for (const step of ONBOARDING_STEPS) {
    await expect(page.getByRole('heading', { name: step.heading })).toBeVisible();
    await page.getByRole('button', { name: step.choice, exact: true }).click();
  }

  await expect(page.getByRole('heading', { name: /Your city/i })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /Skip for now/i }).click();

  await expect(page.getByRole('heading', { name: /Office Safe/i })).toBeVisible();
  const officeOn = page.getByRole('button', { name: /Office Safe is on/i });
  if (await officeOn.isVisible()) {
    await officeOn.click();
  }
  await page.getByRole('button', { name: /Get started/i }).click();

  await expect(page).not.toHaveURL(/onboarding/, { timeout: 30_000 });
  await expect(
    page.getByRole('heading', { name: /Your wardrobe awaits|Keep it airy|Balanced weather|Rich scents|Let longevity/i }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('link', { name: /Add first bottle|Add bottle/i }).first()).toBeVisible({ timeout: 15_000 });
}

export async function addFragranceFromSearch(page: Page, query: string) {
  await page.getByRole('link', { name: /Add first bottle|Add bottle/i }).first().click({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /Add fragrance/i })).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: /Add manually/i }).click();
  const brand = /bleu/i.test(query) ? 'Chanel' : 'Dior';
  const name = /bleu/i.test(query) ? 'Bleu de Chanel' : 'Sauvage';

  await page.getByPlaceholder('Fragrance name').fill(name);
  await page.getByPlaceholder('Brand').fill(brand);
  await page.getByRole('button', { name: /Save to wardrobe/i }).click();
  await expect(page).toHaveURL(/\/collection/, { timeout: 20_000 });
  await expect(page.getByText(/\d+ bottle/i)).toBeVisible({ timeout: 15_000 });
}
