# Testing — which suite covers what

Four suites plus two CI-only gates. The split exists because the site is
hybrid: the STATIC public site and the SSR gated hub need different servers,
so they get different Playwright configs.

| Command               | Runner       | Serves                             | Covers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | ------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`            | Playwright   | fresh build → static `dist/client` | Public site: smoke (every route 200 + real title), axe a11y light+dark, reflow at 320/768/1024/1440, availability badges, public interactions (nav dropdowns incl. the pointerdown outside-tap contract, hamburger, FAQ accordion; tabs/calculator/announcement tests self-skip until content places them). **Cannot reach `/family-hub/*`** (SSR, excluded in `tests/routes.ts`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `npm run test:hub`    | Playwright   | fresh build → `wrangler` preview   | The gated hub, in two halves. **`gate`** (`hub-gate.spec.ts`) runs with NO session and asserts every hub page, API endpoint and server island refuses an anonymous request, that the login page stays reachable, and that public pages are unaffected. **`chromium`/`webkit-iphone`** depend on a `setup` project that signs in once and saves `tests/.auth/family.json`, then cover shell chrome, home dashboard (incl. the island-opacity regression test), the DERIVED class pages (`hub-classroom.spec.ts` — each classroom renders at its shipped address with a fact card per class, each old per-class address still redirects there, the rail shows one link per classroom rather than one per class, the class list the personalization reads is published, and a made-up class address 404s), the DERIVED org chart (`hub-org-chart.spec.ts` — the chart's columns come from the seats' reporting REFERENCES, so a healthy dataset shows a "Reports to <officer>" column per officer and NO "Other roles" catch-all; one class-rep card per live class from the single per-class seat; and every "Reports to" tag on the job list names a role that still exists), the Board's spotlight pop-ups (`hub-spotlight.spec.ts` — CONTENT-DEPENDENT: the no-spotlight contract always runs, the paging / dismissal / axe / 320px checks `test.skip` themselves when the dataset has none switched on, and the pure selection rules live in `src/lib/hub-spotlight.test.ts` instead), and every inner page — app header render, axe in light AND dark, 320px overflow. |
| `npm run test:unit`   | Vitest       | nothing (pure functions)           | `src/**/*.test.ts` — date math, calendar parsing, count formatting, Portable Text normalizing, season/coop-hours logic, AQI tier copy, **tuition math** (`tuition.test.ts`, pinned to the school's published annual totals) and **theme token contrast** (`theme-tokens.test.ts`, which parses `globals.css` and checks focus-ring/border/text pairs in BOTH themes — the one gate that can see focus-indicator contrast, since axe and Lighthouse cannot). Milliseconds to run; put new pure logic here. A module that imports the SWR cache still tests fine — `vi.mock('@/lib/hub-cache')` keeps `cloudflare:workers` from loading (see `hub-air-quality.test.ts`). The seven `preview-*.test.ts` suites (2026-08-28) are a **fork of the canonical suites** in `ncs-astro-sanity-starter`: only the runner import changed (`node:test` → `vitest`), the assertions stay on `node:assert/strict`, and every case is otherwise byte-identical — so re-syncing them is a copy plus that one edit. They carry no PORTABLE marker for exactly that reason. `sanity-path.test.ts` and `inline-rich-write.test.ts` (2026-08-28, cards 28 + 28b) cover canonical modules too, but they are this repo's OWN suites rather than forks - the starter's versions test the starter's array names and its single-paragraph default, and this schema has one array and keeps its lines. Unmarked, for the same reason.                                                                                                                                                               |
| `npm run check:links` | linkinator   | existing `dist/client`             | Every internal link + asset in the built static site. Needs a real `npm run build` first (postbuild generates the OG images it checks).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Lighthouse (CI only)  | lhci         | built site                         | Accessibility score MUST be 100, per route, both public and hub. The real gate is Linux CI — see gotchas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `npm run check`       | astro/oxlint | —                                  | Types + lint. Fast; run before anything else.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `npm run typegen`     | Sanity CLI   | —                                  | Regenerates `src/lib/sanity.types.ts` from the Studio schema. CI runs it and fails on a diff — see "Stale Sanity types" below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

Both Playwright configs run TWO projects: `chromium` (Desktop Chrome) and
`webkit-iphone` (real WebKit engine, iPhone viewport) — so every UI test
executes twice, and genuine Safari-engine breakage surfaces locally.

## The gotchas (each has cost real time)

- **`test:hub` boots `npm run build && npm run preview` (wrangler), never
  `astro dev`.** On this Astro 7 + Cloudflare stack, `astro dev` daemonizes to
  a detached process and the launching command exits, which Playwright's
  `webServer` reads as a startup failure.
- **`playwright.hub.config.ts`'s `testMatch` is an ALLOW-LIST.** A new spec file
  under `tests/` silently does not run until its name is added to BOTH the
  top-level `testMatch` and the `chromium` project's.
- **A pop-up that renders on every hub page must be marked seen in
  `hub-auth.setup.ts`.** The first-visit tour and the Board's spotlight pop-ups
  both do this: an undismissed overlay in the shared storage state would cover
  every other hub suite. Their own specs clear the mark on purpose.
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
- **Every hub page timing out at once is the MACHINE, not the code.** On a
  loaded Windows box (a browser with many tabs, a pile of MCP servers) the whole
  suite fails with `page.goto` timeouts on pages nothing has touched. The
  giveaway is a Playwright worker dying with `code=3221225794` — Windows
  `STATUS_DLL_INIT_FAILED`, meaning the box could not spawn another process.
  Close what you can and re-run; this is not a code regression, and chasing it
  as one costs hours (2026-08-29).
- **Only the calendar and directory pages timing out is GOOGLE THROTTLING, not
  the code.** Those are the two pages that fan out to Google origins
  server-side (the Apps Script calendar feed, the gviz sheets), and a heavy
  suite run hammers those origins from this IP for half an hour. Run the suite
  again immediately after and every visit to exactly those two routes times
  out while all other routes pass — the throttled response hangs the SSR
  render past the 60s goto limit. Measured 2026-08-29: 45/130 under load,
  120/130 minutes later (the 10 failures all on those two routes), 130/130
  after a quiet gap, same build all three times. The tell is per-ROUTE
  determinism plus a plain `curl` of the same route answering in well under a
  second: if curl is fast and only the Google-fanout pages fail, wait ten
  minutes and re-run before touching anything.
  **Prove the renderer is fine in about a minute, before you go hunting.** Sign
  in over `fetch` (POST `/api/hub-login`, keep the `astro-session` cookie) and
  pull several hub pages at once against the running preview. A healthy build
  answers each in ~130-250ms with a full body (~180-210KB), and keeps doing so
  under six concurrent requests and after the board-content cache goes stale at
  the 5-minute mark. If that is clean, the SSR path is clean and the failures
  are the harness. A stalling page returns its 200 and then sends ZERO bytes, so
  check the BODY LENGTH, not the status.
  Running the suite against a server you started yourself (`reuseExistingServer`
  is on locally) narrows the variables — but **build with
  `WCP_INSECURE_COOKIES=1` too**, not just the preview. It is baked in at build
  time, and a build without it sends a `Secure` session cookie that WebKit will
  not return over `http://localhost`, so every `webkit-iphone` test fails on a
  missing `h1#hub-page-title` and looks like a real bug.
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

## Uptime check (production, added 2026-08-27)

`.github/workflows/uptime.yml` curls four key pages on the live site every
hour and fails the run if any answers something other than 200. A failed run
notifies you through GitHub. It is the only check that watches PRODUCTION;
every suite above tests a local build.

To arm it, set the `SITE_URL` repo variable to the live origin
(`https://wcp-website.nathanjnixon86.workers.dev` today). Without the variable
the job warns and exits 0, so it never false-alarms.

WARNING: keep the trailing slash on each path in that workflow. This is a
static build with directory-format output, so `/tuition` answers 307 and only
`/tuition/` answers 200.

GitHub's scheduler is best-effort and can run late. For real monitoring, also
point a dedicated service (UptimeRobot's free tier is enough) at the homepage.

## Stale Sanity types (CI guard, added 2026-08-27)

`npm run typegen` does two steps. It extracts the Studio schema to
`schema.json`, then generates TypeScript types into
`src/lib/sanity.types.ts`. The types are COMMITTED; `schema.json` is
gitignored (a large machine artifact nobody reads).

The CI `build` job runs typegen and then fails if the committed types moved.
A red step there means one thing: someone changed a schema type and did not
regenerate. Fix it in two steps.

1. Run `npm run typegen` in `site/`.
2. Commit `src/lib/sanity.types.ts` with the schema change.

Notes:

- The queries in `src/lib/queries.ts` do NOT use these types today. The guard
  still has value: it proves the committed types describe the real schema, so
  the types are safe to adopt later.
- The extract step needs `--workspace public`. This Studio has TWO workspaces
  (`public`, `family-hub`) over one dataset, and the CLI refuses to guess.
  Both workspaces register the SAME `schemaTypes` array, so one extract covers
  every type.
- `sanity typegen generate` reads `sanity-typegen.json`, not `sanity.cli.ts`.
  Sanity 6.4 has no `typegen` block in the CLI config.
- Typegen prints "Encountered errors in N files" for files it cannot parse for
  GROQ. That is a warning, it exits 0, and it does not affect the schema types.

## Parity verification (`scripts/page-parity.mjs`, added 2026-08-27)

A rendered-HTML parity harness, back-ported from the presacademy repo. Use it
when a refactor must not change the output: capture the built HTML of every
prerendered public route, refactor, rebuild, compare. Any diff is either real
drift or a value that genuinely varies between builds.

    npm run build
    node scripts/page-parity.mjs capture     # 27 snapshots -> scripts/.parity/
    ...refactor...
    npm run build
    node scripts/page-parity.mjs compare     # PASS/DIFF per page, exit 1 on any diff
    node scripts/page-parity.mjs compare tuition   # one page

Facts to know:

- The script NEVER builds. You build. Use `npm run build`, never bare
  `astro build`: the postbuild hook (Pagefind, OG cards, Instagram re-host)
  rewrites `dist/client` HTML, so a bare-build baseline diffs against every
  real build.
- The route list comes from `tests/routes.ts`, the same source the Playwright
  sweeps use. Add a route there and the harness picks it up.
- Snapshots in `scripts/.parity/*.html` ARE COMMITTED. They are the baseline.
  Re-capture only when you intend to move it, and say so in the commit message.
- The normalizer strips build-varying values only: `/_astro/` content hashes,
  Astro scoped-style hashes, island hydration prefixes, between-tag whitespace,
  and the Instagram tile grid. Every rule and its reason is in the file header.
- The Instagram grid (`wcp-ig-grid`, home page only) is EXCLUDED because it is
  live third-party data read at build time. The exclusion is narrow: the
  section wrapper, heading, CTA and lightbox all still compare byte-for-byte.
- Proof it works: build, capture, rebuild, compare gave **27/27 PASS**
  (2026-08-27).

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

A second finding (2026-08-17, evening): the preview server ALSO decays under sustained
BROWSER traffic on this machine — after a few minutes of Playwright load, the document
response stalls for browser connections while curl stays instant, and a bare Playwright
`goto` hangs on pages that loaded in ~1s on a fresh server. Restarting the server fixes it
every time. So the working recipe is per-RUN, not per-session:

The recipe, and it is quick:

1. `npm run build` (add `WCP_INSECURE_COOKIES=1` so the WebKit project can send its cookie).
2. Start the server yourself: `WCP_INSECURE_COOKIES=1 npm run preview` — leave it running.
3. Run the suite immediately. `reuseExistingServer` picks the server up.
4. Between runs, restart the server (kill the PID on 4321, `npm run preview` again). A
   degraded server shows the same mass-timeout shape as the rebuild trap.

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

Parity gotcha: compare only against a plain `npm run build`. The Playwright
webServer rebuilds dist with fake tracker ids (consent card env), which adds
the footer cookie button and DIFFs every page against the plain-build
baselines.
