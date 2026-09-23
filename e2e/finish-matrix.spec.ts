import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  matrixViewports,
  FINISH_THEMES,
  waitForAppReady,
  assertNoHorizontalOverflow,
  assertNotObscured,
  applyFinishTheme,
  writeMatrixResults,
} from './helpers/finish-matrix.js';
import { installTestMocks } from './helpers';

const RUN = process.env.FINISH_MATRIX === '1' || process.env.FINISH_MATRIX_FULL === '1';
const SHOTS = path.join('qa', 'finish-loop', 'shots');
const ROUTES = ['home'];

test.describe('finish-matrix', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!RUN, 'Set FINISH_MATRIX=1');
  const failures: string[] = [];
  for (const vp of matrixViewports()) {
    for (const theme of FINISH_THEMES) {
      test(`home · ${vp.name} · ${theme}`, async ({ page }) => {
        test.setTimeout(90_000);
        try {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await installTestMocks(page);
          await page.goto('/?demo=1');
          await waitForAppReady(page).catch(async () => {
            await page.waitForLoadState('domcontentloaded');
            const ready = await page.evaluate(
              () => (window as Window & { __APP_READY__?: boolean }).__APP_READY__ === true,
            );
            if (!ready) throw new Error('__APP_READY__ not set (C-20)');
          });
          /* Theme after boot — applyFinishTheme before goto can race a cold shell. */
          await applyFinishTheme(page, theme);
          await assertNoHorizontalOverflow(page);
          await assertNotObscured(page, 'body');
          fs.mkdirSync(path.join(SHOTS, 'home', theme), { recursive: true });
          await page.screenshot({ path: path.join(SHOTS, 'home', theme, `${vp.name}.png`) });
        } catch (e) {
          failures.push(`home/${vp.name}/${theme}: ${(e as Error).message}`);
          throw e;
        }
      });
    }
  }
  test.afterAll(() => {
    writeMatrixResults({
      routes: ROUTES,
      viewports: matrixViewports().map((v) => v.name),
      themes: FINISH_THEMES,
      failures,
    });
  });
});
