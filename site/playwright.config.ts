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
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run serve:dist',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
