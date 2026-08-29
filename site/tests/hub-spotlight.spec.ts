import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// =============================================================================
// Spotlight pop-ups — the Board's "look at this" greeting on any hub page
// =============================================================================
// These are CONTENT-DEPENDENT: a spotlight exists only while the Board has one
// switched on and inside its dates, which is the exception rather than the
// rule. So this suite splits in two, the way hub-tour.spec.ts handles the
// note-may-or-may-not-be-due case:
//   - The contract that must hold with NO spotlight live: a hub page shows no
//     pop-up and nothing blocks the page.
//   - Everything else runs only when the page actually served one, and is
//     skipped otherwise. The pure selection rules (window, order, link kinds,
//     the storage key) are covered without a browser in
//     src/lib/hub-spotlight.test.ts.
// The shared auth state marks every live spotlight as seen, so the other
// suites never meet the overlay. These tests clear that mark on purpose.
// =============================================================================

const clearSeen = `
  try { localStorage.removeItem('wcp-spotlights-seen'); } catch {}
`;

/**
 * A hub page with no note and no tour due, so a spotlight may open.
 *
 * Documents on purpose, NOT the Calendar or the home: those two fan out to the
 * Apps Script calendar feed and the gviz sheets server-side, and are the two
 * pages that time out first under load or Google throttling (docs/TESTING.md).
 * A spotlight renders on every hub page, so this suite should sit on a fast
 * one and never inherit that flakiness.
 */
const PAGE = '/family-hub/documents';

/** Open the pop-up from a fresh state, or skip when the Board has none on. */
async function openFresh(page: import('@playwright/test').Page) {
  await page.addInitScript(clearSeen);
  await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
  const modal = page.locator('[data-spotlight-modal]');
  test.skip((await modal.count()) === 0, 'No spotlight is switched on in the dataset.');
  await expect(modal).toBeVisible({ timeout: 5000 });
  return modal;
}

test.describe('Spotlight pop-ups', () => {
  test('a hub page never blocks itself when no spotlight is live', async ({ page }) => {
    await page.addInitScript(clearSeen);
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await page.waitForTimeout(1600);

    // However many are live, there is only ever ONE modal.
    expect(await page.locator('[data-spotlight-modal]').count()).toBeLessThanOrEqual(1);
    // And the page itself rendered.
    await expect(page.locator('h1#hub-page-title')).toBeVisible();
  });

  test('stays closed after every page was seen; a partial read comes back', async ({ page }) => {
    // Seen is marked per spotlight ON DISPLAY, by design: closing after
    // reading 1 of 3 must NOT silence the other two - the arrows would
    // otherwise burn messages nobody read. So the stays-closed guarantee
    // only holds once every live page was displayed. This test walks every
    // page first, and also pins the partial-read reopen.
    const modal = await openFresh(page);

    // Walk to the last page (no-op when only one spotlight is live).
    const next = modal.locator('button[data-spotlight-next]');
    while ((await next.count()) > 0 && (await next.isEnabled().catch(() => false))) {
      const before = await modal.locator('[aria-live]').textContent();
      await next.click();
      await page.waitForTimeout(150);
      const after = await modal.locator('[aria-live]').textContent();
      if (before === after) break; // reached the end
    }

    await modal.locator('button[data-spotlight-close]').first().click();
    await expect(modal).toBeHidden();

    const stored = await page.evaluate(() => localStorage.getItem('wcp-spotlights-seen'));
    expect(stored).toBeTruthy();
    const seenCount = Object.keys(JSON.parse(stored as string)).length;

    // Re-seed the seen map AFTER the clearing init script (init scripts run in
    // the order they were added), then prove the right thing happens.
    await page.addInitScript((v) => {
      try {
        localStorage.setItem('wcp-spotlights-seen', v);
      } catch {
        /* fine */
      }
    }, stored as string);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1600);
    const reopened = await page
      .locator('[data-spotlight-modal]')
      .isVisible()
      .catch(() => false);
    const liveCount = await page.locator('[data-spotlight-page]').count();
    if (seenCount >= liveCount) {
      // Every live spotlight was displayed - the modal must stay closed.
      expect(reopened).toBe(false);
    } else {
      // Some were never displayed - they must come back.
      expect(reopened).toBe(true);
    }
  });

  test('shows arrows only when more than one spotlight is live', async ({ page }) => {
    const modal = await openFresh(page);
    const count = await modal.locator('[data-spotlight-page]').count();
    const nav = modal.locator('[data-spotlight-next]');

    if (count < 2) {
      // One notice reads exactly like the sibling note modals: no chrome.
      await expect(nav).toHaveCount(0);
      await expect(modal.locator('[data-spotlight-progress]')).toHaveCount(0);
      return;
    }

    await expect(modal.locator('[data-spotlight-progress]')).toHaveText(`1 of ${count}`);
    await expect(modal.locator('[data-spotlight-prev]')).toBeDisabled();

    // Forward with the button, back with the keyboard.
    await nav.click();
    await expect(modal.locator('[data-spotlight-progress]')).toHaveText(`2 of ${count}`);
    await expect(modal.locator('[data-spotlight-page]:not([hidden])')).toHaveCount(1);
    await page.keyboard.press('ArrowLeft');
    await expect(modal.locator('[data-spotlight-progress]')).toHaveText(`1 of ${count}`);

    // Paging marks each notice seen as it is displayed.
    const seen = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('wcp-spotlights-seen') ?? '{}'),
    );
    expect(Object.keys(seen).length).toBe(2);
  });

  test('Esc closes it, and it never stacks with the first-visit tour', async ({ page }) => {
    const modal = await openFresh(page);
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();

    // On the hub HOME with the tour still due, the tour speaks and the
    // spotlight holds back: never two modals in one visit.
    await page.addInitScript(`try { localStorage.removeItem('wcp-tour-seen'); } catch {}`);
    await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2400);
    await expect(page.locator('[data-spotlight-modal]')).toBeHidden();
  });

  test('passes axe while open, in light and dark', async ({ page }) => {
    await openFresh(page);

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
    await openFresh(page);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
});
