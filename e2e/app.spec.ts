import { test, expect, type Page } from '@playwright/test';

const ONBOARDING_STEPS = [
  { heading: /How do you identify/i, choice: 'Man' },
  { heading: /Age range/i, choice: '25–34' },
  { heading: /Skin type/i, choice: 'Normal' },
  { heading: /Fragrance sensitivity/i, choice: 'No' },
  { heading: /Work context/i, choice: 'Office daily' },
  { heading: /Usual dress style/i, choice: 'Smart casual' },
  { heading: /Projection comfort/i, choice: 'Moderate' },
] as const;

async function completeOnboarding(page: Page) {
  await page.goto('./onboarding');
  await expect(page.getByRole('heading', { name: /Your fragrance OS/i })).toBeVisible();
  await page.getByRole('button', { name: 'Get started', exact: true }).click();
  await expect(page.getByRole('heading', { name: ONBOARDING_STEPS[0].heading })).toBeVisible();

  for (const step of ONBOARDING_STEPS) {
    await expect(page.getByRole('heading', { name: step.heading })).toBeVisible();
    await page.getByRole('button', { name: step.choice, exact: true }).click();
  }

  await expect(page).not.toHaveURL(/onboarding/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: /Your wardrobe awaits|Keep it airy|Balanced weather|Rich scents|Let longevity/i })).toBeVisible({ timeout: 15_000 });
}

async function addFragranceFromSearch(page: Page, query: string) {
  await page.getByRole('link', { name: /Add first bottle|Add bottle/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Add bottle' })).toBeVisible();

  await page.getByPlaceholder(/Search/i).fill(query);
  await expect(page.locator('button').filter({ hasText: /^(EDT|EDP|Parfum|Cologne|Extrait)$/ }).first()).toBeVisible({ timeout: 20_000 });

  await page.locator('button').filter({ hasText: /^(EDT|EDP|Parfum|Cologne|Extrait)$/ }).first().click();
  await page.getByRole('button', { name: 'Add to wardrobe' }).click();
  await expect(page).toHaveURL(/\/collection/, { timeout: 15_000 });
}

test.describe('ScentCap PWA', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: { latitude: 40.7128, longitude: -74.006, accuracy: 1, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
          timestamp: Date.now(),
        } as GeolocationPosition);
      };

      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        if (url.includes('open-meteo.com')) {
          return new Response(JSON.stringify({
            current: { temperature_2m: 20, relative_humidity_2m: 50, wind_speed_10m: 10, weather_code: 0 },
          }), { headers: { 'Content-Type': 'application/json' } });
        }
        return originalFetch(input, init);
      };
    });
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
  });

  test('onboarding flow completes', async ({ page }) => {
    await completeOnboarding(page);
    await expect(page).toHaveURL(/\/ScentCap\/?$/);
  });

  test('demo flow loads sample wardrobe on home', async ({ page }) => {
    await page.goto('./onboarding');
    await expect(page.getByRole('heading', { name: /Your fragrance OS/i })).toBeVisible();
    await page.getByRole('button', { name: /Explore with sample wardrobe/i }).click();

    await expect(page).not.toHaveURL(/onboarding/, { timeout: 30_000 });
    await expect(page.getByText(/You're viewing a demo wardrobe/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Bottles', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Wear this today/i })).toBeVisible({ timeout: 20_000 });
  });

  test('add fragrance via search and home shows content', async ({ page }) => {
    await completeOnboarding(page);
    await addFragranceFromSearch(page, 'Dior');

    await expect(page.getByText(/1 bottles/i)).toBeVisible();
    await page.getByRole('link', { name: 'Today' }).click();
    await expect(page.getByRole('button', { name: /Wear this today/i })).toBeVisible({ timeout: 20_000 });
  });

  test('travel kit persists trip name after reload', async ({ page }) => {
    await page.goto('./onboarding');
    await page.getByRole('button', { name: /Explore with sample wardrobe/i }).click();
    await expect(page).not.toHaveURL(/onboarding/, { timeout: 30_000 });

    await page.goto('./travel');
    await expect(page.getByRole('heading', { name: 'Travel kit' })).toBeVisible({ timeout: 10_000 });
    await page.getByLabel(/Trip name/i).fill('Dubai work trip');
    await page.waitForTimeout(600);

    await page.reload();
    await expect(page.getByLabel(/Trip name/i)).toHaveValue('Dubai work trip', { timeout: 10_000 });
  });

  test('navigate to advisor and get recommendation', async ({ page }) => {
    await completeOnboarding(page);
    await addFragranceFromSearch(page, 'Bleu');

    await page.getByRole('link', { name: 'Advisor' }).click();
    await expect(page.getByRole('heading', { name: 'Scent Advisor' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Get recommendation' }).click();
    await expect(page.getByText('Primary')).toBeVisible({ timeout: 15_000 });
  });
});
