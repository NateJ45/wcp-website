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
- **Workspaces:** the Studio is TWO views of the same dataset, split by AUDIENCE — **Public website** (`/studio/#/public`, where `/studio` lands: everything the world sees — alert, Announcements, Money & payments, News, Newsletter, Events, Pages, School info, Community & content, Site setup, and the public inboxes) and **Family Hub** (`/studio/#/family-hub`, lock-badged icon: the gated families-only content in four bands — everyday hub jobs / Families & co-op / Hub pages & look / Printables — plus the hub inboxes). Three things appear in BOTH menus on purpose: the **Alert banner** (a snow day must never hide in the other workspace), the **Money & payments** folder (fee schedule, budget, class tuition, campaigns — one money home for the Treasurer), and the shared chrome (Welcome, Help & Guide, Trash). Welcome's intro line, task cards, and Recently edited list all follow the workspace, and since 2026-08-31 **Help & Guide lists only the guides for that side's work** (per-guide `ws` tag in `src/sanity/guides/content.ts`; untagged = both — money, classes, staff, the alert, the tools; a category empty on one side does not render there). Class docs live under School info (Public) and stay reachable from either side via Money & payments → "Class tuition (open a class)". The `#` is because the embedded Studio on a static build uses hash routing (verified live 2026-07-13). Switch via the workspace name in the top-left. The trim is menu-only comfort, not permission (see [ROLES.md](ROLES.md)). Both are defined by one shared `workspace()` factory in `sanity.config.ts`; the left-nav structures live in [src/sanity/structure.ts](../src/sanity/structure.ts) (`publicStructure` + `hubStructure`), each organized by task-frequency bands inside the audience split. (Before 2026-08 the split was by frequency — "Everyday edits" at `#/everyday` vs "Everything" at `#/everything`; old bookmarks to those hashes land on the workspace picker, not an error.)
- **Studio plugins:** `structureTool`, `presentationTool` (click-to-edit), `sanity-plugin-media` (the "Media" library), `sanity-plugin-documents-pane` (a "Used on" tab, plus a **Responses** tab on every sign-up sheet listing the `signupEntry` docs that reference it — both in `defaultDocumentNode`), `@sanity/orderable-document-list` (drag-to-reorder — Classes, Testimonials, School-Year Events, FAQs, Co-op roles & org chart, hub Documents & Forms, and the Community collections), and `sanity-plugin-link-checker` (the "Link Checker" tool, Public website workspace only — the hub has its own weekly Link health report). Presentation carries a Squarespace-style **page navigator** (left side panel, `PreviewNavigator.tsx` via `components.unstable_navigator`): the Public workspace lists `page` docs, the hub workspace lists `hubPage` docs — click a page and the preview + edit panel follow; the hub workspace's Presentation opens on the hub home preview. The navigator also carries the 2026-08-24 Squarespace layer: **status dots** (amber = published with unpublished edits, hollow = never published — computed from raw-perspective draft/published twins), **grouping** (public: "In the menu" vs "Not in the menu" from the `navigation` doc, home always in; hub: built-in "Hub pages" vs "Board-created pages"), a **↗ live-page link** per published row, a **＋ New page** button (creates an empty `drafts.<uuid>` doc and opens it in the edit panel — draft-only so nothing half-made publishes itself), pinned **Site-wide shortcuts** (menus / settings / alert banner), and (public list, 2026-08-30) a collapsed **News posts** group — the latest 12 `post` docs with status dots and live links, so an article previews and edits from the same panel as a page. The lists live-refresh via `client.listen`. Related: preview surfaces put an explicit `data-sanity` attribute on every SECTION wrapper (`src/lib/preview-edit-attr.ts`, threaded through `SectionRenderer`'s `editDoc` prop and `HubSectionedBody`), so the overlay draws section-LEVEL controls (move / duplicate / delete / insert) in the preview, not just text click-to-edit — the wrapper must be a real block box, never `display: contents` (no rect to outline). The Presentation preview covers hub pages too: `/preview/family-hub/<hubKey-or-slug>` renders a hubPage's editable surface (heading/intro/sections through HubSectionedBody) with click-to-edit, gated on the preview cookie (401 without it — see `src/pages/preview/family-hub/`). Custom panes: a **Welcome** launcher (task cards deep-linking to tuition/alert/news/etc. + recent edits; a structure pane in `structure.ts`) and an **SEO preview** tab (Google + social card; added via `defaultDocumentNode` in `sanity.config.ts`). Growth-plan features (AI Assist, Comments/Tasks) are **not** enabled — see the note below.
- **Soft delete / "Recently deleted":** Sanity has no built-in trash, so board-authored **content** types (`ARCHIVABLE_TYPES` in `schemaTypes/index.ts`) have their destructive **Delete** action swapped for **Archive** (`src/sanity/actions/archive.tsx`): it snapshots the whole document (its JSON) into a `trashedItem` and removes the original, so it leaves both the Studio lists and the public site. **Recently deleted** (in both workspaces) lists them; **Restore** rebuilds the original from the snapshot (`createOrReplace` to the same id, so references re-resolve), **Delete forever** empties it (with a confirm). Archive is blocked (with a toast) when other docs still reference the item, mirroring the native delete guard. Nothing auto-purges — it's kept until the board empties it (safer than a timed delete). Pure round-trip logic in `src/lib/trash.ts` (unit-tested). Machine/inbox types (submissions, subscribers, sign-up & hours entries, moderated photos) keep the normal Delete — the **Clean up** tool bulk-empties those. `trashedItem` is Studio-only (never public, excluded from the deploy webhook).
- **Self-service extras (board independence):** a `redirect` document type (Public website → Site setup → Redirects) whose entries are read at build by `astro.config.mjs`'s `fetchCmsRedirects()` and folded into the `redirects` map — so the board fixes old/renamed links without the developer (see [REDIRECTS.md](REDIRECTS.md)). **Safe rename:** changing the slug of a published `page` or `post` files that redirect automatically. `src/sanity/actions/slugRedirect.tsx` wraps the stock Publish action for the types in `SLUG_REDIRECT_TYPES`, creates the old→new `redirect` doc, toasts "Old link kept working", and then publishes; a failed write warns and publishes anyway, so it can never block an edit. Path normalization is shared with the build in `src/lib/redirects.ts` (unit-tested), so the Studio and `astro.config.mjs` cannot disagree about what a path is. Five custom Studio tools, placed by where their data lives: **Export** (`ExportTool.tsx`, BOTH workspaces) downloads subscribers / submissions / directory as CSV client-side (off-boarding); **Clean up** (`CleanupTool.tsx`, Family Hub workspace) bulk-deletes old handled messages / past sign-up responses with a count preview + typed confirmation (free-plan bulk delete); **Checkup** (`HealthTool.tsx`, both) is a read-only "what needs attention?" report (banner left on, old messages, stale pages, class gaps, a "waiting to publish" card naming every board doc with unpublished edits, oldest first — machine/inbox types excluded — and, since 2026-08-30, a **class-slug-drift alert**: every directory child / teacher note / curriculum guide whose stored class key matches no live class or class page, because a renamed class slug breaks those joins silently); and **Start of year** (`SetupWizard.tsx`, both) is a read-only guided checklist for the annual rollover (year label, key dates, tuition, co-op hours goal, events, content refresh) that jumps you to each thing to update; and **Site stats** (`StatsTool.tsx`, Public website workspace only) is the read-only traffic panel — 7-day and 28-day totals plus a 28-bar daily chart, read from Cloudflare through the site's own `/api/stats` (see "Site stats" below). All five are read-only or self-confirming and free-plan safe. `update.showUntil` lets a pinned announcement drop off the hub home on its own.
- **Announcements (bars + popups):** `announcement` docs (Public website → Announcements) render site-wide public bars (stacked, priority-ordered, dismissible) + one popup, via `AnnouncementBars.astro` / `AnnouncementModal.astro` in BaseLayout (public chrome only). On/off + optional `showFrom`/`showUntil`; scheduling + dismissal + the waitlist auto-message run client-side (`scripts/announcement-bars.ts` reads `/api/availability`; `announcement-modal.ts` frequency-caps popups). Pre-built "＋ New" starting points live in `announcementTemplates.ts`. Pure logic (in-window, placement, waitlist message) in `lib/announcements.ts`, unit-tested. The urgent snow-day **Alert banner** (`closureAlert`) stays a separate singleton, always on top. Design spec: `docs/superpowers/specs/2026-07-13-announcements-design.md`.
- **Scale-ready content model:** the class-targeting dropdowns (`update.audience`, directory child class) read the live `class` docs via `ClassSelectInput.tsx`, so adding a class needs no enum edit; display labels fall back gracefully via `classLabel()` in `class-colors.ts`. The Fundraising section shows every active `campaign` (not just one). Events support **recurrence** (`event.recurrence`/`recurrenceEnd`, expanded by `expandRecurring()` in `lib/events.ts` — unit-tested), a **category filter + past-events archive** on `/events`, and an optional reusable **`venue`** reference (HIDDEN since the 2026-08-23 field audit — zero uses; the type stays registered as the seed of a second-campus model).
- **Studio look & feel + dark mode:** [src/sanity/theme.ts](../src/sanity/theme.ts) builds the theme with `@sanity/ui`'s `buildTheme()`, which ships BOTH a light and a dark color scheme — so the Studio's **Appearance** toggle (System / Light / Dark, in the avatar menu) works. We feed our brand font (Quicksand, one-notch-heavier weights) in via `buildTheme({ font })` — it must go INTO the builder, since a post-hoc `theme.fonts.family` patch is ignored and the Studio stays on Inter. (This replaced the old `buildLegacyTheme`, which was light-only — hard-coded white backgrounds — so Dark looked broken.) Font files + the sun+cloud workspace icon load through `src/sanity/components/StudioLayout.tsx` (`studio.components.layout`). Since 2026-08-30 the **Family Hub workspace wears a WARM twin** of the theme (`wcpHubStudioTheme`: base/transparent hue → yellow, primary/selection hue → orange), so the two workspaces are tellable apart at a glance — buildTheme still derives every tint from the tested `@sanity/color` scales, so both schemes stay accessible. The custom Studio tools all open with `ToolHeading` (`src/sanity/components/ToolHeading.tsx`: the emblem beside a Captain Comic heading) — use it for any new tool. The Studio also greets a first visit with a ten-step **welcome tour** (`StudioTour.tsx`, mounted by StudioLayout — the hub-tour pattern: once per browser via localStorage, replayable from the Welcome pane's "Show the welcome tour again" link, and it can never crash the Studio: every storage read is try/caught). The tour is **workspace-aware**: shared steps (publish model, the two doors, click-to-edit, ＋ starters, Media, tools, Help, safety) plus two middle steps that swap per side — news/menus on Public, the weekly rhythm + families on the hub. Bump its `SEEN_KEY` when the steps change enough that returning volunteers should see them again. "＋ New" starting points: announcements (`announcementTemplates.ts`), pages (`pageTemplates.ts`), and hub content (`hubTemplates.ts` — spotlight, minutes, announcement post, birthday/welcome celebrations, and two sign-up sheet starters that begin CLOSED so nothing half-made goes live). Money-sensitive field descriptions name their walkthrough explicitly ('Help & Guide → "Change tuition or fees"') — deliberately plain strings: Sanity's types allow a React element as a field `description`, but `sanity schema validate` warns it is "known to cause problems and will not be supported in future versions", so don't use JSX there.
- **One-time seed (pending):** `node scripts/seed-orderrank.mjs` — gives existing FAQs and hub Documents their drag-order rank matching today's order (additive `setIfMissing`; the frontend falls back to the legacy `order` number until then, so nothing breaks unseeded — the drag list just won't match today's order until the first drag or the seed).
- **Read clients:** [src/lib/cms.ts](../src/lib/cms.ts) (public build-time reads),
  [src/lib/sanity.ts](../src/lib/sanity.ts) (gated hub, request-time),
  [src/lib/cms-preview.ts](../src/lib/cms-preview.ts) (Studio draft preview, stega on)

## Content types (what board members can edit)

**Public site (built into static pages):**

| Type                  | What it feeds                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Page**              | Every public page, as a hero + a stack of sections (the page builder)                                                                 |
| **News post**         | The News/blog feed (/news) — title, cover, summary, rich body, category                                                               |
| **Newsletter issue**  | The public newsletter web archive (/newsletter) — composed in Studio, emailed via Apps Script                                         |
| **Event**             | The public Events page (/events) — dated open houses, tours, closures                                                                 |
| **Alert banner**      | Site-wide banner for snow days / urgent notices (singleton; toggle + message)                                                         |
| **Announcement**      | Board-managed bars + popups (waitlist/open-house/fundraiser/etc.), on/off, scheduled, stacked; separate from the urgent Alert banner  |
| **Menus**             | The header and footer navigation, plus the header button (singleton)                                                                  |
| **Class**             | Each class's schedule, ages, tuition — used on its page, the tuition table, hub                                                       |
| **Staff**             | Teacher names and bios (one source, shown everywhere they appear)                                                                     |
| **Tuition & Fees**    | Registration / participation fees and payment info (singleton)                                                                        |
| **FAQ**               | The FAQ page, grouped by category                                                                                                     |
| **Testimonial**       | Parent quotes (feature one for the homepage wall)                                                                                     |
| **School-Year Event** | The school-year timeline                                                                                                              |
| **Site Settings**     | Phone, email, address, social, current school year, the optional logo and the header/footer show-toggles (singleton, used everywhere) |

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

| Feature                                                                                                                    | Free?         | Notes                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page builder, News, Events, Media library, forms, newsletter, SEO preview, "Used on", Welcome dashboard, redirects, search | ✅ Free       | Everything the board uses day to day                                                                                                                                                           |
| **Editor role** (edit without member/billing access)                                                                       | ❌ Growth     | Free has only **Administrator** + **Viewer** — see [ROLES.md](ROLES.md)                                                                                                                        |
| **Scheduled publishing**                                                                                                   | ❌ Growth     | Sanity's own is **off** on purpose (`scheduledDrafts.enabled: false`). A free replacement ships instead — see [Scheduled publishing, the free version](#scheduled-publishing-the-free-version) |
| **Comments & Tasks** (collaboration)                                                                                       | ❌ Growth     | Not enabled                                                                                                                                                                                    |
| **AI Assist** (in-field AI, auto alt-text)                                                                                 | ❌ Growth     | Not installed                                                                                                                                                                                  |
| **Custom per-field roles**                                                                                                 | ❌ Enterprise | e.g. "edit News but not tuition"                                                                                                                                                               |

To upgrade: manage.sanity.io → project → **Plan**. Then AI Assist and Comments/Tasks can be
wired up, and the Editor role starts working. (Scheduled publishing would also unlock, but we
keep it off — see the note above.)

## Scheduled publishing, the free version (added 2026-08-27)

Ported from `ncs-astro-sanity-starter` (Cards 19 + 20). Two small parts replace the
Growth-plan feature, and they cost nothing:

1. **The field.** `page` and `hubPage` carry **"Publish automatically at"** in a
   **Publishing** tab. A board member picks a date and time, **leaves the page as a
   draft**, and walks away. Times are the editor's own local time (Sanity's date input
   stores UTC), so nobody has to think about timezones. Clearing the field before the
   time arrives cancels it. Field + group live in
   [`src/sanity/schemaTypes/_publishAt.ts`](../src/sanity/schemaTypes/_publishAt.ts) and
   must be added as a **pair** (`PUBLISH_AT_GROUP` into `groups`, `publishAtField()`
   into `fields`) — a field naming a group its type never declared is a hard Studio
   crash, not a warning.
2. **The job.** [`.github/workflows/publish-due.yml`](../../.github/workflows/publish-due.yml)
   runs [`scripts/publish-due.mjs`](../scripts/publish-due.mjs) every half hour. It
   finds every draft whose `publishAt` has passed and publishes it.

Facts worth knowing:

- **The promise is "within the half hour", not "at 9:00 exactly"**, and the field
  description in the Studio says so. GitHub's cron is best-effort too.
- **The script is dependency-free on purpose** (global `fetch` against Sanity's HTTP
  API), so the workflow is checkout + node with no `npm ci` — 48 runs a day would
  otherwise burn real Actions time. Do not add an install step, and do not give the
  script an import from `node_modules`.
- **Publishing strips `publishAt` in the same mutation**, so a published page can never
  carry a stale schedule and be picked up again on the next run. Each document is one
  atomic mutate (create the published doc + delete the draft together).
- **Dry run by default.** `node scripts/publish-due.mjs` prints the queue and writes
  nothing; `--apply` publishes. The workflow passes `--apply`.
- **A scheduled publish deploys itself.** The script writes to the dataset, and the
  deploy webhook below watches the dataset, so a scheduled `page` triggers the same
  rebuild a hand-published one does. A `hubPage` is filtered out of that webhook on
  purpose and needs no rebuild (the hub is server rendered and reads Sanity live).
- **Adding the pair to another document type is the whole installation.** The script's
  query is schema-agnostic: any draft with a `publishAt`. It is deliberately NOT on the
  singletons (Site Settings and friends are never "published later").
- **Running it by hand** needs `SANITY_AUTH_TOKEN` (a write token) and
  `SANITY_PROJECT_ID=niemhgev` in the environment or in `site/.env`. This repo's own
  secret is named `SANITY_TOKEN`, so the workflow maps it — the same mapping the backup
  workflow does for the Sanity CLI.

## Show someone a draft: share links (added 2026-08-27)

Also ported from the starter. A board member can hand a reviewer (a chair, a teacher, a
parent) a link that shows a page's **draft**, with no Sanity login:

- **Where:** the `Copy share link` action in a page's publish menu, and the `⋯` menu on
  each row of the page list beside the preview.
- **How it works:** the Studio mints the same one-time preview secret the Presentation
  tool uses, wrapped in an `/api/draft-mode/enable` URL. The endpoint validates the
  secret against the dataset and only then sets the preview cookie. An invalid or
  expired secret gets a bare 401.
- **The link works for about an hour**, and that cannot be extended — the TTL is hard
  coded inside `@sanity/preview-url-secret`. The Studio copy says so out loud rather than
  letting a reviewer discover it as a 401 the next morning. Minting a fresh link is one
  click.
- **Deployed origin only.** The cookie is `secure` + `sameSite: none`, so a browser will
  not store it over plain `http://localhost:4321`. Test share links on the live site.
- **Family Hub pages get NO share link, on purpose.** The link carries the Studio preview
  cookie, and that cookie is the _entire_ gate on `/preview/family-hub/*` — the family
  password guards `/family-hub`, not the preview route. A hub share link would therefore
  show the directory, health details and the children's photo wall to whoever received
  it. The reasoning (and the warning against "fixing" it) lives in
  [`src/sanity/urls.ts`](../src/sanity/urls.ts).

## Undo a change (added 2026-08-28)

Ported from the starter (PORTS.md card 27). Squarespace's Ctrl+Z, for everything a board
member does to a page, not only typing:

- **Where:** the `Undo last change` and `Redo` actions in the publish menu of a **Page**
  and a **Family Hub page**, in BOTH workspaces. With a page open, `Ctrl+Z` /
  `Ctrl+Shift+Z` / `Ctrl+Y` (`Cmd` on a Mac) do the same.
- **How it works:** every mutation Sanity accepts lands in a transaction log, and each
  entry carries a mendoza patch in both directions. Undo reads the last few transactions
  for the DRAFT, applies the newest one's `revert`, and keeps the forward patch so Redo can
  replay it. It goes through the editor's own Studio session, so it needs no extra token.
  See [`src/sanity/undoRedo.ts`](../src/sanity/undoRedo.ts) for the mechanism and the
  safety rules, and [`src/sanity/components/UndoRedo.tsx`](../src/sanity/components/UndoRedo.tsx)
  for the actions and the keyboard layer.
- **Drafts only, which makes it publish-safe.** A publish is a mutation on the PUBLISHED
  twin, so it is not in this log and cannot be stepped over. Undo also refuses rather than
  writing over a change it cannot see ("Someone else edited since"), and it will not delete
  a draft that has no published copy behind it ("This would remove the only copy").
- **An undo that changes nothing is not an undo** (fix ported 2026-08-28). A transaction
  that CREATED the draft carries an EMPTY revert patch, not a null one, so absence is read
  from the patch shape. Before any write, undo compares the candidate with the current
  document, ignoring `_rev` and `_updatedAt`; if nothing moves, it skips that transaction
  and tries the next one back. Undo never reports success while the page stands still.
- **Text boxes keep their own undo.** With focus in an input, a textarea or a rich-text
  editor, the shortcut does nothing at all, so the browser's per-field undo runs.
- **The preview iframe eats the key.** A key pressed inside the Presentation page picture
  goes to the iframe, not to the Studio. Use the two menu actions, or click into the Studio
  panel first.
- **In memory, gone on reload.** Undo is for the last few minutes. **Version history** is
  still the deep restore, and the volunteer guide says so.
- Tests: [`src/lib/undoRedo.test.ts`](../src/lib/undoRedo.test.ts) (this repo's Vitest copy
  of the canonical 41 cases; the shared module itself is byte-identical to the starter's).

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

| Where                         | Why                                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `.env` (gitignored)           | Local **build** — `cms.ts` reads public page content via `import.meta.env` at build time                                      |
| `.dev.vars` (gitignored)      | Local **Worker runtime** — the gated hub reads via `cloudflare:workers` env under `wrangler`/preview                          |
| GitHub `secrets.SANITY_TOKEN` | CI, Lighthouse, and Deploy builds (all three pass it — a tokenless build emits an empty site), and the nightly dataset backup |
| Cloudflare secret             | The deployed Worker's runtime (gated hub) — set with `npx wrangler secret put SANITY_TOKEN`                                   |

`projectId` / `dataset` are **not** secret (the Studio bundles them) — they're in
`astro.config.mjs`, `sanity.config.ts`, and `src/sanity/env.ts`.

## Site stats: the traffic panel (added 2026-08-28)

The Studio's **Site stats** tool (Public website workspace, top nav) shows how
busy the website has been: 7-day and 28-day totals, a 28-bar daily chart, and
an error count when there is one. It exists because Squarespace and Wix both
put a traffic panel in their editor, so a board member goes looking for one.

**What the number is.** REQUESTS SERVED by the Worker, not page views and not
people. The site runs on `workers.dev` with **no zone**, so the only dataset
available to us is the account-level Workers one
(`workersInvocationsAdaptive`), which carries no URL: a page, a photo, a font
and an `/api` call are all one request each. The zone-side
`httpRequestsAdaptiveGroups` dataset — the one that knows about paths — needs a
custom domain. Until the DNS cutover happens, the labels must keep saying
"visits to the site (requests served)". Do not soften them into "visitors".

**How it is wired.**

| Piece                                 | What it does                                                                                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/api/stats.ts`              | SSR-only endpoint. Queries Cloudflare GraphQL, buckets to UTC days, caches in the isolate for 10 minutes (**no KV** — the account is near its write cap) |
| `src/lib/site-stats.ts`               | Pure day-bucketing / shaping / bar-scaling. Shared by the endpoint and the tool, unit-tested in `site-stats.test.ts`                                     |
| `src/sanity/components/StatsTool.tsx` | The panel. Hand-drawn SVG chart, no chart library                                                                                                        |
| `wrangler.jsonc` `vars.CF_ACCOUNT_ID` | Names the account to ask about. Not a secret; it grants nothing on its own                                                                               |

**Who can read it.** The endpoint requires the **Studio preview cookie** (the
unforgeable fingerprint from `src/lib/preview-auth.ts`). An editor gets that
cookie the first time they open the Presentation tab; the tool's empty state
walks them through it. Without the cookie the endpoint returns `401` and shows
nothing.

### Mint the token (one time, Nathan)

1. Go to **dash.cloudflare.com → My Profile → API Tokens → Create Token →
   Create Custom Token**.
2. Name it `wcp-site-stats`.
3. Permissions: **Account · Account Analytics · Read**. That is the only one.
   Do not add Workers, KV, or Zone permissions; this token should not be able
   to change anything.
4. Account Resources: **Include · Nathanjnixon86@gmail.com's Account**.
5. TTL: leave open, or set a reminder to re-mint.
6. Copy the token once (Cloudflare never shows it again), then from `site/`:

   ```powershell
   npx wrangler secret put CF_ANALYTICS_TOKEN
   ```

   Paste it at the prompt. Also add it to gitignored `.dev.vars` if you want the
   panel to work under a local Worker preview (see `.dev.vars.example`).

7. Deploy, open `/studio/#/public`, open a page's Presentation tab once, then
   click **Site stats**.

Unset, the endpoint fails closed with a plain `503` naming the missing secret,
and the tool shows a "not set up yet" card. Nothing else on the site changes.

## Nightly dataset backup (added 2026-08-27)

All site content lives in Sanity. A bad mutation, a mis-run patch script, or an
accidental "Remove field" in the Studio can destroy content that no code change
can restore. `.github/workflows/sanity-backup.yml` exports the whole production
dataset (documents + assets) every night at 07:00 UTC, ENCRYPTS it, and keeps
each tarball for 90 days as a GitHub Actions artifact.

**The encryption is load-bearing, not optional.** This repo is PUBLIC, and any
logged-in GitHub user can download a public repo's artifacts. The dataset holds
the family directory (names, addresses, phones), health details, the children's
photos, and the share-by-link Google URLs. A plaintext artifact publishes all
of it. This shipped wrong 2026-08-27 (two duplicate workflows, both plaintext);
found and fixed 2026-09-01 — the workflow now encrypts with
AES-256-CBC/PBKDF2 before upload, refuses to export at all when the
`BACKUP_PASSPHRASE` secret is missing, and the old plaintext artifacts were
deleted. Never add an upload of the raw tarball back, here or in any other
workflow. (`backup.yml` is the retired duplicate — a manual-only stub, safe to
delete.)

Facts:

- The schedule is ENABLED. This repo is PUBLIC, so Actions minutes are free.
- The job runs from `site/`, because `sanity.cli.ts` (which carries the project
  id) lives there.
- It reuses the existing `secrets.SANITY_TOKEN`, mapped to the `SANITY_AUTH_TOKEN`
  environment variable the Sanity CLI reads.
- It also needs `secrets.BACKUP_PASSPHRASE` — the encryption key. The same
  value must live in the school records (and in `site/.dev.vars` locally):
  GitHub can never show a secret again, and a backup nobody can decrypt is no
  backup. Create it once with
  `openssl rand -base64 32 | gh secret set BACKUP_PASSPHRASE --repo NateJ45/wcp-website`
  (and store the value before piping it away).
- A gate job checks both secrets first: a missing secret gives a WARNING and
  skips, it never fails the run — and never uploads plaintext.

To restore a backup:

1. Open the workflow run in the Actions tab and download the `sanity-backup`
   artifact.
2. Unzip it to get `sanity-backup-<date>.tar.gz.enc`, then decrypt:
   `openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in sanity-backup-<date>.tar.gz.enc -out sanity-backup.tar.gz`
   (it prompts for the passphrase from the school records).
3. From `site/`, run
   `npx sanity dataset import sanity-backup.tar.gz production --replace`.

WARNING: `--replace` overwrites documents that have the same id. Restore into a
scratch dataset first if you only need one document back.

For longer or off-site retention, push the encrypted tarball to R2 in the
workflow instead of (or as well as) uploading the artifact.

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

## Nightly backups (2026-08-31)

`.github/workflows/backup.yml` exports the production dataset (documents +
assets) every night at 07:17 UTC and keeps each export as a 30-day workflow
artifact — the insurance the Studio trash cannot provide once Delete-forever
runs. It needs the `SANITY_BACKUP_TOKEN` repo secret (any read token); until
that secret exists the job skips with a notice. Restore:
`npx sanity dataset import <artifact>.tar.gz production --replace` from
`site/`, logged in.

**Restore drill (last run 2026-08-31, run 33344170164's artifact):** the
export was downloaded, extracted, and validated end-to-end locally — 239
documents, every ndjson line parses, 41 types, keystone docs present
(hubPage-home, page-home, siteSettings, feeSchedule, navigation), and 178
asset binaries in the tar exactly matching the 178 assets live (directory
37/37). **Do NOT rehearse the import into a scratch dataset on this plan:**
new datasets are created PUBLIC ("Private datasets are not available" — only
`production` is private), and the export holds the family directory PII, so
a scratch import would publish it. A full import rehearsal therefore waits
for a real restore (into `production`, which stays private) or a paid plan
with private datasets. Note the deploy/editor token cannot create datasets
either (`sanity.project.datasets/create` grant) — dataset creation needs
`sanity login` as an admin.
