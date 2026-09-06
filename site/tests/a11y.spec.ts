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
//
// WCAG 2.2 note: axe-core's default set already includes the 2.2 AA rule that
// is machine-detectable — `target-size` (SC 2.5.8) — so this gate enforces 2.2
// too. Do NOT narrow this to `.withTags([...])`: that would DROP the
// best-practice + 2.2 coverage the default set gives us. The other new 2.2
// criteria (2.4.11 Focus Not Obscured, 2.5.7 Dragging, 3.2.6/3.3.7/3.3.8) are
// manual/structural and were audited by hand (2026-07-14); 2.4.11 is handled by
// the root `scroll-padding` in globals.css.
// =============================================================================

test.describe('Accessibility — no axe violations', () => {
  for (const route of routes) {
    test(`${route} passes axe`, async ({ page }) => {
      // not 'load': WebKit parks forever on the hero <video>'s VP9 WebM source
      // and never clears the delay-load flag (mechanism proven in
      // a11y-dark.spec.ts). settle() covers real readiness.
      await page.goto(route, { waitUntil: 'domcontentloaded' });
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
