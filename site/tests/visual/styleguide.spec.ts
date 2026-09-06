/* ============================================================================
   Visual regression — the styleguide wall (see playwright.visual.config.ts)
   ============================================================================
   /styleguide renders every fixture-driven section with FIXED data, so its
   pixels move only when the design system moves. One full-page shot per
   theme. Baselines live in tests/visual/__screenshots__/ and are generated
   in CI (update-visual-baselines.yml) — never from a Windows machine.
   ============================================================================ */
import { test, expect, type Page } from '@playwright/test';

// The main suites' settle(): let fonts, layout, and late paints finish so the
// shot is deterministic. Reduced motion (config) keeps reveals at rest.
async function settle(page: Page) {
  await page.goto('/styleguide/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

test('styleguide, light', async ({ page }) => {
  await settle(page);
  await expect(page).toHaveScreenshot('styleguide-light.png', { fullPage: true });
});

test('styleguide, dark', async ({ page }) => {
  // Dark mode is CLASS-driven (localStorage 'wcp-theme', applied by the
  // BaseLayout head script before first paint), not media-driven —
  // emulateMedia does nothing here. Seeding the site's own storage key uses
  // the real mechanism, so the screenshot can never catch a light flash.
  await page.addInitScript(() => {
    localStorage.setItem('wcp-theme', 'dark');
  });
  await settle(page);
  await expect(page).toHaveScreenshot('styleguide-dark.png', { fullPage: true });
});
