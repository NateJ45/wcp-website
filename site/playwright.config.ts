import { defineConfig, devices } from '@playwright/test';

// =============================================================================
// Playwright config — automates the QA that was being done by hand
// =============================================================================
// Tests run against the REAL production build (dist/client) served statically,
// not `astro dev` — the Cloudflare workerd dev runtime is flakier and can serve
// error pages that a naive check would read as "fine". Fresh build + no-cache
// serve each run avoids stale-CSS false results.
// =============================================================================

const PORT = 4321;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  // The hub specs need the SSR /family-hub routes, which don't exist in this
  // static dist/client serve — they have their own config
  // (playwright.hub.config.ts).
  testIgnore: ['hub-shell.spec.ts', 'hub-home.spec.ts', 'hub-sections.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    // The webServer build below enables the cookie-consent card (a test-only
    // PUBLIC_GADS_ID). On a fresh profile it would overlay every page and
    // perturb the 200-odd existing tests, so the general suites run with a
    // pre-stored "denied" decision — the normal browsing state once a visitor
    // has answered. consent.spec.ts opts back out (empty storageState) to
    // exercise the card itself, including its own axe light+dark scans.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: baseURL,
          localStorage: [
            {
              name: 'wcp-consent',
              value: JSON.stringify({
                v: 2,
                analytics: 'denied',
                marketing: 'denied',
                at: '2026-01-01T00:00:00.000Z',
              }),
            },
          ],
        },
      ],
    },
  },
  // Chromium + a real WebKit iPhone profile (borrowed from GovSoft's
  // go-for-launch playbook): most WCP parents browse on iPhones, and Safari's
  // engine finds layout/JS issues Chromium never will. The iPhone project
  // runs the viewport-agnostic suites (smoke + axe); reflow drives its own
  // viewport sizes, which conflicts with mobile emulation.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'webkit-iphone',
      use: { ...devices['iPhone 14'] },
      testMatch: /(smoke|a11y)\.spec\.ts$/,
    },
  ],
  webServer: {
    command: 'npm run build && npm run serve:dist',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Syntactically-valid fake tracker ids so the consent card renders with
    // BOTH toggle rows in test builds and its suite (consent.spec.ts) can
    // cover the per-category behavior. No tracker loads in tests that don't
    // grant a category.
    env: {
      ...(process.env as Record<string, string>),
      PUBLIC_GA_ID: 'G-0000TEST00',
      PUBLIC_GADS_ID: 'AW-0000TEST00',
      PUBLIC_META_PIXEL_ID: '1234567890123456',
    },
  },
});
