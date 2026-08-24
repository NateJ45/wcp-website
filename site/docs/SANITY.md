# Sanity — the content system behind the whole site

Sanity is the CMS behind **both** halves of the site:

1. **The public marketing site** is a full **page builder** — every page is a Sanity
   document a volunteer composes from a palette of sections. These are read at **build
   time** and prerendered to static HTML. See [PAGE_BUILDER.md](PAGE_BUILDER.md).
2. **The Family Hub** private content (announcements, documents, per-class notes, the
   family directory) is read **server-side, with a token, behind the family gate** —
   the dataset is private, so PII never touches the public site or git.

Content that stays on Google (Calendar, Fundraising) is **not** in Sanity.

- **Project ID:** `niemhgev` · **Dataset:** `production` (private) · **API version:** `2025-01-01`
- **Studio config:** [sanity.config.ts](../sanity.config.ts) · schemas in [src/sanity/schemaTypes/](../src/sanity/schemaTypes/)
- **Workspaces:** the Studio is TWO views of the same dataset, split by AUDIENCE — **Public website** (`/studio/#/public`, where `/studio` lands: everything the world sees — alert, Announcements, Money & payments, News, Newsletter, Events, Pages, School info, Community & content, Site setup, and the public inboxes) and **Family Hub** (`/studio/#/family-hub`, lock-badged icon: the gated families-only content in four bands — everyday hub jobs / Families & co-op / Hub pages & look / Printables — plus the hub inboxes). Three things appear in BOTH menus on purpose: the **Alert banner** (a snow day must never hide in the other workspace), the **Money & payments** folder (fee schedule, budget, class tuition, campaigns — one money home for the Treasurer), and the shared chrome (Welcome, Help & Guide, Trash). Class docs live under School info (Public) and stay reachable from either side via Money & payments → "Class tuition (open a class)". The `#` is because the embedded Studio on a static build uses hash routing (verified live 2026-07-13). Switch via the workspace name in the top-left. The trim is menu-only comfort, not permission (see [ROLES.md](ROLES.md)). Both are defined by one shared `workspace()` factory in `sanity.config.ts`; the left-nav structures live in [src/sanity/structure.ts](../src/sanity/structure.ts) (`publicStructure` + `hubStructure`), each organized by task-frequency bands inside the audience split. (Before 2026-08 the split was by frequency — "Everyday edits" at `#/everyday` vs "Everything" at `#/everything`; old bookmarks to those hashes land on the workspace picker, not an error.)
- **Studio plugins:** `structureTool`, `presentationTool` (click-to-edit), `sanity-plugin-media` (the "Media" library), `sanity-plugin-documents-pane` (a "Used on" tab), `@sanity/orderable-document-list` (drag-to-reorder — Classes, Testimonials, School-Year Events, FAQs, Co-op Roles, hub Documents & Forms, and the Community collections), and `sanity-plugin-link-checker` (the "Link Checker" tool, Public website workspace only — the hub has its own weekly Link health report). Custom panes: a **Welcome** launcher (task cards deep-linking to tuition/alert/news/etc. + recent edits; a structure pane in `structure.ts`) and an **SEO preview** tab (Google + social card; added via `defaultDocumentNode` in `sanity.config.ts`). Growth-plan features (AI Assist, Comments/Tasks) are **not** enabled — see the note below.
- **Soft delete / "Recently deleted":** Sanity has no built-in trash, so board-authored **content** types (`ARCHIVABLE_TYPES` in `schemaTypes/index.ts`) have their destructive **Delete** action swapped for **Archive** (`src/sanity/actions/archive.tsx`): it snapshots the whole document (its JSON) into a `trashedItem` and removes the original, so it leaves both the Studio lists and the public site. **Recently deleted** (in both workspaces) lists them; **Restore** rebuilds the original from the snapshot (`createOrReplace` to the same id, so references re-resolve), **Delete forever** empties it (with a confirm). Archive is blocked (with a toast) when other docs still reference the item, mirroring the native delete guard. Nothing auto-purges — it's kept until the board empties it (safer than a timed delete). Pure round-trip logic in `src/lib/trash.ts` (unit-tested). Machine/inbox types (submissions, subscribers, sign-up & hours entries, moderated photos) keep the normal Delete — the **Clean up** tool bulk-empties those. `trashedItem` is Studio-only (never public, excluded from the deploy webhook).
- **Self-service extras (board independence):** a `redirect` document type (Public website → Site setup → Redirects) whose entries are read at build by `astro.config.mjs`'s `fetchCmsRedirects()` and folded into the `redirects` map — so the board fixes old/renamed links without the developer (see [REDIRECTS.md](REDIRECTS.md)). Four custom Studio tools, placed by where their data lives: **Export** (`ExportTool.tsx`, BOTH workspaces) downloads subscribers / submissions / directory as CSV client-side (off-boarding); **Clean up** (`CleanupTool.tsx`, Family Hub workspace) bulk-deletes old handled messages / past sign-up responses with a count preview + typed confirmation (free-plan bulk delete); **Checkup** (`HealthTool.tsx`, both) is a read-only "what needs attention?" report (banner left on, old messages, stale pages, class gaps); and **Start of year** (`SetupWizard.tsx`, both) is a read-only guided checklist for the annual rollover (year label, key dates, tuition, co-op hours goal, events, content refresh) that jumps you to each thing to update. All four are read-only or self-confirming and free-plan safe. `update.showUntil` lets a pinned announcement drop off the hub home on its own.
- **Announcements (bars + popups):** `announcement` docs (Public website → Announcements) render site-wide public bars (stacked, priority-ordered, dismissible) + one popup, via `AnnouncementBars.astro` / `AnnouncementModal.astro` in BaseLayout (public chrome only). On/off + optional `showFrom`/`showUntil`; scheduling + dismissal + the waitlist auto-message run client-side (`scripts/announcement-bars.ts` reads `/api/availability`; `announcement-modal.ts` frequency-caps popups). Pre-built "＋ New" starting points live in `announcementTemplates.ts`. Pure logic (in-window, placement, waitlist message) in `lib/announcements.ts`, unit-tested. The urgent snow-day **Alert banner** (`closureAlert`) stays a separate singleton, always on top. Design spec: `docs/superpowers/specs/2026-07-13-announcements-design.md`.
- **Scale-ready content model:** the class-targeting dropdowns (`update.audience`, directory child class) read the live `class` docs via `ClassSelectInput.tsx`, so adding a class needs no enum edit; display labels fall back gracefully via `classLabel()` in `class-colors.ts`. The Fundraising section shows every active `campaign` (not just one). Events support **recurrence** (`event.recurrence`/`recurrenceEnd`, expanded by `expandRecurring()` in `lib/events.ts` — unit-tested), a **category filter + past-events archive** on `/events`, and an optional reusable **`venue`** reference (HIDDEN since the 2026-08-23 field audit — zero uses; the type stays registered as the seed of a second-campus model).
- **Studio look & feel + dark mode:** [src/sanity/theme.ts](../src/sanity/theme.ts) builds the theme with `@sanity/ui`'s `buildTheme()`, which ships BOTH a light and a dark color scheme — so the Studio's **Appearance** toggle (System / Light / Dark, in the avatar menu) works. We feed our brand font (Quicksand, one-notch-heavier weights) in via `buildTheme({ font })` — it must go INTO the builder, since a post-hoc `theme.fonts.family` patch is ignored and the Studio stays on Inter. (This replaced the old `buildLegacyTheme`, which was light-only — hard-coded white backgrounds — so Dark looked broken.) Font files + the sun+cloud workspace icon load through `src/sanity/components/StudioLayout.tsx` (`studio.components.layout`). Money-sensitive field descriptions name their walkthrough explicitly ('Help & Guide → "Change tuition or fees"') — deliberately plain strings: Sanity's types allow a React element as a field `description`, but `sanity schema validate` warns it is "known to cause problems and will not be supported in future versions", so don't use JSX there.
- **One-time seed (pending):** `node scripts/seed-orderrank.mjs` — gives existing FAQs and hub Documents their drag-order rank matching today's order (additive `setIfMissing`; the frontend falls back to the legacy `order` number until then, so nothing breaks unseeded — the drag list just won't match today's order until the first drag or the seed).
- **Read clients:** [src/lib/cms.ts](../src/lib/cms.ts) (public build-time reads),
  [src/lib/sanity.ts](../src/lib/sanity.ts) (gated hub, request-time),
  [src/lib/cms-preview.ts](../src/lib/cms-preview.ts) (Studio draft preview, stega on)

## Content types (what board members can edit)

**Public site (built into static pages):**

| Type                  | What it feeds                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Page**              | Every public page, as a hero + a stack of sections (the page builder)                                                                |
| **News post**         | The News/blog feed (/news) — title, cover, summary, rich body, category                                                              |
| **Newsletter issue**  | The public newsletter web archive (/newsletter) — composed in Studio, emailed via Apps Script                                        |
| **Event**             | The public Events page (/events) — dated open houses, tours, closures                                                                |
| **Alert banner**      | Site-wide banner for snow days / urgent notices (singleton; toggle + message)                                                        |
| **Announcement**      | Board-managed bars + popups (waitlist/open-house/fundraiser/etc.), on/off, scheduled, stacked; separate from the urgent Alert banner |
| **Menus**             | The header and footer navigation (singleton)                                                                                         |
| **Class**             | Each class's schedule, ages, tuition — used on its page, the tuition table, hub                                                      |
| **Staff**             | Teacher names and bios (one source, shown everywhere they appear)                                                                    |
| **Tuition & Fees**    | Registration / participation fees and payment info (singleton)                                                                       |
| **FAQ**               | The FAQ page, grouped by category                                                                                                    |
| **Testimonial**       | Parent quotes (feature one for the homepage wall)                                                                                    |
| **School-Year Event** | The school-year timeline                                                                                                             |
| **Site Settings**     | Phone, email, address, social, current school year (singleton, used everywhere)                                                      |

**Community & content** (each surfaces through a matching page-builder section; empty ones simply don't render):

| Type                        | What it feeds                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Program**                 | Enrichment / summer / curriculum offerings (Programs section)                                          |
| **Board / leadership**      | Public officers and leaders, separate from teaching Staff (Board section)                              |
| **Partner / sponsor**       | Community partner logos (Logo strip section, "Partners")                                               |
| **Accreditation / license** | Trust badges — accreditation, license, membership (Logo strip section, "Accreditations")               |
| **Fundraising campaign**    | All active campaigns + goal/raised (Fundraising progress section)                                      |
| **Job posting**             | Open teaching / board positions (Open positions section)                                               |
| **Resource / download**     | Handbook, calendar, forms — uploaded file or link (Downloads section)                                  |
| **Photo album**             | A reusable set of photos shown as a gallery (Photo album section)                                      |
| **Location / venue**        | RETIRED from the menus 2026-08-23 (zero uses); type registered for a future second campus (`venue.ts`) |

**Family Hub (read live behind the gate):**

| Type                      | What it feeds                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| **Update**                | School Updates feed (pin to surface on the hub home; target a class or all)                   |
| **Document / Form**       | Documents & Forms (link or uploaded file, grouped by category incl. meeting minutes)          |
| **Hub page**              | Each hub route's heading/intro + Board-added sections (`hubPage`, keyed by route)             |
| **Teacher welcome note**  | The class-page sign-off card per class (`teacherNote`, incl. the call/text phone)             |
| **President's note**      | The first-visit welcome letter modal (singleton; bump the version stamp to re-show)           |
| **Celebration**           | Birthdays, shout-outs, welcomes on /family-hub/celebrations                                   |
| **Co-op role**            | The who-does-what role directory on Co-op Jobs (drag-orderable)                               |
| **Sign-up sheet / entry** | Sign-ups & RSVPs — board creates sheets, family responses arrive as entries (**PII**)         |
| **Hours log**             | Co-op-hours ledger rows logged from /family-hub/hours (**PII**; created by the site)          |
| **Photo submission**      | Moderated family-photo queue for the photo wall (**PII** until approved)                      |
| **Directory — Family**    | Family Directory (**PII**; only entries marked "Show in directory" appear)                    |
| **Form submission**       | Messages sent through website contact forms (**PII**; created by the site, read-only)         |
| **Newsletter subscriber** | Newsletter sign-ups (**PII**; created by the site; also pushed to your email provider if set) |

Editors get bold/italic/links/lists and a couple of headings — no raw HTML, no color or
font controls, and (in the page builder) no spacing or layout knobs. They can't break the
design. See [PAGE_BUILDER.md](PAGE_BUILDER.md) for why that brand-lock is deliberate.

## Plan: what's free vs. paid (Growth)

The project runs on Sanity's **free** plan. Most of what we use is free, but a few
"Squarespace/WordPress-parity" features are **Growth-only** ($15/editor seat/mo) and are
either not enabled or won't function until an upgrade:

| Feature                                                                                                                    | Free?         | Notes                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Page builder, News, Events, Media library, forms, newsletter, SEO preview, "Used on", Welcome dashboard, redirects, search | ✅ Free       | Everything the board uses day to day                                                                                                                                           |
| **Editor role** (edit without member/billing access)                                                                       | ❌ Growth     | Free has only **Administrator** + **Viewer** — see [ROLES.md](ROLES.md)                                                                                                        |
| **Scheduled publishing**                                                                                                   | ❌ Growth     | Config flag is **off** on purpose (`scheduledDrafts.enabled: false`) so the board never relies on a Schedule button that would vanish after the trial; publishing is immediate |
| **Comments & Tasks** (collaboration)                                                                                       | ❌ Growth     | Not enabled                                                                                                                                                                    |
| **AI Assist** (in-field AI, auto alt-text)                                                                                 | ❌ Growth     | Not installed                                                                                                                                                                  |
| **Custom per-field roles**                                                                                                 | ❌ Enterprise | e.g. "edit News but not tuition"                                                                                                                                               |

To upgrade: manage.sanity.io → project → **Plan**. Then AI Assist and Comments/Tasks can be
wired up, and the Editor role starts working. (Scheduled publishing would also unlock, but we
keep it off — see the note above.)

## The Studio

There is **one** Studio, and it's embedded at **`/studio`** on the live site
(`https://wcp-website.nathanjnixon86.workers.dev/studio/`). It ships with the normal deploy, so
it's rebuilt on **every** deploy — its schema stays in lockstep with the site and can't fall
out of date. This is the single place the board edits content; bookmark this URL.

> **Don't deploy a separate hosted Studio.** Sanity _can_ also host a standalone Studio at
> `westchesterpreschool.sanity.studio` (via `npx sanity deploy`), but that copy only updates
> when someone re-runs `sanity deploy` by hand — nothing automates it. It quietly drifts
> behind the embedded `/studio` (missing newer document types and fields, like the Family
> Directory) even though **both read the same `niemhgev/production` data**, so it _looks_ like
> content is missing when it isn't. We use only the embedded `/studio` so there's a single,
> always-current source of truth. If a hosted Studio was deployed in the past, retire it:
>
> ```sh
> npx sanity login       # log in as the project owner
> npx sanity undeploy    # takes down westchesterpreschool.sanity.studio
> ```

The embedded Studio is already built and working — it just needs one one-time **admin**
action that your Editor token can't do (it requires your own login):

### Add CORS origins (required — the Studio can't talk to Sanity without this)

Easiest: open the deployed `/studio`, and on the _"Connect this Studio to your project"_
screen click **Add CORS origin** — it pre-fills the current URL. Do this for each origin
you'll use. Or add them in one place at
**manage.sanity.io → project `niemhgev` → API → CORS Origins** (check _Allow credentials_):

- the Studio's origin: `https://wcp-website.nathanjnixon86.workers.dev`
- your live site origin once the domain is cut over, e.g. `https://www.westchesterpreschool.org`
- `http://localhost:3333` (only if you run the Studio locally via `npx sanity dev`)

Or from the terminal after `npx sanity login`:

```sh
npx sanity cors add https://www.westchesterpreschool.org --credentials
```

### (Optional) Opening the Studio from the Sanity Dashboard

Day to day you reach the Studio at its direct URL —
`https://wcp-website.nathanjnixon86.workers.dev/studio/` (bookmark it). Sanity's **Dashboard**
(sanity.io) is just a launcher that can open the Studio for you, but it needs a little setup,
because our Studio lives at the `/studio` **sub-path** while the root of that domain is the
public marketing site.

- **Register the full `/studio` URL.** In **manage.sanity.io → project `niemhgev`**, set the
  Studio/app URL to the **full path** `https://wcp-website.nathanjnixon86.workers.dev/studio/`,
  not the bare origin. Registering only the origin makes the Dashboard open the homepage
  instead of the Studio — that's the classic symptom ("the Dashboard just shows the website").
- **Let the Dashboard read the schema** (only needed for Dashboard-side extras like Canvas):
  run `npx sanity schema deploy`. The Studio is already served publicly with no auth wall,
  which is the other requirement.
- **Ignore Sanity's "set up auto-updates" prompt.** It wants a `deployment: { appId,
autoUpdates }` block in [sanity.cli.ts](../sanity.cli.ts), but auto-updates only works for
  studios built with `sanity build`; ours is built by `@sanity/astro`, so the block does
  nothing. The Studio stays current the simple way — it rebuilds on every deploy, so its
  Sanity version is whatever's pinned in `package.json` (bump the dependency to update). We
  also keep `deployment`/`studioHost` out of `sanity.cli.ts` on purpose, so a stray
  `sanity deploy` can't recreate a separate, drifting Studio.

## Secrets & config

**`SANITY_TOKEN`** (Editor token) is a **server-only secret**, never committed. It is read
in two different contexts, so it lives in a few places:

| Where                         | Why                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `.env` (gitignored)           | Local **build** — `cms.ts` reads public page content via `import.meta.env` at build time             |
| `.dev.vars` (gitignored)      | Local **Worker runtime** — the gated hub reads via `cloudflare:workers` env under `wrangler`/preview |
| GitHub `secrets.SANITY_TOKEN` | CI, Lighthouse, and Deploy builds (all three pass it — a tokenless build emits an empty site)        |
| Cloudflare secret             | The deployed Worker's runtime (gated hub) — set with `npx wrangler secret put SANITY_TOKEN`          |

`projectId` / `dataset` are **not** secret (the Studio bundles them) — they're in
`astro.config.mjs`, `sanity.config.ts`, and `src/sanity/env.ts`.

## Auto-deploy on publish (Sanity → GitHub Actions → Cloudflare)

Publishing a change in the Studio does **not** update the live site by itself — the
public pages are static HTML, built once. `.github/workflows/deploy.yml` closes that
gap: it rebuilds and redeploys automatically, either when code is pushed to `main` or
when Sanity tells it a document was published.

**One-time setup (two credentials only you should create — see below for why):**

1. **Cloudflare API token**, so GitHub Actions can run `wrangler deploy`.
   - Cloudflare dashboard → **My Profile → API Tokens → Create Token** → use the
     **"Edit Cloudflare Workers"** template → scope it to your account.
   - Then, in your own terminal (not shared with anyone, including Claude):
     ```sh
     gh secret set CLOUDFLARE_API_TOKEN --repo NateJ45/wcp-website
     ```
     Paste the token when prompted.

2. **A GitHub personal access token**, so Sanity's webhook can trigger the workflow.
   The endpoint it calls (`POST /repos/.../dispatches`) is documented as needing a
   **classic** token with the `repo` scope:
   - github.com/settings/tokens → **Generate new token (classic)** → check the
     **`repo`** scope box → generate.
   - _(If you'd rather use a fine-grained token: scope it to just `wcp-website` with
     **Contents: Read and write** — GitHub's docs don't explicitly confirm this works
     for this endpoint, so try it and fall back to the classic token above if the
     webhook gets a 403.)_
   - Copy it — you'll paste it directly into Sanity's webhook config in step 3, not
     anywhere else.

3. **Create the Sanity webhook**: manage.sanity.io → project `niemhgev` → **API →
   Webhooks → Create webhook**.
   - **Name:** `Trigger site deploy`
   - **URL:** `https://api.github.com/repos/NateJ45/wcp-website/dispatches`
   - **Dataset:** `production`
   - **Trigger on:** Create, Update, Delete
   - **HTTP method:** `POST`
   - **HTTP Headers:** add two —
     - `Authorization` → `Bearer <the GitHub token from step 2>`
     - `Accept` → `application/vnd.github+json`
   - **Projection** (this becomes the request body Sanity sends — it's GROQ, so it
     can pull fields off the changed document):
     ```
     {"event_type": "sanity-publish", "client_payload": {"type": _type}}
     ```
     The `_type` is what the Deploy workflow's `if:` guard reads to skip a build
     for a hub-only / inbox type even if one slips past the Filter below — the
     same exclusion list, kept in version control as a second line of defense (see
     `.github/workflows/deploy.yml`). The older `{"event_type": "sanity-publish"}`
     projection still works; it just loses that second layer (the guard sees no
     type and always builds), so update it to the form above.
   - **Filter** — two exclusions, both required:

     **Exclude drafts.** With "Trigger on: Create, Update, Delete" and no draft
     filter, the webhook fires on every Studio autosave (drafts are real documents
     with a `drafts.` id prefix, and the Studio saves continuously while someone
     types). That is exactly what happened in July 2026: one editing session queued
     dozens of deploys per hour and burned through the month's Actions minutes.
     Publishing still fires — publish writes the un-prefixed document, which passes
     the filter.

     **Skip the document types that only feed Family Hub pages (or inboxes).** Every
     Family Hub route has `prerender = false` (session-gated, reads Sanity live on
     every request — see `src/pages/family-hub/*.astro`), so publishing a `coopRole`,
     `update`, `hubDocument`, `directoryEntry`, or `celebration` document
     already shows up immediately with no rebuild — same for `hubPage`,
     `teacherNote`, `presidentNote`, and the sign-up types (`signupSheet`,
     `signupEntry`), which only ever render behind the gate. The submission inboxes
     (`testimonialSubmission`, the general `submission` from form posts, the
     `hoursLog` co-op-hours ledger, and `photoSubmission` family photos) are
     Studio-only or hub-only and never render on the public site, so they don't need
     a rebuild either. Everything else
     (`testimonial`, `siteSettings`, `page`, `schoolYearEvent`,
     `faqItem`, `class`, `legalPage`, `feeSchedule`) is baked into the static public
     pages at build time and DOES need a redeploy. (Note: **approving** a testimonial
     creates a `testimonial` doc, which correctly triggers a rebuild.)

     Combined filter:

     ```
     !(_id in path("drafts.**")) && !(_type in ["coopRole", "update", "hubDocument", "directoryEntry", "celebration", "hubPage", "teacherNote", "presidentNote", "signupSheet", "signupEntry", "testimonialSubmission", "submission", "hoursLog", "photoSubmission", "trashedItem"])
     ```

     If a new document type is added later, decide which bucket it belongs to by
     checking whether the page(s) that read it have `prerender = false`.

   - Save. Sanity will now ping GitHub on every publish of a type that isn't
     filtered out, and the `Deploy` workflow picks it up within a minute or two.

**Why these two are on you:** creating account credentials (API tokens, PATs) is
something Claude won't do on your behalf, even when asked — they're typed directly by
you into Cloudflare's/GitHub's own screens (or your own terminal), and never pass
through the assistant. Everything else — the workflow file, the deploy logic, testing
it — is already done.

**To test it:** publish any small edit in the Studio (e.g. toggle something in Site
Settings and publish), then check the **Actions** tab on GitHub — a "Deploy" run
should start within moments, and the live site updates a minute or two after it
finishes.

## Notes

- **Local dev Studio:** `/studio` under `npm run dev` shows blank because this project's
  folder path contains spaces (`West Chester Preschool Website`), which breaks Vite's
  dev-time module loading for the Studio component. This is **dev-only** — the production
  build (and the hosted Studio) work fine. To edit locally, use the deployed Studio or run
  `npx sanity dev` (separate port).
- The website reading content does **not** depend on CORS or the Studio deploy — that path
  uses the token server-side and already works (the Updates page is live-wired as the proof).
