import { test, expect } from '@playwright/test';
import { installTestMocks, loadDemoWardrobe } from './helpers';

test.describe('ScentCap viewport contract', () => {
  test.beforeEach(async ({ context, page }) => {
    await installTestMocks(page, { pro: true });
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
  });

  test('375px — floating tabs, desktop sidebar hidden', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loadDemoWardrobe(page);
    await expect(page.getByTestId('desktop-sidebar')).toBeHidden();
    await expect(page.locator('.floating-tab-shell')).toBeVisible();
    await expect(page.getByRole('button', { name: /Wear this today/i })).toBeVisible({ timeout: 20_000 });
  });

  test('1280px — desktop sidebar, floating tabs hidden', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loadDemoWardrobe(page);
    await expect(page.getByTestId('desktop-sidebar')).toBeVisible();
    await expect(page.locator('.floating-tab-shell')).toBeHidden();
    await expect(page.getByTestId('desktop-sidebar').getByRole('link', { name: 'Collection' })).toBeVisible();
  });
});
