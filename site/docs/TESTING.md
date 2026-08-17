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

## Windows gotcha: mass 60s timeouts are the webServer REBUILDING, not the app

Diagnosed properly 2026-08-17 (two earlier versions of this note blamed the Playwright
webServer lifecycle, then "the local server degrades with request volume" — both wrong, and
both cost hours). The real cause: `playwright.hub.config.ts` has

    webServer: { command: 'npm run build && npm run preview', reuseExistingServer: !CI }

When nothing is listening on 4321, Playwright runs that command — a FULL rebuild, which now
also runs the two PDF generators in postbuild and launches Chromium twice more. The rebuild
wipes and repopulates `dist/`, so every page load during it fails, and the run burns ~9
minutes with almost every test timing out at 60s on `page.goto`.

Proof it is not the app: with a preview server already running, the same suite is
**115 passed in 53s**, and a bare Playwright script loads the hub home in ~500ms.

The recipe, and it is quick:

1. `npm run build` (add `WCP_INSECURE_COOKIES=1` so the WebKit project can send its cookie).
2. Start the server yourself: `WCP_INSECURE_COOKIES=1 npm run preview` — leave it running.
3. Run the suite. `reuseExistingServer` picks it up and the tests start immediately.

Diagnosing, in order:

- **Look at the run header.** `[WebServer] npm notice run build` means it is rebuilding —
  that is the whole problem, not a hint about the code.
- **Time a request yourself** while the suite fails: `curl -o /dev/null -w '%{time_total}'`
  against `/family-hub` with a session cookie. Fast server + failing tests = harness.
- **Never trust `cmd | tail` exit codes** — the pipe reports tail's exit, not Playwright's.
  Read `test-results/.last-run.json`.
- **Killing a backgrounded test task does NOT kill its process tree** on Windows. Orphaned
  playwright/wrangler/chromium processes then compete for port 4321 and for CPU. Clear them:
  `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine
-match 'playwright|wrangler|astro' }` then `taskkill /F /T /PID <id>`.
- WebKit-only failures that land on the login page are a different, documented trap: a dist
  built without `WCP_INSECURE_COOKIES=1` sets a Secure cookie WebKit will not send over http.
