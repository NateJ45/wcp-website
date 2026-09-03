/* ============================================================================
   Visual-regression config — SEPARATE from the main suite on purpose
   ============================================================================
   Screenshot baselines are platform-sensitive (font rasterisation differs
   between Windows and the Linux CI runners), so baselines are generated IN CI
   by .github/workflows/update-visual-baselines.yml and committed under
   tests/__screenshots__/. A local run on Windows will diff against Linux
   baselines and fail — that is expected; treat CI as the arbiter, same as the
   a11y sweeps. Regenerate baselines (workflow_dispatch) only when a visual
   change is INTENDED, in the same PR that causes it.
   ============================================================================ */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? ([['github'], ['list']] as const) : ([['list']] as const),
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      // Loose enough to ignore antialiasing shimmer, tight enough that a
      // moved band, lost doodle tile, or colour shift trips it.
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:4321',
    // Reduced motion freezes the reveal/scroll systems: content renders in
    // its resting state, which is exactly what a stable screenshot needs.
    // (A browser-context option, so it lives under contextOptions — at the
    // top level of `use` it is a type error, and silently did nothing.)
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run serve:dist',
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
  },
});
