import { test, expect } from '@playwright/test';
import { settle } from './helpers';

// =============================================================================
// The dynamic classroom route (/family-hub/<class or class page>)
// =============================================================================
// The hub's class pages were hand-written .astro routes over a hardcoded list
// of four slugs, so a class the Board added had no hub presence at all. They
// are derived from the `class` documents now (src/lib/hub-classrooms.ts) and
// served by the gated catch-all. These specs hold the two things that change
// silently if that derivation breaks:
//
//   1. THE ADDRESSES DO NOT MOVE. Families have /family-hub/twos-threes and
//      /family-hub/pre-k bookmarked, and /family-hub/twos, /threes, /pre-k-am,
//      /pre-k-pm were real routes that redirected. All six still behave.
//   2. THE PRECEDENCE IS DELIBERATE. A classroom is resolved before a
//      Board-created page at the same address, so a class page can never be
//      shadowed by a page someone made. (The Studio also refuses to save one
//      there — src/sanity/schemaTypes/documents/hubPage.ts.)
// =============================================================================

/** The classroom pages the site ships with, and the classes each covers. */
const CLASSROOMS = [
  { route: '/family-hub/twos-threes', classes: ['Twos', 'Threes'], from: ['twos', 'threes'] },
  { route: '/family-hub/pre-k', classes: ['Pre-K AM', 'Pre-K PM'], from: ['pre-k-am', 'pre-k-pm'] },
];

for (const room of CLASSROOMS) {
  test.describe(`classroom ${room.route}`, () => {
    test('renders its own page with a class fact card per class', async ({ page }) => {
      const res = await page.goto(room.route, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBe(200);
      await settle(page);

      await expect(page.locator('h1#hub-page-title')).toBeVisible();
      // One fact card per class, each naming its class. The name pill is the
      // marker: it is what tells a parent which half of the page is theirs.
      for (const name of room.classes) {
        await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
      }
      // The page's own document still drives the handbook below the facts.
      await expect(page.locator('.hub-doc-block').first()).toBeVisible();
    });

    for (const slug of room.from) {
      test(`/family-hub/${slug} still lands here`, async ({ page }) => {
        // These were real .astro redirect files. Deleting them must not break
        // a bookmark, so the classroom resolver issues the redirect instead.
        await page.goto(`/family-hub/${slug}`, { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(new RegExp(`${room.route}/?$`));
        await expect(page.locator('h1#hub-page-title')).toBeVisible();
      });
    }
  });
}

test('the rail lists one link per classroom, not one per class', async ({ page }) => {
  // Two classes that share a teacher and a handbook are ONE page, so they must
  // read as one menu item. A regression here shows up as four class links.
  await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
  await settle(page);
  for (const room of CLASSROOMS) {
    await expect(page.locator(`aside a[href="${room.route}"]`).first()).toBeVisible();
  }
  for (const slug of ['twos', 'threes', 'pre-k-am', 'pre-k-pm']) {
    await expect(page.locator(`aside a[href="/family-hub/${slug}"]`)).toHaveCount(0);
  }
});

test('the home page publishes the class list the personalization reads', async ({ page }) => {
  // my-class.ts used to carry a hardcoded map of the four class slugs, which is
  // exactly what made the hub blind to a class the Board added. The list is
  // printed by BaseLayout now; if it stops being printed, the picker silently
  // stops working rather than failing loudly.
  await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
  const rows = await page.locator('[data-hub-classes]').first().textContent();
  const parsed = JSON.parse(rows ?? '[]');
  expect(parsed.length).toBeGreaterThanOrEqual(4);
  for (const row of parsed) {
    expect(row.slug).toBeTruthy();
    expect(row.label).toBeTruthy();
    expect(row.page).toMatch(/^\/family-hub\//);
  }
  // Every picker chip names the page its class lives on.
  const chip = page.locator('[data-my-class-pick="twos"]');
  await expect(chip).toHaveAttribute('data-my-class-page', '/family-hub/twos-threes');
});

test('a made-up class address is a 404, not an empty class page', async ({ page }) => {
  const res = await page.goto('/family-hub/no-such-class', { waitUntil: 'domcontentloaded' });
  expect(res?.status()).toBe(404);
});
