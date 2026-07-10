import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// =============================================================================
// Accessibility (axe-core) — automated WCAG 2.0/2.1 A & AA checks
// =============================================================================
// WCAG AA is a hard requirement for this site. axe catches contrast, labels,
// ARIA, roles, landmarks, etc. — a deeper check than Lighthouse's a11y score.
// We test a representative page per distinct template/component so the whole
// component library is covered without auditing all 20 routes on every run.
// =============================================================================

const a11yRoutes = [
  '/', // hero video, nav, footer, stats, testimonials
  '/about', // teacher cards, prose-y content
  '/tuition', // wide data table, callouts
  '/faq', // accordion (aria-expanded / region / inert)
  '/why-wcp', // compare table, testimonial wall, school-year grid, navy stats
  '/classes/pre-k', // navy readiness band with SectionHeader (eyebrow on navy)
  '/a-day-at-wcp', // schedule timeline, photo gallery
  '/contact', // address, map link, directions
  '/donate', // tier cards, FAQ accordion, forms-ish CTAs
  '/accessibility', // long-form prose page
];

test.describe('Accessibility — no WCAG A/AA violations', () => {
  for (const route of a11yRoutes) {
    test(`${route} passes axe (WCAG 2.1 AA)`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'load' });
      // Settle fonts + reveal content (no half-faded text) so axe audits the
      // real, fully-rendered page — otherwise mid-transition opacity produces
      // false color-contrast violations.
      await settle(page);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        results.violations,
        results.violations.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join('\n'),
      ).toEqual([]);
    });
  }
});
