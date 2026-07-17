import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// =============================================================================
// Cookie consent — the card, persistence, and the consent-gated ads tag
// =============================================================================
// The test build sets a fake PUBLIC_GADS_ID (playwright.config webServer.env)
// so the card exists. The config-level storageState pre-answers consent for
// every OTHER suite; this file opts out to get the true first-visit state.
//
// The contract under test (src/scripts/consent.ts + CookieConsent.astro):
//   - first visit: card visible, NO Google script anywhere
//   - "No thanks": persists across reloads, tag never loads
//   - "Allow cookies": persists, tag scripts injected (type=text/partytown)
//   - footer "Cookie choices" reopens the card so a choice can be changed
//   - the open card passes axe in both themes (it ships on real first visits)
// =============================================================================

test.use({ storageState: { cookies: [], origins: [] } });

const GTAG = 'script[src*="googletagmanager.com"]';

test.beforeEach(async ({ page }) => {
  // Belt-and-suspenders: no test here should reach Google even after "Allow"
  // (Partytown fetches from a worker, which routing may not intercept — the
  // assertions only read the DOM, so an escaped fetch can't flake the test).
  await page.route('**/*googletagmanager.com/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: '' }),
  );
});

test('first visit shows the card and loads no Google script', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  const card = page.locator('[data-consent-banner]');
  await expect(card).toBeVisible();
  await expect(card.getByRole('button', { name: 'Allow cookies' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'No thanks' })).toBeVisible();
  expect(await page.locator(GTAG).count()).toBe(0);
});

test('"No thanks" hides the card, persists, and never loads the tag', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  await page.locator('[data-consent-banner]').getByRole('button', { name: 'No thanks' }).click();
  await expect(page.locator('[data-consent-banner]')).toBeHidden();

  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('[data-consent-banner]')).toBeHidden();
  expect(await page.locator(GTAG).count()).toBe(0);
  const stored = await page.evaluate(() => localStorage.getItem('wcp-consent'));
  expect(JSON.parse(stored ?? '{}').ads).toBe('denied');
});

test('"Allow cookies" persists and injects the Partytown ads tag', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  await page
    .locator('[data-consent-banner]')
    .getByRole('button', { name: 'Allow cookies' })
    .click();
  await expect(page.locator('[data-consent-banner]')).toBeHidden();
  // Prefix match: Partytown rewrites a consumed script's type to
  // "text/partytown-x", so an exact [type="text/partytown"] misses it in the
  // production build (this selector must keep matching both states).
  await expect(page.locator(`${GTAG}[type^="text/partytown"]`)).toBeAttached();

  // The grant re-injects on every subsequent page load, with no card shown.
  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('[data-consent-banner]')).toBeHidden();
  await expect(page.locator(`${GTAG}[type^="text/partytown"]`)).toBeAttached();
  const stored = await page.evaluate(() => localStorage.getItem('wcp-consent'));
  expect(JSON.parse(stored ?? '{}').ads).toBe('granted');
});

test('footer "Cookie choices" reopens the card to change a past answer', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  await page
    .locator('[data-consent-banner]')
    .getByRole('button', { name: 'Allow cookies' })
    .click();

  const opener = page.getByRole('button', { name: 'Cookie choices' });
  await opener.scrollIntoViewIfNeeded();
  await expect(opener).toBeVisible();
  await opener.click();
  await expect(page.locator('[data-consent-banner]')).toBeVisible();

  await page.locator('[data-consent-banner]').getByRole('button', { name: 'No thanks' }).click();
  const stored = await page.evaluate(() => localStorage.getItem('wcp-consent'));
  expect(JSON.parse(stored ?? '{}').ads).toBe('denied');
});

for (const theme of ['light', 'dark'] as const) {
  test(`open card passes axe (${theme} mode)`, async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    if (theme === 'dark') {
      await page.evaluate(() => document.documentElement.classList.add('dark'));
    }
    await settle(page);
    await expect(page.locator('[data-consent-banner]')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      results.violations.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join('\n'),
    ).toEqual([]);
  });
}
