import { test, expect } from '@playwright/test';
import {
  addFragranceFromSearch,
  completeOnboarding,
  installTestMocks,
  loadDemoWardrobe,
} from './helpers';

test.describe('ScentCap PWA', () => {
  test.beforeEach(async ({ context, page }) => {
    await installTestMocks(page);
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
  });

  test('onboarding flow completes', async ({ page }) => {
    await completeOnboarding(page);
    await expect(page).toHaveURL(/\/ScentCap\/?$/);
  });

  test('demo flow loads sample wardrobe on home', async ({ page }) => {
    await loadDemoWardrobe(page);
    await expect(page.getByText('Bottles', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Wear this today/i })).toBeVisible({ timeout: 20_000 });
  });

  test('add fragrance via search and home shows content', async ({ page }) => {
    await completeOnboarding(page);
    await addFragranceFromSearch(page, 'Dior');

    await expect(page.getByText(/1 bottle/i)).toBeVisible();
    await page.getByRole('link', { name: 'Today' }).click();
    await expect(page.getByRole('button', { name: /Wear this today/i })).toBeVisible({ timeout: 20_000 });
  });

  test('delete bottle removes it from wardrobe', async ({ page }) => {
    await completeOnboarding(page);
    await addFragranceFromSearch(page, 'Dior');

    await page.getByRole('link', { name: 'Collection' }).click();
    await expect(page.getByText(/1 bottle/i)).toBeVisible();
    await page.locator('a[href*="/fragrance/"]').first().click();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete' }).last().click();
    await expect(page).toHaveURL(/\/collection/, { timeout: 15_000 });
    await expect(page.getByText(/Your cabinet is empty/i)).toBeVisible();
  });

  test('travel kit persists trip name after reload', async ({ page }) => {
    await loadDemoWardrobe(page);

    await page.getByRole('link', { name: 'You' }).click();
    await page.getByRole('link', { name: /Travel kit planner/i }).click();
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
    await expect(page.getByText(/Primary pick/i)).toBeVisible({ timeout: 15_000 });
  });

  test('calendar month prev/next navigation', async ({ page }) => {
    await loadDemoWardrobe(page);

    await page.getByRole('complementary').getByRole('link', { name: 'Calendar', exact: true }).click();
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

    await loadDemoWardrobe(page);
    await expect(page.getByRole('button', { name: /Wear this today/i })).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: 'Share' }).click();
    await expect(page.getByText(/Shared!|Copied to clipboard|Saved as PNG/)).toBeVisible({ timeout: 10_000 });
    expect(pageErrors).toHaveLength(0);
  });
});

test.describe('ScentCap PWA features', () => {
  test.beforeEach(async ({ context, page }) => {
    await installTestMocks(page);
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
  });

  test('Analytics and Travel Kit open for all users', async ({ page }) => {
    await loadDemoWardrobe(page);

    await page.getByRole('link', { name: 'You' }).click();
    await page.getByRole('link', { name: /Travel kit planner/i }).click();
    await expect(page.getByRole('heading', { name: 'Travel kit' })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('link', { name: 'You' }).click();
    await page.getByRole('link', { name: /Collection analytics|Analytics/i }).click();
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 10_000 });
  });

  test('Settings IA groups and theme toggle', async ({ page }) => {
    await loadDemoWardrobe(page);
    await page.getByRole('link', { name: 'You' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    for (const section of ['Account', 'Appearance', 'Advisor', 'Weather', 'Tools', 'Privacy & Data', 'About & Legal']) {
      await expect(page.getByRole('heading', { name: section, exact: true })).toBeVisible();
    }

    await expect(page.getByRole('link', { name: 'Layering Lab' })).toBeVisible();
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Dark', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('body')).not.toHaveClass(/\blight\b/);
  });

  test('import rejects invalid JSON backup', async ({ page }) => {
    await loadDemoWardrobe(page);
    await page.getByRole('link', { name: 'You' }).click();

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/not valid JSON|invalid/i);
      await dialog.accept();
    });

    await page.getByTestId('import-backup').setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{not-json', 'utf-8'),
    });
    await page.waitForTimeout(400);
  });

  test('import rejects future backup version', async ({ page }) => {
    await loadDemoWardrobe(page);
    await page.getByRole('link', { name: 'You' }).click();

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/newer than this app supports/i);
      await dialog.accept();
    });

    await page.getByTestId('import-backup').setInputFiles({
      name: 'future.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ version: 99, fragrances: [] }), 'utf-8'),
    });
    await page.waitForTimeout(400);
  });

  test('home still works offline after load', async ({ page, context }) => {
    await loadDemoWardrobe(page);
    await expect(page.getByRole('button', { name: /Wear this today/i })).toBeVisible({ timeout: 20_000 });
    await page.waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout: 20_000 }).catch(() => null);
    await context.setOffline(true);
    await page.getByRole('link', { name: 'Collection', exact: true }).click();
    await expect(page.getByRole('heading', { name: /My bottles|Wishlist|Tested/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: 'Today', exact: true }).click();
    await expect(page.getByRole('button', { name: /Wear this today/i })).toBeVisible({ timeout: 20_000 });
    await context.setOffline(false);
  });

  test('demo wardrobe hydrates real catalog bottle photos', async ({ page }) => {
    test.setTimeout(90_000);
    await loadDemoWardrobe(page);
    await expect(page.getByRole('button', { name: /Wear this today/i })).toBeVisible({ timeout: 20_000 });

    await expect
      .poll(async () => {
        return page.evaluate(async () => {
          const dbReq = indexedDB.open('scentcap-v1');
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            dbReq.onsuccess = () => resolve(dbReq.result);
            dbReq.onerror = () => reject(dbReq.error);
          });
          const tx = db.transaction('fragrances', 'readonly');
          const all = await new Promise<Array<{ image?: string }>>((resolve, reject) => {
            const req = tx.objectStore('fragrances').getAll();
            req.onsuccess = () => resolve(req.result as Array<{ image?: string }>);
            req.onerror = () => reject(req.error);
          });
          db.close();
          return all.filter((f) => typeof f.image === 'string' && /^https?:\/\//.test(f.image)).length;
        });
      }, { timeout: 45_000 })
      .toBeGreaterThanOrEqual(6);
  });
});
