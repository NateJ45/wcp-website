import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes } from './routes';
import { settle } from './helpers';

// =============================================================================
// Accessibility (axe-core) — every route, default rule set
// =============================================================================
// WCAG AA is a hard requirement, and Lighthouse's a11y gate (minScore 1) is
// wired into CI. Lighthouse scores on axe's DEFAULT rules — which include
// best-practice checks (heading-order, landmark-unique, region, …) beyond the
// wcag2a/aa tags. So we run the default rule set on ALL routes to stay in sync
// with (and slightly ahead of) the Lighthouse gate. ~1s/page.
// =============================================================================

test.describe('Accessibility — no axe violations', () => {
  for (const route of routes) {
    test(`${route} passes axe`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' }); // not 'load': WebKit stalls on the gitignored hero <video> — settle() covers real readiness
      // Settle fonts + reveal content (no half-faded text) so axe audits the
      // real, fully-rendered page — otherwise mid-transition opacity produces
      // false color-contrast violations.
      await settle(page);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations,
        results.violations.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join('\n'),
      ).toEqual([]);
    });
  }
});
