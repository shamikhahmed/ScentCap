import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { goTab, installTestMocks, loadDemoWardrobe, wearTodayButton } from './helpers';

const SCREENSHOT_DIR = join(process.cwd(), 'docs', 'screenshots');
const IPHONE_15_PRO = { width: 393, height: 852 };

const SHOTS = [
  { file: '01-today-home.png', name: 'Today home with demo wardrobe' },
  { file: '02-office-safe.png', name: 'Office Safe enabled on home' },
  { file: '03-advisor-spray-map.png', name: 'Advisor application map' },
  { file: '04-layering-lab.png', name: 'Layering Lab' },
  { file: '05-analytics.png', name: 'Collection Analytics' },
  { file: '06-travel-kit.png', name: 'Travel kit planner' },
] as const;

test.describe('App Store screenshots', () => {
  test.use({
    viewport: IPHONE_15_PRO,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  test.beforeAll(() => {
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  test.beforeEach(async ({ context, page }) => {
    await installTestMocks(page);
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
  });

  test('capture 6 iPhone 15 Pro screenshots', async ({ page }) => {
    await loadDemoWardrobe(page);

    // 1 — Today / Home
    await expect(wearTodayButton(page)).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: join(SCREENSHOT_DIR, SHOTS[0].file), fullPage: true });

    // 2 — Office Safe visible on home
    await goTab(page, 'Settings');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible({ timeout: 10_000 });
    const officeSwitch = page.getByRole('checkbox', { name: 'Office Safe', exact: true });
    await expect(officeSwitch).toBeVisible();
    if (!(await officeSwitch.isChecked())) {
      await officeSwitch.click(); // async IDB-backed toggle: don't use .check() (it asserts state synchronously)
    }
    await expect(officeSwitch).toBeChecked({ timeout: 5_000 });
    await goTab(page, 'Today');
    await expect(page.getByText(/Office Safe is on/i)).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: join(SCREENSHOT_DIR, SHOTS[1].file), fullPage: true });

    // 3 — Advisor spray / body map
    await goTab(page, 'Advisor');
    await expect(page.getByRole('heading', { name: 'Scent Advisor' })).toBeVisible();
    await page.getByRole('button', { name: 'Get recommendation' }).click();
    await expect(page.getByText(/Primary pick|Where to spray|Layering placement/i).first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: join(SCREENSHOT_DIR, SHOTS[2].file), fullPage: true });

    // 4 — Layering Lab (not in mobile tab bar)
    await page.goto('./layering');
    await expect(page.getByRole('heading', { name: 'Layering Lab', level: 1 })).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: join(SCREENSHOT_DIR, SHOTS[3].file), fullPage: true });

    // 5 — Analytics
    await page.goto('./analytics');
    await expect(page.getByRole('heading', { name: 'Insights', level: 1 })).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: join(SCREENSHOT_DIR, SHOTS[4].file), fullPage: true });

    // 6 — Travel Kit
    await page.goto('./travel');
    await expect(page.getByRole('heading', { name: 'Travel kit' })).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: join(SCREENSHOT_DIR, SHOTS[5].file), fullPage: true });

    for (const shot of SHOTS) {
      await expect(page.locator('body')).toBeVisible();
      expect(shot.file).toMatch(/\.png$/);
    }
  });
});
