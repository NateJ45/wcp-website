import { test, expect } from '@playwright/test';

// =============================================================================
// Live class-availability badges (ClassCard + src/scripts/availability.ts)
// =============================================================================
// The static serve has no /api routes, so the API is mocked with page.route —
// which is exactly the point: these tests prove the CLIENT contract (fill and
// reveal on data, stay hidden without it) independent of Google Sheets.
// /enroll carries a classCardsSection with all four classes.
// =============================================================================

test('badges hydrate from /api/availability with dot + label', async ({ page }) => {
  await page.route('**/api/availability', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        { slug: 'twos', status: 'open' },
        { slug: 'threes', status: 'few' },
        { slug: 'pre-k-am', status: 'waitlist' },
        { slug: 'pre-k-pm', status: 'full' },
      ]),
    }),
  );
  await page.goto('/enroll/', { waitUntil: 'domcontentloaded' });

  const twos = page.locator('[data-availability="twos"]');
  await expect(twos).toBeVisible();
  await expect(twos).toContainText('Spots open');
  await expect(page.locator('[data-availability="threes"]')).toContainText('A few spots left');
  await expect(page.locator('[data-availability="pre-k-am"]')).toContainText('Waitlist open');
  await expect(page.locator('[data-availability="pre-k-pm"]')).toContainText('Class is full');
});

test('badges stay hidden when the API has nothing', async ({ page }) => {
  await page.route('**/api/availability', (route) =>
    route.fulfill({ contentType: 'application/json', body: '[]' }),
  );
  await page.goto('/enroll/', { waitUntil: 'domcontentloaded' });

  // Give the fetch a beat to resolve, then confirm nothing was revealed.
  await page.waitForTimeout(300);
  for (const el of await page.locator('[data-availability]').all()) {
    await expect(el).toBeHidden();
  }
});

test('badges stay hidden when the API fails outright', async ({ page }) => {
  await page.route('**/api/availability', (route) => route.abort());
  await page.goto('/enroll/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  for (const el of await page.locator('[data-availability]').all()) {
    await expect(el).toBeHidden();
  }
});
