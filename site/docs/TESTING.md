# Testing — which suite covers what

Four suites plus two CI-only gates. The split exists because the site is
hybrid: the STATIC public site and the SSR gated hub need different servers,
so they get different Playwright configs.

| Command               | Runner       | Serves                             | Covers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`            | Playwright   | fresh build → static `dist/client` | Public site: smoke (every route 200 + real title), axe a11y light+dark, reflow at 320/768/1024/1440, availability badges, public interactions (nav dropdowns incl. the pointerdown outside-tap contract, hamburger, FAQ accordion; tabs/calculator/announcement tests self-skip until content places them). **Cannot reach `/family-hub/*`** (SSR, excluded in `tests/routes.ts`).                                                                                                                                                                                                                                                                                     |
| `npm run test:hub`    | Playwright   | fresh build → `wrangler` preview   | The gated hub, in two halves. **`gate`** (`hub-gate.spec.ts`) runs with NO session and asserts every hub page, API endpoint and server island refuses an anonymous request, that the login page stays reachable, and that public pages are unaffected. **`chromium`/`webkit-iphone`** depend on a `setup` project that signs in once and saves `tests/.auth/family.json`, then cover shell chrome, home dashboard (incl. the island-opacity regression test), and every inner page — app header render, axe in light AND dark, 320px overflow.                                                                                                                         |
| `npm run test:unit`   | Vitest       | nothing (pure functions)           | `src/**/*.test.ts` — date math, calendar parsing, count formatting, Portable Text normalizing, season/coop-hours logic, AQI tier copy, **tuition math** (`tuition.test.ts`, pinned to the school's published annual totals) and **theme token contrast** (`theme-tokens.test.ts`, which parses `globals.css` and checks focus-ring/border/text pairs in BOTH themes — the one gate that can see focus-indicator contrast, since axe and Lighthouse cannot). Milliseconds to run; put new pure logic here. A module that imports the SWR cache still tests fine — `vi.mock('@/lib/hub-cache')` keeps `cloudflare:workers` from loading (see `hub-air-quality.test.ts`). |
| `npm run check:links` | linkinator   | existing `dist/client`             | Every internal link + asset in the built static site. Needs a real `npm run build` first (postbuild generates the OG images it checks).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Lighthouse (CI only)  | lhci         | built site                         | Accessibility score MUST be 100, per route, both public and hub. The real gate is Linux CI — see gotchas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `npm run check`       | astro/oxlint | —                                  | Types + lint. Fast; run before anything else.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

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
- **`/family-hub` (the HOME page only) can time out under parallel load.** It
  fans out to several external origins server-side — Apps Script calendar, two
  gviz sheets, the store — each with an 8s timeout, and the SWR cache is empty
  on the first hit of a fresh build. Several workers requesting it cold at once
  pushed past the old 30s limit and failed `hub-home` + `hub-shell` with
  `page.goto` timeouts, while every section page passed. The config now allows
  60s. If it recurs, confirm with `--workers=1` (which passes) before hunting
  for a code regression, and check whether an external origin is down.
- **A CMS read added to a shared `sections/*` component will hang the hub.**
  Those bridges render on the static public site AND the SSR hub, so a
  build-time `cmsFetch` becomes a per-request fetch there. Gate it behind a
  public-only prop — see `showFees` on `ClassCardsSection`.
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

## Windows gotcha: mass 60s timeouts from the hub suite's OWN webServer

Seen 2026-08-16, twice, deterministically: the full hub suite run the normal way
(Playwright builds and starts wrangler itself) had EVERY signed-in page render time out at
60s (~64 failures, ~34min), while every signed-out gate check, the sign-in setup, and the
API tests passed. The IDENTICAL dist served by a manually started `npm run preview` passed
the full suite in under a minute (`reuseExistingServer` picks it up on port 4321), and the
same pages were instant in a real browser and via curl. So the failures said nothing about
the code — the pathology lives in the Playwright-managed server lifecycle on Windows (a
fresh multi-thousand-file build immediately served, plus miniflare's per-session KV disk
writes, is exactly the shape antivirus scan-on-access punishes; unproven but the best fit —
both bad runs were late at night).

If the hub suite mass-times-out on signed-in pages while the gate project passes:

1. Don't debug the app first. Check the shape: gate green + content all-timeout = this.
2. Start the server yourself (`npm run preview`, after a fresh `npm run build`) and rerun —
   `reuseExistingServer` uses it. A green run this way is a valid verdict on the code: same
   dist, same wrangler command, only the spawner differs.
3. Also check the OTHER stale-server trap (a leftover process on 4321 serving old code) —
   `netstat -ano | findstr :4321` — and note that killing a backgrounded test task on
   Windows does NOT kill its playwright/wrangler process tree; orphans keep building and
   competing. `taskkill /F /T /PID <pid>` the tree.
4. Never trust `cmd | tail` exit codes for a verdict — the pipe reports tail's exit, not
   Playwright's. Read `test-results/.last-run.json`.
