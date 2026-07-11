# West Chester Preschool website

The website for West Chester Preschool, a volunteer-run cooperative preschool. Migrated
off Squarespace onto a self-hosted stack the board can edit themselves.

**Live:** https://wcp-website.nathanjnixon86.workers.dev

## Stack

- **[Astro 7](https://astro.build)** — static site generation + server routes
- **[Sanity](https://www.sanity.io)** — headless CMS and page builder (the board's editor)
- **[Tailwind v4](https://tailwindcss.com)** — styling (CSS-first, no config file)
- **[Cloudflare Workers](https://workers.cloudflare.com)** — hosting (static assets + the gated SSR routes)

Node **≥ 22.12**. The app lives in [`site/`](site/).

## Two halves

- **Public marketing site** — a Sanity **page builder**. Every page is a CMS document a
  volunteer composes from a palette of sections, prerendered to static HTML. No code
  changes to add or edit a page. See [`site/docs/PAGE_BUILDER.md`](site/docs/PAGE_BUILDER.md).
- **Family Hub** (`/family-hub/**`) — a private, password-gated area for enrolled
  families, server-rendered per request so private content never touches the public site
  or git. See [`site/docs/FAMILY_HUB.md`](site/docs/FAMILY_HUB.md).

## Quick start

```sh
cd site
npm install
npm run dev          # http://localhost:4321
```

You will need a `.env` (build-time Sanity token) and `.dev.vars` (Worker runtime secrets)
— both gitignored. See [`site/docs/SANITY.md`](site/docs/SANITY.md) and
[`site/.dev.vars.example`](site/.dev.vars.example).

> Note: `/studio` is blank under `npm run dev` because this folder's path contains spaces.
> That is dev-only; the deployed Studio works. Details in the docs.

## Common commands (run in `site/`)

```sh
npm run build        # static build → dist/
npm run check        # types (astro check) + lint (oxlint)
npm test             # Playwright: smoke + accessibility + 320px reflow
npm run deploy       # build + deploy to Cloudflare
```

## Deploy

Pushes to `main` deploy automatically. Publishing in the Sanity Studio also triggers a
rebuild via a webhook, so content edits go live (~1-2 min) with no code push. CI runs
type-check, lint, format, build, link-check, Playwright, and a Lighthouse accessibility
gate. See [`.github/workflows/`](.github/workflows/).

## Documentation

- **[`site/CLAUDE.md`](site/CLAUDE.md)** — the developer/agent orientation: architecture, commands, conventions, gotchas. **Start here.**
- [`site/docs/PAGE_BUILDER.md`](site/docs/PAGE_BUILDER.md) — how the public site is composed from CMS sections.
- [`site/docs/SANITY.md`](site/docs/SANITY.md) — the CMS project, the Studio, secrets, the auto-deploy webhook.
- [`site/docs/FAMILY_HUB.md`](site/docs/FAMILY_HUB.md) — the gated family area and its password gate.

Pre-migration planning material (`WCP_Project_Extraction.md` — brand, copy, school
facts; `code-injection.md` — the old Squarespace custom code) is kept in the project
root but **gitignored**, so it lives only in the local working copy, not in this repo.
