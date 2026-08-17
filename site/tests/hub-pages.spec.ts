import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// =============================================================================
// Board-created hub pages — the gated catch-all (family-hub/[...slug].astro)
// =============================================================================
// The ability for a future board to ADD a hub page without a developer is the
// thing these tests protect. It is easy to break invisibly: a change to the
// middleware, the shell, or the query would leave the built-in pages working
// while quietly killing the one route nobody visits day to day.
//
// The fixture is the example page seeded by scripts/seed-example-hub-page.mjs.
// =============================================================================

const EXAMPLE = '/family-hub/example-committee';

test.describe('Board-created hub page', () => {
  test('renders through the catch-all with the normal hub shell', async ({ page }) => {
    await page.goto(EXAMPLE, { waitUntil: 'load' });
    await settle(page);

    // Same page header every hub page uses — a Board page is not a lesser page.
    const h1 = page.locator('h1#hub-page-title');
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText(/An example page/i);

    // The shell: the hub nav is what makes it feel like the hub rather than a
    // stray document. Attached, not visible — this spec also runs on the
    // webkit-iphone project, where the desktop rail is display:none and the
    // drawer serves mobile (the rail renders twice in the DOM either way).
    await expect(page.locator('nav[aria-label="Family Hub"]')).toHaveCount(2);
  });

  test('renders its page-builder sections', async ({ page }) => {
    await page.goto(EXAMPLE, { waitUntil: 'load' });
    await settle(page);

    // One heading per seeded section, proving the hub-safe palette works here.
    await expect(page.getByRole('heading', { name: /How this page got here/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Sections work exactly as they do elsewhere/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /Common questions/i })).toBeVisible();

    // Card grid + FAQ content actually rendered, not just their headings.
    await expect(page.getByText(/Drag sections into the order you want/i)).toBeVisible();
    await expect(page.getByText(/Can I delete this page\?/i)).toBeVisible();
  });

  test('passes axe in light and dark', async ({ page }) => {
    await page.goto(EXAMPLE, { waitUntil: 'load' });
    await settle(page);

    for (const theme of ['light', 'dark'] as const) {
      await page.evaluate((t) => {
        document.documentElement.classList.toggle('dark', t === 'dark');
      }, theme);
      await settle(page);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, `axe violations in ${theme}`).toEqual([]);
    }
  });

  test('no horizontal overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(EXAMPLE, { waitUntil: 'load' });
    await settle(page);
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test('an address with no page behind it is a 404, not an empty shell', async ({ page }) => {
    const res = await page.goto('/family-hub/definitely-not-a-real-page', {
      waitUntil: 'load',
    });
    expect(res?.status()).toBe(404);
  });

  test('a slug that shadows a built-in page never hijacks it', async ({ page }) => {
    // Astro matches the static route first. If that ever changed, the Directory
    // — full of family PII — would be replaceable by anyone who could create a
    // hub page. Assert the real page is what answers.
    await page.goto('/family-hub/directory', { waitUntil: 'load' });
    await settle(page);
    await expect(page.locator('h1#hub-page-title')).toHaveText(/Director/i);
  });

  test('is findable in the command palette', async ({ page }) => {
    // A page nobody can search for is a page nobody uses. The index builds
    // itself from the documents, so a Board page must appear with no registry
    // update.
    const res = await page.request.get('/family-hub/api/search-index');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('example-committee');
  });
});
