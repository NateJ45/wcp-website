import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// Reskinned Family Hub inner section routes. Grows as Phase 2 lands each page.
// Every route here must open with a HubPageHeader <h1> (no navy band), pass axe
// (default ruleset) in light AND dark, and reflow with no horizontal scroll at
// 320px. The static suites can't reach these (SSR, gated) — this runs under
// playwright.hub.config.ts against the real wrangler preview build.
const ROUTES = [
  '/family-hub/tuition',
  '/family-hub/documents',
  '/family-hub/fundraising',
  '/family-hub/coop-jobs',
  '/family-hub/health',
  '/family-hub/calendar',
];

for (const route of ROUTES) {
  test.describe(`Family Hub section: ${route}`, () => {
    test('renders an app header and passes axe (light + dark)', async ({ page }) => {
      await page.goto(route, { waitUntil: 'load' });
      await settle(page);

      // App page header, not the old navy title band. (Board-added page-builder
      // sections may still legitimately use a navy background; the check targets
      // the retired HubShell band specifically, which was the navy <section>
      // labelled by the page h1.)
      await expect(page.locator('h1#hub-page-title')).toBeVisible();
      await expect(page.locator('section.bg-navy[aria-labelledby="hub-page-title"]')).toHaveCount(0);

      for (const theme of ['light', 'dark'] as const) {
        await page.evaluate((t) => {
          document.documentElement.classList.toggle('dark', t === 'dark');
        }, theme);
        const results = await new AxeBuilder({ page }).analyze();
        expect(
          results.violations,
          `[${theme}] ` + results.violations.map((v) => v.id).join(', '),
        ).toEqual([]);
      }
    });

    test('no horizontal overflow at 320px', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 900 });
      await page.goto(route, { waitUntil: 'load' });
      await settle(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);
    });
  });
}
