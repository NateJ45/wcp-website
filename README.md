# West Chester Preschool

The website for **West Chester Preschool**, a volunteer-run cooperative preschool. Migrated off Squarespace onto a self-hosted stack the board can run itself. Built on Astro + Sanity + Cloudflare Workers.

**Live:** [wcp-website.nathanjnixon86.workers.dev](https://wcp-website.nathanjnixon86.workers.dev)

---

## The brief

A co-op preschool is run by parents, and the board turns over every year. That is the whole design problem. Whoever inherits the website next has to be able to change a price, add an event, post a class update, or build a new page, with no code and no training. The old Squarespace site could not do that safely, and it kept private family information in places it did not belong.

The goal was a site with two clean halves: a public marketing site any volunteer can edit like a document, and a private area for enrolled families that keeps their information off the public web entirely.

## The work

**A public site that is a page builder, with the brand locked.** Every public page is a CMS document a volunteer composes from a palette of sections, prerendered to fast static HTML. The trick is what the editor cannot do: there are no color, font, spacing, or layout controls. Volunteers get full control of content (what sections, what order, the words, the photos) and zero control of design, which is what keeps a parent-built page on-brand and off the "template" look. Adding a page takes no developer.

**A private Family Hub that respects the family.** The gated area (`/family-hub/**`) is server-rendered per request behind a password, so private content never touches the public site or git. It holds the family directory, co-op volunteer-hours tracking, documents and forms, the class calendar and photos, budget and fundraising progress, and a page for each classroom. Private data lives in the CMS behind the gate, never in the code.

**Accessibility as a build gate, not a promise.** Heading order, keyboard support, and color contrast are enforced in CI: the site holds a perfect Lighthouse accessibility score and an automated axe pass at mobile widths, or the build fails. Motion is opt-in and turns itself off for visitors who prefer reduced motion.

**Content that updates itself.** Publishing in the Studio triggers a rebuild through a webhook, so a board member's edit goes live in a minute or two with no code push.

## The result

A preschool website a rotating volunteer board can actually operate: fast and accessible for families, editable end to end without a developer, and built so private information stays private.

---

## Stack

- **[Astro 7](https://astro.build)** — static site generation + server routes
- **[Sanity](https://www.sanity.io)** — headless CMS and page builder (the board's editor)
- **[Tailwind v4](https://tailwindcss.com)** — styling (CSS-first, no config file)
- **[Cloudflare Workers](https://workers.cloudflare.com)** — hosting (static assets + the gated SSR routes)

Node **≥ 22.12**. The app lives in [`site/`](site/).

## Two halves

- **Public marketing site** — a Sanity **page builder**. Every page is a CMS document a volunteer composes from a palette of sections, prerendered to static HTML. See [`site/docs/PAGE_BUILDER.md`](site/docs/PAGE_BUILDER.md).
- **Family Hub** (`/family-hub/**`) — a private, password-gated area for enrolled families, server-rendered per request so private content never touches the public site or git. See [`site/docs/FAMILY_HUB.md`](site/docs/FAMILY_HUB.md).

## Quick start

```sh
cd site
npm install
npm run dev          # http://localhost:4321
```

You will need a `.env` (build-time Sanity token) and `.dev.vars` (Worker runtime secrets), both gitignored. See [`site/docs/SANITY.md`](site/docs/SANITY.md) and [`site/.dev.vars.example`](site/.dev.vars.example).

> Note: `/studio` is blank under `npm run dev` because this folder's path contains spaces. That is dev-only; the deployed Studio works. Details in the docs.

## Common commands (run in `site/`)

```sh
npm run build        # static build → dist/
npm run check        # types (astro check) + lint (oxlint)
npm test             # Playwright: smoke + accessibility + 320px reflow
npm run deploy       # build + deploy to Cloudflare
```

## Deploy

Pushes to `main` deploy automatically. Publishing in the Sanity Studio also triggers a rebuild via a webhook, so content edits go live (~1-2 min) with no code push. CI runs type-check, lint, format, build, link-check, Playwright, and a Lighthouse accessibility gate. See [`.github/workflows/`](.github/workflows/).

## Documentation

- **[`site/CLAUDE.md`](site/CLAUDE.md)** — the developer/agent orientation: architecture, commands, conventions, gotchas. **Start here.**
- [`site/docs/PAGE_BUILDER.md`](site/docs/PAGE_BUILDER.md) — how the public site is composed from CMS sections.
- [`site/docs/SANITY.md`](site/docs/SANITY.md) — the CMS project, the Studio, secrets, the auto-deploy webhook.
- [`site/docs/FAMILY_HUB.md`](site/docs/FAMILY_HUB.md) — the gated family area and its password gate.

---

Built by [Nixon Creative Studio](https://nixoncreativestudio.com).
