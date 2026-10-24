import { test, expect } from '@playwright/test';
import {
  addFragranceFromSearch,
  completeOnboarding,
  goTab,
  installTestMocks,
  loadDemoWardrobe,
  wearTodayButton,
} from './helpers';

test.describe('ScentCap PWA', () => {
  test.beforeEach(async ({ context, page }) => {
    await installTestMocks(page);
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
  });

  test('onboarding flow completes', async ({ page }) => {
    await completeOnboarding(page);
    // ScentCap 3 sends new users straight to the first-bottle step.
    await expect(page).toHaveURL(/\/ScentCap\/add\/?$/);
  });

  test('demo flow loads sample wardrobe on home', async ({ page }) => {
    await loadDemoWardrobe(page);
    await expect(page.getByText('Bottles', { exact: true })).toBeVisible();
    await expect(wearTodayButton(page)).toBeVisible({ timeout: 20_000 });
  });

  test('add fragrance via search and home shows content', async ({ page }) => {
    await completeOnboarding(page);
    await addFragranceFromSearch(page, 'Dior');

    await goTab(page, 'Collection');
    await expect(page.getByText(/1 bottle/i)).toBeVisible();
    await goTab(page, 'Today');
    await expect(wearTodayButton(page)).toBeVisible({ timeout: 20_000 });
  });

  test('delete bottle removes it from wardrobe', async ({ page }) => {
    await completeOnboarding(page);
    await addFragranceFromSearch(page, 'Dior');

    await goTab(page, 'Collection');
    await expect(page.getByText(/1 bottle/i)).toBeVisible();
    await page.locator('a[href*="/fragrance/"]').first().click();
    const remove = page.getByRole('button', { name: /Remove from collection/i });
    await expect(remove).toBeVisible({ timeout: 10_000 });

    await remove.click();
    const sheet = page.getByRole('dialog', { name: /Remove bottle/i });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page).toHaveURL(/\/collection/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Your shelf is empty/i })).toBeVisible();
  });

  test('travel kit persists trip name after reload', async ({ page }) => {
    await loadDemoWardrobe(page);

    await goTab(page, 'Settings');
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

    await goTab(page, 'Advisor');
    await expect(page.getByRole('heading', { name: 'Scent Advisor' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Get recommendation' }).click();
    await expect(page.getByText(/Primary pick/i)).toBeVisible({ timeout: 15_000 });
  });

  test('calendar month prev/next navigation', async ({ page }) => {
    await loadDemoWardrobe(page);

    await goTab(page, 'Diary');
    await expect(page.getByRole('heading', { name: 'Diary', level: 1 })).toBeVisible({ timeout: 10_000 });

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
    await expect(wearTodayButton(page)).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: /Share today/i }).click();
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

    await goTab(page, 'Settings');
    await page.getByRole('link', { name: /Travel kit planner/i }).click();
    await expect(page.getByRole('heading', { name: 'Travel kit' })).toBeVisible({ timeout: 10_000 });

    await goTab(page, 'Settings');
    await page.getByRole('link', { name: /Collection analytics/i }).click();
    await expect(page.getByRole('heading', { name: 'Insights', level: 1 })).toBeVisible({ timeout: 10_000 });
  });

  test('Settings IA groups and theme toggle', async ({ page }) => {
    await loadDemoWardrobe(page);
    await goTab(page, 'Settings');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();

    // Inset-grouped list headers (<p class="ui-list-header">, not headings). Scoped to <main> — the sidebar
    // also has a "Tools" header and Profile has a row with the same title.
    const main = page.locator('main');
    for (const section of ['Profile', 'Preferences', 'Tools', 'Data', 'About']) {
      await expect(main.locator('.ui-list-header', { hasText: new RegExp(`^${section}$`) })).toBeVisible();
    }

    await expect(main.getByRole('link', { name: 'Layering Lab' })).toBeVisible();

    const theme = page.getByRole('group', { name: 'Theme' });
    for (const label of ['Light', 'Dark', 'System']) {
      await expect(theme.getByRole('button', { name: label, exact: true })).toBeVisible();
    }
    const pressed = async (label: string) =>
      expect(theme.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');

    await theme.getByRole('button', { name: 'Light', exact: true }).click();
    await pressed('Light');
    await expect(page.locator('body')).toHaveClass(/\blight\b/);

    await theme.getByRole('button', { name: 'Dark', exact: true }).click();
    await pressed('Dark');
    await expect(theme.getByRole('button', { name: 'Light', exact: true })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('body')).not.toHaveClass(/\blight\b/);

    await theme.getByRole('button', { name: 'System', exact: true }).click();
    await pressed('System');
  });

  test('import rejects invalid JSON backup', async ({ page }) => {
    await loadDemoWardrobe(page);
    await goTab(page, 'Settings');

    // 3.0: failures surface in a Sheet, never a native alert().
    let nativeDialog = false;
    page.on('dialog', async (dialog) => {
      nativeDialog = true;
      await dialog.dismiss();
    });

    await page.getByTestId('import-backup').setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{not-json', 'utf-8'),
    });

    const sheet = page.getByRole('dialog', { name: 'Import failed' });
    await expect(sheet).toBeVisible({ timeout: 10_000 });
    await expect(sheet.getByText(/not valid JSON|invalid/i)).toBeVisible();
    await sheet.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(sheet).toBeHidden();
    expect(nativeDialog).toBe(false);
  });

  test('import rejects future backup version', async ({ page }) => {
    await loadDemoWardrobe(page);
    await goTab(page, 'Settings');

    let nativeDialog = false;
    page.on('dialog', async (dialog) => {
      nativeDialog = true;
      await dialog.dismiss();
    });

    await page.getByTestId('import-backup').setInputFiles({
      name: 'future.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ version: 99, fragrances: [] }), 'utf-8'),
    });

    const sheet = page.getByRole('dialog', { name: 'Import failed' });
    await expect(sheet).toBeVisible({ timeout: 10_000 });
    await expect(sheet.getByText(/newer than this app supports/i)).toBeVisible();
    await sheet.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(sheet).toBeHidden();
    expect(nativeDialog).toBe(false);
  });

  test('home still works offline after load', async ({ page, context }) => {
    await loadDemoWardrobe(page);
    await expect(wearTodayButton(page)).toBeVisible({ timeout: 20_000 });
    await page.waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout: 20_000 }).catch(() => null);
    await context.setOffline(true);
    await goTab(page, 'Collection');
    await expect(page.getByRole('heading', { name: 'Collection', level: 1 })).toBeVisible({ timeout: 15_000 });
    await goTab(page, 'Today');
    await expect(wearTodayButton(page)).toBeVisible({ timeout: 20_000 });
    await context.setOffline(false);
  });

  test('demo wardrobe ships bundled bottle art offline (no Fraganty)', async ({ page }) => {
    // Demo is intentionally offline: bottle art is bundled (`bottles/*.webp`) or an inline data URI —
    // never a live catalog https:// URL.
    test.setTimeout(60_000);
    await loadDemoWardrobe(page);
    await expect(wearTodayButton(page)).toBeVisible({ timeout: 20_000 });

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
          return all.filter(
            (f) => typeof f.image === 'string' && /^(data:image\/|bottles\/)/.test(f.image),
          ).length;
        });
      }, { timeout: 15_000 })
      .toBeGreaterThanOrEqual(6);
  });
});
