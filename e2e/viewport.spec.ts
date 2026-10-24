import { test, expect } from '@playwright/test';
import { installTestMocks, loadDemoWardrobe, navLink, wearTodayButton } from './helpers';

/**
 * Shell contract for ScentCap 3 (src/components/layout/AppShell.tsx).
 *
 * AppShell switches between the floating `.ui-tabbar` and the desktop sidebar at Tailwind `md:`.
 * src/index.css overrides the default (768px) with `--breakpoint-md: 700px`, matching DESIGN.md's "Cap BP".
 * So: <=699px tabs, >=700px sidebar — iPad mini portrait (744px) gets the sidebar. If anyone drops the
 * override and `md:` reverts to Tailwind's 768px, the 700/744 cases below fail loudly.
 */
const CAP_BP = 700;

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
    await expect(page.locator('.ui-tabbar')).toBeVisible();
    await expect(wearTodayButton(page)).toBeVisible({ timeout: 20_000 });
  });

  test('tab bar lists Today · Collection · Advisor · Diary · Settings', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loadDemoWardrobe(page);
    const links = page.locator('nav.ui-tabbar').getByRole('link');
    await expect(links).toHaveText(['Today', 'Collection', 'Advisor', 'Diary', 'Settings']);
  });

  test(`${CAP_BP - 1}px — just under Cap BP — tabs, no sidebar`, async ({ page }) => {
    await page.setViewportSize({ width: CAP_BP - 1, height: 900 });
    await loadDemoWardrobe(page);
    await expect(page.getByTestId('desktop-sidebar')).toBeHidden();
    await expect(page.locator('.ui-tabbar')).toBeVisible();
  });

  test(`${CAP_BP}px — Cap BP — sidebar, tabs hidden`, async ({ page }) => {
    await page.setViewportSize({ width: CAP_BP, height: 900 });
    await loadDemoWardrobe(page);
    const sidebar = page.getByTestId('desktop-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(page.locator('.ui-tabbar')).toBeHidden();
    // 3.0 sidebar footer reads "ScentCap {version}", not a bare "vX.Y.Z".
    await expect(sidebar.getByText(/^ScentCap\s+v?\d+\.\d+\.\d+/)).toBeVisible();
  });

  test('744px — iPad mini width — sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 744, height: 1133 });
    await loadDemoWardrobe(page);
    await expect(page.getByTestId('desktop-sidebar')).toBeVisible();
    await expect(page.locator('.ui-tabbar')).toBeHidden();
  });

  test('1280px — desktop sidebar, floating tabs hidden', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loadDemoWardrobe(page);
    await expect(page.getByTestId('desktop-sidebar')).toBeVisible();
    await expect(page.locator('.ui-tabbar')).toBeHidden();
    for (const label of ['Today', 'Collection', 'Advisor', 'Diary', 'Settings']) {
      await expect(navLink(page, label)).toBeVisible();
    }
  });

  test('375px — no content clipped behind floating tabs on primary routes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loadDemoWardrobe(page);
    const labels = ['Today', 'Collection', 'Advisor', 'Diary', 'Settings'];
    for (const label of labels) {
      await navLink(page, label).click();
      await expect(page.locator('main .ui-page').first()).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(400);
      const { pad, clearance } = await page.evaluate(() => {
        // 3.0: <main> is unpadded; the page container (.ui-page) owns the bottom inset.
        const page = document.querySelector('main .ui-page');
        const nav = document.querySelector('.ui-tabbar');
        if (!page || !nav) return { pad: 0, clearance: Number.POSITIVE_INFINITY };
        const pad = parseFloat(getComputedStyle(page).paddingBottom) || 0;
        const navRect = nav.getBoundingClientRect();
        // Distance the tab bar covers from the viewport bottom edge.
        return { pad, clearance: window.innerHeight - navRect.top };
      });
      expect(pad + 1, `tab ${label}: .ui-page bottom padding (${pad}px) clears floating tabs (${clearance}px)`).toBeGreaterThanOrEqual(
        clearance,
      );
    }
  });
});
