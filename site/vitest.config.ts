import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Mirror tsconfig's `@/*` → `src/*` path alias so modules under test that
    // import via `@/` (e.g. portable-text.ts) resolve outside Astro's build.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // `tests/` is Playwright's directory, but it uses `.spec.ts` exclusively —
    // so `*.test.ts` there is unambiguously a vitest file and cannot pull a
    // browser spec into the unit run. tests/fixtures.test.ts lives next to the
    // fixtures it guards rather than being exiled into src/ to satisfy a glob.
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
