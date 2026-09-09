import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Mirror tsconfig's `@/*` → `src/*` path alias so modules under test that
    // import via `@/` (e.g. portable-text.ts) resolve outside Astro's build.
    // `cloudflare:workers` is a Worker-runtime module with no Node resolution.
    // The stub lets a unit test import hub-cache directly (see its header).
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'cloudflare:workers': fileURLToPath(
        new URL('./src/lib/test-stubs/cloudflare-workers.ts', import.meta.url),
      ),
    },
  },
  test: {
    // `tests/` is Playwright's directory, but it uses `.spec.ts` exclusively —
    // so `*.test.ts` there is unambiguously a vitest file and cannot pull a
    // browser spec into the unit run. tests/fixtures.test.ts lives next to the
    // fixtures it guards rather than being exiled into src/ to satisfy a glob.
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
