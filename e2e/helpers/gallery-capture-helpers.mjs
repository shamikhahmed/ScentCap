/** Vendored from capricorn-tooling/shared/gallery/capture-helpers.mjs — keep in sync (CI has no sibling tooling). */
/**
 * Gallery capture helpers — Capricorn Perfection Loop v3 (§9.2)
 *
 * Import from Playwright gallery specs:
 *   import { GALLERY_CLOCK, prepareGalleryPage, isGalleryCapture }
 *     from '../capricorn-tooling/shared/gallery/capture-helpers.mjs';
 *
 * Rules:
 * - Gate capture behind CAPTURE_GALLERY=1 (CAP-STANDARD)
 * - Deterministic clock: 2026-10-14T09:41:00
 * - Disable animations, wait for fonts + network idle
 * - Emulate colourScheme AND set the app's own theme when it has one
 */

export const GALLERY_CLOCK = "2026-10-14T09:41:00";
export const GALLERY_CLOCK_ISO = "2026-10-14T09:41:00.000Z";
export const GALLERY_CLOCK_MS = Date.parse(GALLERY_CLOCK_ISO);

/** Required device classes for v3 completeness (G17). */
export const REQUIRED_DEVICES = ["iphone", "ipad", "mac"];

/** Capture viewports (§9.1). Store retina widths; Playwright viewport is CSS px. */
export const GALLERY_VIEWPORTS = {
  iphone: { width: 390, height: 844, deviceScaleFactor: 3, label: "iphone" },
  "iphone-se": { width: 375, height: 667, deviceScaleFactor: 2, label: "iphone-se" },
  ipad: { width: 1180, height: 820, deviceScaleFactor: 2, label: "ipad" },
  "ipad-portrait": { width: 820, height: 1180, deviceScaleFactor: 2, label: "ipad-portrait" },
  mac: { width: 1440, height: 900, deviceScaleFactor: 2, label: "mac" },
};

export function isGalleryCapture() {
  return process.env.CAPTURE_GALLERY === "1";
}

/**
 * Install a fixed clock before any page scripts run.
 * Call from test.beforeEach / fixture via context.addInitScript.
 */
export function galleryClockInitScript(iso = GALLERY_CLOCK_ISO) {
  const ms = Date.parse(iso);
  return `
    (() => {
      const fixed = ${ms};
      const RealDate = Date;
      class FakeDate extends RealDate {
        constructor(...args) {
          if (args.length === 0) super(fixed);
          else super(...args);
        }
        static now() { return fixed; }
        static parse = RealDate.parse;
        static UTC = RealDate.UTC;
      }
      FakeDate.prototype = RealDate.prototype;
      window.Date = FakeDate;
    })();
  `;
}

/**
 * CSS that freezes motion for deterministic screenshots.
 */
export const GALLERY_FREEZE_CSS = `
  *, *::before, *::after {
    animation: none !important;
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition: none !important;
    transition-duration: 0s !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }
`;

/**
 * Prepare a Playwright page for a gallery shot.
 * @param {import('playwright-core').Page} page
 * @param {{ theme?: 'light'|'dark'|'sepia', colorScheme?: 'light'|'dark', setAppTheme?: (page, theme) => Promise<void>, freezeMotion?: boolean }} opts
 */
export async function prepareGalleryPage(page, opts = {}) {
  const theme = opts.theme || "light";
  const colorScheme = opts.colorScheme || (theme === "dark" ? "dark" : "light");

  await page.emulateMedia({ colorScheme });

  if (opts.freezeMotion !== false) {
    await page.addStyleTag({ content: GALLERY_FREEZE_CSS });
  }

  if (typeof opts.setAppTheme === "function") {
    await opts.setAppTheme(page, theme);
  }

  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
  // Settle one frame after fonts/theme
  await page.waitForTimeout(50);
}

/**
 * Build a v2 manifest shot entry.
 */
export function shotEntry({
  id,
  group,
  screen,
  state = "default",
  theme,
  device,
  file,
  route = "",
  caption = "",
  w,
  h,
}) {
  return {
    id,
    group,
    screen,
    state,
    theme,
    device,
    file,
    route,
    caption: caption || screen,
    ...(w ? { w } : {}),
    ...(h ? { h } : {}),
  };
}

/**
 * Manifest path helper: docs/screenshots/gallery/<theme>/<device>/<group>--<screen>--<state>.webp
 */
export function shotRelativePath({ theme, device, group, screen, state = "default", ext = "webp" }) {
  const slug = (s) =>
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `${theme}/${device}/${slug(group)}--${slug(screen)}--${slug(state)}.${ext}`;
}

/**
 * Notes for gallery.spec authors (also in CAPTURE.md).
 */
export const CAPTURE_NOTES = `
CAPTURE_GALLERY=1
  Gate every gallery.spec behind this env var so routine e2e does not rewrite shots.

Deterministic capture
  - Fixed clock: ${GALLERY_CLOCK} (use galleryClockInitScript on the browser context)
  - Demo seed data (?demo=1 or app demo entry)
  - Animations frozen (GALLERY_FREEZE_CSS)
  - document.fonts.ready + networkidle before screenshot
  - No toasts unless the shot is about a toast
  - Playwright colorScheme + app theme setting both set
  - Production build only (never Vite/Next dev for gallery)

Output
  docs/screenshots/gallery/<theme>/<device>/<group>--<screen>--<state>.webp
  gallery-manifest.json schema v2 (see CURSOR-PERFECTION-LOOP.md §9.3)
`;
