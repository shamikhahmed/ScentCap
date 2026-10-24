/**
 * Product walkthrough recordings — CAPTURE_VIDEO=1 required. Raw WebM lands in test-results;
 * scripts/encode-videos.sh turns them into H.264 MP4 + posters in docs/video and docs/store/preview.
 */
import { test, expect, type Page } from '@playwright/test';
import { installTestMocks } from './helpers';

const FORMATS = [
  { id: 'walkthrough-portrait', viewport: { width: 432, height: 768 }, size: { width: 1080, height: 1920 }, mobile: true },
  { id: 'walkthrough-landscape', viewport: { width: 1280, height: 720 }, size: { width: 1920, height: 1080 }, mobile: false },
  { id: 'appstore-preview', viewport: { width: 443, height: 960 }, size: { width: 886, height: 1920 }, mobile: true },
] as const;

async function glide(page: Page, px: number, steps = 12) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, px / steps);
    await page.waitForTimeout(45);
  }
}

for (const f of FORMATS) {
  test.describe(f.id, () => {
    test.skip(!process.env.CAPTURE_VIDEO, 'CAPTURE_VIDEO=1 to record');
    test('record', async ({ browser }, info) => {
      test.setTimeout(180_000);
      const context = await browser.newContext({
        baseURL: info.project.use.baseURL,
        viewport: f.viewport,
        isMobile: f.mobile,
        hasTouch: f.mobile,
        colorScheme: 'light',
        recordVideo: { dir: `test-results/videos/${f.id}`, size: f.size },
      });
      const page = await context.newPage();
      await installTestMocks(page);
      const short = f.id === 'appstore-preview';

      // 1. Welcome
      await page.goto('./onboarding');
      await expect(page.getByRole('button', { name: /Explore a sample wardrobe/i })).toBeVisible();
      await page.waitForTimeout(short ? 1600 : 2400);
      await page.getByRole('button', { name: /Explore a sample wardrobe/i }).click();

      // 2. Today pick
      await expect(page.getByTestId('demo-banner')).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(short ? 2000 : 2800);
      await page.getByRole('button', { name: 'Date', exact: true }).click();
      await page.waitForTimeout(1600);
      await glide(page, 520);
      await page.waitForTimeout(1200);
      await glide(page, -520);
      await page.getByRole('button', { name: 'Wear today' }).first().click();
      await page.waitForTimeout(1200);
      const save = page.getByRole('button', { name: /Save to diary/i });
      if (await save.isVisible().catch(() => false)) {
        await page.getByRole('radio', { name: '5 stars' }).click();
        await page.waitForTimeout(700);
        await save.click();
      }
      await page.waitForTimeout(900);

      // 3. Add via search
      await page.goto('./add');
      await page.waitForTimeout(1400);
      await page.locator('#catalog-search').click();
      await page.keyboard.type('baccarat', { delay: 110 });
      await page.locator('#catalog-search').blur();
      await page.waitForTimeout(1300);
      await page.locator('button.ui-bottle').first().click();
      await page.waitForTimeout(1800);
      await page.getByRole('button', { name: 'Add to collection' }).click();

      // 4. Detail
      await expect(page.getByRole('status').filter({ hasText: 'Added to your collection' })).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(1800);
      if (!short) {
        await glide(page, 700, 16);
        await page.waitForTimeout(1500);
      }

      // 5. Collection
      await page.goto('./collection');
      await page.waitForTimeout(1500);
      await glide(page, short ? 360 : 640, 14);
      await page.waitForTimeout(1600);

      await context.close(); // flushes the WebM
    });
  });
}
