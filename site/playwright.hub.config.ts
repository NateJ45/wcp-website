import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE } from './tests/auth-file';

// SSR hub coverage. Unlike playwright.config.ts (which serves static
// dist/client), this boots a server that renders the gated /family-hub pages.
//
// The gate is CLOSED here, as in production. That splits this config in two:
//   - `gate` runs tests/hub-gate.spec.ts with NO stored session, asserting a
//     stranger is locked out of every hub surface.
//   - the content projects depend on `setup`, which signs in once with the
//     password from .dev.vars and saves the session to tests/.auth/family.json.
// (Before 2026-07-19 the middleware carried a HUB_OPEN bypass and these suites
// browsed straight in. Restoring the gate is what made the split necessary.)
//
// Uses `npm run preview` (wrangler), NOT `astro dev`: on this Astro 7 /
// Cloudflare stack `astro dev` always daemonizes to a detached background
// process and the launching CLI command exits immediately — Playwright's
// webServer reads that exit as a startup failure even though the server is
// actually up. `astro preview` runs wrangler in the foreground and serves
// the same SSR build, so it works as Playwright's webServer. Requires a
// fresh `npm run build` first (bundled into the command below).
export default defineConfig({
  testDir: './tests',
  testMatch: /(hub-(shell|home|sections|gate|pages)\.spec|hub-auth\.setup)\.ts$/,
  // 60s, not the usual 30s. The hub HOME page fans out to several external
  // origins server-side (Apps Script calendar, two gviz sheets, the store),
  // each with its own 8s timeout, and `cached()` cannot help on the first hit
  // of a fresh build. Under full-suite parallelism several workers request it
  // cold at the same moment and the slowest exceeded 30s, failing hub-home and
  // hub-shell with `page.goto` timeouts while every section page passed. It is
  // contention, not a regression — the same suite passes at --workers=1.
  // If this starts failing again, check the external origins before the code.
  timeout: 60_000,
  webServer: {
    command: 'npm run build && npm run preview',
    // The login page is the one hub route reachable without a session, so it is
    // the only safe readiness probe now the gate is closed.
    url: 'http://localhost:4321/family-hub/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...(process.env as Record<string, string>),
      // Drops the Secure flag from the session cookie for THIS server only (see
      // the long note in astro.config.mjs). preview serves the production build
      // over http://localhost, and WebKit will not send a Secure cookie over
      // http — without this the webkit-iphone project silently lands on the
      // login page for every test. Applies to the build too, since the cookie
      // config is baked in at build time.
      WCP_INSECURE_COOKIES: '1',
    },
  },
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    // Locked-out coverage. Deliberately no storageState.
    {
      name: 'gate',
      testMatch: /hub-gate\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], storageState: undefined },
    },

    // Signs in once; everything below reuses the cookie.
    {
      name: 'setup',
      testMatch: /hub-auth\.setup\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Chromium + a real WebKit iPhone profile — the gated hub is exactly what
    // parents open on their phones, so it gets Safari-engine coverage too. The
    // iPhone project runs the section-page checks (axe + header render); the
    // shell/home specs assert desktop-rail layout and drive their own viewports.
    {
      name: 'chromium',
      testMatch: /hub-(shell|home|sections|pages)\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
    {
      name: 'webkit-iphone',
      use: { ...devices['iPhone 14'], storageState: AUTH_FILE },
      // A Board-created page gets Safari coverage too: it is the route most
      // likely to rot unnoticed, and phones are where the hub is actually read.
      testMatch: /hub-(sections|pages)\.spec\.ts$/,
      grep: /renders an app header|renders through the catch-all/,
      dependencies: ['setup'],
    },
  ],
});
