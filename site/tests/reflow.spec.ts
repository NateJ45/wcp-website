import { test, expect } from '@playwright/test';
import { routes } from './routes';
import { settle } from './helpers';

// =============================================================================
// WCAG 2.1 SC 1.4.10 Reflow — no horizontal scrolling at 320px CSS width
// =============================================================================
// The exact check that used to be run by hand after every layout change. A page
// fails Reflow if content forces a horizontal scrollbar at a 320px viewport
// (equivalent to 400% zoom on a 1280px screen). Runs on every route.
// =============================================================================

test.describe('Reflow — no horizontal overflow at 320px', () => {
  test.use({ viewport: { width: 320, height: 720 } });

  for (const route of routes) {
    test(`${route} does not overflow at 320px`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'load' });
      // Wait for fonts + reveal all content so we measure the settled layout.
      await settle(page);
      const { docWidth, viewportWidth } = await page.evaluate(() => ({
        docWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));
      expect(
        docWidth,
        `${route}: content is ${docWidth}px wide in a ${viewportWidth}px viewport`,
      ).toBeLessThanOrEqual(viewportWidth);
    });
  }
});
