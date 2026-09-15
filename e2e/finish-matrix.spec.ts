import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  matrixViewports, FINISH_THEMES, waitForAppReady,
  assertNoHorizontalOverflow, assertNotObscured, applyFinishTheme,
} from './helpers/finish-matrix.js';

const RUN = process.env.FINISH_MATRIX === '1' || process.env.FINISH_MATRIX_FULL === '1';
const SHOTS = path.join('qa', 'finish-loop', 'shots');

test.describe('finish-matrix', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!RUN, 'Set FINISH_MATRIX=1');
  for (const vp of matrixViewports()) {
    for (const theme of FINISH_THEMES) {
      test(`home · ${vp.name} · ${theme}`, async ({ page }) => {
        test.setTimeout(90_000);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyFinishTheme(page, theme);
        await page.goto('/?demo=1');
        await waitForAppReady(page).catch(async () => {
          await page.waitForLoadState('domcontentloaded');
          const ready = await page.evaluate(() => (window as Window & { __APP_READY__?: boolean }).__APP_READY__ === true);
          if (!ready) throw new Error('__APP_READY__ not set (C-20)');
        });
        await assertNoHorizontalOverflow(page);
        await assertNotObscured(page, 'body');
        fs.mkdirSync(path.join(SHOTS, 'home', theme), { recursive: true });
        await page.screenshot({ path: path.join(SHOTS, 'home', theme, `${vp.name}.png`) });
      });
    }
  }
});
