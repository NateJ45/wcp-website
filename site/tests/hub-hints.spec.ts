import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// =============================================================================
// Feature hints — the one-shot pointers on the Directory and Calendar pages
// =============================================================================

const clearHints = `
  try {
    localStorage.removeItem('wcp-hint-directory-map');
    localStorage.removeItem('wcp-hint-calendar-filters');
  } catch {}
`;

test.describe('Feature hints', () => {
  test('the Directory hint appears once, and Got it dismisses it for good', async ({ page }) => {
    await page.addInitScript(clearHints);
    await page.goto('/family-hub/directory', { waitUntil: 'domcontentloaded' });
    await settle(page);

    const bubble = page.locator('.wcp-hint-bubble');
    await expect(bubble).toBeVisible({ timeout: 5000 });
    await expect(bubble).toContainText(/class|opted in/i);
    await expect(page.locator('.wcp-hint-ring')).toBeVisible();

    await bubble.getByRole('button', { name: /dismiss/i }).click();
    await expect(bubble).toBeHidden();
    const stored = await page.evaluate(() => localStorage.getItem('wcp-hint-directory-map'));
    expect(stored).toBe('1');
  });

  test('a dismissed hint stays gone after a reload', async ({ page }) => {
    // No clearing: the shared state from setup has no hint keys, so seed one.
    await page.addInitScript(
      `try { localStorage.setItem('wcp-hint-calendar-filters', '1'); } catch {}`,
    );
    await page.goto('/family-hub/calendar', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2200);
    await expect(page.locator('.wcp-hint-bubble')).toHaveCount(0);
  });

  test('the Calendar hint passes axe while showing, light and dark', async ({ page }) => {
    await page.addInitScript(clearHints);
    await page.goto('/family-hub/calendar', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.wcp-hint-bubble')).toBeVisible({ timeout: 5000 });

    for (const theme of ['light', 'dark'] as const) {
      await page.evaluate((t) => {
        document.documentElement.classList.toggle('dark', t === 'dark');
      }, theme);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, `axe violations in ${theme}`).toEqual([]);
    }
  });
});
