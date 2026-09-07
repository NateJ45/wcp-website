import { defineConfig, devices } from '@playwright/test';
import { ADMIN_AUTH_FILE, AUTH_FILE } from './tests/auth-file';

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
// Serves the SSR build through scripts/preview-foreground.mjs.
//
// `astro dev` daemonizes, so Playwright's webServer reads its immediate exit as
// a startup failure. This file used to say `astro preview` avoided that by
// running wrangler in the foreground — TRUE WHEN WRITTEN, FALSE NOW: the
// current Astro daemonizes preview too and returns 0 straight away. The result
// was "Process from config.webServer exited early" and not one test running,
// which nobody noticed because CI never invoked this config at all
// (fixed 2026-09-06 — `npm run test:hub` is now a CI step).
//
// The wrapper starts the same server, waits for it to answer, holds the process
// open for Playwright, and stops the daemon afterwards so a killed run cannot
// leave a stale server feeding the next one an old build. Requires a fresh
// `npm run build` first (bundled into the command below).
export default defineConfig({
  testDir: './tests',
  testMatch:
    /(hub-(shell|home|sections|gate|pages|tour|hints|spotlight|classroom|org-chart|a11y)\.spec|hub-(auth|admin)\.setup)\.ts$/,
  // 60s, not the usual 30s. The hub HOME page fans out to several external
  // origins server-side (Apps Script calendar, two gviz sheets, the store),
  // each with its own 8s timeout, and `cached()` cannot help on the first hit
  // of a fresh build. Under full-suite parallelism several workers request it
  // cold at the same moment and the slowest exceeded 30s, failing hub-home and
  // hub-shell with `page.goto` timeouts while every section page passed. It is
  // contention, not a regression — the same suite passes at --workers=1.
  // If this starts failing again, check the external origins before the code.
  timeout: 60_000,
  // Cap the workers: everything here renders through ONE local workerd
  // isolate, and 8 workers × 2 browser projects of streaming SSR (each page
  // fanning out to Sanity + the external origins) starved it — pages that
  // render in ~1s idle streamed for 30s+ under the pile-up, and half the
  // suite failed on goto timeouts with the code healthy (2026-08-23). Four
  // keeps the wall clock close while staying under the collapse point.
  workers: 4,
  // Both of these are in playwright.config.ts and were missing here — this
  // config was written when nothing ran it, so the gap never showed.
  //
  // forbidOnly matters more than it looks. A stray `test.only` left in a hub
  // spec would silently reduce this suite to that one test in CI, including
  // hub-gate.spec.ts, which is the assertion that a stranger cannot reach any
  // family's address. That is the same shape as the bug this whole config was
  // just rescued from: a green tick over tests that did not run.
  forbidOnly: !!process.env.CI,
  // One retry in CI, matching playwright.config.ts. This is NOT here to paper
  // over product flakiness: the documented failure above is contention for
  // external origins (Apps Script, gviz, the store) on a cold build, which a
  // retry legitimately clears. If a hub test starts needing its retry
  // routinely, that is a signal to investigate, not to raise the number —
  // check the run summary for "flaky" before trusting a green.
  retries: process.env.CI ? 1 : 0,
  webServer: {
    // stage-dev-vars runs BETWEEN build and serve on purpose: wrangler resolves
    // `.dev.vars` next to the config it is given, so the worker cannot see
    // site/.dev.vars and needs a copy inside dist/server, which only exists
    // once the build has produced it.
    command:
      'npm run build && node scripts/stage-dev-vars.mjs && node scripts/seed-test-kv.mjs && node scripts/preview-foreground.mjs',
    // The login page is the one hub route reachable without a session, so it is
    // the only safe readiness probe now the gate is closed.
    url: 'http://localhost:4321/family-hub/login',
    // The wrapper stops any stale server, runs a FULL production build
    // (pagefind index, OG images, curriculum and supply PDFs) and only then
    // starts serving, so the readiness clock covers the build too. 120s was
    // enough when the build ran separately; it is not now, and the failure
    // reads as "Timed out waiting for config.webServer" rather than anything
    // about the build.
    reuseExistingServer: !process.env.CI,
    timeout: 420_000,
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
      testMatch:
        /hub-(shell|home|sections|pages|tour|hints|spotlight|classroom|org-chart)\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },

    // The gated hub's axe sweep. routes.ts covers the prerendered site only and
    // said SSR coverage would land "when the hub pages get their real content";
    // it has that content, and the gap let 1.14:1 text ship on 2026-09-06.
    {
      name: 'a11y-hub',
      testMatch: /hub-a11y\.spec\.ts$/,
      grep: /gated hub/,
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
    // Signs in a second time for the board-only screens.
    {
      name: 'admin-setup',
      testMatch: /hub-admin\.setup\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'a11y-admin',
      testMatch: /hub-a11y\.spec\.ts$/,
      grep: /board admin/,
      use: { ...devices['Desktop Chrome'], storageState: ADMIN_AUTH_FILE },
      dependencies: ['admin-setup'],
    },
    {
      name: 'webkit-iphone',
      use: { ...devices['iPhone 14'], storageState: AUTH_FILE },
      // A Board-created page gets Safari coverage too: it is the route most
      // likely to rot unnoticed, and phones are where the hub is actually read.
      testMatch: /hub-(sections|pages|tour)\.spec\.ts$/,
      grep: /renders an app header|renders through the catch-all|opens on the first visit/,
      dependencies: ['setup'],
    },
  ],
});
