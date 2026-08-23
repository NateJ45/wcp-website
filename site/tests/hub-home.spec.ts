import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// These specs wait on 'domcontentloaded' + explicit content, NEVER on 'load':
// the server-island placeholders are module scripts whose top-level await
// (and, for the store card, dozens of external product images) hold the
// window load event open — cold external origins pushed it past the 60s test
// timeout on a page that had fully rendered (diagnosed 2026-08-23; the SSR
// response itself answers in under 2s). The island-dependent assertions carry
// their own 30s timeouts instead.
const ISLAND_TIMEOUT = 30_000;

test.describe('Family Hub home dashboard', () => {
  test('greeting, class row, and widgets render with no axe violations (light + dark)', async ({
    page,
  }) => {
    await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
    await settle(page);

    // Greeting hero.
    await expect(page.getByText(/^Good (morning|afternoon|evening), WCP family!$/)).toBeVisible();

    // Class links in the rail (Twos + Threes share one page; Pre-K AM + PM too).
    for (const href of ['/family-hub/twos-threes', '/family-hub/pre-k']) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }

    // Widget grid: six cards by their titles. Three are server islands that
    // stream in after the shell, so allow them the island timeout.
    for (const title of [
      'Upcoming Events',
      'Announcements',
      'Fundraising',
      'Meeting Minutes',
      'Class Photos',
      'Budget Snapshot',
    ]) {
      await expect(page.getByRole('heading', { name: title, level: 3 })).toBeVisible({
        timeout: ISLAND_TIMEOUT,
      });
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

  // Regression (2026-07): the server-island widgets stream in AFTER reveal.ts's
  // initial scan; without the MutationObserver in reveal.ts their data-reveal
  // cards never got .is-visible and sat at opacity 0 forever (except on hard
  // refresh, where the race flipped). Playwright's toBeVisible() treats
  // opacity:0 as visible, so this asserts the class AND the computed opacity.
  test('server-island widgets join the reveal system', async ({ page }) => {
    await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
    await settle(page);

    for (const title of ['Upcoming Events', 'Fundraising', 'Budget Snapshot']) {
      const heading = page.getByRole('heading', { name: title, level: 3 });
      // Waits for the island to stream in (cold external origins are slow).
      await expect(heading).toBeVisible({ timeout: ISLAND_TIMEOUT });
      const card = page.locator('[data-reveal]', { has: heading }).last();
      // Below-fold cards reveal on scroll — exercise the observer path too.
      await card.scrollIntoViewIfNeeded();
      await expect(card).toHaveClass(/is-visible/);
      await expect
        .poll(() => card.evaluate((e) => getComputedStyle(e).opacity), { timeout: 5000 })
        .toBe('1');
    }
  });

  test('no horizontal overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
    await settle(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    // The phone-only bottom tab bar: 4 links + More, and it clears the
    // content (BaseLayout pads main's bottom).
    const tabBar = page.locator('nav[aria-label="Hub quick navigation"]');
    await expect(tabBar).toBeVisible();
    await expect(tabBar.locator('a, button')).toHaveCount(5);
  });
});
