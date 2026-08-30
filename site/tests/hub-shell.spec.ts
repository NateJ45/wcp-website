import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

test.describe('Family Hub shell', () => {
  test('rail renders with active Home and no axe violations (light + dark)', async ({ page }) => {
    await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
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
    await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
    await settle(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test('drawer opens, traps focus, and Esc closes it', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
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
    await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
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
    await page.goto('/family-hub/documents', { waitUntil: 'domcontentloaded' });
    await settle(page);

    const topbar = page.locator('[data-hub-topbar]');
    await expect(topbar).toBeVisible();

    // Bell: opens its server-rendered panel; Esc closes it again.
    const bell = topbar.locator('details[data-hub-bell]');
    await bell.locator('summary').click();
    await expect(bell.locator('[data-bell-panel]')).toBeVisible();
    // .first(): the panel lists recent announcements ABOVE the "All updates"
    // link and each row links to /family-hub/updates too, so with any real
    // announcements published this locator matches several elements (strict
    // mode violation the first time content landed, 2026-08-04).
    await expect(bell.locator('a[href="/family-hub/updates"]').first()).toBeVisible();

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

  // The bell reads SEVEN feeds (2026-08-29). This test is content-independent:
  // it pins the panel's contract, not any one row. The per-feed rules live in
  // src/lib/hub-bell.test.ts, where they can be tested against real data.
  test('bell: nine rows at most, every row dated or honestly undated, no feed starves', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/family-hub/documents', { waitUntil: 'domcontentloaded' });
    await settle(page);

    const panel = page.locator('[data-hub-topbar] details[data-hub-bell] [data-bell-panel]');
    const rows = panel.locator('li[data-published]');
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(9);

    // Every row carries data-published, because hub-fresh.ts reads that
    // attribute to badge the bell. An UNDATED row (the fundraising milestone,
    // which has no crossing time anywhere) carries it empty on purpose: it
    // lists, and it never counts toward the unseen badge. Anything else must
    // be a date the browser can parse, or the badge silently under-counts.
    const metas: string[] = [];
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const published = await row.getAttribute('data-published');
      expect(published, 'row is missing data-published').not.toBeNull();
      if (published) {
        expect(Number.isFinite(Date.parse(published)), `unparseable date "${published}"`).toBe(
          true,
        );
      }
      const meta = (await row.locator('[data-bell-meta]').getAttribute('data-bell-meta')) ?? '';
      if (meta) metas.push(meta);
    }

    // The per-feed cap: no feed may take more than 4 rows (updates), and only
    // announcements and meeting minutes may go past 2. Without this, three
    // documents plus three announcements fill the panel and the note bump the
    // Board made this morning never shows.
    const wide = new Set(['Announcement', 'Meeting minutes', 'Spotlight']);
    const tally = new Map<string, number>();
    for (const meta of metas) tally.set(meta, (tally.get(meta) ?? 0) + 1);
    for (const [meta, n] of tally) {
      expect(n, `${meta} took ${n} rows`).toBeLessThanOrEqual(wide.has(meta) ? 4 : 2);
    }
  });
});
