/**
 * App Store screenshot sets — CAPTURE_STORE=1 required.
 * 6.9" 1320×2868 · 6.5" 1284×2778 · iPad 13" 2064×2752. Demo wardrobe, light mode, real bottle photos.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { installTestMocks, loadDemoWardrobe } from './helpers';

const OUT = join(process.cwd(), 'docs', 'store', 'screenshots');

const SETS = [
  { id: 'iphone-6.9', viewport: { width: 440, height: 956 }, scale: 3, mobile: true },
  { id: 'iphone-6.5', viewport: { width: 428, height: 926 }, scale: 3, mobile: true },
  { id: 'ipad-13', viewport: { width: 1032, height: 1376 }, scale: 2, mobile: true },
] as const;

const SCREENS = [
  { file: '01-today', route: './' },
  { file: '02-add', route: './add', search: 'bleu' },
  { file: '03-collection', route: './collection' },
  { file: '04-detail', route: './collection', openFirst: true },
  { file: '05-advisor', route: './advisor' },
  { file: '06-diary', route: './calendar' },
  { file: '07-insights', route: './analytics' },
] as const;

for (const set of SETS) {
  test.describe(`store · ${set.id}`, () => {
    test.skip(!process.env.CAPTURE_STORE, 'CAPTURE_STORE=1 to capture');
    test.use({ viewport: set.viewport, deviceScaleFactor: set.scale, isMobile: set.mobile, hasTouch: true, colorScheme: 'light' });

    test('capture', async ({ page }) => {
      test.setTimeout(180_000);
      mkdirSync(join(OUT, set.id), { recursive: true });
      await installTestMocks(page);
      await loadDemoWardrobe(page);
      for (const s of SCREENS) {
        await page.goto(s.route);
        await page.waitForLoadState('networkidle');
        if ('search' in s && s.search) {
          await page.locator('#catalog-search').fill(s.search);
          await page.locator('#catalog-search').blur();
          await page.waitForTimeout(800);
        }
        if ('openFirst' in s && s.openFirst) {
          await page.locator('a.ui-bottle').first().click();
          await expect(page.getByRole('button', { name: /Wear today|Worn today/ })).toBeVisible();
        }
        // Let lazy bottle images decode.
        await page.waitForFunction(() => [...document.images].filter((i) => i.getBoundingClientRect().top < innerHeight).every((i) => i.complete));
        await page.waitForTimeout(400);
        await page.screenshot({ path: join(OUT, set.id, `${s.file}.png`) });
      }
    });
  });
}
