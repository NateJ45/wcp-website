import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { hubRoutes, adminRoutes } from './hub-routes';
import { settle } from './helpers';

// =============================================================================
// Accessibility (axe-core) for the GATED hub — the half that had no sweep
// =============================================================================
// tests/routes.ts covers the prerendered marketing site and says in its own
// header that the Family Hub is excluded because it is SSR behind a password:
// "SSR a11y/reflow coverage lands when the hub pages get their real content."
//
// It has that content now, and the exclusion cost something real. On 2026-09-06
// the board admin shipped with its table text at 1.14:1 against the card — a
// background token (`--muted`, #eff0f1) used as a text colour where
// `--muted-foreground` (#5f6573) was meant. It was invisible on screen and
// nothing failed; a human found it by selecting the blank-looking column.
// axe's color-contrast rule fails on exactly that.
//
// Same default rule set as a11y.spec.ts, and for the same reason: narrowing to
// wcag2a/aa tags would drop the best-practice and WCAG 2.2 rules the Lighthouse
// gate scores against.
// =============================================================================

const sweep = (route: string) =>
  test(`${route} passes axe`, async ({ page }) => {
    // domcontentloaded, not 'load': WebKit parks on the hero video's WebM
    // source. settle() covers real readiness and lets fonts and reveal
    // animations finish, so axe is not fooled by mid-transition opacity into
    // reporting false contrast violations.
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      results.violations.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join('\n'),
    ).toEqual([]);
  });

test.describe('Accessibility — gated hub, no axe violations', () => {
  for (const route of hubRoutes) sweep(route);
});

test.describe('Accessibility — board admin, no axe violations', () => {
  for (const route of adminRoutes) sweep(route);

  // The per-family editor is the densest form on the site and the one a board
  // member actually types into, so it gets swept on a real record rather than
  // only on the blank "new" form.
  test('/family-hub/admin/family/<id> passes axe', async ({ page }) => {
    await page.goto('/family-hub/admin', { waitUntil: 'domcontentloaded' });
    const firstEdit = page.getByRole('link', { name: 'Edit' }).first();
    // An empty directory would make this pass by having nothing to check, which
    // is the shape of failure this whole sweep exists to prevent.
    await expect(firstEdit, 'no families to edit — the sweep would prove nothing').toBeVisible();
    await firstEdit.click();
    await expect(page).toHaveURL(/\/family-hub\/admin\/family\//);
    await settle(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      results.violations.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join('\n'),
    ).toEqual([]);
  });
});
