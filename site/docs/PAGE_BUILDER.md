# The page builder — how the public site is composed

The entire public marketing site is **CMS-driven**. Every page is a Sanity `page`
document made of a fixed hero plus an ordered stack of **sections** chosen from a
fixed palette, rendered by Astro through the site's existing components. A volunteer
composes pages in the Studio (Squarespace-style); production stays static.

This is the single most important thing to understand about the codebase. The goal
was **board buy-in**: prove a non-technical volunteer can edit every page without
touching code. It is shipped and live.

## The `page` document

Defined in [`src/sanity/schemaTypes/documents/page.ts`](../src/sanity/schemaTypes/documents/page.ts).

```
page {
  title, slug,                 // slug is a STRING + regex, not Sanity's slug type
  hero,                        // a dedicated heroObject FIELD (not a section) — always exactly one, at top
  sections[],                  // the editable body: an ordered array of section objects
  archived,                    // soft delete: off the site, kept in the Studio (see "Archive & restore")
  seoPreview,                  // value-less; its custom input draws the search + share previews
  seoTitle, seoDescription, ogImage, hideFromSearch   // group "Search & sharing"
}
```

- **The hero is a fixed field, not the first array item.** The marketing `Header`
  overlay hard-requires exactly one hero at the top of every page, so making it a
  field means a volunteer cannot delete, reorder, or duplicate it.
- **Slug is a plain string validated by regex** (`^[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)*$`),
  because Sanity's built-in `slug` type slugifies away the slashes that nested routes
  like `classes/twos` depend on. Doc ids are `page-<slug>` with slashes turned to
  dashes (`page-classes-twos`). `home` maps to `/`.

## The section palette

**40 body section types + the hero** — the registry in
[`src/sanity/schemaTypes/sections/index.ts`](../src/sanity/schemaTypes/sections/index.ts)
is the source of truth for the count; each maps 1:1 to an existing presentational
component. The Studio's "+ Add section" picker is **grouped and searchable**
(`sectionInsertMenu()` in the registry): five volunteer-named bands — Words/photos/video,
Cards/facts/tables, From-your-lists, Money & enrolling, Banners/forms/contact — instead of
one 40-item list; the hub's page builder reuses the same bands trimmed to its smaller
palette, and a dev-time check throws if a new section type is not assigned to a group. The picker
opens on a **grid of thumbnails** (list view still available from its view switcher): every section
type shows a picture of itself at `/studio-thumbs/<sectionType>.jpg`. Regenerate those pictures with
**`npm run build && npm run studio-thumbs`** after you add a section type or change the site design
— `scripts/studio-thumbs.mjs` finds each type's `data-stype` wrapper in the built pages, screenshots
that band with Playwright, and writes a 600px JPEG per type (a type with no live instance gets a
plain brand placeholder, so the grid never breaks). A missing file falls back to the Studio's own
tile, so a stale folder degrades quietly. Some are **pull-based**:
they hold only config (heading + band) and fetch their content from a collection
at build time, hiding the whole band when there's nothing to show.

| Section type               | Renders through                   | Used for                                                                                                                      |
| -------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `heroObject` (page field)  | `Hero.astro`                      | every page's top banner (incl. home video + `<Underline>` accent word)                                                        |
| `proseSection`             | `Prose.astro`                     | body copy incl. the policy pages' rich-prose variant (h2/h3/lists; the old `legalPage` type is retired — docs/FIELD_AUDIT.md) |
| `cardGridSection`          | `FeatureCard.astro` grid          | every feature-card grid                                                                                                       |
| `statBandSection`          | `StatBlock.astro`                 | navy stat bands (home, why-wcp)                                                                                               |
| `ctaSection`               | `CtaBanner.astro`                 | every call-to-action banner                                                                                                   |
| `testimonialSection`       | `Testimonial` / `TestimonialWall` | quotes (source: featured / tag / all / manual refs)                                                                           |
| `teacherSection`           | `TeacherCard.astro`               | staff (refs `staff` docs, or inline)                                                                                          |
| `classCardsSection`        | `ClassCard.astro`                 | class cards (refs `class` docs, or inline)                                                                                    |
| `faqSection`               | `Faq` / `FaqItem.astro`           | FAQ groups (by category, or inline)                                                                                           |
| `schoolYearSection`        | `SchoolYear.astro`                | school-year timeline                                                                                                          |
| `tuitionTableSection`      | `TuitionTable.astro`              | tuition (auto from class/feeSchedule docs, or inline)                                                                         |
| `scheduleSection`          | `ScheduleTimeline.astro`          | a-day-at-wcp, class day schedules                                                                                             |
| `stepListSection`          | `StepList.astro`                  | numbered steps (co-op helper day)                                                                                             |
| `compareSection`           | `CompareTable.astro`              | comparison table (why-wcp)                                                                                                    |
| `tabsSection`              | `TabsSection.astro`               | accessible tabbed content (ARIA tabs, keyboard-nav, no-JS fallback)                                                           |
| `accordionSection`         | `AccordionSection.astro`          | collapsible rows (native `<details>`, no-JS)                                                                                  |
| `quickFactsSection`        | `QuickFactsSection.astro`         | icon + value + label facts (hours, ages, ratios)                                                                              |
| `pullQuoteSection`         | `PullQuoteSection.astro`          | one large statement / philosophy quote                                                                                        |
| `videoSection`             | `VideoSection.astro`              | YouTube/Vimeo, **click-to-load** (no iframe until clicked)                                                                    |
| `mapSection`               | `MapSection.astro`                | Google Map + directions, **click-to-load**                                                                                    |
| `countdownSection`         | `CountdownSection.astro`          | live countdown (aria-hidden ticker + date fallback)                                                                           |
| `gallerySection`           | `PhotoGallery.astro`              | photo galleries                                                                                                               |
| `storyTimelineSection`     | `StoryTimelineSection.astro`      | scroll-revealed "day in the life" moments along a dashed spine (A Day at WCP)                                                 |
| `splitMediaSection`        | split image+text rows             | virtual-tour alternating rows                                                                                                 |
| `noticeBarSection`         | cream announcement strip          | home announcement                                                                                                             |
| `contactDetailsSection`    | contact block                     | contact page (reads Site Settings)                                                                                            |
| `latestPostsSection`       | `PostCard.astro` grid             | **pull** — newest News posts                                                                                                  |
| `upcomingEventsSection`    | `EventCard.astro` grid            | **pull** — upcoming Events (hides when none)                                                                                  |
| `formSection`              | `ContactForm.astro`               | tour / contact / inquiry forms (fixed variants, or editor-written questions — see [Forms](#forms))                            |
| `newsletterSignupSection`  | `NewsletterSignup.astro`          | email signup                                                                                                                  |
| `tuitionCalculatorSection` | `TuitionCalculatorSection.astro`  | interactive monthly-cost estimator                                                                                            |
| `enrollmentCtaSection`     | `EnrollmentCtaSection.astro`      | enrollment steps + CTA band                                                                                                   |
| `reviewFormSection`        | `ReviewFormSection.astro`         | families submit a review/testimonial                                                                                          |
| `programCardsSection`      | card grid                         | **pull** — Program docs (enrichment / summer offerings)                                                                       |
| `boardMembersSection`      | people grid                       | **pull** — Board / leadership docs                                                                                            |
| `logoStripSection`         | logo row                          | **pull** — Partners **or** Accreditations (config picks which)                                                                |
| `campaignSection`          | progress bar                      | **pull** — every active Fundraising campaign                                                                                  |
| `jobsSection`              | posting list                      | **pull** — open Job postings (shows an empty-message when none)                                                               |
| `downloadsSection`         | resource list                     | **pull** — Resource docs (optionally one category)                                                                            |
| `albumSection`             | `PhotoGallery.astro`              | a referenced Photo album                                                                                                      |
| `instagramSection`         | `InstagramSection.astro`          | "Life inside WCP" bulletin-board gallery — **live IG feed** (build-time) with a curated fallback album                        |

**Reference vs. inline.** Sections that can pull from existing docs
(`testimonial`, `staff`, `class`, `faqItem`, `schoolYearEvent`) offer a `source`
toggle: reference the shared doc (single source of truth) or hold one-off inline
content. Callouts are an optional trailing field on content sections, not a
standalone section (a standalone one would double the band padding).

**Smart content formatting (no field, keyed off the text you type).** A couple
of section bodies auto-adapt so a volunteer never has to fight the styling:

- **`cardGridSection` card body → tap-to-call directory.** When a card body is a
  run-on list of phone numbers (`Emergency 911 · Police (513) 777-2231 · …`,
  middot/bullet/pipe separated), it renders as a scannable list of `label →
tel: link` rows instead of a wrapping paragraph. Parser + rules live in
  `src/lib/phone-list.ts` (needs 2+ numbers, so ordinary prose that mentions one
  number is left alone); rendered by `PhoneList.astro`.
- **`stepListSection` footnote → readable note when it's a sentence.** The
  footnote is a short display-font sign-off ("Total time: ~2.5 hours"). Because
  the display face is caps-only, a whole paragraph typed there becomes an
  all-caps shout, so a footnote over ~70 chars drops the flourish and renders as
  a left-aligned body-font note with an info icon (see `StepList.astro`).

### Forms

A **Contact form** section (`formSection` → `FormSection.astro` → `ContactForm.astro`)
always opens with the same standard boxes — first name, last name, email, and an
optional phone — so every message carries a reply address. What comes AFTER those boxes
has two modes:

1. **Variant (the default).** The section's _Form fields_ radio picks one of five fixed
   question sets (`general` / `enroll` / `waitlist` / `tour` / `teach`), listed in
   [FORMS.md](FORMS.md). This is what every live form uses today.
2. **Editor-written questions.** Fill the section's **Your own questions** array
   (`fields`, of type `formField`) and those questions replace the variant list. The
   _Form fields_ radio hides itself once the array holds a row, so the two modes can
   never look like they are both in play.

The mode is chosen by data, not by a flag: `fields` empty → mode 1, byte for byte the
markup the site has always emitted (`scripts/page-parity.mjs` pins this — the dataset
carries a live form section).

**A question (`formField`)** has a `label` (the question text, required, ≤120 chars), a
`kind` radio — `text` · `email` · `phone` · `textarea` · `select` · `checkbox` — an
`options` list of strings (visible and required only for `select`), and a `required`
boolean. **A form asks at most 12 questions**; the Studio validates it and
`normalizeCustomFields()` re-applies the cap at render time. Two form-level fields sit
beside the array: the existing **Button label** and **Thank-you message** serve the
editor-written form too (there is deliberately no second copy of them), and
**recipientNote** is an internal reminder for the board that is never rendered.

**Brand-lock still holds.** A question controls the words and the answer type, never the
design — no width, color, or layout field. Required questions get the native `required`
attribute plus `aria-required` and a visible `*`; optional ones are marked "(optional)",
matching the variant forms.

**Where an answer goes.** Each answer posts as `custom_<n>`, next to a hidden
`custom_<n>_label` (the question text) and, when required, `custom_<n>_req="1"`.
[`/api/contact`](../src/pages/api/contact.ts) folds every answered question into the
stored message as a `Question: answer` line, exactly like the variant extras — so the
submission doc, the notification email, and the Google Sheet row all need **no schema
change and no Apps Script change** for a new form. The shaping, the caps (2,000
characters per answer, 12,000 across all answers, 200 per label), and the
required-answer check are pure functions in
[`src/lib/custom-form-fields.ts`](../src/lib/custom-form-fields.ts), unit-tested in
`custom-form-fields.test.ts`. Answers are never logged. The same honeypot
(`company`) and the dormant Turnstile check apply, and the browser blocks a missing
required answer first through native HTML validation.

**Instagram "Life inside WCP".** `instagramSection` shows the school's Instagram as a
pinned-photo bulletin board. It pulls the **live feed at build time** via
`src/lib/instagram.ts` when the `INSTAGRAM_TOKEN` env var (a long-lived Instagram Graph
API token, from the **Instagram API with Instagram Login** product in a Meta developer
app — not oEmbed, which can't list an account's recent media) is set. It's read via
`import.meta.env` for the STATIC sections at build time — set it as a **GitHub Actions
repo secret** (`gh secret set INSTAGRAM_TOKEN`) AND a Cloudflare Worker secret
(`wrangler secret put INSTAGRAM_TOKEN`): the hub's social wall reads it at request time,
and `refresh-instagram-token.yml` pushes the refreshed token to both. Until it's
set (or if a fetch fails) the section shows the album picked in its **Fallback album**
field, so the home is never empty. No token, no third-party script
hits a visitor's browser.

Getting the token: the Instagram account must be a Business/Creator account linked to a
Facebook Page, added as an **Instagram Tester** on the Meta app (App roles → Instagram
testers → accept the invite from the Instagram account itself, or you'll hit "Insufficient
developer role"), then authorized through the app's "Generate access tokens" step to
produce a long-lived (60-day) token.

Because the site is static, both the feed content and the token need periodic rebuilds/
refreshing — both automated: `.github/workflows/refresh-instagram-token.yml` runs weekly,
refreshes the long-lived token via `graph.instagram.com/refresh_access_token` every 50
days (tracked in `.github/instagram-token-refreshed-at`, created on the first real refresh, since GitHub cron can't express
"every N days" directly), writes the new token back to the `INSTAGRAM_TOKEN` secret, and
triggers a `deploy.yml` rebuild so it — and any new posts — go live immediately. That
refresh/rebuild step needs a **PAT** (not the default `GITHUB_TOKEN`, which can't write
repo secrets or trigger other workflows) stored as the `GH_ACTIONS_PAT` secret, scoped to
this repo with "Secrets: write" and "Actions: write" permissions.

## Brand-lock

Shared building blocks live in
[`src/sanity/schemaTypes/objects/_shared.ts`](../src/sanity/schemaTypes/objects/_shared.ts):
`bandFields()` (background `white|grey|cream|navy` + compact only — the divider/"seam"
between bands is placed automatically by the renderer from adjacent band colours, not a
volunteer toggle, since 2026-07-17), `iconField()` (a **validated dropdown** of allowed
icon names, so a typo can never break the build), required `alt` on every image, and
constrained Portable Text.

There are **no** color, font, spacing, or layout fields anywhere, by design. A
volunteer chooses _what_ and _what order_ and fills in words and photos; the styling
is the components'. This is the guardrail that keeps new pages on-brand. **Do not add
design controls to section schemas.**

## The renderer

[`src/components/sections/SectionRenderer.astro`](../src/components/sections/SectionRenderer.astro)
is a dispatch table keyed on `_type`. Each section type has one thin **bridge**
component (e.g. `CardGridSection.astro`) that unpacks Sanity fields into the existing
component's props and wraps it in `<Section bg seam size labelledby={titleId}>`. The
renderer walks the sections once and sets each band's `seam` from the colours of the
band above (`effectiveBg`/`wantsSeam` in `section-helpers.ts`): a scallop/trim edge
appears only entering a strong band (cream or navy) whose colour changed, so pages
never become a layer-cake of dividers and no board member has to decide.

Two more code-owned doctrines live in the renderer (boldness pass 2026-07, both
public-only — gated on the `pageSlug` prop the hub never passes):

- **Photo moments** ([`src/lib/photo-moments.ts`](../src/lib/photo-moments.ts)): a
  per-page map splices code-owned bands between sections, fed by the build-time
  photo registry ([`src/lib/photo-registry.ts`](../src/lib/photo-registry.ts)) —
  deterministic picks from the already-public A Day gallery, Board alt text
  included, zero Sanity writes. Kinds: `strip` (3 taped prints), `interlude`
  (one full-bleed photo), `tuition-opener`, `heritage` (home's "Fifty-five
  Septembers" strip), `chooser` (home's self-segmentation rows), `septembers`
  (the About page's horizontal every-year-since-1969 rail,
  `SeptembersWall.astro`), and `visit` (home's "Come find us" address/phone/
  CTA block paired with a photo, replacing the Sanity `hp-visit` proseSection,
  which has no image slot). Each degrades gracefully if the build-time photo
  fetch fails.
- **The closing CTA**: when a page's FINAL band is a navy `ctaSection`, it stays
  navy with the amber crayon underline on the title's last word
  (`underlineAccent` — orange as accent, never a text surface; the 2026-07-19
  palette rule replaced the earlier amber drench closer). Stored tone is
  untouched; cream closers and mid-page navy CTAs are unaffected. `titleId`
  derives from the section `_key` and feeds both `Section labelledby` and
  `SectionHeader` so the `aria-labelledby` + heading-order accessibility gate holds.
- **Empty-state coaching (preview only, added 2026-08-28)**: a section that
  holds none of its own content renders in the PREVIEW as a muted dashed note
  that names the section and says what to add ("Add one card for each point.
  Give each card a title and a short line of text."). Before this, a volunteer
  who inserted a section from the visual picker landed back on a band of empty
  padding, which reads as a broken site rather than as a turn to type. The
  per-type emptiness tests and the sentences live in one registry,
  [`src/lib/section-coach.ts`](../src/lib/section-coach.ts); the band itself is
  [`SectionCoach.astro`](../src/components/sections/SectionCoach.astro). It is
  **preview-only, and provably so**: `SectionRenderer` is the only caller and it
  calls the registry only when `editDoc` is set, which only the draft-mode
  preview routes pass. The live site and the Family Hub keep byte-identical
  markup, so an empty section behaves on the live site exactly as it always did
  (usually nothing at all). Do not move this into a section component. The
  registry covers only the types whose emptiness shows in the section's own
  data; the "pull" sections that fetch a collection inside their component
  (Latest news, Upcoming events, Programs, Board, Logo strip, Fundraising,
  Downloads, Tuition calculator, Instagram) hide themselves when the collection
  is empty and are left alone. Add a new section type to the registry when you
  add it to the palette. `src/lib/section-coach.test.ts` pins the rule.

### The Act II section grammar (redesign 2026-07-18, public only)

The renderer wraps every public section in a zero-box `display: contents` div
carrying `data-stype="<sectionType>"`, and the "Construction Paper" grammar in
`globals.css` composes on it — **content is untouched; only rendering changes**:

- **Header treatments by section TYPE.** Every printed public eyebrow renders
  as a taped paper chip (2026-07-19: the chip look went universal, not just the
  data sections). Data/list/form sections (cardGrid, tuitionTable, form,
  stepList, faq, schedule, quickFacts, compare, tabs, accordion, downloads,
  jobs, newsletterSignup, tuitionCalculator, contactDetails, campaign)
  additionally render a LEFT-anchored header. Photo/story/emotional sections
  render centered with the eyebrow retired (the field stays editable in the
  Studio; it just no longer prints on those types).
- **The sheet list.** `cardGridSection` card grids render as a ruled
  "sign-up sheet" list (2 columns on wide screens) instead of icon-card grids.
  A grid gets REAL cards back only via `CARDGRID_KEEP_CARDS` in
  [`src/lib/page-doctrine.ts`](../src/lib/page-doctrine.ts) (page slug +
  section `_key`; currently the month/tradition grids on /why-wcp and
  /co-op-life).
- **The stat strip.** `statBandSection` renders as one wrapped fact row on the
  navy band, not boxed tiles.
- **Class-page color ownership.** `/classes/*` sets `--page-accent(-ink)` so
  taped chips and sheet icons carry that class's brand color.

The page doctrine in [`src/lib/page-doctrine.ts`](../src/lib/page-doctrine.ts)
also grew render-time registries (each entry is a STOPGAP with a close-out row
in [PENDING.md](PENDING.md)): `SECTION_DROP` (hide by `_key` or
`type:<sectionType>`), `SECTION_HOIST` (reorder to front), `SECTION_INSERT_AFTER`
(splice a synthetic section after an anchor key — e.g. the "When each class
meets" class cards on /a-day-at-wcp, which use a `pullAll` flag to fetch class
docs at build), `SECTION_APPEND`, and `SECTION_HEADER_OVERRIDES` (retitle a
section header). Photo-moment `after` anchors accept a section `_key` (preferred,
survives reorders) or a legacy index.

- **Images:** [`src/lib/image.ts`](../src/lib/image.ts) builds responsive URLs from
  Sanity's CDN via `@sanity/image-url`; `SanityImage.astro` emits `<img srcset>`. The
  five media components (Hero, TeacherCard, PhotoGallery, ClassCard, splitMedia) each
  gained one optional `sanityImage` prop that swaps the local `<Image>` for the Sanity
  `<img>` with identical wrapper classes — reuse, not rebuild.
- **Rich text:** [`src/lib/portable-text.ts`](../src/lib/portable-text.ts) via
  `@portabletext/to-html`.
- **Preview-aware links:** `withBase(href, linkBase)` in
  [`src/lib/utils.ts`](../src/lib/utils.ts) prefixes internal links with `/preview`
  inside the Presentation preview so click-through stays in draft mode. It is threaded
  through the renderer and the shared `Header`/`Footer`/`NavList` chrome.
- **Stega vs. enum logic:** in the `/preview` path, Sanity's stega encoding hides a
  ~1KB run of invisible marker characters in every string so click-to-edit knows which
  field to open. That is correct for _displayed_ text but breaks any string used in
  **rendering logic** — e.g. `CtaBanner` does `tone === 'navy'`, which is `false` once
  `tone` carries stega markers, so the preview silently picks the wrong branch (the
  navy CTA rendered cream in preview only). Dropdown/enum fields that drive rendering
  are therefore excluded from stega by the `filter` /`NON_STEGA_FIELDS` list in
  [`src/lib/cms-preview.ts`](../src/lib/cms-preview.ts). **When you add a new enum field
  that a component compares or maps on, add it to that list.** Display strings stay
  encoded so click-to-edit keeps working.
- **Section-level controls in the preview (2026-08-24):** stega only covers TEXT, so the
  preview routes also pass `editDoc` (the doc id + type) into `SectionRenderer` /
  `HubSectionedBody`, which wraps each section in an element carrying an explicit
  `data-sanity` attribute (`src/lib/preview-edit-attr.ts`, built on
  `@sanity/visual-editing/create-data-attribute`). The Presentation overlay then outlines
  the whole section and shows the array controls — move, duplicate, delete, insert — right
  on the page. Two rules: the wrapper must be a REAL block box (the `display: contents`
  grammar wrapper has no rect to outline, so the edit wrapper is a separate plain div), and
  the live public/hub routes never pass `editDoc` (no attribute ships outside `/preview`).

## Seeding & bulk edits

Pages and their content live in Sanity, but they can be authored/edited in bulk from code
via the `pagebuilder-lib.mjs` helpers (`hero`, `cardGrid`, `statBand`, `stepList`,
`faqSection`, `testimonials`, `cta`, `sh`, `card`, `act`, ...) and a small script.
`scripts/migrate-pagebuilder.mjs` seeded the whole site originally (idempotent,
`createOrReplace` with `page-<slug>` ids). For _additive_ changes to a live site, prefer a
surgical script like `scripts/seed-site-expansion.mjs` (2026-07-14): it `set`s single fields
and `insert`s new sections guarded by stable `_key`s (idempotent, non-destructive), and only
`createOrReplace`s genuinely new pages. **Never re-run the full migrate against a live
dataset** — it clobbers Board edits. Note the gotcha the expansion script documents: only the
`home` page had an active draft, so its hero title is `set` on both `page-home` and
`drafts.page-home` and no home _sections_ are touched. New pages added this way (e.g.
`/safety`, `/reviews`) must also be added to `tests/routes.ts` so the a11y/reflow/smoke
suites cover them.

## Routing

- **`src/pages/[...slug].astro`** (static, `prerender = true`): `getStaticPaths()`
  reads every `page` slug from Sanity at build time and emits one static route each.
  `home` → `/`; nested slugs keep their slashes via the rest param. Fetches
  `PAGE_BY_SLUG_QUERY` (page + hero + all sections with refs dereferenced in one
  round-trip — see [`src/lib/queries.ts`](../src/lib/queries.ts)).
- **`src/pages/preview/[...slug].astro`** (SSR, `prerender = false`, `noindex`): the
  same query through the draft-aware, stega-enabled `cms-preview.ts` client. One file
  serves every page's preview. The live-refresh doc id comes from the query's `_id`,
  never derived as `page-<slug>` — that convention only holds for script-seeded pages,
  and Studio-created pages (random ids) got no auto-refresh (Babies test, 2026-08-24).
- **Slug guards (2026-08-24, same test):** `page.slug` validation now rejects a first
  segment that collides with a code-owned route or build-output folder
  (`RESERVED_PAGE_SLUGS` in `documents/page.ts` — update it when adding a top-level
  route or `public/` folder), and a slug already used by another page (async
  uniqueness check, same pattern as `hubPage`).
- **Safe rename (2026-08-27):** changing the slug of an already-published `page` (or `post`)
  no longer breaks inbound links. The stock Publish action is wrapped by
  `src/sanity/actions/slugRedirect.tsx`, which files a `redirect` document (old path → new
  path, 301) before publishing and toasts the editor. Path shaping is shared with the
  build-time redirect reader via `src/lib/redirects.ts`. See [REDIRECTS.md](REDIRECTS.md).

**Refresh in the preview.** The section content is server-rendered Astro, so it can't
re-render on the client the way a React app would. Instead
[`VisualEditingOverlay.tsx`](../src/components/preview/VisualEditingOverlay.tsx) soft-
refetches the current preview URL and swaps in the fresh `#main` — no full reload, no
scroll jump, and click-to-edit keeps working (the swapped HTML is draft-fetched with
stega). **What triggers it:**

- **Auto (live events):** the overlay opens an `EventSource` to
  [`/preview/live`](../src/pages/preview/live.ts), a server-side SSE proxy on the
  Worker. The token can't go to the browser (draft reads need it), so the Worker holds
  `SANITY_TOKEN`, subscribes to Sanity's **listen API** (SSE mutation events) with a
  GROQ filter — this page's doc (draft or published id) OR any shared/non-page type,
  since staff/classes/FAQs/settings can appear on any page — and forwards a tiny
  `change` signal per relevant edit. Edits appear a moment after you pause typing.
- **Manual:** the comlink `refresh` handler — the preview's **Refresh** (⟳) button
  (`source: 'manual'`), kept as the fallback, plus the `source: 'mutation'` edit event
  **if** the Studio ever sends it (deprecated, silent in Sanity 6.x).

**Cost (why it's built this way):** a listen connection counts as ONE Sanity API
request however long it stays open, and its events are free — so an open preview tab
costs ~nothing and an edit costs one page refetch. This replaced (2026-07-14) a
`/preview/refresh-signal` poll that ran an uncached GROQ query every 1.5s and was the
site's dominant quota driver. **Never reintroduce an interval poll here.** Connection
drops (Sanity rotates listeners, Workers recycle) are fine: the browser's `EventSource`
auto-reconnects, and the endpoint aborts its upstream Sanity connection whenever the
preview tab goes away. The endpoint requires the Presentation perspective cookie and
carries no content in either direction — just "something changed".

## Navigation

The header/footer menus are a Sanity `navigation` singleton (the "Menus" doc:
`mainNav`, `footerColumns`, `legalNav`). [`src/lib/nav.ts`](../src/lib/nav.ts)
`resolveNavigation()` turns it into the shapes `src/data/nav.ts` already exports,
falling back to that static file if the Studio has no menus, so the site never loses
its nav. `Header`/`Footer` call `getNavigation()` (same pattern as `getSiteSettings`).

### Chrome options (added 2026-08-27)

Four additive fields let the Board adjust the header/footer chrome. **Every one of
them is an override with a code fallback, so an untouched dataset renders the
markup it always did** — `node scripts/page-parity.mjs compare` is the proof and
must stay at 27/27.

- **`navigation.headerCta`** (`{ show, label, linkType, page, url }`, Header menu
  group) — the one header button. `resolveHeaderCta()` in
  [`src/lib/nav.ts`](../src/lib/nav.ts) returns `{ show: raw.show !== false }` plus a
  `label`/`href` only when the Board typed one; `Header.astro` keeps
  `/virtual-tour#sec-pp-tour-form`, "Schedule a Tour" (big overlay + mobile panel) and
  "Book a Tour" (compact bar) as its defaults. The mobile bar's one-word "Tour" is
  code-owned whatever the label says: it is a 320px fit, not a wording choice.
- **`siteSettings.showPhone` / `showEmail` / `showSocials`** — hide those details in
  the header AND footer only. They resolve through `getSiteSettings()` into
  `site.show.{phone,email,socials}` (fallbacks in
  [`src/data/site.ts`](../src/data/site.ts), all `true`). Unset means shown, so
  neither field carries an `initialValue` and only an explicit `false` hides anything.
  The Visit Us page, the contact form and the structured data are untouched.
- **`siteSettings.logoOverride`** (image + `alt`, Identity group) — replaces the
  committed `wcp-logo-navy/white.png` pair in all three header renderings, at the same
  width/height/classes. One uploaded picture serves both themes (a Sanity image has no
  light/dark variant), so it drops the `dark:hidden`/`dark:block` pair and renders one
  plain `<img>` off the Sanity CDN. The footer logo is deliberately NOT overridden: it
  sits on navy and only ever wants the white lockup.

The Studio guide entries are "Change the phone, email, or address" and "Edit the
menus" in [`src/sanity/guides/content.ts`](../src/sanity/guides/content.ts).

## Pages as first-class objects (added 2026-08-27)

The Presentation tool's page list
([`src/sanity/components/PreviewNavigator.tsx`](../src/sanity/components/PreviewNavigator.tsx),
one factory with a `public` and a `hub` flavor) is where a page is managed, not just
opened. Four capabilities, all additive — an untouched dataset renders the same HTML,
and `node scripts/page-parity.mjs compare` must stay at 27/27.

**1. Duplicate** (row `⋯` menu, both flavors). Reads the page's DRAFT twin when there
is one (the newest words), regenerates every nested `_key` (two array members with one
key is a Studio-level error), strips `_id`/`_rev`/`_createdAt`/`_updatedAt`, titles the
copy "… copy", and takes the first free `<slug>-copy`, `<slug>-copy-2`, … A hub copy
also drops `hubKey`: two documents claiming one built-in hub page would make the page
a coin toss. The copy is created as `drafts.<uuid>` and opened in the edit panel.

**2. Archive & restore** — a real trash, and NOT the same thing as "Recently deleted".

- `archived` (boolean) on `page` and `hubPage`. No `initialValue`, so existing
  documents have no value at all.
- Every live-site query tests `archived != true`, never `== false`: a page made before
  the field stays visible. The filters live in
  [`src/lib/queries.ts`](../src/lib/queries.ts) (`ALL_PAGE_SLUGS_QUERY`, which is
  `getStaticPaths`, plus `HUB_PAGE_QUERY` and `HUB_PAGE_BY_SLUG_QUERY`) and in the hub
  search index (`family-hub/api/search-index.ts`). `PAGE_BY_SLUG_QUERY` deliberately
  does NOT filter: the route list already leaves an archived page unbuilt, and the
  Studio preview must still render it so an editor can look before restoring.
- Menus: a page link carries `"pageArchived": page->archived`, and
  [`nav.ts`](../src/lib/nav.ts) `resolveNavigation()` drops those links (and a dropdown
  left with nothing in it). It cannot be filtered in GROQ — a dropped link would look
  exactly like a dangling reference, which the resolver turns into a warning and a link
  to the home page.
- The row action PATCHES both twins (`archived: true`, or `unset` to restore). It never
  deletes: a delete is refused while anything references the page, and it loses the
  words. **"Recently deleted"** (`trashedItem` + `src/sanity/actions/archive.tsx`) is
  still the way to remove a page for good.
- Archived rows collect in an "Archived" group at the bottom of both lists.

**3. The "Search & sharing" panel.** One shared helper,
[`schemaTypes/objects/seoFields.ts`](../src/sanity/schemaTypes/objects/seoFields.ts),
builds the whole group in one order. It REUSES fields a type already has rather than
renaming them (a rename moves the data and loses it): `page.seoTitle` → title,
`page.seoDescription` → description, `page.ogImage` → image, and only
`hideFromSearch` is new. `hubPage` gets no such group — hub pages sit behind the family
password, so SEO fields there would be dead controls. At the top of the group,
[`SeoSnippetInput.tsx`](../src/sanity/components/SeoSnippetInput.tsx) draws a live
Google result and share card from the document's own values. It is an INPUT, so
`useFormValue` is allowed; a standalone document VIEW (`SeoPreviewPane`) may not call
it (see the gotcha in CLAUDE.md). `hideFromSearch` adds
`<meta name="robots" content="noindex, nofollow">` in `[...slug].astro`
(BaseLayout's `noindex` + `nofollow` props) and drops the page from the sitemap: the
`sitemap()` filter in `astro.config.mjs` reads the hidden slugs from Sanity at build
time, fail-safe like the CMS redirect read beside it.

**4. Menu membership and order by drag** (public flavor only; the hub menu is a
different document and is left alone). Each eligible row has a `⋮⋮` grip — a separate
element from the row button, so a drag can never be read as a click. Dragging inside
"In the menu" reorders the header menu; dragging between the two groups adds or removes
the page. Native HTML5 drag events, no new dependency. Rules: only TOP-LEVEL membership
moves, an item with children keeps its children, removing a top-level item takes its
children out with it, and adding appends a new `navLink` referencing the page at the
drop position. Home is pinned and has no grip; a page that is in the menu only inside a
dropdown has no grip either. **The write goes to the DRAFT Menus document when one
exists, and to the published one when it does not** — the same document the Menus
editor would write, and the reason the "In the menu" group reads the draft first. With
no draft, the drag therefore edits the live menu, which goes out on the next rebuild.
The list redraws optimistically and the `client.listen` refetch settles it.

## Saved sections (added 2026-08-28)

A `sectionPreset` document is one filled-in section, kept so it can be dropped onto
another page. Schema:
[`schemaTypes/documents/sectionPreset.ts`](../src/sanity/schemaTypes/documents/sectionPreset.ts).

**The storage shape is an ARRAY of every body section type, capped at one**
(`validation: R.max(1)`), not a single object field. Sanity has no union-object field, and
forty per-type fields is not a form. The array buys three things for free: the same
grouped `sectionInsertMenu` picker the page builder uses, the ordinary section FORM (so a
saved section is editable in place, not a frozen blob), and the type's own preview.
`sectionType` is a read-only string copied out of that array on capture, so a list can
label a preset without opening it.

**Capture: "Save a section as preset…"**
([`actions/saveSectionPreset.tsx`](../src/sanity/actions/saveSectionPreset.tsx)), a
document action on `page` only. The ⋮ menu on a section item would be the natural home,
but neither the array-input item menu nor the visual-editing overlay toolbar is open to a
plugin — a document action is the surface we own. The action returns a
`DocumentActionDescription.dialog` of `type: 'dialog'` listing the DRAFT's sections by
number, kind, and first words, plus a name box. Picking one creates a PUBLISHED
`sectionPreset` (a preset is a tool, not content; nothing about it reaches the website, so
a publish step would be ceremony). Every nested `_key` is regenerated on the way in.

**Insertion: the "Saved sections" group** at the bottom of the PUBLIC
[`PreviewNavigator`](../src/sanity/components/PreviewNavigator.tsx), collapsed by default.
The page form's own "+ Add section" picker can only offer schema TYPES, so a document has
no way in there; the navigator is the one surface that knows which page the preview is on.
**The current page is resolved from the navigator's own rows**: `pending?.href ?? current`
(the sticky-navigation intent, else `usePresentationParams().preview`), matched against
`row.href` exactly, then by `endsWith` — the same rule the row highlight uses. With no
match the Add buttons are disabled and the panel says "Open a page first". Adding
`setIfMissing({sections: []})` + `append`s the section to the page's DRAFT, creating that
draft from the published document first when there is none (`_rev`/`_createdAt`/
`_updatedAt` stripped). Keys are regenerated again, so the same preset can be added twice.
A preset is a COPY: editing it never touches pages that already have it. The list
live-refreshes through the existing `client.listen` (which now also watches
`sectionPreset`), and warns past 30 presets rather than blocking.

Structure: **Saved sections** sits under Pages in `publicStructure`
(`savedSectionsGroup`, pane id `section-presets`), ordered by title.

## Check this page (added 2026-08-28)

A second `page`-only document action,
[`actions/checkPage.tsx`](../src/sanity/actions/checkPage.tsx), running a courtesy
read-through of the DRAFT in a dialog. **It never blocks publish** and it is not
validation; Sanity's own required-field rules already do that job. All the logic is pure
and unit-tested in [`src/lib/page-checks.ts`](../src/lib/page-checks.ts)
(`checkPage(doc, config, knownSlugs)` → three `CheckGroup`s); the action only fetches the
page slugs and renders the answer.

**`page-checks.ts` is a PORTABLE canonical file** (library of record:
`ncs-astro-sanity-starter`, card 25 in its `PORTS.md`) and imports nothing, so everything
repo-specific arrives as a `PageCheckConfig` from
[`src/sanity/pageBuilderConfig.ts`](../src/sanity/pageBuilderConfig.ts): the builder array
names (`sections`), the hero header unit (`checkEmpty: true` — a WCP hero carries the page
heading, so an empty one is a real finding), the self-filling section list, and
`CODE_OWNED_PATHS`. That file also owns `SECTION_HOST_TYPES` / `PAGE_BUILDER_TYPES`, which
is what `sanity.config.ts` uses to decide which document types get these two actions, and
which builder array `saveSectionPreset.tsx` lists. **Change the lists there, never in
`page-checks.ts`.** The unit tests stay local (`src/lib/page-checks.test.ts`, Vitest)
because the canonical suite is written for `node:test`.

The three heuristics:

1. **Photos with no description.** Walks for any object carrying `asset._ref`, then looks
   for a non-empty `alt`/`altText` on the image itself, on its parent, or at the parent's
   `<key>Alt`/`<key>AltText`. That covers all three ways this repo models alt text
   (`figureImage`'s sibling `alt`, the hero's `imageAlt`, an inline `alt`).
2. **Sections with nothing typed in them.** A section with no non-empty string anywhere,
   ignoring Sanity's `_`-keys and a list of setting-ish keys (`variant`, `tone`, `layout`,
   …) whose enum initial values would otherwise silence the check forever. Sections that
   fill themselves from a list (Teachers, FAQs, News, Tuition, …) are exempt.
3. **Links worth a look.** Every same-site path written anywhere in the hero or sections,
   compared by FIRST SEGMENT against the `page` slugs plus the code-owned routes
   (`CODE_OWNED_PATHS` in `pageBuilderConfig.ts`, mirroring `RESERVED_PAGE_SLUGS` in
   `page.ts`). First-segment
   matching is deliberate: `/events/fall-fair` and `/curriculum/twos.pdf` are real
   addresses no `page` document owns. It under-reports on purpose.

If the slug fetch fails the link group is dropped and the other two still run.

## Editing in the Studio

- **Presentation Tool** ([`src/sanity/resolve.ts`](../src/sanity/resolve.ts)) maps
  every `page` to its `/preview/[...slug]` route, so a live preview opens beside the
  editor and any text or photo is click-to-edit (stega).
- **Structure** ([`src/sanity/structure.ts`](../src/sanity/structure.ts)) surfaces
  "Pages (section builder)" and the "Menus" singleton. Because `page` is not a
  singleton, the default **＋ Create** gives volunteers new-page creation — and since
  2026-08-24 the ＋ menu offers **starting layouts**
  ([`src/sanity/pageTemplates.ts`](../src/sanity/pageTemplates.ts), initial-value
  templates like the announcement ones): _standard info page_, _photo story page_,
  _event or program page_, and a hub _info page_, each pre-filled with sections and
  [bracketed] placeholder copy so nobody starts from a blank canvas. Template array
  items carry explicit `_key`s.
- **In-Studio help:** [`src/sanity/guides/content.ts`](../src/sanity/guides/content.ts)
  holds plain-language walkthroughs ("Build or edit a page", "Edit the menus", etc.)
  rendered in a read-only Help & Guide pane. "Where in the Studio" breadcrumb cards are
  clickable (2026-08-24): a `path` block's optional `link` (`PathLink`: a doc intent, a
  structure pane id, or a tool name, with an optional workspace swap) renders a
  "Take me there" card in `GuideView.tsx` — navigation goes through
  `router.navigateUrl`, never a raw href (hash routing; same rule as WelcomePane's
  TaskCard). The ~40 guides are grouped under titled
  dividers by `guide.category` (the union type makes a missing/typo'd category a compile
  error) — added 2026-08-24 because one flat list was overwhelming to scan. Both
  workspaces get EVERY guide, but the group order is per-workspace
  (`GUIDE_CATEGORY_ORDER`): each side leads with its own work, and a load-time guard
  throws if a reorder ever drops a category.

## News / blog

Separate from the page builder but built on the same pieces. A `post` document
([`documents/post.ts`](../src/sanity/schemaTypes/documents/post.ts)) has a title,
slug, `publishedAt`, category, author (→ staff), cover, excerpt, SEO fields, and a
rich `postBody` (headings/lists/links + inline images, rendered by `renderPostBody`
in [`portable-text.ts`](../src/lib/portable-text.ts)).

- **Routes:** `/news` ([`news/index.astro`](../src/pages/news/index.astro)) + `/news/page/[page]`
  (pagination, `NEWS_PAGE_SIZE` in [`lib/news.ts`](../src/lib/news.ts)), the article at
  [`news/[slug].astro`](../src/pages/news/[slug].astro), an RSS feed at
  [`news/rss.xml.ts`](../src/pages/news/rss.xml.ts), and a draft preview at
  `preview/news/[slug].astro`. `PostArticle.astro` renders both the public post and the
  preview so they never drift.
- **Homepage:** the `latestPostsSection` builder section pulls the newest posts
  automatically (bridge fetches them at build time — the editor only sets a heading and
  count).
- **Publish date:** a post's `publishedAt` still gates visibility (the index query filters
  `publishedAt <= now()`), so a post dated in the future stays hidden until then — but the
  board publishes immediately; Sanity **scheduled publishing is off** (a paid feature, see
  SANITY.md).
- Slug reserves the word `page` so it can't collide with the `/news/page/<n>` routes.

## Events

An `event` document ([`documents/event.ts`](../src/sanity/schemaTypes/documents/event.ts)):
title, start/end datetimes, all-day flag, location, category, description, optional CTA.
The static `/events` page ([`events.astro`](../src/pages/events.astro)) lists upcoming
events (query filters `coalesce(endDate, startDate) >= now()`), and an
`upcomingEventsSection` builder section shows the next few on any page (hides when empty).
Date/time display and the "Add to Google Calendar" links live in
[`lib/events.ts`](../src/lib/events.ts) — rendered in the school's Eastern timezone since
Sanity stores datetimes in UTC. Distinct from `schoolYearEvent` (the co-op timeline) and
the gated Family Hub calendar.

## Migration / seeding

[`scripts/migrate-pagebuilder.mjs`](../scripts/migrate-pagebuilder.mjs) (with helpers
in `pagebuilder-lib.mjs`) transcribes all pages and the nav into Sanity. It is
**idempotent** — assets are uploaded once (tracked in `scripts/.asset-map.json`),
pages are `createOrReplace` by `page-<slug>` id — so it is safe to re-run. Run it with
the build token available:

```sh
node scripts/migrate-pagebuilder.mjs
```

## Drag-to-reorder (orderable lists)

`class`, `testimonial`, `schoolYearEvent`, `coopRole`, `faqItem`, `hubDocument`,
`program`, `boardMember`, `partner`, `credential`, `jobPosting`, and `resource` use
[`@sanity/orderable-document-list`](https://www.sanity.io/plugins/orderable-document-list):
their Studio lists have drag handles, and the site renders them in that order. Each
schema has `orderRankField()` + `orderRankOrdering`, their old `order` number field is
hidden, `structure.ts` uses `orderableDocumentListDeskItem`, and the site queries sort by
`order(orderRank)` (FAQs drag-order within their category grouping — `FAQ_ITEMS_QUERY`
sorts by `coalesce(orderRank, "~")` inside each category). Existing docs were seeded from
the old `order` values via
[`scripts/seed-order-ranks.mjs`](../scripts/seed-order-ranks.mjs) (LexoRank, idempotent),
so ordering was preserved with no downtime — **run that script once after adding a new
orderable type.**

## Live availability badges & structured data

Two enrollment-funnel features ride on top of the builder:

- **"Spots open / Waitlist" badges** on class cards (`ClassCard.astro`). The enrollment
  chair keeps a tiny Google Sheet (tab `Availability`, columns `class` + `status` with
  values `open|few|waitlist|full`; ID pasted into Site Settings). Because builder pages
  are static, the badges hydrate client-side from `/api/availability` — an SSR route
  that reads the sheet server-side via `src/lib/gsheets.ts` and caches 5 minutes — so a
  sheet edit shows within minutes with **no rebuild**. Badges are colored-dot + neutral
  text (never colored-text-on-tint) and stay hidden on any failure. Contract covered by
  `tests/availability.spec.ts` (mocked API).
- **JSON-LD**: every public page emits a `Preschool` (LocalBusiness) block from Site
  Settings + code-side identity facts (`StructuredData.astro`: geo, hours, priceRange,
  hasMap, areaServed — Board-uneditable on purpose), and the page route aggregates every
  `faqSection`'s Q&As into **one** `FAQPage` block per page (Google requires a single
  block; the per-section emission was removed 2026-07-17). `/events` adds an `Event`
  block per upcoming event and `/news/[slug]` a `BlogPosting` block.

## How a change goes live

A volunteer publishes in the Studio → the Sanity webhook fires
`repository_dispatch` → the Deploy workflow rebuilds and redeploys → the static page
updates ~1-2 minutes later. The Presentation preview reflects the draft instantly; the
public page waits for the rebuild. See [SANITY.md](SANITY.md) for the webhook.

## Copy that lives outside the page builder

Almost every public string is a page-builder section a volunteer edits directly. A few are
not, because they belong to code-owned utility pages, and those are Board-editable too:

| Wording                                       | Studio home                                  |
| --------------------------------------------- | -------------------------------------------- |
| Thank-you page (and its tour-request variant) | Small bits of wording → After a form is sent |
| Page-not-found chip, heading, explanation     | Small bits of wording → Page not found       |
| Footer sign-off ("See you at drop-off!")      | Small bits of wording → Footer               |
| Google rating, review count, listing link     | Site Settings → Social & reviews             |
| Class hours for Google's listing (schema.org) | Site Settings → Location                     |

Every one of those falls back to the string committed in the page, so clearing a field
restores the default rather than emptying the page. The tour-request variant of the
thank-you copy is handed to its client script as `data-` attributes rather than
interpolated into it, which keeps that script a plain module.

**What stays code-owned on purpose:** the tour-first hero CTA and its proof line (a
conversion decision with evidence behind it — see the Act II doctrine in CLAUDE.md), the
header/footer navigation IA, and every layout, colour and spacing choice. Brand-lock gives
volunteers content control, not design control.
