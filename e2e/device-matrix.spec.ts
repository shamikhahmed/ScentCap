/**
 * Device matrix visual QA — set DEVICE_MATRIX=1 to capture.
 * Out: qa/device-matrix/{family}/{device-id}/{screen}.png + meta.json
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { installTestMocks, loadDemoWardrobe } from './helpers';
import {
  ALL_DEVICES,
  MAJOR_SCREENS,
  applyDeviceChrome,
  dismissOverlays,
  expectedLayout,
  forceDarkTheme,
  probeLayout,
} from './device-matrix';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'qa', 'device-matrix');
const RUN = process.env.DEVICE_MATRIX === '1';

test.describe('Device matrix visual QA', () => {
  test.skip(!RUN, 'Set DEVICE_MATRIX=1 to capture');

  test.beforeEach(async ({ context, page }) => {
    await installTestMocks(page);
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
  });

  test('capture major screens across iPhone / iPad / browser', async ({ page }) => {
    test.setTimeout(45 * 60 * 1000);
    fs.mkdirSync(OUT, { recursive: true });
    const meta: object[] = [];

    // Unlock demo wardrobe once, then dark theme for matrix
    await applyDeviceChrome(page, ALL_DEVICES[0]);
    await loadDemoWardrobe(page);
    await forceDarkTheme(page);
    await page.goto('./');
    await expect(page.getByText(/Wear this today|sample wardrobe|Sample wardrobe/i).first()).toBeVisible({
      timeout: 30_000,
    });

    for (const device of ALL_DEVICES) {
      const dir = path.join(OUT, device.family, device.id);
      fs.mkdirSync(dir, { recursive: true });
      await applyDeviceChrome(page, device);

      for (const screen of MAJOR_SCREENS) {
        await dismissOverlays(page);
        await applyDeviceChrome(page, device);
        await page.evaluate(() => document.body.classList.remove('light'));

        if (screen.kind === 'welcome') {
          await page.goto('./onboarding');
          await expect(page.getByRole('heading', { name: /Your scent (counter|wardrobe)/i })).toBeVisible({
            timeout: 20_000,
          });
        } else {
          await page.goto(`.${screen.route === '/' ? '/' : screen.route}`);
          await page.waitForTimeout(450);
          const main = page.locator('#main');
          if (screen.id === 'dashboard') {
            await expect(main.getByRole('button', { name: /Wear this today/i })).toBeVisible({ timeout: 25_000 });
          } else if (screen.id === 'collection') {
            await expect(main).toBeVisible({ timeout: 20_000 });
          } else if (screen.id === 'settings') {
            await expect(main.getByText(/Appearance|About & Legal/i).first()).toBeVisible({ timeout: 20_000 });
          } else if (screen.id === 'advisor') {
            await expect(main).toBeVisible({ timeout: 20_000 });
          } else if (screen.id === 'add-sheet') {
            await expect(page.getByRole('heading', { name: /Add fragrance/i })).toBeVisible({ timeout: 20_000 });
          }
        }

        await page.waitForTimeout(220);
        const probe = await probeLayout(page);
        const expectMode = expectedLayout(device.width);
        const layoutOk =
          screen.kind === 'welcome'
            ? !probe.overflow
            : probe.layout === expectMode &&
              !probe.overflow &&
              (screen.id !== 'dashboard' ||
                probe.wearClearOfTabs !== false);

        const file = path.join(dir, `${screen.id}.png`);
        await page.screenshot({ path: file, fullPage: false });

        meta.push({
          family: device.family,
          deviceId: device.id,
          label: device.label,
          width: device.width,
          height: device.height,
          chrome: device.chrome,
          safeTop: device.safeTop,
          safeBottom: device.safeBottom,
          screen: screen.id,
          screenLabel: screen.label,
          expectedLayout: screen.kind === 'welcome' ? 'n/a' : expectMode,
          layoutOk,
          ...probe,
          file: path.relative(path.join(__dirname, '..'), file),
        });
      }

      // Restore wardrobe shell after welcome (profile still demo-complete)
      await page.goto('./');
      await page.waitForTimeout(200);
    }

    fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));

    for (const d of ALL_DEVICES) {
      expect(fs.existsSync(path.join(OUT, d.family, d.id, 'dashboard.png'))).toBe(true);
    }

    const bad = (meta as { layoutOk?: boolean; deviceId: string; screen: string }[]).filter((m) => m.layoutOk === false);
    expect(bad, `layout/overflow failures: ${JSON.stringify(bad.slice(0, 8))}`).toEqual([]);
  });
});
