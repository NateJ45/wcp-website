import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// =============================================================================
// First-visit tour — the walkthrough a family sees on their first sign-in
// =============================================================================
// The shared auth state marks the tour as seen, so the other suites never meet
// the overlay. These tests clear that mark on purpose, per test.
// =============================================================================

const clearSeen = `
  try { localStorage.removeItem('wcp-tour-seen'); } catch {}
`;

// Get to an OPEN tour from a fresh state. When the President's note is due it
// opens first — close it, and the tour follows (that IS the product behavior:
// the President speaks first). When no note is due the tour opens by itself.
async function openTourFresh(page: import('@playwright/test').Page) {
  await page.addInitScript(clearSeen);
  await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
  const note = page.locator('[data-note-modal]');
  const noteOpened = await note
    .waitFor({ state: 'visible', timeout: 2500 })
    .then(() => true)
    .catch(() => false);
  if (noteOpened) await note.locator('button[data-note-close]').first().click();
  await expect(page.locator('[data-tour-modal]')).toBeVisible({ timeout: 5000 });
}

test.describe('First-visit tour', () => {
  test('opens on the first visit, after the note when one is due', async ({ page }) => {
    await openTourFresh(page);
    await expect(page.locator('#tour-title')).toHaveText(/Welcome to the Family Hub/i);
  });

  test('walks forward and back through all eight steps', async ({ page }) => {
    await openTourFresh(page);

    const next = page.locator('[data-tour-next]');
    for (let i = 0; i < 7; i++) await next.click();
    await expect(next).toHaveText('Done');
    // The last step hides Skip: Done is the one way out.
    await expect(page.locator('[data-tour-skip]')).toBeHidden();

    const back = page.locator('[data-tour-back]');
    await back.click();
    await expect(next).toHaveText('Next');
  });

  test('closing stores the version and stops the auto-open', async ({ page }) => {
    await openTourFresh(page);
    const modal = page.locator('[data-tour-modal]');

    await page.locator('[data-tour-skip]').click();
    await expect(modal).toBeHidden();

    const stored = await page.evaluate(() => localStorage.getItem('wcp-tour-seen'));
    expect(stored).toBeTruthy();

    // A reload must not reopen it. The clearSeen init script re-runs on every
    // navigation and would wipe the key, so re-seed it AFTER the wipe — init
    // scripts run in the order they were added.
    await page.addInitScript((v) => {
      try {
        localStorage.setItem('wcp-tour-seen', v);
      } catch {
        /* fine */
      }
    }, stored as string);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-tour-modal]')).toBeHidden();
  });

  test('the greeting chip reopens a dismissed tour', async ({ page }) => {
    await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
    await settle(page);

    const chip = page.locator('[data-tour-open]');
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(page.locator('[data-tour-modal]')).toBeVisible();
  });

  test('the class chips write the same picks the home picker uses', async ({ page }) => {
    await openTourFresh(page);

    // Steps: welcome → navigate → classes.
    const next = page.locator('[data-tour-next]');
    await next.click();
    await next.click();

    const chip = page.locator('[data-tour-class-pick="threes"]');
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');

    const picks = await page.evaluate(() => localStorage.getItem('wcp-my-classes'));
    expect(picks).toContain('threes');

    // Close; the home tile behind the modal is already personalized.
    await page.locator('[data-tour-skip]').click();
    await expect(
      page.locator('[data-class-tile="threes"] [data-my-class-tag]').first(),
    ).toBeVisible();
  });

  test('spotlights the real page elements as the steps advance', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openTourFresh(page);

    const modal = page.locator('[data-tour-modal]');
    const spot = page.locator('[data-tour-spot]');
    const next = page.locator('[data-tour-next]');

    // Step 2 points at the rail menu.
    await next.click();
    await expect(modal).toHaveClass(/is-spot/);
    await expect(spot).toBeVisible();
    const rail = page.locator('nav[aria-label="Family Hub"]').first();
    await expect
      .poll(async () => {
        const s = await spot.boundingBox();
        const r = await rail.boundingBox();
        if (!s || !r) return 'no boxes';
        return Math.abs(s.y + 8 - r.y) < 24 && s.width >= r.width
          ? 'wrapped'
          : `off by ${s.y - r.y}`;
      })
      .toBe('wrapped');

    // Step 3 moves to the class picker area, scrolled into view.
    await next.click();
    await expect
      .poll(
        async () => {
          const s = await spot.boundingBox();
          const picker = await page
            .locator('[data-my-class-picker], [data-my-class-current]')
            .first()
            .boundingBox();
          if (!s || !picker) return 'no boxes';
          return Math.abs(s.y + 8 - picker.y) < 24
            ? 'wrapped'
            : `off by ${Math.round(s.y - picker.y)}`;
        },
        { timeout: 4000 },
      )
      .toBe('wrapped');

    // The bell step follows the tiles; then money, search, and the centered
    // last step.
    await next.click();
    await next.click();
    await expect
      .poll(async () => {
        const s = await spot.boundingBox();
        const bell = await page.locator('[data-hub-bell]').first().boundingBox();
        if (!s || !bell) return 'no boxes';
        return Math.abs(s.y + 8 - bell.y) < 24 ? 'wrapped' : `off by ${Math.round(s.y - bell.y)}`;
      })
      .toBe('wrapped');
    await next.click();
    await next.click();
    await next.click();
    await expect(modal).not.toHaveClass(/is-spot/);
  });

  test('Esc closes it and focus returns to the opener', async ({ page }) => {
    await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
    await settle(page);
    const chip = page.locator('[data-tour-open]');
    await chip.click();
    await expect(page.locator('[data-tour-modal]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-tour-modal]')).toBeHidden();
    await expect(chip).toBeFocused();
  });

  test('passes axe while open, in light and dark', async ({ page }) => {
    await openTourFresh(page);

    for (const theme of ['light', 'dark'] as const) {
      await page.evaluate((t) => {
        document.documentElement.classList.toggle('dark', t === 'dark');
      }, theme);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, `axe violations in ${theme}`).toEqual([]);
    }
  });

  test('no horizontal overflow at 320px while open', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await openTourFresh(page);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
});
