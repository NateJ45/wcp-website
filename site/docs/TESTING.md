# Testing — which suite covers what

Four suites plus two CI-only gates. The split exists because the site is
hybrid: the STATIC public site and the SSR gated hub need different servers,
so they get different Playwright configs.

| Command               | Runner       | Serves                             | Covers                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`            | Playwright   | fresh build → static `dist/client` | Public site: smoke (every route 200 + real title), axe a11y light+dark, reflow at 320/768/1024/1440, availability badges, public interactions (nav dropdowns incl. the pointerdown outside-tap contract, hamburger, FAQ accordion; tabs/calculator/announcement tests self-skip until content places them). **Cannot reach `/family-hub/*`** (SSR, excluded in `tests/routes.ts`). |
| `npm run test:hub`    | Playwright   | fresh build → `wrangler` preview   | The gated hub: shell chrome, home dashboard (incl. the island-opacity regression test), every inner page — app header render, axe in light AND dark, 320px overflow.                                                                                                                                                                                                               |
| `npm run test:unit`   | Vitest       | nothing (pure functions)           | `src/**/*.test.ts` — date math, calendar parsing, count formatting, Portable Text normalizing, season/coop-hours logic, AQI tier copy. Milliseconds to run; put new pure logic here. A module that imports the SWR cache still tests fine — `vi.mock('@/lib/hub-cache')` keeps `cloudflare:workers` from loading (see `hub-air-quality.test.ts`).                                  |
| `npm run check:links` | linkinator   | existing `dist/client`             | Every internal link + asset in the built static site. Needs a real `npm run build` first (postbuild generates the OG images it checks).                                                                                                                                                                                                                                            |
| Lighthouse (CI only)  | lhci         | built site                         | Accessibility score MUST be 100, per route, both public and hub. The real gate is Linux CI — see gotchas.                                                                                                                                                                                                                                                                          |
| `npm run check`       | astro/oxlint | —                                  | Types + lint. Fast; run before anything else.                                                                                                                                                                                                                                                                                                                                      |

Both Playwright configs run TWO projects: `chromium` (Desktop Chrome) and
`webkit-iphone` (real WebKit engine, iPhone viewport) — so every UI test
executes twice, and genuine Safari-engine breakage surfaces locally.

## The gotchas (each has cost real time)

- **`test:hub` boots `npm run build && npm run preview` (wrangler), never
  `astro dev`.** On this Astro 7 + Cloudflare stack, `astro dev` daemonizes to
  a detached process and the launching command exits, which Playwright's
  `webServer` reads as a startup failure.
- **`toBeVisible()` counts `opacity: 0` as visible.** The reveal system hides
  via opacity, so island/reveal regressions must assert the COMPUTED style
  (see the regression test in `hub-home.spec.ts`), not visibility.
- **Keep axe on its DEFAULT rule set.** Narrowing to `.withTags(['wcag2a',...])`
  silently drops `target-size` (WCAG 2.2 SC 2.5.8) and the best-practice rules
  Lighthouse also checks.
- **webkit-iphone flakes on Windows** with `Target page, context or browser
has been closed` under full-suite load. Re-run the single test in isolation
  before treating it as real (`npx playwright test <spec> --project=webkit-iphone --grep "<name>"`).
- **Hero videos are gitignored**, so smoke/link tests skip them by design; a
  404 on `public/hero/*.mp4` locally is expected, not a failure.
- **Local `lhci autorun` can exit 1 on Windows** from an EPERM temp-cleanup
  crash even when the audit passed. Linux CI is the authoritative Lighthouse
  gate.
- **`settle()` in `tests/helpers.ts`** is the shared wait-for-quiet helper —
  use it instead of hand-rolled timeouts when a page streams islands.

## What to run when

- Touched pure logic in `src/lib/`? → `test:unit` (and add cases there, not in
  Playwright).
- Touched anything the public site renders? → `npm test`.
- Touched hub pages/chrome/scripts? → `test:hub`.
- Before committing a nontrivial change, the full local gate (from CLAUDE.md):
  `npx astro check` · `npm run lint` · `npm run format:check` ·
  `npm run build` · `npm run check:links` · `npm test` · `npm run test:unit`.
