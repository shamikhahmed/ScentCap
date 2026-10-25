#!/usr/bin/env node
/**
 * iPhone/WebKit behaviour check for the Cap fleet's mobile bugs.
 * Usage: node scripts/ios-behaviour-check.mjs [baseUrl]   (default http://localhost:4180/ScentCap/)
 * Checks: tabs tappable (not covered), no sideways overflow, new screen opens at top, shell never blanks
 * during navigation, sheets keep scroll position, Today doesn't re-skeleton after an action.
 */
import { webkit, devices } from '@playwright/test';

const BASE = process.argv[2] || 'http://localhost:4180/ScentCap/';
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 15 Pro'] });
const page = await ctx.newPage();

await page.goto(BASE + '?demo=1');
await page.getByTestId('demo-banner').waitFor({ timeout: 30000 });
await page.waitForTimeout(1500);

// 1. Tabs are the topmost element at their centre (nothing invisible covering them)
const covered = await page.evaluate(() =>
  [...document.querySelectorAll('.ui-tab')].filter((t) => {
    const r = t.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !t.contains(hit);
  }).map((t) => t.textContent),
);
check('tab bar tappable', covered.length === 0, covered.join(','));

// 2. No sideways overflow on main screens
for (const path of ['', 'collection', 'add', 'advisor', 'calendar', 'analytics', 'settings', 'layering', 'travel']) {
  await page.goto(BASE + path);
  await page.waitForTimeout(700);
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  check(`no sideways overflow /${path}`, sw <= iw + 1, `${sw} > ${iw}`);
}

// 3. Navigation: shell never blanks; new screen opens at top
await page.goto(BASE);
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(200);
const blankDuringNav = await page.evaluate(async () => {
  let blank = false;
  const obs = new MutationObserver(() => {
    if (!document.querySelector('.ui-tabbar')) blank = true;
  });
  obs.observe(document.body, { childList: true, subtree: true });
  document.querySelector('a.ui-tab[href$="/collection"]')?.click();
  await new Promise((r) => setTimeout(r, 1200));
  obs.disconnect();
  return blank;
});
check('shell stays during navigation (no blank "refresh")', !blankDuringNav);
check('new screen opens at top', (await page.evaluate(() => scrollY)) === 0, String(await page.evaluate(() => scrollY)));

// 4. Sheet keeps scroll position (Add → open bottle → cancel)
await page.goto(BASE + 'add');
await page.waitForTimeout(1200);
await page.evaluate(() => window.scrollTo(0, 500));
await page.waitForTimeout(200);
const before = await page.evaluate(() => scrollY);
await page.locator('button.ui-bottle').nth(2).tap();
await page.getByRole('dialog').waitFor();
const during = await page.evaluate(() => document.body.style.top);
await page.getByRole('button', { name: 'Cancel' }).tap();
await page.waitForTimeout(300);
const after = await page.evaluate(() => scrollY);
check('sheet keeps scroll position', Math.abs(after - before) < 4, `before ${before} after ${after} (locked top ${during})`);

// 5. Today: action doesn't swap hero for skeleton or jump
await page.goto(BASE);
await page.waitForTimeout(1500);
await page.evaluate(() => window.scrollTo(0, 300));
const y0 = await page.evaluate(() => scrollY);
await page.getByRole('button', { name: 'Date', exact: true }).tap();
await page.waitForTimeout(100);
const skeleton = await page.locator('.ui-skeleton').count();
await page.waitForTimeout(800);
const y1 = await page.evaluate(() => scrollY);
check('occasion switch keeps card (no skeleton flash)', skeleton === 0, `skeletons ${skeleton}`);
check('occasion switch keeps scroll', Math.abs(y1 - y0) < 4, `${y0} → ${y1}`);

// 5b. Programmatic scroll lands instantly (no smooth-scroll animation)
await page.goto(BASE + 'collection');
await page.waitForTimeout(800);
const { landed, max } = await page.evaluate(() => {
  window.scrollTo(0, 300);
  return { landed: Math.round(scrollY), max: Math.round(document.documentElement.scrollHeight - innerHeight) };
});
check('scrollTo lands instantly', landed === Math.min(300, max), `scrollY ${landed}`);

// 6. Inputs ≥16px (no iOS zoom-on-focus)
await page.goto(BASE + 'add');
await page.waitForTimeout(800);
const small = await page.evaluate(() =>
  [...document.querySelectorAll('input,select,textarea')].filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16).length,
);
check('inputs ≥16px', small === 0, `${small} small`);

await browser.close();
let fail = 0;
for (const r of results) {
  if (!r.ok) fail++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok || !r.detail ? '' : `  (${r.detail})`}`);
}
process.exit(fail ? 1 : 0);
