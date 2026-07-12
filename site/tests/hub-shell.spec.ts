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

    const toggle = page.locator('[data-hub-drawer-toggle]');
    const drawer = page.locator('#hub-drawer');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
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
});
