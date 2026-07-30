import { test, expect } from '@playwright/test';
import { installTestMocks, loadDemoWardrobe } from './helpers';

test.describe('ScentCap viewport contract', () => {
  test.beforeEach(async ({ context, page }) => {
    await installTestMocks(page);
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
  });

  test('375px — floating tabs, desktop sidebar hidden', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loadDemoWardrobe(page);
    await expect(page.getByTestId('desktop-sidebar')).toBeHidden();
    await expect(page.locator('.atelier-tabbar')).toBeVisible();
    await expect(page.getByRole('button', { name: /Wear this today/i })).toBeVisible({ timeout: 20_000 });
  });

  test('699px — just under Cap BP — tabs, no sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 699, height: 900 });
    await loadDemoWardrobe(page);
    await expect(page.getByTestId('desktop-sidebar')).toBeHidden();
    await expect(page.locator('.atelier-tabbar')).toBeVisible();
  });

  test('700px — Cap BP — sidebar, tabs hidden (iPad mini trap)', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 900 });
    await loadDemoWardrobe(page);
    await expect(page.getByTestId('desktop-sidebar')).toBeVisible();
    await expect(page.locator('.atelier-tabbar')).toBeHidden();
    await expect(page.getByTestId('desktop-sidebar').getByText(/^v\d+\.\d+\.\d+$/)).toBeVisible();
  });

  test('744px — iPad mini width — sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 744, height: 1133 });
    await loadDemoWardrobe(page);
    await expect(page.getByTestId('desktop-sidebar')).toBeVisible();
    await expect(page.locator('.atelier-tabbar')).toBeHidden();
  });

  test('1280px — desktop sidebar, floating tabs hidden', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loadDemoWardrobe(page);
    await expect(page.getByTestId('desktop-sidebar')).toBeVisible();
    await expect(page.locator('.atelier-tabbar')).toBeHidden();
    await expect(page.getByTestId('desktop-sidebar').getByRole('link', { name: 'Collection' })).toBeVisible();
  });
});
