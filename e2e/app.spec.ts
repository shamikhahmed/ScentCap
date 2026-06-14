import { test, expect, type Page } from '@playwright/test';

const ONBOARDING_STEPS = [
  { heading: /Where do you spend most days/i, choice: 'Office daily' },
  { heading: /How bold should scents be/i, choice: 'Moderate' },
] as const;

async function completeOnboarding(page: Page) {
  await page.goto('./onboarding');
  await expect(page.getByRole('heading', { name: /Your fragrance OS/i })).toBeVisible();
  await page.getByRole('button', { name: /Quick setup/i }).click();
  await expect(page.getByRole('heading', { name: ONBOARDING_STEPS[0].heading })).toBeVisible();

  for (const step of ONBOARDING_STEPS) {
    await expect(page.getByRole('heading', { name: step.heading })).toBeVisible();
    await page.getByRole('button', { name: step.choice, exact: true }).click();
  }

  await expect(page.getByRole('heading', { name: /Office Safe/i })).toBeVisible();
  await page.locator('button').filter({ hasText: /Office Safe is ON/i }).click();
  await page.getByRole('button', { name: /Get started/i }).click();

  await expect(page).not.toHaveURL(/onboarding/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: /Your wardrobe awaits|Keep it airy|Balanced weather|Rich scents|Let longevity/i })).toBeVisible({ timeout: 15_000 });
}

async function addFragranceFromSearch(page: Page, query: string) {
  await page.getByRole('link', { name: /Add first bottle|Add bottle/i }).first().click();
  await expect(page.getByRole('heading', { name: /Add fragrance/i })).toBeVisible();

  await page.getByPlaceholder(/Search by brand or name/i).fill(query);
  await expect(page.locator('button').filter({ hasText: /^(EDT|EDP|Parfum|Cologne|Extrait)$/ }).first()).toBeVisible({ timeout: 20_000 });

  await page.locator('button').filter({ hasText: /^(EDT|EDP|Parfum|Cologne|Extrait)$/ }).first().click();
  await page.getByRole('button', { name: 'Add to wardrobe' }).click();
  await expect(page).toHaveURL(/\/collection/, { timeout: 15_000 });
}

test.describe('ScentCap PWA', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('scentcap_pro', 'true');

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
    await page.getByRole('button', { name: /Try demo collection/i }).click();

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
    await page.getByRole('button', { name: /Try demo collection/i }).click();
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

  test('calendar month prev/next navigation', async ({ page }) => {
    await page.goto('./onboarding');
    await page.getByRole('button', { name: /Try demo collection/i }).click();
    await expect(page).not.toHaveURL(/onboarding/, { timeout: 30_000 });

    await page.goto('./calendar');
    await expect(page.getByRole('heading', { name: 'Wear calendar' })).toBeVisible({ timeout: 10_000 });

    const monthLabel = page.locator('p.text-sm.font-medium').filter({ hasText: /\w+ \d{4}/ });
    const initial = await monthLabel.textContent();

    await page.getByRole('button', { name: 'Previous month' }).click();
    await expect(monthLabel).not.toHaveText(initial ?? '');

    await page.getByRole('button', { name: 'Next month' }).click();
    await expect(monthLabel).toHaveText(initial ?? '');
  });

  test('share card export does not throw', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('./onboarding');
    await page.getByRole('button', { name: /Try demo collection/i }).click();
    await expect(page.getByRole('button', { name: /Wear this today/i })).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: /Share today's pick/i }).click();
    await expect(page.getByText(/Shared!|Copied to clipboard|Saved as PNG/)).toBeVisible({ timeout: 10_000 });
    expect(pageErrors).toHaveLength(0);
  });
});

test.describe('ScentCap Pro paywall', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      localStorage.removeItem('scentcap_pro');
    });
  });

  test('gated feature shows paywall when not Pro', async ({ page }) => {
    await page.goto('./onboarding');
    await page.getByRole('button', { name: /Try demo collection/i }).click();
    await expect(page).not.toHaveURL(/onboarding/, { timeout: 30_000 });

    await page.goto('./travel');
    await expect(page.getByTestId('paywall-modal')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /Upgrade to Pro/i })).toBeVisible();
  });

  test('bottle limit shows paywall when adding 13th bottle', async ({ page }) => {
    await completeOnboarding(page);

    for (let i = 0; i < 12; i++) {
      await addFragranceFromSearch(page, 'Dior');
      if (i < 11) {
        await page.getByRole('link', { name: /Add bottle/i }).first().click();
      }
    }

    await page.getByRole('link', { name: /Add bottle/i }).first().click();
    await page.getByPlaceholder(/Search by brand or name/i).fill('Chanel');
    await expect(page.locator('button').filter({ hasText: /^(EDT|EDP|Parfum|Cologne|Extrait)$/ }).first()).toBeVisible({ timeout: 20_000 });
    await page.locator('button').filter({ hasText: /^(EDT|EDP|Parfum|Cologne|Extrait)$/ }).first().click();
    await page.getByRole('button', { name: 'Add to wardrobe' }).click();

    await expect(page.getByTestId('paywall-modal')).toBeVisible({ timeout: 10_000 });
  });
});
