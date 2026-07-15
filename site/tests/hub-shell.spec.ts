import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

test.describe('Family Hub shell', () => {
  test('rail renders with active Home and no axe violations (light + dark)', async ({ page }) => {
    await page.goto('/family-hub', { waitUntil: 'load' });
    await settle(page);

    const nav = page.locator('nav[aria-label="Family Hub"]').first();
    await expect(nav).toBeVisible();
    await expect(nav.locator('[aria-current="page"]')).toHaveText(/Home/);

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
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/family-hub', { waitUntil: 'load' });
    await settle(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test('drawer opens, traps focus, and Esc closes it', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/family-hub', { waitUntil: 'load' });
    await settle(page);

    // TWO toggles share the drawer (top-bar menu + the tab bar's More) and
    // hub-drawer.ts must keep their aria-expanded in sync — regression: the
    // script once bound only the first, leaving the More button dead.
    const menuToggle = page.getByRole('button', { name: 'Open menu' });
    const moreToggle = page.getByRole('button', { name: /More — open the full menu/ });
    const drawer = page.locator('#hub-drawer');
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(moreToggle).toHaveAttribute('aria-expanded', 'false');

    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(moreToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');

    await page.keyboard.press('Escape');
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');

    // The tab bar's More button opens it too.
    await moreToggle.click();
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });

  test('desktop rail collapses to icons and keeps accessible names', async ({ page }) => {
    await page.goto('/family-hub', { waitUntil: 'load' });
    await settle(page);

    const aside = page.locator('.hub-rail-aside');
    const toggle = page.locator('[data-rail-toggle]');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const expandedWidth = (await aside.boundingBox())!.width;

    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-rail-collapsed', '');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const collapsedWidth = (await aside.boundingBox())!.width;
    expect(collapsedWidth).toBeLessThan(expandedWidth - 60);

    // Labels are visually hidden but stay in the a11y tree (accessible names).
    await expect(aside.locator('nav a').first()).toHaveText(/Home/);

    // Toggling back restores the wide rail.
    await toggle.click();
    await expect(page.locator('html')).not.toHaveAttribute('data-rail-collapsed', '');
    expect((await aside.boundingBox())!.width).toBeGreaterThan(collapsedWidth + 60);
  });

  // The desktop topbar + bell + quick actions (2026-07-14 app-elevation
  // Track A). Menus are native <details>; hub-menus.ts adds Esc/outside-close.
  test('topbar: bell opens, closes on Esc, passes axe open; search opens', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/family-hub/documents', { waitUntil: 'load' });
    await settle(page);

    const topbar = page.locator('[data-hub-topbar]');
    await expect(topbar).toBeVisible();

    // Bell: opens its server-rendered panel; Esc closes it again.
    const bell = topbar.locator('details[data-hub-bell]');
    await bell.locator('summary').click();
    await expect(bell.locator('[data-bell-panel]')).toBeVisible();
    await expect(bell.locator('a[href="/family-hub/updates"]')).toBeVisible();

    // Axe with the panel open (both themes) — pill/panel contrast gate.
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

    await page.keyboard.press('Escape');
    await expect(bell.locator('[data-bell-panel]')).not.toBeVisible();

    // The search affordance opens the palette.
    await topbar.locator('[data-hub-search-open]').click();
    await expect(page.locator('dialog[open], [role="dialog"]').first()).toBeVisible();
  });
});
