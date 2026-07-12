import { defineConfig, devices } from '@playwright/test';

// SSR hub coverage. Unlike playwright.config.ts (which serves static
// dist/client), this boots a server that renders the gated /family-hub
// pages. The hub gate is open in preview (HUB_OPEN = true).
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
  testMatch: 'hub-shell.spec.ts',
  timeout: 30_000,
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321/family-hub',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:4321' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
