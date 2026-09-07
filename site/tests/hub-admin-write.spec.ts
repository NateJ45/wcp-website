import { test, expect } from '@playwright/test';

// =============================================================================
// The board admin's WRITE paths: add a family, attach a photo, bulk remove
// =============================================================================
// These three are the reason /family-hub/admin exists — they are what replaced
// the Sanity Studio for the board — and until now NOTHING had run them. The
// project note said "Board to try /family-hub/admin end to end … built
// 2026-09-06 but NO human has run those write paths yet", and the plan was for
// them to rehearse on staging.
//
// That rehearsal would have hit production. deploy-staging.yml deployed the
// same emitted config as production and changed only the Worker name, so the
// staging site was bound to the LIVE DIRECTORY namespace and the real photo
// bucket (found and fixed 2026-09-07 — see scripts/stage-bindings.mjs). Bulk
// remove deletes families outright; it is built for the end-of-year clear-out.
//
// So the write paths get a test instead of a rehearsal. This runs against the
// LOCAL miniflare KV that seed-test-kv.mjs fills with obviously-fake families
// (example.invalid, 555-01xx), so it can add and delete freely and no real
// family is ever touched. It also means a board member breaking these paths is
// caught by CI rather than by a family noticing their entry vanished.
//
// Ordered, not parallel: the three steps are one story — the family this adds
// is the family it later removes — and they share one directory document.
// =============================================================================

test.describe.configure({ mode: 'serial' });

const FAMILY = 'Ztest Writepath';

test.describe('Board admin — write paths', () => {
  test('adds a family, and it appears in the directory', async ({ page }) => {
    await page.goto('/family-hub/admin');
    await page.getByRole('link', { name: 'Add a family' }).click();
    await expect(page).toHaveURL(/\/family-hub\/admin\/family\/new/);

    await page.locator('#familyName').fill(FAMILY);
    // The grown-up and child rows are the parts a board member actually types
    // into, and the class <select> is the one that must stay in sync with the
    // hub's own class slugs — a free-text class was the original reason this
    // control is a dropdown.
    // The row fields are INDEXED (parent0Name, child0Class, …) — the form posts
    // a flat body and the handler reassembles the arrays from those suffixes.
    await page.locator('input[name="parent0Name"]').fill('Testy Writepath');
    await page.locator('input[name="parent0Email"]').fill('testy@example.invalid');
    await page.locator('input[name="parent0Phone"]').fill('555-0199');
    await page.locator('input[name="child0Name"]').fill('Tiny Writepath');
    await page.locator('select[name="child0Class"]').selectOption('twos');
    await page.locator('#address').fill('9 Writepath Way, Exampleton');

    await page.getByRole('button', { name: 'Save changes' }).click();

    // Back on the list, with the new family on it.
    await expect(page).toHaveURL(/\/family-hub\/admin/);
    await expect(page.getByRole('cell', { name: FAMILY })).toBeVisible();
  });

  test('the new family reaches the family-facing directory too', async ({ page }) => {
    // Writing to KV is only half the job: the point of the admin is that the
    // change shows up for families. A save that never surfaces is the failure
    // this catches.
    await page.goto('/family-hub/directory');
    await expect(page.getByText(FAMILY, { exact: false }).first()).toBeVisible();
  });

  test('attaches a photo, served back through the gated route', async ({ page }) => {
    await page.goto('/family-hub/admin');
    const row = page.getByRole('row', { name: new RegExp(FAMILY) });
    await row.getByRole('link', { name: 'Edit' }).click();
    await expect(page).toHaveURL(/\/family-hub\/admin\/family\//);

    // A real PNG, generated here rather than committed: a binary fixture of a
    // child's photograph is precisely what must never be in this repo, and a
    // 1x1 red pixel proves the upload path just as well.
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    await page
      .locator('input[name="photo"]')
      .setInputFiles({ name: 'writepath.png', mimeType: 'image/png', buffer: png });
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page).toHaveURL(/\/family-hub\/admin/);

    // The photo must come back through /family-hub/photo/<key>, which is behind
    // the gate on purpose — R2 has no public endpoint here, because these are
    // pictures of children.
    await page.goto('/family-hub/directory');
    const img = page.locator('img[src^="/family-hub/photo/"]').first();
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    const res = await page.request.get(src!);
    expect(res.status(), 'the gated photo route should serve the upload').toBe(200);
    expect(res.headers()['content-type']).toContain('image');
  });

  test('bulk-removes the family, and it disappears from the directory', async ({ page }) => {
    await page.goto('/family-hub/admin');

    // The confirm() is deliberate — bulk remove is the destructive control, and
    // it names the families in the prompt. Playwright DISMISSES dialogs by
    // default, so without this the submit silently does nothing and the test
    // would "pass" by never deleting.
    let prompt = '';
    page.on('dialog', (d) => {
      prompt = d.message();
      return d.accept();
    });

    await page.getByRole('button', { name: 'Select several…' }).click();
    const row = page.getByRole('row', { name: new RegExp(FAMILY) });
    await row.getByRole('checkbox').check();
    await page.getByRole('button', { name: /^Remove \d+ famil/ }).click();

    await expect(page.getByRole('cell', { name: FAMILY })).toHaveCount(0);
    expect(prompt, 'the confirm should name what is about to be deleted').toContain(FAMILY);

    // And gone for families, not just hidden on the board's own list.
    await page.goto('/family-hub/directory');
    await expect(page.getByText(FAMILY, { exact: false })).toHaveCount(0);
  });
});
