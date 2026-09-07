import { expect, test as setup } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ADMIN_AUTH_FILE } from './auth-file';

// =============================================================================
// Signs in twice — family, then board — and saves that session separately.
// =============================================================================
// /family-hub/admin sits behind BOTH gates: the shared family password gets you
// into the hub, and a second board-only password gets you into editing. The
// ordinary hub suites deliberately do not carry this session: a test that can
// rewrite the directory by accident is a test that can destroy it.
// =============================================================================

/** Read a password the preview server is actually running with. */
function secret(name: string): string {
  const fromEnv = process.env[name]?.trim();
  if (fromEnv) return fromEnv;
  try {
    const raw = readFileSync(new URL('../.dev.vars', import.meta.url), 'utf8');
    const value = raw.match(new RegExp(`^\s*${name}\s*=\s*"?([^"\r\n]*)"?`, 'm'))?.[1]?.trim();
    if (value) return value;
  } catch {
    /* fall through to the explicit failure below */
  }
  // Deliberately throws rather than skipping. A skipped auth setup would make
  // every admin a11y test silently pass, which is the failure mode this whole
  // sweep exists to close.
  throw new Error(
    `No ${name} found. The admin suite needs the same value the preview server ` +
      'is using: set it in .dev.vars or export it before running.',
  );
}

setup('sign in to the board admin', async ({ page, context }) => {
  await page.goto('/family-hub/login');
  await page.getByLabel('Family password').fill(secret('FAMILY_HUB_PASSWORD'));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/family-hub\/?$/);

  await page.goto('/family-hub/admin');
  // The middleware bounces an unauthorised visitor to the admin login.
  await expect(page).toHaveURL(/\/family-hub\/admin\/login/);
  await page.getByLabel('Board password').fill(secret('FAMILY_HUB_ADMIN_PASSWORD'));
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Landing on the admin, not back on its login form, is the proof.
  await expect(page).toHaveURL(/\/family-hub\/admin\/?$/);
  await context.storageState({ path: ADMIN_AUTH_FILE });
});
