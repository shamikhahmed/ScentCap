/**
 * ScentCap gallery v3 capture (§9) — CAPTURE_GALLERY=1 required.
 * 10 screens × light/dark × iphone/ipad/mac = 60 shots.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  GALLERY_VIEWPORTS,
  galleryClockInitScript,
  isGalleryCapture,
  prepareGalleryPage,
  shotEntry,
  shotRelativePath,
} from './helpers/gallery-capture-helpers.mjs';
import { installTestMocks } from './helpers';

const GALLERY_DIR = join(process.cwd(), 'docs', 'screenshots', 'gallery');
const MANIFEST = join(GALLERY_DIR, 'gallery-manifest.json');
const ACCENT = '#9a6a2f';

const SCREENS = [
  {
    route: './onboarding',
    group: 'First run',
    screen: 'Onboarding',
    state: 'welcome',
    caption: 'Your fragrance wardrobe, beautifully kept.',
    skipDemo: true,
  },
  {
    route: './?demo=1',
    group: 'Daily',
    screen: 'Today',
    state: 'demo',
    caption: 'A pick for the weather, your plans and your mood.',
  },
  {
    route: './collection?demo=1',
    group: 'Wardrobe',
    screen: 'Collection',
    state: 'demo',
    caption: 'Every bottle, with its real photo.',
  },
  {
    route: './add?demo=1',
    group: 'Wardrobe',
    screen: 'Add fragrance',
    state: 'demo',
    caption: 'Search 1,300+ real fragrances and add in a tap.',
  },
  {
    route: './advisor?demo=1',
    group: 'Insights',
    screen: 'Advisor',
    state: 'demo',
    caption: 'Fine-tune a pick for any occasion.',
  },
  {
    route: './calendar?demo=1',
    group: 'Insights',
    screen: 'Diary',
    state: 'demo',
    caption: 'Your wear diary, day by day.',
  },
  {
    route: './analytics?demo=1',
    group: 'Insights',
    screen: 'Insights',
    state: 'demo',
    caption: 'Rotation, value and habits.',
  },
  {
    route: './layering?demo=1',
    group: 'Lab',
    screen: 'Layering lab',
    state: 'demo',
    caption: 'Find the best pairing for any bottle.',
  },
  {
    route: './travel?demo=1',
    group: 'Travel',
    screen: 'Travel kit',
    state: 'demo',
    caption: 'Pack the right bottles for a trip.',
  },
  {
    route: './settings?demo=1',
    group: 'System',
    screen: 'Settings',
    state: 'demo',
    caption: 'Preferences, data and privacy.',
  },
] as const;

const DEVICES = ['iphone', 'ipad', 'mac'] as const;
const THEMES = ['light', 'dark'] as const;

async function setAppTheme(page: import('@playwright/test').Page, theme: 'light' | 'dark') {
  await page.evaluate(async (t) => {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('scentcap-v1');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const prefs = await new Promise<Record<string, unknown>>((resolve) => {
        const tx = db.transaction('preferences', 'readonly');
        const get = tx.objectStore('preferences').get('preferences');
        get.onsuccess = () =>
          resolve(
            (get.result as Record<string, unknown>) || {
              id: 'preferences',
              officeMaxSprays: 3,
              officeSafeMode: false,
              theme: 'light',
              signatures: {},
            },
          );
      });
      prefs.theme = t;
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('preferences', 'readwrite');
        tx.objectStore('preferences').put(prefs);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {
      /* ignore */
    }
    document.body.classList.toggle('light', t === 'light');
    document.documentElement.style.colorScheme = t;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f2f2f7' : '#000000');
  }, theme);
}

function pngToWebp(pngPath: string, webpPath: string) {
  mkdirSync(dirname(webpPath), { recursive: true });
  const cwebp = spawnSync('cwebp', ['-q', '82', pngPath, '-o', webpPath], { encoding: 'utf8' });
  if (cwebp.status === 0 && existsSync(webpPath)) {
    try {
      unlinkSync(pngPath);
    } catch {
      /* keep png */
    }
    return;
  }
  spawnSync('cp', [pngPath, webpPath]);
}

function writeManifest(shots: ReturnType<typeof shotEntry>[]) {
  mkdirSync(GALLERY_DIR, { recursive: true });
  let existing: { shots?: ReturnType<typeof shotEntry>[] } = { shots: [] };
  try {
    existing = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch {
    /* first write */
  }
  const byKey = new Map<string, ReturnType<typeof shotEntry>>();
  for (const s of existing.shots || []) {
    if (s?.theme && s?.device && s?.file) {
      byKey.set(`${s.theme}/${s.device}/${s.file}`, s);
    }
  }
  for (const s of shots) {
    byKey.set(`${s.theme}/${s.device}/${s.file}`, s);
  }
  const merged = [...byKey.values()].sort((a, b) => String(a.file).localeCompare(String(b.file)));
  const version = JSON.parse(readFileSync(join(process.cwd(), 'VERSION.json'), 'utf8')).version;
  writeFileSync(
    MANIFEST,
    JSON.stringify(
      {
        app: 'ScentCap',
        version,
        capturedAt: '2026-10-14T09:41:00Z',
        accent: ACCENT,
        schema: 2,
        shots: merged,
      },
      null,
      2,
    ),
  );
}

for (const device of DEVICES) {
  for (const theme of THEMES) {
    test.describe(`gallery v3 · ${theme} · ${device}`, () => {
      test.skip(!isGalleryCapture(), 'Run via npm run gallery (CAPTURE_GALLERY=1)');

      const vp = GALLERY_VIEWPORTS[device];
      test.use({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.deviceScaleFactor,
        isMobile: device === 'iphone' || device === 'ipad',
        hasTouch: device === 'iphone' || device === 'ipad',
        colorScheme: theme,
      });

      test.beforeEach(async ({ context, page }) => {
        await context.addInitScript(galleryClockInitScript());
        await installTestMocks(page);
        await context.grantPermissions(['geolocation']);
        await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
      });

      test(`capture ${SCREENS.length} screens`, async ({ page }) => {
        test.setTimeout(360_000);
        const shots: ReturnType<typeof shotEntry>[] = [];

        for (const screen of SCREENS) {
          await page.goto(screen.route, { waitUntil: 'domcontentloaded' });
          if (!screen.skipDemo) {
            await page
              .waitForFunction(
                () =>
                  document.documentElement.dataset.appReady === 'true' ||
                  (window as Window & { __APP_READY__?: boolean }).__APP_READY__ === true,
                null,
                { timeout: 25_000 },
              )
              .catch(() => undefined);
          } else {
            await expect(page.getByRole('heading', { name: /Your fragrance wardrobe, beautifully kept/i })).toBeVisible({
              timeout: 15_000,
            });
          }

          await prepareGalleryPage(page, {
            theme,
            colorScheme: theme,
            setAppTheme,
            freezeMotion: true,
          });

          const rel = shotRelativePath({
            theme,
            device,
            group: screen.group,
            screen: screen.screen,
            state: screen.state,
            ext: 'webp',
          });
          const webpPath = join(GALLERY_DIR, rel);
          const pngPath = webpPath.replace(/\.webp$/, '.png');
          mkdirSync(dirname(pngPath), { recursive: true });
          await page.screenshot({ path: pngPath, fullPage: false, animations: 'disabled' });
          pngToWebp(pngPath, webpPath);

          const box = page.viewportSize();
          shots.push(
            shotEntry({
              id: `${screen.group}--${screen.screen}--${screen.state}`
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
              group: screen.group,
              screen: screen.screen,
              state: screen.state,
              theme,
              device,
              file: rel,
              route: screen.route.replace(/^\.\//, '/'),
              caption: screen.caption,
              w: (box?.width ?? vp.width) * vp.deviceScaleFactor,
              h: (box?.height ?? vp.height) * vp.deviceScaleFactor,
            }),
          );
        }

        writeManifest(shots);
      });
    });
  }
}
