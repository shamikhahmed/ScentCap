/** Vendored from capricorn-tooling/shared/testing/finish-matrix.js — keep in sync. */
/**
 * Cap Fleet finish-matrix helpers (FLT-07 / §6.2 / C-31).
 * Import from Playwright specs in each web repo.
 *
 * Smoke (default): 3 viewports × themes. Full: FINISH_MATRIX_FULL=1 → all 15.
 *
 * CI must set FINISH_MATRIX=1 (see shared/testing/FINISH-MATRIX-CI.md).
 */

import fs from 'node:fs';
import path from 'node:path';

export const FINISH_VIEWPORTS = [
  { name: 'tiny-se1', width: 320, height: 568 },
  { name: 'fold-cover', width: 344, height: 882 },
  { name: 'android-s', width: 360, height: 780 },
  { name: 'iphone-se3', width: 375, height: 667 },
  { name: 'iphone-16', width: 393, height: 852 },
  { name: 'iphone-17', width: 402, height: 874 },
  { name: 'pixel', width: 412, height: 915 },
  { name: 'promax', width: 440, height: 956 },
  { name: 'phone-land', width: 844, height: 390 },
  { name: 'fold-open', width: 673, height: 841 },
  { name: 'ipad-mini', width: 744, height: 1133 },
  { name: 'ipad-land', width: 1180, height: 820 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'wide', width: 2560, height: 1440 },
];

/** Default first-pass smoke set (must stay a subset of FINISH_VIEWPORTS). */
export const FINISH_SMOKE_VIEWPORTS = FINISH_VIEWPORTS.filter((v) =>
  ['iphone-se3', 'iphone-16', 'laptop'].includes(v.name),
);

export const FINISH_THEMES = ['light', 'dark'];

/** Smoke unless FINISH_MATRIX_FULL=1. */
export function matrixViewports() {
  return process.env.FINISH_MATRIX_FULL === '1' ? FINISH_VIEWPORTS : FINISH_SMOKE_VIEWPORTS;
}

/** Wait until the app signals the first real screen (not splash). */
export async function waitForAppReady(page, { timeout = 15000 } = {}) {
  await page.waitForFunction(
    () => window.__APP_READY__ === true || document.documentElement.dataset.appReady === 'true',
    null,
    { timeout },
  );
}

export async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      innerWidth: window.innerWidth,
    };
  });
  if (overflow.scrollWidth > overflow.innerWidth + 1) {
    throw new Error(
      `Horizontal overflow: scrollWidth=${overflow.scrollWidth} innerWidth=${overflow.innerWidth}`,
    );
  }
}

/** Fail if a fixed bar covers the center of the primary control. */
export async function assertNotObscured(page, selector) {
  const ok = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    return !!(top && (top === el || el.contains(top)));
  }, selector);
  if (!ok) throw new Error(`Obscured or missing primary control: ${selector}`);
}

/** Apply light/dark for matrix runs (emulateMedia + common class/dataset hooks). */
export async function applyFinishTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((t) => {
    const root = document.documentElement;
    root.dataset.theme = t;
    root.dataset.colorScheme = t;
    root.classList.toggle('dark', t === 'dark');
    root.classList.toggle('light', t === 'light');
    root.classList.toggle('theme-dark', t === 'dark');
    root.classList.toggle('theme-light', t === 'light');
    if (document.body) {
      document.body.classList.toggle('dark', t === 'dark');
      document.body.classList.toggle('light', t === 'light');
    }
    try {
      localStorage.setItem('theme', t);
      localStorage.setItem('color-scheme', t);
    } catch (_) {
      /* ignore */
    }
  }, theme);
}

/**
 * Write qa/finish-loop/matrix-results.json for the tier1 runner (C-31).
 * Call from finish-matrix afterAll. shotCount must equal routes × viewports × themes.
 */
export function writeMatrixResults({
  root = process.cwd(),
  routes,
  viewports,
  themes = FINISH_THEMES,
  failures = [],
  shotCount,
} = {}) {
  const routeList = Array.isArray(routes) ? routes : [routes || 'home'];
  const vpList = Array.isArray(viewports) ? viewports : matrixViewports().map((v) => v.name);
  const themeList = Array.isArray(themes) ? themes : FINISH_THEMES;
  const expected = routeList.length * vpList.length * themeList.length;
  const shots =
    typeof shotCount === 'number'
      ? shotCount
      : countPngs(path.join(root, 'qa', 'finish-loop', 'shots'));
  const generatedAt = new Date().toISOString();
  const outDir = path.join(root, 'qa', 'finish-loop');
  fs.mkdirSync(outDir, { recursive: true });
  const payload = {
    failures,
    shotCount: shots,
    expectedShots: expected,
    generatedAt,
    routes: routeList,
    viewports: vpList,
    themes: themeList,
  };
  fs.writeFileSync(path.join(outDir, 'matrix-results.json'), JSON.stringify(payload, null, 2) + '\n');
  return payload;
}

function countPngs(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.png$/i.test(ent.name)) n += 1;
    }
  };
  walk(dir);
  return n;
}
