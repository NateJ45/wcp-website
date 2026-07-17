import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

// =============================================================================
// Cookie consent — the card, per-category persistence, and gated trackers
// =============================================================================
// The test build sets fake ids for all three trackers (playwright.config
// webServer.env) so the card exists with BOTH toggle rows. The config-level
// storageState pre-answers consent for every OTHER suite; this file opts out
// to get the true first-visit state.
//
// The contract under test (src/scripts/consent.ts + CookieConsent.astro):
//   - first visit: card visible, toggles unchecked, NO tracker script anywhere
//   - "Save choices" untouched = the one-click decline; persists, no trackers
//   - "Accept all": persists, injects gtag (GA + Ads configs) AND the pixel
//   - a single-category grant loads only that category's scripts
//   - footer "Cookie choices" reopens with toggles reflecting the stored state
//   - the open card passes axe in both themes (it ships on real first visits)
//
// Selector gotcha: Partytown rewrites a consumed script's type to
// "text/partytown-x", so assertions must prefix-match [type^=].
// =============================================================================

test.use({ storageState: { cookies: [], origins: [] } });

const GTAG = 'script[src*="googletagmanager.com"]';

const card = (page: import('@playwright/test').Page) => page.locator('[data-consent-banner]');
const storedState = (page: import('@playwright/test').Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('wcp-consent') ?? '{}'));
const pixelInjected = (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('script')].some((s) => s.text.includes('fbq(')),
  );

test.beforeEach(async ({ page }) => {
  // Belt-and-suspenders: no test here should reach Google/Meta even after a
  // grant (Partytown fetches from a worker, which routing may not intercept —
  // the assertions only read the DOM, so an escaped fetch can't flake).
  for (const host of ['**/*googletagmanager.com/**', '**/*connect.facebook.net/**']) {
    await page.route(host, (route) => route.fulfill({ contentType: 'text/javascript', body: '' }));
  }
});

test('first visit shows the card with unchecked toggles and no tracker scripts', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'load' });
  await expect(card(page)).toBeVisible();
  await expect(card(page).locator('[data-consent-toggle="analytics"]')).not.toBeChecked();
  await expect(card(page).locator('[data-consent-toggle="marketing"]')).not.toBeChecked();
  await expect(card(page).getByRole('button', { name: 'Save choices' })).toBeVisible();
  await expect(card(page).getByRole('button', { name: 'Accept all' })).toBeVisible();
  expect(await page.locator(GTAG).count()).toBe(0);
  expect(await pixelInjected(page)).toBe(false);
});

test('"Save choices" untouched declines both, persists, loads nothing', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  await card(page).getByRole('button', { name: 'Save choices' }).click();
  await expect(card(page)).toBeHidden();

  await page.reload({ waitUntil: 'load' });
  await expect(card(page)).toBeHidden();
  expect(await page.locator(GTAG).count()).toBe(0);
  expect(await pixelInjected(page)).toBe(false);
  const stored = await storedState(page);
  expect(stored.analytics).toBe('denied');
  expect(stored.marketing).toBe('denied');
});

test('"Accept all" persists and injects gtag configs for GA + Ads and the pixel', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'load' });
  await card(page).getByRole('button', { name: 'Accept all' }).click();
  await expect(card(page)).toBeHidden();
  await expect(page.locator(`${GTAG}[type^="text/partytown"]`)).toBeAttached();
  // One shared loader; a config script per id.
  const configs = await page.evaluate(
    () =>
      [...document.querySelectorAll('script')].filter((s) => s.text.includes("gtag('config'"))
        .length,
  );
  expect(configs).toBe(2);
  expect(await pixelInjected(page)).toBe(true);

  // The grants re-inject on every subsequent page load, with no card shown.
  await page.reload({ waitUntil: 'load' });
  await expect(card(page)).toBeHidden();
  await expect(page.locator(`${GTAG}[type^="text/partytown"]`)).toBeAttached();
  expect(await pixelInjected(page)).toBe(true);
  const stored = await storedState(page);
  expect(stored.analytics).toBe('granted');
  expect(stored.marketing).toBe('granted');
});

test('an analytics-only grant loads GA but neither advertising tracker', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  await card(page).locator('[data-consent-toggle="analytics"]').check();
  await card(page).getByRole('button', { name: 'Save choices' }).click();

  await expect(page.locator(`${GTAG}[type^="text/partytown"]`)).toBeAttached();
  const configs = await page.evaluate(() =>
    [...document.querySelectorAll('script')]
      .filter((s) => s.text.includes("gtag('config'"))
      .map((s) => s.text),
  );
  expect(configs).toHaveLength(1);
  expect(configs[0]).toContain('G-0000TEST00');
  expect(await pixelInjected(page)).toBe(false);
  const stored = await storedState(page);
  expect(stored.analytics).toBe('granted');
  expect(stored.marketing).toBe('denied');
});

test('footer "Cookie choices" reopens with toggles reflecting the stored state', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'load' });
  await card(page).locator('[data-consent-toggle="analytics"]').check();
  await card(page).getByRole('button', { name: 'Save choices' }).click();

  const opener = page.getByRole('button', { name: 'Cookie choices' });
  await opener.scrollIntoViewIfNeeded();
  await expect(opener).toBeVisible();
  await opener.click();
  await expect(card(page)).toBeVisible();
  await expect(card(page).locator('[data-consent-toggle="analytics"]')).toBeChecked();
  await expect(card(page).locator('[data-consent-toggle="marketing"]')).not.toBeChecked();

  // Withdraw analytics too; the change persists.
  await card(page).locator('[data-consent-toggle="analytics"]').uncheck();
  await card(page).getByRole('button', { name: 'Save choices' }).click();
  const stored = await storedState(page);
  expect(stored.analytics).toBe('denied');
});

test('a v1 stored decision re-asks (inventory grew)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('wcp-consent', JSON.stringify({ v: 1, ads: 'granted', at: '' }));
  });
  await page.goto('/', { waitUntil: 'load' });
  await expect(card(page)).toBeVisible();
  expect(await page.locator(GTAG).count()).toBe(0);
});

for (const theme of ['light', 'dark'] as const) {
  test(`open card passes axe (${theme} mode)`, async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    if (theme === 'dark') {
      await page.evaluate(() => document.documentElement.classList.add('dark'));
    }
    await settle(page);
    await expect(card(page)).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      results.violations.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join('\n'),
    ).toEqual([]);
  });
}
