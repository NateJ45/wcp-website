import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes } from './routes';
import { settle } from './helpers';

// =============================================================================
// Accessibility (axe-core) — dark mode, every route
// =============================================================================
// Mirrors a11y.spec.ts, but with the `.dark` class applied to <html> before
// the audit, the same way a visitor's toggle click (or a remembered
// preference) would. Dark mode is a large, mostly CSS-driven repaint of the
// whole site (see globals.css's `.dark { ... }` block) — this is what proves
// the new palette actually holds up to AA everywhere, not just by manual math.
// =============================================================================

test.describe('Accessibility (dark mode) — no axe violations', () => {
  for (const route of routes) {
    test(`${route} passes axe in dark mode`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'load' });
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await settle(page);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations,
        results.violations.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join('\n'),
      ).toEqual([]);
    });
  }
});
