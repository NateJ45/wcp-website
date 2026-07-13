import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

test.describe('Family Hub home dashboard', () => {
  test('greeting, class row, and widgets render with no axe violations (light + dark)', async ({
    page,
  }) => {
    await page.goto('/family-hub', { waitUntil: 'load' });
    await settle(page);

    // Greeting hero.
    await expect(page.getByText(/^Good (morning|afternoon|evening), WCP family!$/)).toBeVisible();

    // Class links in the rail (Pre-K AM + PM share one merged page).
    for (const href of ['/family-hub/twos', '/family-hub/threes', '/family-hub/pre-k']) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }

    // Widget grid: six cards by their titles.
    for (const title of [
      'Upcoming Events',
      'Announcements',
      'Fundraising',
      'Meeting Minutes',
      'Class Photos',
      'Budget Snapshot',
    ]) {
      await expect(page.getByRole('heading', { name: title, level: 3 })).toBeVisible();
    }

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
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/family-hub', { waitUntil: 'load' });
    await settle(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});
