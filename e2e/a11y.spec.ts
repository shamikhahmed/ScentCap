/**
 * Accessibility smoke — main landmark + axe (critical/serious) on core routes.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { installTestMocks, loadDemoWardrobe } from './helpers';

test.describe('Accessibility smoke', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    await installTestMocks(page);
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
  });

  test('core screens: main landmark + no critical/serious axe', async ({ page }) => {
    await loadDemoWardrobe(page);

    const hops: { click?: string; name: string }[] = [
      { name: 'home' },
      { click: 'Collection', name: 'collection' },
      { click: 'Advisor', name: 'advisor' },
      { click: 'You', name: 'settings' },
    ];

    for (const hop of hops) {
      if (hop.click) {
        await page
          .getByRole('complementary')
          .getByRole('link', { name: hop.click, exact: true })
          .click({ force: true });
      }
      await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast'])
        .analyze();
      const bad = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      expect(bad, `${hop.name}: ${bad.map((v) => `${v.id}(${v.nodes.length})`).join(', ')}`).toEqual([]);
    }
  });
});
