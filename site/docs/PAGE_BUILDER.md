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
  seoTitle, seoDescription, ogImage
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

35 body section types + the hero. Registered in
[`src/sanity/schemaTypes/sections/index.ts`](../src/sanity/schemaTypes/sections/index.ts);
each maps 1:1 to an existing presentational component. Some are **pull-based**:
they hold only config (heading + band) and fetch their content from a collection
at build time, hiding the whole band when there's nothing to show.

| Section type              | Renders through                   | Used for                                                               |
| ------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| `heroObject` (page field) | `Hero.astro`                      | every page's top banner (incl. home video + `<Underline>` accent word) |
| `proseSection`            | `Prose.astro`                     | body copy; legal pages use the rich-prose variant (h2/h3/lists)        |
| `cardGridSection`         | `FeatureCard.astro` grid          | every feature-card grid                                                |
| `statBandSection`         | `StatBlock.astro`                 | navy stat bands (home, why-wcp)                                        |
| `ctaSection`              | `CtaBanner.astro`                 | every call-to-action banner                                            |
| `testimonialSection`      | `Testimonial` / `TestimonialWall` | quotes (source: featured / tag / all / manual refs)                    |
| `teacherSection`          | `TeacherCard.astro`               | staff (refs `staff` docs, or inline)                                   |
| `classCardsSection`       | `ClassCard.astro`                 | class cards (refs `class` docs, or inline)                             |
| `faqSection`              | `Faq` / `FaqItem.astro`           | FAQ groups (by category, or inline)                                    |
| `schoolYearSection`       | `SchoolYear.astro`                | school-year timeline                                                   |
| `tuitionTableSection`     | `TuitionTable.astro`              | tuition (auto from class/feeSchedule docs, or inline)                  |
| `scheduleSection`         | `ScheduleTimeline.astro`          | a-day-at-wcp, class day schedules                                      |
| `stepListSection`         | `StepList.astro`                  | numbered steps (co-op helper day)                                      |
| `compareSection`          | `CompareTable.astro`              | comparison table (why-wcp)                                             |
| `tabsSection`             | `TabsSection.astro`               | accessible tabbed content (ARIA tabs, keyboard-nav, no-JS fallback)    |
| `accordionSection`        | `AccordionSection.astro`          | collapsible rows (native `<details>`, no-JS)                           |
| `quickFactsSection`       | `QuickFactsSection.astro`         | icon + value + label facts (hours, ages, ratios)                       |
| `pullQuoteSection`        | `PullQuoteSection.astro`          | one large statement / philosophy quote                                 |
| `videoSection`            | `VideoSection.astro`              | YouTube/Vimeo, **click-to-load** (no iframe until clicked)             |
| `mapSection`              | `MapSection.astro`                | Google Map + directions, **click-to-load**                             |
| `countdownSection`        | `CountdownSection.astro`          | live countdown (aria-hidden ticker + date fallback)                    |
| `gallerySection`          | `PhotoGallery.astro`              | photo galleries                                                        |
| `splitMediaSection`       | split image+text rows             | virtual-tour alternating rows                                          |
| `noticeBarSection`        | cream announcement strip          | home announcement                                                      |
| `contactDetailsSection`   | contact block                     | contact page (reads Site Settings)                                     |
| `latestPostsSection`      | `PostCard.astro` grid             | **pull** — newest News posts                                           |
| `upcomingEventsSection`   | `EventCard.astro` grid            | **pull** — upcoming Events (hides when none)                           |
| `formSection`             | `ContactForm.astro`               | tour / contact / inquiry forms                                         |
| `newsletterSignupSection` | `NewsletterForm.astro`            | email signup                                                           |
| `programCardsSection`     | card grid                         | **pull** — Program docs (enrichment / summer offerings)                |
| `boardMembersSection`     | people grid                       | **pull** — Board / leadership docs                                     |
| `logoStripSection`        | logo row                          | **pull** — Partners **or** Accreditations (config picks which)         |
| `campaignSection`         | progress bar                      | **pull** — the one active Fundraising campaign                         |
| `jobsSection`             | posting list                      | **pull** — open Job postings (shows an empty-message when none)        |
| `downloadsSection`        | resource list                     | **pull** — Resource docs (optionally one category)                     |
| `albumSection`            | `PhotoGallery.astro`              | a referenced Photo album                                               |

**Reference vs. inline.** Sections that can pull from existing docs
(`testimonial`, `staff`, `class`, `faqItem`, `schoolYearEvent`) offer a `source`
toggle: reference the shared doc (single source of truth) or hold one-off inline
content. Callouts are an optional trailing field on content sections, not a
standalone section (a standalone one would double the band padding).

## Brand-lock

Shared building blocks live in
[`src/sanity/schemaTypes/objects/_shared.ts`](../src/sanity/schemaTypes/objects/_shared.ts):
`bandFields()` (background `white|grey|cream|navy` + seam + compact only),
`iconField()` (a **validated dropdown** of allowed icon names, so a typo can never
break the build), required `alt` on every image, and constrained Portable Text.

There are **no** color, font, spacing, or layout fields anywhere, by design. A
volunteer chooses _what_ and _what order_ and fills in words and photos; the styling
is the components'. This is the guardrail that keeps new pages on-brand. **Do not add
design controls to section schemas.**

## The renderer

[`src/components/sections/SectionRenderer.astro`](../src/components/sections/SectionRenderer.astro)
is a dispatch table keyed on `_type`. Each section type has one thin **bridge**
component (e.g. `CardGridSection.astro`) that unpacks Sanity fields into the existing
component's props and wraps it in `<Section bg seam size labelledby={titleId}>`.
`titleId` derives from the section `_key` and feeds both `Section labelledby` and
`SectionHeader` so the `aria-labelledby` + heading-order accessibility gate holds.

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

## Routing

- **`src/pages/[...slug].astro`** (static, `prerender = true`): `getStaticPaths()`
  reads every `page` slug from Sanity at build time and emits one static route each.
  `home` → `/`; nested slugs keep their slashes via the rest param. Fetches
  `PAGE_BY_SLUG_QUERY` (page + hero + all sections with refs dereferenced in one
  round-trip — see [`src/lib/queries.ts`](../src/lib/queries.ts)).
- **`src/pages/preview/[...slug].astro`** (SSR, `prerender = false`, `noindex`): the
  same query through the draft-aware, stega-enabled `cms-preview.ts` client. One file
  serves every page's preview.

**Auto-refresh as you edit.** The section content is server-rendered Astro, so it can't
re-render on the client the way a React app would. Instead
[`VisualEditingOverlay.tsx`](../src/components/preview/VisualEditingOverlay.tsx) gives
`<VisualEditing>` a `refresh` handler: when the Studio reports a draft mutation over the
comlink (no browser token involved), it soft-refetches the current preview URL and swaps
in the fresh `#main`. So edits appear on their own ~1s after you pause typing — no full
reload, no manual refresh — while click-to-edit keeps working (the swapped HTML is
draft-fetched with stega). It is intentionally not per-keystroke: that would need the
whole renderer ported to React, recreating the drift the builder avoids. (For
`source: 'mutation'` the library has no default behavior, which is why, without this
handler, the preview only updated on a manual browser reload.)

## Navigation

The header/footer menus are a Sanity `navigation` singleton (the "Menus" doc:
`mainNav`, `footerColumns`, `legalNav`). [`src/lib/nav.ts`](../src/lib/nav.ts)
`resolveNavigation()` turns it into the shapes `src/data/nav.ts` already exports,
falling back to that static file if the Studio has no menus, so the site never loses
its nav. `Header`/`Footer` call `getNavigation()` (same pattern as `getSiteSettings`).

## Editing in the Studio

- **Presentation Tool** ([`src/sanity/resolve.ts`](../src/sanity/resolve.ts)) maps
  every `page` to its `/preview/[...slug]` route, so a live preview opens beside the
  editor and any text or photo is click-to-edit (stega).
- **Structure** ([`src/sanity/structure.ts`](../src/sanity/structure.ts)) surfaces
  "Pages (section builder)" and the "Menus" singleton. Because `page` is not a
  singleton, the default **＋ Create** gives volunteers new-page creation.
- **In-Studio help:** [`src/sanity/guides/content.ts`](../src/sanity/guides/content.ts)
  holds plain-language walkthroughs ("Build or edit a page", "Edit the menus", etc.)
  rendered in a read-only Help & Guide pane.

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
- **Scheduling:** posts use Sanity scheduled publishing to go live later; the index
  query filters `publishedAt <= now()`.
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

`class`, `testimonial`, `schoolYearEvent`, and `coopRole` use
[`@sanity/orderable-document-list`](https://www.sanity.io/plugins/orderable-document-list):
their Studio lists have drag handles, and the site renders them in that order. Each
schema has `orderRankField()` + `orderRankOrdering`, their old `order` number field is
hidden, `structure.ts` uses `orderableDocumentListDeskItem`, and the site queries sort by
`order(orderRank)`. Existing docs were seeded from the old `order` values via
[`scripts/seed-order-ranks.mjs`](../scripts/seed-order-ranks.mjs) (LexoRank, idempotent),
so ordering was preserved with no downtime — **run that script once after adding a new
orderable type.** `faqItem` is deliberately **not** orderable: it groups by category, so a
flat drag list would be misleading; it keeps its `order` field.

## How a change goes live

A volunteer publishes in the Studio → the Sanity webhook fires
`repository_dispatch` → the Deploy workflow rebuilds and redeploys → the static page
updates ~1-2 minutes later. The Presentation preview reflects the draft instantly; the
public page waits for the rebuild. See [SANITY.md](SANITY.md) for the webhook.
