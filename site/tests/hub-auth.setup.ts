import { expect, test as setup } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { AUTH_FILE } from './auth-file';

// =============================================================================
// Signs in once, saves the session cookie for the hub suites to reuse.
// =============================================================================
// Before the gate was restored, the hub specs browsed straight into
// /family-hub because the middleware had a HUB_OPEN bypass. Now they need a
// real session, so this setup project runs first (see `dependencies` in
// playwright.hub.config.ts) and writes storageState to tests/.auth/family.json.
// =============================================================================

/**
 * The shared password the preview server is actually running with.
 *
 * `astro preview` boots wrangler, which reads bindings from .dev.vars — so the
 * test has to use that same value rather than inventing one. An explicit
 * FAMILY_HUB_PASSWORD in the environment wins, which is how CI would supply it.
 */
function familyPassword(): string {
  const fromEnv = process.env.FAMILY_HUB_PASSWORD?.trim();
  if (fromEnv) return fromEnv;

  try {
    const raw = readFileSync(new URL('../.dev.vars', import.meta.url), 'utf8');
    const match = raw.match(/^\s*FAMILY_HUB_PASSWORD\s*=\s*"?([^"\r\n]*)"?/m);
    const value = match?.[1]?.trim();
    if (value) return value;
  } catch {
    // fall through to the explicit failure below
  }

  throw new Error(
    'No FAMILY_HUB_PASSWORD found. The hub suites need the same password the ' +
      'preview server is using: set it in .dev.vars or export it before running.',
  );
}

setup('sign in to the family hub', async ({ page, context }) => {
  await page.goto('/family-hub/login');
  await page.getByLabel('Family password').fill(familyPassword());
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Landing on the hub (not back on the login form) is the proof it worked.
  await expect(page).toHaveURL(/\/family-hub\/?$/);

  // Every seed below reads the live DOM, and every one of them fails SILENTLY
  // if the element is not attached yet: the note seeds nothing at all, the tour
  // seeds an empty version that can never match the real one, and the spotlight
  // map comes out empty. toHaveURL above polls the URL, which can flip while the
  // hub document is still arriving, so wait for the shell itself before reading
  // anything out of it. Getting this wrong raises no error here; it surfaces as
  // a one-shot overlay covering the shell in some later suite, which is how the
  // desktop-rail test failed on 2026-09-07 and again on 2026-09-09 even after
  // the note seeding below was added.
  await page.locator('.wcp-hub-canvas').waitFor({ state: 'attached' });

  // Mark the first-visit tour as seen, so its overlay never blocks the other
  // suites. tests/hub-tour.spec.ts clears this on purpose to test the tour.
  await page.evaluate(() => {
    const tour = document.querySelector('[data-tour-modal]');
    const version = tour?.getAttribute('data-tour-version') ?? '';
    localStorage.setItem('wcp-tour-seen', version);

    // Same treatment for any Board spotlight pop-up that is live: it renders on
    // EVERY hub page, so an undismissed one would overlay every other suite.
    // tests/hub-spotlight.spec.ts clears this on purpose to test the pop-up.
    const seen: Record<string, string> = {};
    for (const el of document.querySelectorAll('[data-spotlight-modal]')) {
      seen[el.getAttribute('data-spotlight-id') ?? ''] =
        el.getAttribute('data-spotlight-version') ?? '';
    }
    localStorage.setItem('wcp-spotlights-seen', JSON.stringify(seen));

    // And the President's letter, which was MISSED when this block was written.
    // note-modal.ts opens it 700ms after load on a first visit and it covers the
    // whole shell, so any suite that clicks shell chrome was racing that timer:
    // settle() waits on document.fonts.ready behind a 5s cap, so whether the
    // click landed first was luck. It cost hub-shell's drawer test (flaky, passed
    // on retry) and the desktop-rail test (failed outright) in CI on 2026-09-07,
    // both with "<div ...> from <main> subtree intercepts pointer events".
    //
    // Seeding it here rather than dismissing it per-test keeps ONE mechanism for
    // one-shot overlays, the same as the tour and the spotlight above — and it
    // covers tests nobody has written yet. tests/hub-tour.spec.ts clears these
    // on purpose and handles the note explicitly, so it is unaffected.
    const note = document.querySelector('[data-note-modal]');
    if (note) {
      localStorage.setItem(
        note.getAttribute('data-storage-key') ?? 'wcp-note-seen',
        note.getAttribute('data-version') ?? '',
      );
    }
  });

  await context.storageState({ path: AUTH_FILE });
});
