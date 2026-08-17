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

  // Mark the first-visit tour as seen, so its overlay never blocks the other
  // suites. tests/hub-tour.spec.ts clears this on purpose to test the tour.
  await page.evaluate(() => {
    const tour = document.querySelector('[data-tour-modal]');
    const version = tour?.getAttribute('data-tour-version') ?? '';
    localStorage.setItem('wcp-tour-seen', version);
  });

  await context.storageState({ path: AUTH_FILE });
});
