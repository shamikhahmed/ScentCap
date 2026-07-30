/** Shared device matrix for visual QA — Capricorn fleet. */

export type DeviceFamily = 'iphone' | 'ipad' | 'browser';

export type DeviceDef = {
  id: string;
  label: string;
  width: number;
  height: number;
  chrome: string;
  safeTop: number;
  safeBottom: number;
  family: DeviceFamily;
};

export const IPHONE: DeviceDef[] = [
  { id: 'iphone-se', label: 'iPhone SE (home button)', width: 375, height: 667, chrome: 'home-button', safeTop: 20, safeBottom: 0, family: 'iphone' },
  { id: 'iphone-13-mini', label: 'iPhone 13 mini (notch)', width: 375, height: 812, chrome: 'notch', safeTop: 50, safeBottom: 34, family: 'iphone' },
  { id: 'iphone-14', label: 'iPhone 14 (notch)', width: 390, height: 844, chrome: 'notch', safeTop: 47, safeBottom: 34, family: 'iphone' },
  { id: 'iphone-14-pro', label: 'iPhone 14/15 Pro (Dynamic Island)', width: 393, height: 852, chrome: 'dynamic-island', safeTop: 59, safeBottom: 34, family: 'iphone' },
  { id: 'iphone-15-pro-max', label: 'iPhone 15 Pro Max (Dynamic Island)', width: 430, height: 932, chrome: 'dynamic-island', safeTop: 59, safeBottom: 34, family: 'iphone' },
  { id: 'iphone-16-pro-max', label: 'iPhone 16 Pro Max (Dynamic Island)', width: 440, height: 956, chrome: 'dynamic-island', safeTop: 62, safeBottom: 34, family: 'iphone' },
];

export const IPAD: DeviceDef[] = [
  { id: 'ipad-mini', label: 'iPad mini', width: 744, height: 1133, chrome: 'tablet', safeTop: 24, safeBottom: 20, family: 'ipad' },
  { id: 'ipad-air-11', label: 'iPad Air 11"', width: 820, height: 1180, chrome: 'tablet', safeTop: 24, safeBottom: 20, family: 'ipad' },
  { id: 'ipad-pro-11', label: 'iPad Pro 11"', width: 834, height: 1194, chrome: 'tablet', safeTop: 24, safeBottom: 20, family: 'ipad' },
  { id: 'ipad-pro-13', label: 'iPad Pro 13" portrait', width: 1024, height: 1366, chrome: 'tablet', safeTop: 24, safeBottom: 20, family: 'ipad' },
  { id: 'ipad-pro-13-land', label: 'iPad Pro 13" landscape', width: 1366, height: 1024, chrome: 'tablet', safeTop: 24, safeBottom: 20, family: 'ipad' },
];

export const BROWSER: DeviceDef[] = [
  { id: 'browser-phone-360', label: 'Mobile browser 360', width: 360, height: 740, chrome: 'browser', safeTop: 0, safeBottom: 0, family: 'browser' },
  { id: 'browser-sm-laptop', label: 'Laptop 1280×800', width: 1280, height: 800, chrome: 'browser', safeTop: 0, safeBottom: 0, family: 'browser' },
  { id: 'browser-hd', label: 'Desktop 1440×900', width: 1440, height: 900, chrome: 'browser', safeTop: 0, safeBottom: 0, family: 'browser' },
  { id: 'browser-fhd', label: 'Desktop 1920×1080', width: 1920, height: 1080, chrome: 'browser', safeTop: 0, safeBottom: 0, family: 'browser' },
  { id: 'browser-ultrawide', label: 'Ultrawide 2560×1080', width: 2560, height: 1080, chrome: 'browser', safeTop: 0, safeBottom: 0, family: 'browser' },
];

export const ALL_DEVICES = [...IPHONE, ...IPAD, ...BROWSER];

/** Cap shell: tabs ≤699 · sidebar ≥700 */
export const SHELL_BP = 700;

export type MajorScreen = {
  id: string;
  label: string;
  kind: 'welcome' | 'page' | 'overlay';
  route?: string;
};

export const MAJOR_SCREENS: MajorScreen[] = [
  { id: 'lock', label: 'Welcome / onboarding', kind: 'welcome', route: '/onboarding' },
  { id: 'dashboard', label: 'Today (home)', kind: 'page', route: '/' },
  { id: 'collection', label: 'Collection (dense list)', kind: 'page', route: '/collection' },
  { id: 'settings', label: 'Settings / You', kind: 'page', route: '/settings' },
  { id: 'advisor', label: 'Advisor (secondary hub)', kind: 'page', route: '/advisor' },
  { id: 'add-sheet', label: 'Add bottle (form)', kind: 'page', route: '/add' },
];

export function expectedLayout(width: number): 'mobile-tabs' | 'sidebar' {
  return width >= SHELL_BP ? 'sidebar' : 'mobile-tabs';
}

/** Inject safe-area simulation for Chromium (env() usually 0). */
export async function applyDeviceChrome(
  page: import('@playwright/test').Page,
  device: DeviceDef,
) {
  await page.setViewportSize({ width: device.width, height: device.height });
  await page.evaluate(({ safeTop, safeBottom, chrome }) => {
    const root = document.documentElement;
    root.style.setProperty('--st', `${safeTop}px`);
    root.style.setProperty('--sb', `${safeBottom}px`);
    root.style.setProperty('--cap-safe-t', `${safeTop}px`);
    root.style.setProperty('--cap-safe-b', `${safeBottom}px`);
    root.dataset.qaChrome = chrome;
    root.dataset.qaSafeTop = String(safeTop);
    root.dataset.qaSafeBottom = String(safeBottom);

    let tag = document.getElementById('qa-device-safe');
    if (!tag) {
      tag = document.createElement('style');
      tag.id = 'qa-device-safe';
      document.head.appendChild(tag);
    }
    tag.textContent = `
      :root {
        --sat: ${safeTop}px;
        --sab: ${safeBottom}px;
      }
      .cap-demo-banner {
        padding-top: max(0.375rem, ${safeTop}px) !important;
      }
      .atelier-tabbar {
        padding-bottom: calc(0.4rem + ${safeBottom}px) !important;
      }
      .atelier-fab {
        bottom: calc(4.85rem + ${safeBottom}px) !important;
      }
      .atelier-main {
        padding-bottom: calc(7.5rem + ${safeBottom}px) !important;
      }
      @media (min-width: 700px) {
        .atelier-main { padding-bottom: 2rem !important; }
        .atelier-tabbar, .atelier-fab { display: none !important; }
      }
      .sc-offline-banner {
        padding-top: max(0.5rem, ${safeTop}px) !important;
      }
    `;
  }, { safeTop: device.safeTop, safeBottom: device.safeBottom, chrome: device.chrome });
  await page.waitForTimeout(80);
}

export async function probeLayout(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const tabs = document.querySelector('.atelier-tabbar');
    const sidebar = document.querySelector('[data-testid="desktop-sidebar"]');
    const tabsVisible = !!(
      tabs &&
      getComputedStyle(tabs).display !== 'none' &&
      tabs.getBoundingClientRect().height > 0
    );
    const sideVisible = !!(
      sidebar &&
      getComputedStyle(sidebar).display !== 'none' &&
      sidebar.getBoundingClientRect().width > 0
    );
    const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    const tabRect = tabsVisible && tabs ? tabs.getBoundingClientRect() : null;
    const verMatch = sidebar?.textContent?.match(/v\d+\.\d+\.\d+/);
    const sidebarVer = verMatch ? verMatch[0] : null;
    let layout: 'mobile-tabs' | 'sidebar' | 'hybrid-both' | 'neither' = 'neither';
    if (tabsVisible && !sideVisible) layout = 'mobile-tabs';
    else if (sideVisible && !tabsVisible) layout = 'sidebar';
    else if (sideVisible && tabsVisible) layout = 'hybrid-both';

    const cta = [...document.querySelectorAll('button')].find((b) =>
      /Wear this today/i.test(b.textContent || ''),
    );
    let wearClearOfTabs: boolean | null = null;
    let wearTabGap: number | null = null;
    if (cta && tabsVisible && tabs) {
      const cr = cta.getBoundingClientRect();
      const tr = tabs.getBoundingClientRect();
      wearTabGap = Math.round(tr.top - cr.bottom);
      wearClearOfTabs = cr.bottom <= tr.top + 2;
    }

    return {
      layout,
      tabsVisible,
      sideVisible,
      overflow,
      tabBottom: tabRect ? tabRect.bottom : null,
      viewportH: window.innerHeight,
      sidebarVer,
      wearClearOfTabs,
      wearTabGap,
    };
  });
}

/** Switch to dark via Settings UI (keeps React/IDB in sync). */
export async function forceDarkTheme(page: import('@playwright/test').Page) {
  await page.goto('./settings');
  const dark = page.getByRole('button', { name: /^Dark$/i });
  await dark.waitFor({ state: 'visible', timeout: 20_000 });
  if ((await dark.getAttribute('aria-pressed')) !== 'true') {
    await dark.click();
  }
  await page.waitForTimeout(200);
  await page.evaluate(() => document.body.classList.remove('light'));
}

export async function dismissOverlays(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"], [data-state="open"]').forEach((el) => {
      const close = el.querySelector('button[aria-label*="Close" i], button[aria-label*="Dismiss" i]');
      if (close instanceof HTMLElement) close.click();
    });
  });
  await page.keyboard.press('Escape').catch(() => undefined);
}
