# Home photo restoration: testimonial snapshots + the visit block

**Date:** 2026-07-19
**Status:** design approved, awaiting spec review
**Scope:** public home page only. Two losses relative to the old Squarespace
home, both photographic, both shippable with zero Sanity writes.

## Why

Nathan supplied six screenshots of the old Squarespace home and reported the
new site is "missing a lot of the pictures and info". An audit against the code
found most of it is not missing:

| Old-site element                     | Status on the new home                                             |
| ------------------------------------ | ------------------------------------------------------------------ |
| 7th card, "55+ years in West Chester" | Promoted to the code-owned `HeritageStrip` ("Fifty-five Septembers") |
| "WCP is not a religious school"      | Present, in the `hp-visit` prose (unbolded)                        |
| Class card price / schedule / bullets | Supported by `ClassCard.astro` (`price`, `features`)               |
| Day-in-life timeline                 | Verbatim identical, all five entries, 9:30 to 11:40                |
| Testimonial author photos            | **MISSING.** No photo field, no render path                        |
| Visit block photo                    | **MISSING.** `hp-visit` is a `proseSection`, which has no image slot |

Two further findings are recorded but **out of scope** here:

- The why-WCP photo collage is absent by design. The 2026-07-19 redesign pulled
  decorative photos out of content sections and concentrated them into
  `ChooserRows` / `HeritageStrip` / `Interlude` / the Instagram wall. Nathan
  chose to leave the card grid clean.
- **The hero video is not live in production.** `public/hero/wcp-hero.mp4` and
  `.webm` exist locally but are gitignored, so every CI and production build
  404s them and the hero degrades to the still poster. This is the largest
  visual gap on the live site and is a hosting decision (R2 or Sanity), not a
  content port. Tracked separately, not addressed by this spec.

## The governing constraint

Sanity writes return `402 plan_limit_reached` (re-confirmed 2026-07-19; CDN
reads fine). Any image placed into the page-builder needs an asset upload,
which is a write.

**The unlock:** the public home is statically prerendered by `[...slug].astro`,
so `astro:assets` works there. The pre-sized `-sm.webp` workaround exists only
because SSR hub pages cannot resize. Local assets under `src/assets/` are
therefore fine on this surface, and both changes ship today.

Photo sourcing for the visit block goes through `src/lib/photo-registry.ts`,
which reads the already-public A Day gallery from Sanity at build time. Reusing
only already-public images keeps the photo-consent surface unchanged.

---

## Part 1: Testimonial snapshots

### Design intent

`Testimonial.astro` was rebuilt 2026-07-17 into a stationery parent note (ruled
paper, tape strip, capped tilt, hand-drawn stars, Great Vibes signature). Its
header comment names what it replaced: "the old flat white card with a
border-top color strip (a named AI-slop tell)". The old Squarespace circular
avatar beside a name and role **is** that rejected pattern.

The restoration is therefore a **snapshot taped to the note**, not an avatar: a
small print, tilted against the note's own tilt, the way a photo is clipped to
a letter. Native to Construction Paper, same information.

### Data path

Home testimonials render from Sanity (`k12`, `source: 'featured'`, `limit: 3`),
not from `src/data/testimonials.ts`. Verified via CDN:

```
sections[_key=="k12"] → { source: "featured", limit: 3, layout: "grid", items: null }
*[_type=="testimonial" && featured==true] → Alison Blankenship, Amber Cron,
                                            Meagan Gegner, Taylor Dore, Amanda Hackney
```

So the photo cannot live on the data file. It needs a code-side join keyed on
author name.

**New module: `src/lib/testimonial-photos.ts`**

- Maps a normalized author name (lowercase, punctuation and whitespace
  collapsed) to a local `import` from `src/assets/testimonials/`.
- Exports `photoFor(author: string): ImageMetadata | undefined`.
- Normalization must tolerate the "Lisa T." trailing period and casing drift.
- Unit-tested in `src/lib/testimonial-photos.test.ts` (Vitest, per the existing
  `src/lib` test convention): known author resolves, unknown returns
  `undefined`, normalization handles punctuation and case.

### Assets

Eleven confirmed matches, copied from `assets-from-squarespace/images/` into
`src/assets/testimonials/` under readable kebab-case names:

| Quote author (`testimonials.ts`) | Source file             | New name                |
| -------------------------------- | ----------------------- | ----------------------- |
| Alison Blankenship               | `013-Alison.jpg`        | `alison-blankenship.jpg` |
| Erin McQuillen                   | `014-ErinMcqueen.jpg`   | `erin-mcquillen.jpg`    |
| Amanda Hackney                   | `015-Amanda.jpg`        | `amanda-hackney.jpg`    |
| Taylor Dore                      | `047-TayloreDore.jpg`   | `taylor-dore.jpg`       |
| Katherine Oliver                 | `056-Katherine.jpg`     | `katherine-oliver.jpg`  |
| Lauren Lintz                     | `063-LaurenLintz.jpg`   | `lauren-lintz.jpg`      |
| Laura Gilbert                    | `064-LaurenGilbert.jpg` | `laura-gilbert.jpg`     |
| Erin Millspaw                    | `067-erinmills.jpg`     | `erin-millspaw.jpg`     |
| Lisa T.                          | `071-lisat.png`         | `lisa-t.png`            |
| Sara Jane Nixon                  | `074-SaraJaneNixon.jpg` | `sara-jane-nixon.jpg`   |
| Renee Ross                       | `077-reneeross.jpg`     | `renee-ross.jpg`        |

**Decisions taken:**

- `064-LaurenGilbert.jpg` maps to **Laura Gilbert**. The filename says Lauren,
  the quote says Laura; Nathan confirmed Laura. The quote's spelling is
  authoritative for display.
- `062-Erin.jpg` is **excluded**. It could be Erin Schmerr or Erin Millspaw and
  guessing attaches a real person's face to the wrong name. Open item below.

**Consent basis:** every one of these images was published on the public
Squarespace site, so re-publishing them on the replacement site does not widen
the consent surface. This matches the photo-registry rule.

### Component change

`Testimonial.astro` gains an optional `photo?: ImageMetadata` prop.

- When absent, the note renders exactly as today. **Non-negotiable:** 13 of the
  24 quotes have no photo, and `/reviews` shows the full wall, so the no-photo
  path is the common case and must be visually unchanged.
- When present, render an `astro:assets` `<Image>` as a taped print: small
  (~4.5rem), square crop, tilted counter to the note's tilt, its own small tape
  strip, sitting above the star row.
- The image is **decorative** relative to the quote: the author is already named
  in the signature. Use `alt=""` and keep it out of the accessible name, or the
  screen-reader output duplicates the attribution. The `<figure>` /
  `<blockquote>` / `<figcaption>` semantics stay untouched.
- The note is a theme-stable light-paper island. Any new ink or border colour
  comes from `.wcp-note-paper`'s fixed palette, never theme tokens (the `-ink`
  trap).

`TestimonialSection.astro` calls `photoFor(t.author)` and passes the result
through. No change to its existing `/reviews` and `/why-wcp` stopgap branches.

### Degradation

The home row shows 3 of 5 featured quotes; only Alison, Taylor Dore and Amanda
Hackney have photos, so the row may render 1 to 3 snapshots depending on GROQ
ordering. A mixed row of photo and no-photo notes must look deliberate, not
broken. This is the primary visual review point.

---

## Part 2: The visit block

### The architectural wrinkle

Photo moments inject **between** sections; they cannot wrap one. So a
side-by-side photo beside the visit details cannot be a moment alone.

The precedent is `HeritageStrip`, which replaced the stat band by exactly this
route: drop the Sanity section via `SECTION_DROP`, inject a code-owned
component in its slot via `PHOTO_MOMENTS`. `ChooserRows` and `TuitionOpener` are
likewise code-owned public copy.

### Approach

**New component: `src/components/VisitBlock.astro`**

- Left: one registry photo via `photosFor('home-visit', 1)`, framed as a taped
  print in the scrapbook idiom. Renders text-only if the registry is empty
  (same contract as `Interlude` and `PhotoStrip`: never a broken frame).
- Right: the visit details, all read from `src/data/site.ts`, which already
  holds every fact (`address`, `phone`, `hours`, `geo`, Google Maps URL,
  founded, Lakota calendar note). **No copy is invented and none is duplicated
  into a new source of truth.**
- Restores the old site's bolded **"WCP is not a religious school"** lead, which
  currently sits unemphasized mid-paragraph.
- Two CTAs, matching the old site: "Schedule a Tour" (the tour form, per the
  tour-first doctrine) and "Open in Google Maps".
- Heading order: `SectionHeader as="h2"` with `aria-labelledby` wiring, per the
  hard a11y gate.

**Wiring:**

- `photo-moments.ts` gains `{ after: 'hp-instagram', kind: 'visit', slot: 'home-visit' }`
  and `'visit'` joins the `kind` union.
- `SectionRenderer.astro` gains a `'visit'` branch in **both** render sites
  (there are two, around lines 301 and 365).
- `page-doctrine.ts` `SECTION_DROP.home` gains `'hp-visit'`.

### The tradeoff, stated plainly

This moves the address block out of the page-builder and into code, so a
volunteer can no longer edit it in the Studio. Accepted because:

- `site.ts` already carries these facts as the typed fallback, so there is one
  source of truth, not two.
- The address, phone and hours change rarely, and changing them in `site.ts`
  already updates the footer, schema.org markup and contact surfaces.
- It matches three existing code-owned public bands.

It is nonetheless a reduction in volunteer control, which the brand-lock section
of `CLAUDE.md` treats as a real cost. The `PENDING.md` close-out is to rebuild
`hp-visit` as a genuine `splitMediaSection` in Sanity once writes work, then
delete the component, the moment and the doctrine entry.

---

## Documentation and close-out

Per the repo's docs rule, in the same commit:

- **`docs/PENDING.md`** gains two code-stopgap rows, one per part, each naming
  exactly what to delete when the quota returns.
- **`docs/PAGE_BUILDER.md`** notes the new `'visit'` moment kind alongside the
  existing kinds.
- **`src/sanity/guides/content.ts`** is updated only if a volunteer's view
  changes. The visit block leaving the Studio **is** such a change, so the
  guide must say the home address block is code-owned for now.

Two queued patch scripts are authored but **not run** (writes are frozen), each
dry-run by default per the `patch-lib.mjs` convention:

- `patch-testimonial-photos.mjs` — upload the eleven headshots as Sanity assets
  onto their `testimonial` docs; close out by deleting `testimonial-photos.ts`
  and its test.
- `patch-home-visit-splitmedia.mjs` — rebuild `hp-visit` as a real
  `splitMediaSection`; close out by deleting `VisitBlock.astro`, the moment and
  the `SECTION_DROP` entry.

Both need a matching `photo?` field on the `testimonial` schema
(`src/sanity/schemaTypes/documents/testimonial.ts`), which can be added now
since a schema change is code, not a write.

## Verification

- `npm run test:unit` covers `testimonial-photos.ts`.
- `npm test` (Playwright: smoke, axe, reflow at 320/768/1024/1440) covers the
  home page. The a11y gate must hold 100.
- Visual check on the mixed photo / no-photo testimonial row, and on the visit
  block at 320px, in both light and dark mode.
- Full local gate before commit: `npx astro check`, `npm run lint`,
  `npm run format:check`, `npm run build`, `npm run check:links`, `npm test`,
  `npm run test:unit`.
- Watch for the stale-`astro dev`-on-4321 trap before trusting a local run.

## Open items for Nathan

1. **Who is `062-Erin.jpg`?** Erin Schmerr or Erin Millspaw. Excluded until
   confirmed; adding it later is a one-line map entry.
2. **The home row drifted from the old site.** The old home showed Alison, Erin
   McQuillen and Amanda. Sanity's featured set is Alison, Amber Cron, Meagan
   Gegner, Taylor Dore, Amanda Hackney, and Amber and Meagan have no photo.
   Re-picking the featured five is a Sanity edit, so it is quota-blocked, but
   worth queueing if the home row should lead with photographed families.
3. **The hero video** remains the largest visual gap on the live site and is
   not addressed here.
