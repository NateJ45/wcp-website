import { defineConfig } from '@playwright/test';

// Fast, hermetic unit tests for pure library code — no browser, no webServer,
// no build, no Sanity. Keeps logic-level coverage (e.g. the Portable Text
// heading-order normalizer) separate from the heavy build-and-serve e2e suites
// (playwright.config.ts / playwright.hub.config.ts). Run: npm run test:unit.
export default defineConfig({
  testDir: './tests',
  testMatch: /\.unit\.spec\.ts$/,
  reporter: 'list',
});
