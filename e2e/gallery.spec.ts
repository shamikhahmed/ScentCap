import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { installTestMocks, loadDemoWardrobe } from './helpers';

const GALLERY_DIR = join(process.cwd(), 'docs', 'screenshots', 'gallery');

const SCREENS = [
  { route: './', slug: 'today', label: 'Today' },
  { route: './collection', slug: 'collection', label: 'Collection' },
  { route: './add', slug: 'add', label: 'Add Fragrance' },
  { route: './advisor', slug: 'advisor', label: 'Advisor' },
  { route: './calendar', slug: 'calendar', label: 'Calendar' },
  { route: './analytics', slug: 'analytics', label: 'Analytics' },
  { route: './layering', slug: 'layering', label: 'Layering Lab' },
  { route: './travel', slug: 'travel', label: 'Travel Kit' },
  { route: './settings', slug: 'settings', label: 'Settings' },
] as const;

const VIEWPORTS = {
  mobile: { width: 393, height: 852 },
  desktop: { width: 1280, height: 800 },
} as const;

type ManifestShot = { file: string; label: string; route: string; viewport: string };

function appendManifest(shots: ManifestShot[]) {
  const manifestPath = join(GALLERY_DIR, 'gallery-manifest.json');
  let existing: { shots: ManifestShot[] } = { shots: [] };
  try {
    existing = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    /* first writer */
  }
  const merged = [...existing.shots.filter((s) => !shots.some((n) => n.file === s.file)), ...shots];
  merged.sort((a, b) => a.file.localeCompare(b.file));
  const version = JSON.parse(readFileSync(join(process.cwd(), 'VERSION.json'), 'utf8')).version;
  writeFileSync(
    manifestPath,
    JSON.stringify({ app: 'ScentCap', version, generated: new Date().toISOString(), shots: merged }, null, 2),
  );
}

async function captureAll(page: Page, viewport: keyof typeof VIEWPORTS) {
  const shots: ManifestShot[] = [];

  // Onboarding first — demo load navigates away from it
  await page.goto('./onboarding');
  await expect(page.getByRole('heading', { name: /Your scent counter/i })).toBeVisible();
  const onboardingFile = `${viewport}-00-onboarding.png`;
  await page.screenshot({ path: join(GALLERY_DIR, onboardingFile), fullPage: true });
  shots.push({ file: onboardingFile, label: 'Onboarding', route: '/onboarding', viewport });

  await loadDemoWardrobe(page);

  for (const [i, screen] of SCREENS.entries()) {
    await page.goto(screen.route);
    await expect(page.locator('#root > *').first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(600); // settle animations / lazy charts
    const file = `${viewport}-${String(i + 1).padStart(2, '0')}-${screen.slug}.png`;
    await page.screenshot({ path: join(GALLERY_DIR, file), fullPage: true });
    shots.push({ file, label: screen.label, route: screen.route.slice(1) || '/', viewport });
  }

  appendManifest(shots);
}

for (const viewport of ['mobile', 'desktop'] as const) {
  test.describe(`Screen gallery — ${viewport}`, () => {
    test.skip(!process.env.CAPTURE_GALLERY, 'Gallery capture runs via `npm run gallery` (CAPTURE_GALLERY=1)');

    test.use({
      viewport: VIEWPORTS[viewport],
      deviceScaleFactor: 2,
      isMobile: viewport === 'mobile',
      hasTouch: viewport === 'mobile',
    });

    test.beforeAll(() => {
      mkdirSync(GALLERY_DIR, { recursive: true });
    });

    test.beforeEach(async ({ context, page }) => {
      await installTestMocks(page, { pro: true });
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
    });

    test(`capture ${SCREENS.length + 1} ${viewport} screens`, async ({ page }) => {
      await captureAll(page, viewport);
    });
  });
}
