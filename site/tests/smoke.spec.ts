import { test, expect } from '@playwright/test';
import { routes } from './routes';

// =============================================================================
// Smoke — every route builds and renders (not a 404 / error page)
// =============================================================================

test.describe('Smoke — every route renders', () => {
  for (const route of routes) {
    test(`${route} returns 200 and renders`, async ({ page }) => {
      // not 'load': WebKit parks forever on the hero <video>'s VP9 WebM source
      // and never clears the delay-load flag (mechanism proven in
      // a11y-dark.spec.ts). settle() covers real readiness.
      const resp = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(resp?.status(), `${route} HTTP status`).toBe(200);
      // A real rendered page (every title ends with the school name), not a
      // blank or error body.
      await expect(page).toHaveTitle(/West Chester Preschool/);
    });
  }
});
