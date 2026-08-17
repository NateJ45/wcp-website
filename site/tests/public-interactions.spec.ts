import { test, expect } from '@playwright/test';
import { settle } from './helpers';

// =============================================================================
// Public-site interactions — the scripted behaviors a visitor actually uses
// =============================================================================
// Runs against the static dist/client serve like the rest of this suite, with
// NO network: /api/availability (an SSR-only route that doesn't exist in the
// static serve) is mocked to an empty feed so pages that hydrate badges or a
// waitlist bar stay deterministic. Each test reads the real DOM contract the
// scripts wire (data-* hooks + aria state) and asserts COMPUTED visibility
// where the hiding is geometric (the FAQ grid-rows collapse) — attributes
// alone would have missed the 2026-07-17 :has()-fallback regression.
//
// This spec runs in the chromium project only (webkit-iphone matches
// smoke|a11y), so the hamburger test emulates a phone viewport inline.
// Content is CMS-driven: the tuition calculator and announcement bars only
// exist when the Board places them, so those tests detect absence and skip
// with a reason instead of failing a fresh build.
// =============================================================================

test.beforeEach(async ({ page }) => {
  await page.route('**/api/availability', (route) =>
    route.fulfill({ contentType: 'application/json', body: '[]' }),
  );
});

// -----------------------------------------------------------------------------
// Desktop nav dropdown (src/scripts/nav.ts + NavList.astro)
// -----------------------------------------------------------------------------
test('desktop dropdown opens on click, closes on outside pointerdown and Escape', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await settle(page);

  // The big overlay header is the visible nav at scroll 0 (the compact bar is
  // in the DOM but off-screen). Resolve the menu through aria-controls instead
  // of hardcoding its index — the CMS Menus doc controls item order.
  const trigger = page.locator('[data-big-header] [data-dropdown-trigger]', {
    hasText: 'Classes',
  });
  const menuId = await trigger.getAttribute('aria-controls');
  expect(menuId, 'Classes trigger carries aria-controls').toBeTruthy();
  const menu = page.locator(`#${menuId}`);

  // Closed by default (visibility:hidden until data-open).
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeHidden();

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeVisible();
  await expect(menu.locator('a').first()).toBeVisible();

  // Outside dismissal listens on pointerdown, not click: iOS Safari never
  // synthesizes a bubbling click for taps on plain text/background. Dispatch
  // ONLY pointerdown (no click follows) to prove the fixed path — this fails
  // against a click-based listener the way a real iOS outside-tap did.
  await page.locator('h1').first().dispatchEvent('pointerdown');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeHidden();

  // Escape closes and leaves focus on the trigger button.
  await trigger.click();
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

// -----------------------------------------------------------------------------
// Mobile hamburger menu (src/scripts/nav.ts, the < lg header bar)
// -----------------------------------------------------------------------------
test('mobile hamburger opens the nav panel and the toggle closes it again', async ({ page }) => {
  // iPhone-ish viewport (< lg breakpoint) so the mobile bar renders.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await settle(page);

  const toggle = page.locator('[data-nav-toggle]');
  const panel = page.locator('#mobile-nav');
  await expect(panel).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();
  // Focus moves into the panel on open (its first link).
  await expect(panel.locator('a').first()).toBeFocused();

  // The SAME button is the close affordance (hamburger swaps to an X); there
  // is no separate [data-nav-close] element in the current header markup.
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
});

// -----------------------------------------------------------------------------
// FAQ accordion (/faq — src/scripts/faq.ts + Faq.astro grid-rows collapse)
// -----------------------------------------------------------------------------
test('faq question opens its answer and closes it again', async ({ page }) => {
  await page.goto('/faq/', { waitUntil: 'domcontentloaded' });
  await settle(page);

  const item = page.locator('[data-faq-item]').first();
  const trigger = item.locator('[data-faq-trigger]');
  const answer = item.locator('[role="region"]');
  // COMPUTED geometry, not just aria state: the collapse is grid-template-rows
  // 0fr behind `.js` + @supports :has() — this regression-guards the
  // 2026-07-17 fix where a bare 0fr left answers permanently invisible.
  const answerHeight = () => answer.evaluate((el) => el.getBoundingClientRect().height);

  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(await answerHeight()).toBeLessThan(1);

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(answer).toBeVisible(); // non-zero box = actually rendered open
  await expect.poll(answerHeight).toBeGreaterThan(20);

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(answerHeight).toBeLessThan(1);
});

// -----------------------------------------------------------------------------
// Tabs section (src/scripts/tabs.ts + TabsSection.astro)
// -----------------------------------------------------------------------------
// No public page currently places a tabsSection (verified 2026-07-17: zero
// [data-tabs] across the built dist/client). The body below is ready — set
// TABS_ROUTE to the page's route when the Board adds one ('' = none yet).
const TABS_ROUTE = '';

test('tabs switch the visible panel on click', async ({ page }) => {
  test.skip(
    !TABS_ROUTE,
    'No public page renders a tabsSection yet (CMS-driven); set TABS_ROUTE in this spec when one ships.',
  );
  await page.goto(TABS_ROUTE, { waitUntil: 'domcontentloaded' });
  await settle(page);

  const tabs = page.locator('[data-tabs]').first();
  const tabButtons = tabs.locator('[role="tab"]');
  const panels = tabs.locator('[role="tabpanel"]');
  expect(await tabButtons.count()).toBeGreaterThan(1);

  // First tab active by default; only its panel is shown.
  await expect(tabButtons.first()).toHaveAttribute('aria-selected', 'true');
  await expect(panels.first()).toBeVisible();
  await expect(panels.nth(1)).toBeHidden();

  await tabButtons.nth(1).click();
  await expect(tabButtons.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabButtons.first()).toHaveAttribute('aria-selected', 'false');
  await expect(panels.nth(1)).toBeVisible();
  await expect(panels.first()).toBeHidden();
});

// -----------------------------------------------------------------------------
// Tuition calculator (/tuition — src/scripts/tuition-calculator.ts)
// -----------------------------------------------------------------------------
test('tuition calculator updates the monthly total when a class is ticked', async ({ page }) => {
  await page.goto('/tuition/', { waitUntil: 'domcontentloaded' });
  await settle(page);

  const calc = page.locator('[data-tuition-calc]');
  test.skip(
    (await calc.count()) === 0,
    'The tuition page does not currently place a tuitionCalculatorSection (CMS-driven); this activates when the Board adds one.',
  );

  const firstClass = calc.locator('[data-calc-class]').first();
  const monthlyOut = calc.locator('[data-calc-monthly]');
  const emptyPrompt = calc.locator('[data-calc-empty]');

  // Nothing ticked: $0 total and the "tick a class" prompt shows.
  await expect(monthlyOut).toHaveText('$0');
  await expect(emptyPrompt).toBeVisible();

  // Tick the first class: the total becomes its data-monthly price, formatted
  // the same way the script formats it ($ + en-US grouping).
  const price = Number((await firstClass.getAttribute('data-monthly')) ?? '0');
  expect(price).toBeGreaterThan(0);
  await firstClass.check();
  await expect(monthlyOut).toHaveText(`$${Math.round(price).toLocaleString('en-US')}`);
  await expect(emptyPrompt).toBeHidden();

  // Untick: back to the resting state.
  await firstClass.uncheck();
  await expect(monthlyOut).toHaveText('$0');
  await expect(emptyPrompt).toBeVisible();
});

// -----------------------------------------------------------------------------
// Instagram lightbox (src/scripts/social-lightbox.ts + InstagramSection.astro)
// -----------------------------------------------------------------------------
test('instagram tile opens the in-page viewer, next advances, Escape closes', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await settle(page);

  // Tiles are feed/CMS-driven; a tokenless build with no fallback album has
  // none — skip rather than fail (matches the calculator/announcement style).
  const tiles = page.locator('[data-wall-item]');
  test.skip(
    (await tiles.count()) === 0,
    'No Instagram tiles in this build (feed/CMS-driven); this activates when the band has content.',
  );

  const dialog = page.locator('[data-wall-lightbox]');
  const img = dialog.locator('[data-wall-lb-img]');
  await expect(dialog).toBeHidden();

  // Tiles stay REAL Instagram links for no-JS visitors.
  expect(await tiles.first().getAttribute('href')).toMatch(/^https?:\/\//);

  // Plain click is intercepted and opens the native <dialog> viewer.
  await tiles.first().click();
  await expect(dialog).toBeVisible();
  const firstSrc = await img.getAttribute('src');
  expect(firstSrc, 'viewer shows the tile media').toBeTruthy();

  // Next advances to a different post when the band has more than one tile
  // (image src changes, or an inline video swaps in for a reel).
  if ((await tiles.count()) > 1) {
    await dialog.locator('[data-wall-next]').click();
    const video = dialog.locator('[data-wall-lb-video]');
    await expect
      .poll(async () =>
        (await video.isVisible()) ? 'video' : ((await img.getAttribute('src')) ?? ''),
      )
      .not.toBe(firstSrc);
  }

  // Native dialog behavior: Escape closes the viewer.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

// -----------------------------------------------------------------------------
// Announcement bar dismissal (src/scripts/announcement-bars.ts)
// -----------------------------------------------------------------------------
test('announcement bar dismisses and stays dismissed after reload', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await settle(page);

  // Bars are CMS-scheduled and absent from a build with none in window —
  // detect and skip rather than fail (a fresh build legitimately has zero).
  const bars = page.locator('[data-ann]');
  test.skip(
    (await bars.count()) === 0,
    'No announcement bar in this build (CMS-driven, none scheduled); this activates when the Board publishes one.',
  );
  const visibleBar = page.locator('[data-ann]:not([hidden])').first();
  test.skip(
    (await visibleBar.count()) === 0,
    'Announcement bars exist but none is inside its show window right now.',
  );

  const id = await visibleBar.getAttribute('data-ann');
  await expect(visibleBar).toBeVisible();
  await visibleBar.locator('[data-ann-dismiss]').click();
  await expect(visibleBar).toBeHidden();

  // Dismissal is remembered per bar (localStorage keyed by id + window start).
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator(`[data-ann="${id}"]`)).toBeHidden();
});

test.describe('mailto fallback — a click with no mail app never ends in silence', () => {
  // Headless Chromium has no mailto handler, which makes it the exact stand-in
  // for a visitor with no default mail app: the click does nothing, the page
  // keeps focus, and the script must copy the address and say so.
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('a labeled email button pops the Copied! token', async ({ page, browserName }) => {
    // Clipboard permissions are a Chromium-only Playwright API.
    test.skip(browserName !== 'chromium', 'clipboard permissions are chromium-only here');

    await page.goto('/enroll/', { waitUntil: 'load' });
    await settle(page);

    const button = page.locator('a[href^="mailto:"]', { hasText: /email us/i }).first();
    await button.scrollIntoViewIfNeeded();
    await button.click();

    // The token waits ~1.2s to be sure no mail app took the click.
    const toast = page.locator('.wcp-copy-toast.is-shown');
    await expect(toast).toBeVisible({ timeout: 4000 });
    await expect(toast).toHaveText(/Copied!|westchesterpreschool\.org/);

    // And the address really is on the clipboard.
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('@westchesterpreschool.org');
  });
});
