import { test, expect } from '@playwright/test';
import { settle } from './helpers';

// =============================================================================
// The org chart on /family-hub/coop-jobs is DERIVED (2026-08-29)
// =============================================================================
// The chart's shape used to be a committed list, so a school could not rename a
// role, add one, or shrink its board. It is built now from the `coopRole`
// documents (the seats, each saying where it sits and who it reports to) and the
// `roleHolder` documents (the people) — see src/lib/hub-org.ts, which is
// unit-tested in full. These specs hold the parts only a real render proves:
//
//   1. THE COLUMNS COME FROM THE REPORTING LINES. "Reports to Secretary" and
//      "Reports to VP" are not headings anybody typed; they are derived from a
//      seat's reference to its officer. If the join breaks, both columns
//      collapse into one "Other roles" box — which is loud, and this catches it.
//   2. CLASS REPS STAY AUTOMATIC. ONE seat expands to one card per live class,
//      so the chart must show a rep for every class the hub knows about. This
//      is what makes a class the Board adds get a rep card with no code change.
//   3. THE JOB LIST AND THE CHART AGREE, because they read the same documents.
// =============================================================================

test.describe('the derived org chart', () => {
  test('draws a column per officer, from the reporting lines', async ({ page }) => {
    await page.goto('/family-hub/coop-jobs', { waitUntil: 'domcontentloaded' });
    await settle(page);

    const chart = page.locator('.org-chart');
    await expect(chart).toBeVisible();

    // Every column heading reads "Reports to <officer>" — the derived title.
    // "Other roles" is the catch-all for a seat whose officer was deleted, so
    // its presence on a healthy dataset means the references did not resolve.
    const titles = await chart.locator('p.uppercase').allInnerTexts();
    const columns = titles.filter((t) => /^Reports to /i.test(t));
    expect(columns.length).toBeGreaterThanOrEqual(2);
    expect(titles.some((t) => /Other roles/i.test(t))).toBe(false);

    // The top of the chart, and the paid-staff row under it.
    await expect(chart.getByText('President', { exact: true }).first()).toBeVisible();
    await expect(chart.getByText('Paid Staff', { exact: true }).first()).toBeVisible();
  });

  test('shows one class-rep card per live class, with no per-class document', async ({ page }) => {
    // `[data-hub-classes]` is the live class list the home page publishes for
    // the personalization scripts — the same list the rep seat expands over. The
    // chart must therefore carry exactly one rep card per class, by name. A
    // class added in the Studio lands in both without any code change.
    await page.goto('/family-hub', { waitUntil: 'domcontentloaded' });
    const raw = await page.locator('[data-hub-classes]').first().textContent();
    const classes = JSON.parse(raw ?? '[]') as { label: string }[];
    expect(classes.length).toBeGreaterThanOrEqual(4);

    await page.goto('/family-hub/coop-jobs', { waitUntil: 'domcontentloaded' });
    await settle(page);
    const chart = page.locator('.org-chart');
    for (const cls of classes) {
      await expect(chart.getByText(`${cls.label} Rep`, { exact: true })).toHaveCount(1);
    }
    // And no rep card the class list does not account for.
    await expect(chart.locator('span', { hasText: /^[\w\s-]+ Rep$/ })).toHaveCount(classes.length);
  });

  test('the job list is built from the same seats as the chart', async ({ page }) => {
    await page.goto('/family-hub/coop-jobs', { waitUntil: 'domcontentloaded' });
    await settle(page);

    // A seat's "Reports to X" tag on the job list is DERIVED from the reference
    // now, not free text — so it can never name a role that no longer exists.
    const tags = await page.locator('span', { hasText: /^Reports to / }).allInnerTexts();
    for (const tag of tags) {
      const officer = tag.replace(/^Reports to\s+/, '').trim();
      await expect(page.getByText(officer, { exact: true }).first()).toBeVisible();
    }
  });
});
