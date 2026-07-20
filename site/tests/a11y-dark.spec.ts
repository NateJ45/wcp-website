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
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        // The real toggle also sets color-scheme, which drives form controls,
        // scrollbars and the canvas. Auditing without it measured a page no
        // visitor ever sees.
        document.documentElement.style.colorScheme = 'dark';
      });
      await settle(page);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations,
        results.violations.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join('\n'),
      ).toEqual([]);
    });
  }
});

// =============================================================================
// Focus indicators in dark mode
// =============================================================================
// axe has NO rule for focus-indicator contrast, and the sweep above audits the
// resting DOM only, so nothing above ever focuses an element. That blind spot
// is how eight forms shipped with `focus:outline-none` plus a navy ring that
// measured 1.13:1 in dark mode: keyboard focus was invisible, on a green build
// with Lighthouse at 100 (found 2026-07-19).
//
// This asserts the indicator EXISTS. Its contrast is pinned separately, and
// far more cheaply, by src/lib/theme-tokens.test.ts.
// =============================================================================

const FORM_ROUTES = ['/contact', '/enroll', '/virtual-tour'];

test.describe('Focus indicators are visible in dark mode', () => {
  for (const route of FORM_ROUTES) {
    test(`${route} gives every field a visible focus ring in dark mode`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'load' });
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      });
      await settle(page);

      const fields = page.locator(
        'input:not([type=hidden]):visible, textarea:visible, select:visible',
      );
      const count = await fields.count();
      test.skip(count === 0, 'no form fields on this route');

      const bare: string[] = [];
      for (let i = 0; i < count; i++) {
        const field = fields.nth(i);
        await field.focus();
        const indicator = await field.evaluate((el) => {
          const s = getComputedStyle(el);
          const outline =
            s.outlineStyle !== 'none' && parseFloat(s.outlineWidth || '0') >= 1
              ? parseFloat(s.outlineWidth)
              : 0;
          const shadow = s.boxShadow && s.boxShadow !== 'none' ? 1 : 0;
          return {
            outline,
            shadow,
            name: el.getAttribute('name') ?? el.tagName.toLowerCase(),
          };
        });
        // Either a real outline or a ring-style box-shadow counts.
        if (indicator.outline === 0 && indicator.shadow === 0) bare.push(indicator.name);
      }

      expect(bare, `fields with NO focus indicator in dark mode: ${bare.join(', ')}`).toEqual([]);
    });
  }
});
