# CLAUDE.md

Guidance for Claude Code (and any developer) working in this repo. Read this first.

## What this is

The **West Chester Preschool** website — a volunteer-run cooperative preschool site, migrated off Squarespace onto a self-hosted stack the board can edit themselves.

**Stack:** Astro 7 · Tailwind v4 · Sanity (headless CMS) · Cloudflare Workers. Node **≥ 22.12**.

The whole public site is a **Sanity page-builder**: non-technical volunteers log into the Studio and edit every page Squarespace-style (click-to-edit, add/reorder sections, build new pages) with no code changes. See [docs/PAGE_BUILDER.md](docs/PAGE_BUILDER.md).

## Keep the docs in sync — on every change

**A change is not done until the docs describing it match reality.** Treat documentation as part of the change, not a follow-up. On every add / remove / modify — a feature, file, command, config, secret, gotcha, section type, or field — before you consider the work finished:

1. **Update the affected markdown.** Grep the docs for anything the change touches and fix it in the same commit: this file (`CLAUDE.md`), [`README.md`](../README.md), and [`docs/`](docs/) (`PAGE_BUILDER.md`, `SANITY.md`, `FAMILY_HUB.md`). New gotcha → add it to the Gotchas list. New command / secret / route → update the relevant section.
2. **Update the in-Studio volunteer guide** ([`src/sanity/guides/content.ts`](src/sanity/guides/content.ts)) **whenever the change alters what a volunteer sees or does** — a new/removed/renamed section type, a changed field or workflow, a new editing surface. This is the Help & Guide a non-technical board member reads; stale steps there are worse than none. (Purely internal changes — refactors, build config, this kind of stega fix — don't need a guide edit, but consciously decide that each time.)

The point: never leave stale docs that could mislead a later developer, AI, or staff member. If you changed it, the docs (and the guide, when volunteer-facing) change with it.

## The mental model: two content paths

Everything here makes sense once you hold these two paths apart:

|                | **Public marketing site**                            | **Family Hub** (`/family-hub/**`)                |
| -------------- | ---------------------------------------------------- | ------------------------------------------------ |
| Rendering      | **Static** — prerendered to HTML at build time       | **SSR** — server-rendered per request            |
| Who sees it    | Everyone                                             | Enrolled families only (password gate)           |
| Content source | Sanity, read at **build time**                       | Sanity, read at **request time** behind the gate |
| Reader client  | `src/lib/cms.ts` (build env token)                   | `src/lib/sanity.ts` (Worker runtime token)       |
| Updates when   | The site **rebuilds** (webhook on publish, ~1-2 min) | Instantly (live read)                            |
| Docs           | [docs/PAGE_BUILDER.md](docs/PAGE_BUILDER.md)         | [docs/FAMILY_HUB.md](docs/FAMILY_HUB.md)         |

A third piece, the **Presentation preview** (`/preview/**`), is SSR + draft-aware (stega click-to-edit) and used only inside the Studio. It is `noindex` and never part of the static output.

## Commands

```sh
npm run dev          # astro dev (see gotcha: /studio is blank locally — spaces in path)
npm run build        # astro build → dist/client (static) + dist/server (Worker)
npm run check        # astro check (types) + oxlint
npm run format:check # prettier
npm test             # Playwright: smoke + axe a11y + 320px reflow (builds fresh, serves dist)
npm run check:links  # linkinator over dist/client
npm run deploy       # build + wrangler deploy -c dist/server/wrangler.json  (see gotcha)
```

**Before committing, the full local gate is:** `npx astro check` · `npm run lint` · `npm run format:check` · `npm run build` · `npm run check:links` · `npm test`. CI runs the same, plus a Lighthouse accessibility gate (must hold 100).

## Where things live

```
src/
  pages/
    [...slug].astro          # STATIC public pages — getStaticPaths() reads page docs from Sanity
    news/                    # blog: index + /page/[n] pagination, [slug] article, rss.xml
    events.astro             # public Events page (upcoming dated events)
    preview/[...slug].astro  # SSR draft preview for the Studio (prerender=false, noindex)
    preview/news/[slug].astro # SSR draft preview for a News post
    family-hub/**            # SSR gated hub pages
    api/                     # hub login/logout, draft-mode toggle
  components/
    sections/                # page-builder: SectionRenderer + one bridge per section type
    ui/, faq/, hub/, preview/
    *.astro                  # the ~30 shared presentational components sections render through
  sanity/
    schemaTypes/             # documents/, objects/, sections/, singletons/ + index.ts (registry)
    structure.ts             # the Studio left-nav a volunteer sees
    resolve.ts               # Presentation Tool location map (doc → /preview route)
    guides/content.ts        # in-Studio "Help & Guide" volunteer walkthroughs (plain-language)
  lib/
    cms.ts / sanity.ts / cms-preview.ts   # the three Sanity read clients (build / gated / preview)
    queries.ts               # all GROQ (PAGE_BY_SLUG_QUERY is the big page-builder projection)
    image.ts, portable-text.ts, nav.ts, utils.ts (withBase)
  data/                      # typed fallbacks (site.ts, nav.ts) used when Sanity has no value
scripts/
  migrate-pagebuilder.mjs    # idempotent: transcribes all pages + nav into Sanity (+ pagebuilder-lib.mjs)
docs/                        # PAGE_BUILDER.md, SANITY.md, FAMILY_HUB.md
```

## Conventions (follow these)

- **Brand-lock is non-negotiable.** The page-builder gives volunteers _content_ control (what sections, what order, text, photos) but **zero design control** — no color/font/spacing/layout fields. Bands are limited to background `white|grey|cream|navy` + seam/compact booleans; images require alt; icons are a validated dropdown. Never add a design knob to a section schema. This is what keeps volunteer-built pages on-brand and avoids the "AI slop" look.
- **Copy voice (visitor-facing text only):** no em-dashes, no ellipses. Short, warm, parent-centered. Avoid AI-tell words (delve, leverage, robust, seamless, nurturing, "not just X, it's Y"). Internal docs and code comments are exempt.
- **Accessibility is a hard gate.** Sections must keep their heading order (`SectionHeader as="h2"`, card `h3`) and `aria-labelledby` wiring, or the Lighthouse a11y score drops below 100 and CI fails. The Playwright a11y test runs axe's **default** rule set (not a wcag-only filter) on purpose — it catches the best-practice rules Lighthouse also checks.
- **Match the surrounding code.** Components are heavily commented with the _why_; keep that density. Tailwind v4 (CSS-first config in `src/styles/globals.css`), no `tailwind.config.js`.
- **Secrets never get committed.** `SANITY_TOKEN` lives in `.env` (build reads) and `.dev.vars` (Worker runtime) — both gitignored. `FAMILY_HUB_PASSWORD` is a Cloudflare secret. See [docs/SANITY.md](docs/SANITY.md).

## Gotchas (these have each cost real time)

- **`wrangler deploy` alone 404s every sub-route.** This is a hybrid static+SSR build; deploy with the adapter-generated config: `wrangler deploy -c dist/server/wrangler.json` (baked into `npm run deploy` and the Deploy workflow).
- **CI/Lighthouse builds need `SANITY_TOKEN`.** Since pages are CMS-driven, `getStaticPaths()` reads them from Sanity at build time — a tokenless build emits an empty site. All three workflows pass `secrets.SANITY_TOKEN`.
- **`/studio` is blank under `npm run dev`.** The project folder path contains spaces (`West Chester Preschool Website`), which breaks Vite's dev-time Studio module loading. **Dev-only** — the production build and hosted Studio are fine. To edit locally, use the deployed Studio or `npx sanity dev`.
- **Slug is a string + regex, not Sanity's `slug` type.** Sanity's slugify strips the slashes that `classes/twos` needs.
- **Never compare a stega-encoded string in logic.** In the `/preview` path, stega encodes ~1KB of invisible marker characters into every string so click-to-edit works, so `tone === 'navy'` is `false` on an encoded value and the component picks the wrong branch (this once rendered the navy CTA as cream in preview only). Dropdown/enum fields that drive rendering are excluded from stega via the `filter` in [`src/lib/cms-preview.ts`](src/lib/cms-preview.ts) — **add any new logic-driving enum field to that `NON_STEGA_FIELDS` list.** Display strings stay encoded (that is the point).
- **Trailing slash:** static `output` + directory format means `/about` → 307 → `/about/` → 200. Expected, not a bug.
- **Hero videos are gitignored** (`public/hero/*.mp4|webm`, belong in R2/Sanity), so they 404 on a clean build and the site degrades to the poster image. The link-check and tests skip them.
- **Windows-only:** local `lhci autorun` can exit 1 on an `EPERM` temp-cleanup crash even when the audit passed. Linux CI is the real Lighthouse gate.

## Deploy & CI

- **Repo:** `NateJ45/wcp-website` (private). **Live:** `wcp-website.nathanjnixon86.workers.dev`.
- **Workflows** (`.github/workflows/`): `ci.yml` (types, lint, format, build, links, Playwright), `lighthouse.yml` (a11y gate 100), `deploy.yml`.
- **Deploy triggers:** push to `main`, **or** a Sanity `repository_dispatch` webhook fired on publish (so CMS edits go live without a code push). Setup in [docs/SANITY.md](docs/SANITY.md).

## Deeper docs

- [docs/PAGE_BUILDER.md](docs/PAGE_BUILDER.md) — page-builder architecture (page doc, section palette, renderer, routing, migration).
- [docs/SANITY.md](docs/SANITY.md) — Sanity project, the Studio, secrets, the auto-deploy webhook.
- [docs/FAMILY_HUB.md](docs/FAMILY_HUB.md) — the gated family area and its password gate.
- [docs/ROLES.md](docs/ROLES.md) — Sanity roles/access (owner-only admin task); what the tiers allow.
