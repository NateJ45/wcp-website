# Home Photo Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the two photographic losses from the old Squarespace home: a snapshot on every testimonial note, and a photo beside the visit details.

**Architecture:** Both ship entirely code-side, no Sanity writes (the API is quota-frozen at `402 plan_limit_reached`). Testimonial photos are 24 local WebP assets joined to Sanity quotes by normalized author name through a new `src/lib/testimonial-photos.ts`. The visit block follows the existing `HeritageStrip` precedent: drop the Sanity `proseSection` via `SECTION_DROP`, inject a code-owned `VisitBlock.astro` in its slot via `PHOTO_MOMENTS`. Two idempotent patch scripts are authored (not run) to move both into Sanity when the quota returns.

**Tech Stack:** Astro 7 (static prerender on the public site, so `astro:assets` works), Tailwind v4, Sanity, Vitest, Playwright, sharp.

**Spec:** [2026-07-19-home-photo-restoration-design.md](../specs/2026-07-19-home-photo-restoration-design.md)

---

## File Structure

| File | Responsibility |
| --- | --- |
| `scripts/prepare-testimonial-photos.mjs` | CREATE. One-shot: downscale the 24 archive photos to 320px square WebP into `src/assets/testimonials/`. |
| `src/assets/testimonials/*.webp` | CREATE (24 files). The committed snapshots, ~400 KB total. |
| `src/lib/testimonial-photos.ts` | CREATE. Author name → local image. The ONLY place the mapping lives. |
| `src/lib/testimonial-photos.test.ts` | CREATE. Vitest: normalization + the every-author-resolves regression test. |
| `src/components/Testimonial.astro` | MODIFY. Optional `photo` prop rendering a taped snapshot. |
| `src/components/sections/TestimonialSection.astro` | MODIFY. Look up the photo, pass it down. |
| `src/sanity/schemaTypes/documents/testimonial.ts` | MODIFY. Add the `photo` field the patch script will populate. |
| `src/components/VisitBlock.astro` | CREATE. Photo + visit details, all facts from `site.ts`. |
| `src/lib/photo-moments.ts` | MODIFY. Add `'visit'` to the `kind` union and the home moment. |
| `src/components/sections/SectionRenderer.astro` | MODIFY. Render the `'visit'` kind in BOTH moment blocks. |
| `src/lib/page-doctrine.ts` | MODIFY. `SECTION_DROP.home` gains `'hp-visit'`. |
| `scripts/patch-testimonial-photos.mjs` | CREATE. Queued: upload 24 photos onto the Sanity `testimonial` docs. |
| `scripts/patch-home-visit-splitmedia.mjs` | CREATE. Queued: rebuild `hp-visit` as a real `splitMediaSection`. |
| `docs/PENDING.md`, `docs/PAGE_BUILDER.md`, `src/sanity/guides/content.ts` | MODIFY. Docs sync, per the repo rule. |

**Working directory for every command below is `site/`** (the repo root's shell CWD is one level up; prefix with `cd site` or run from there).

---

## Task 1: Downscale the 24 archive photos

**Files:**
- Create: `scripts/prepare-testimonial-photos.mjs`
- Create: `src/assets/testimonials/` (24 `.webp` files)

Source archive lives at the REPO ROOT, not in `site/`: `../assets-from-squarespace/images/`. It is gitignored, so this script is run once by a human who has it and the OUTPUT is committed.

- [ ] **Step 1: Write the script**

Create `scripts/prepare-testimonial-photos.mjs`:

```js
// =============================================================================
// prepare-testimonial-photos.mjs — one-shot: archive headshots → committed WebP
// =============================================================================
// The old Squarespace site showed a photo beside every family quote. All 24
// source files live in the gitignored ../assets-from-squarespace/images/, at
// 7.5MB total, for images that render ~80px. This downscales them to 320px
// square WebP (~400KB total) into src/assets/testimonials/, which IS committed.
//
// The author→file mapping below is NOT guessed from filenames (an earlier pass
// did that and got three wrong). It is transcribed from the live old site,
// where every testimonial <img> carries the author's name in its alt attribute.
//
// Run once: node scripts/prepare-testimonial-photos.mjs
// =============================================================================
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(SITE_DIR, '../assets-from-squarespace/images');
const OUT = resolve(SITE_DIR, 'src/assets/testimonials');

// author → archive filename (verified present on disk, 24/24)
const MAP = {
  'Alison Blankenship': '013-Alison.jpg',
  'Erin McQuillen': '014-ErinMcqueen.jpg',
  'Amanda Hackney': '015-Amanda.jpg',
  'Taylor Dore': '047-TayloreDore.jpg',
  'Amber Cron': '050-448967548_10228935510510140_9150997885768748421_n.jpg',
  'Meagan Gegner': '054-495704435_10228526804301141_3646875931461916867_n.jpg',
  'Katherine Oliver': '056-Katherine.jpg',
  'Daniel Hagedorn': '057-395417966_10163531036432468_1334487575746853067_n.jpg',
  'Erin Schmerr': '062-Erin.jpg',
  'Lauren Lintz': '063-LaurenLintz.jpg',
  'Laura Gilbert': '064-LaurenGilbert.jpg',
  'Valerie Williams': '065-462682701_10233598382801508_8541926930120176671_n.jpg',
  'Nathan Nixon': '066-img_1_1711415359262.jpg',
  'Erin Millspaw': '067-erinmills.jpg',
  'Emily Wilkes': '068-3L7A7100.jpg',
  'Jessica Swarr': '069-2c95e942-0336-4fa5-938d-769de6e8b301.jpg',
  'Kayla Moormann': '070-image0.jpeg',
  'Lisa T.': '071-lisat.png',
  'Lexie Lenavitt': '072-512151748_10163404040888436_3057702550802177284_n.jpg',
  'Anita Shrestha': '073-3L7A7071.jpg',
  'Sara Jane Nixon': '074-SaraJaneNixon.jpg',
  'Courtney Marquart': '075-510583991_10226240783832728_8660122827878054808_n.jpg',
  'Teresa Vasquez': '076-FullSizeRender.jpeg',
  'Renee Ross': '077-reneeross.jpg',
};

// Must match normalizeAuthor() in src/lib/testimonial-photos.ts, then hyphenate.
export const slugFor = (author) =>
  author
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/ /g, '-');

if (!existsSync(SRC)) {
  throw new Error(`archive not found at ${SRC} (it is gitignored — ask Nathan for it)`);
}
mkdirSync(OUT, { recursive: true });

let bytes = 0;
for (const [author, file] of Object.entries(MAP)) {
  const from = join(SRC, file);
  if (!existsSync(from)) throw new Error(`missing source for ${author}: ${file}`);
  const to = join(OUT, `${slugFor(author)}.webp`);
  const info = await sharp(from)
    .resize(320, 320, { fit: 'cover', position: 'attention' })
    .webp({ quality: 82 })
    .toFile(to);
  bytes += info.size;
  console.log(`${author.padEnd(20)} -> ${slugFor(author)}.webp  ${(info.size / 1024).toFixed(0)}KB`);
}
console.log(`\n${Object.keys(MAP).length} photos, ${(bytes / 1024).toFixed(0)}KB total`);
```

`position: 'attention'` makes sharp crop toward the most visually salient region, which keeps faces in frame better than a centre crop on group photos.

- [ ] **Step 2: Run it**

Run: `node scripts/prepare-testimonial-photos.mjs`

Expected: 24 lines, then a total around 300-500 KB. Any `missing source for …` means the archive is incomplete; stop and report rather than dropping an author.

- [ ] **Step 3: Verify the output**

Run: `ls src/assets/testimonials | wc -l`
Expected: `24`

- [ ] **Step 4: Commit**

```bash
git add scripts/prepare-testimonial-photos.mjs src/assets/testimonials
git commit -m "Testimonial photos: downscale the 24 archive headshots to committed WebP"
```

---

## Task 2: The author → photo lookup (TDD)

**Files:**
- Create: `src/lib/testimonial-photos.ts`
- Test: `src/lib/testimonial-photos.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/testimonial-photos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeAuthor, photoFor } from './testimonial-photos';
import { testimonials } from '@/data/testimonials';

describe('normalizeAuthor', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeAuthor('  Alison   Blankenship ')).toBe('alison blankenship');
  });

  it('drops punctuation so "Lisa T." matches "Lisa T"', () => {
    expect(normalizeAuthor('Lisa T.')).toBe(normalizeAuthor('Lisa T'));
  });
});

describe('photoFor', () => {
  it('resolves a known author', () => {
    expect(photoFor('Alison Blankenship')).toBeDefined();
  });

  it('is insensitive to case and spacing', () => {
    expect(photoFor('alison  blankenship')).toBe(photoFor('Alison Blankenship'));
  });

  it('resolves the trailing-period author', () => {
    expect(photoFor('Lisa T.')).toBeDefined();
  });

  it('returns undefined for an unknown author', () => {
    expect(photoFor('Nobody Atall')).toBeUndefined();
  });

  it('returns undefined for empty input', () => {
    expect(photoFor(undefined)).toBeUndefined();
    expect(photoFor('')).toBeUndefined();
  });

  // Regression guard: the old site had a photo for every quote. If someone adds
  // a testimonial to data/testimonials.ts without a photo this fails loudly,
  // which is the prompt to either supply one or accept the no-photo note.
  it('has a photo for every testimonial author in the data file', () => {
    const missing = testimonials.filter((t) => !photoFor(t.author)).map((t) => t.author);
    expect(missing).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm run test:unit -- testimonial-photos`
Expected: FAIL, "Failed to resolve import ./testimonial-photos".

- [ ] **Step 3: Write the implementation**

Create `src/lib/testimonial-photos.ts`:

```ts
// =============================================================================
// Testimonial photos — author name → the family's snapshot
// =============================================================================
// CODE STOPGAP (2026-07-19). The old Squarespace site showed a photo beside
// every family quote; the new site's quotes live in Sanity but Sanity WRITES
// are quota-frozen, so the images cannot be uploaded as assets yet. The public
// site is statically prerendered, so astro:assets works with local files and
// this ships today.
//
// Joined on AUTHOR NAME because the home page renders testimonials from Sanity
// (page-home section k12, source: 'featured'), not from data/testimonials.ts.
//
// CLOSE OUT: run scripts/patch-testimonial-photos.mjs --commit when the quota
// is back, then delete this file, its test, the `photo` prop threading in
// TestimonialSection.astro, and the src/assets/testimonials/ directory. See
// docs/PENDING.md.
//
// The mapping is transcribed from the live old site's alt attributes, NOT
// guessed from archive filenames (that produced three wrong pairings). Two
// name traps worth keeping in mind if you extend this:
//   - `laura-gilbert` really is Laura; the archive filename says "LaurenGilbert".
//   - Erin Schmerr appears twice on the old site with DIFFERENT photos: here as
//     a quote author, and in src/assets/staff/erin-schmerr.jpg as a teacher.
// =============================================================================
import alisonBlankenship from '@/assets/testimonials/alison-blankenship.webp';
import amandaHackney from '@/assets/testimonials/amanda-hackney.webp';
import amberCron from '@/assets/testimonials/amber-cron.webp';
import anitaShrestha from '@/assets/testimonials/anita-shrestha.webp';
import courtneyMarquart from '@/assets/testimonials/courtney-marquart.webp';
import danielHagedorn from '@/assets/testimonials/daniel-hagedorn.webp';
import emilyWilkes from '@/assets/testimonials/emily-wilkes.webp';
import erinMcquillen from '@/assets/testimonials/erin-mcquillen.webp';
import erinMillspaw from '@/assets/testimonials/erin-millspaw.webp';
import erinSchmerr from '@/assets/testimonials/erin-schmerr.webp';
import jessicaSwarr from '@/assets/testimonials/jessica-swarr.webp';
import katherineOliver from '@/assets/testimonials/katherine-oliver.webp';
import kaylaMoormann from '@/assets/testimonials/kayla-moormann.webp';
import lauraGilbert from '@/assets/testimonials/laura-gilbert.webp';
import laurenLintz from '@/assets/testimonials/lauren-lintz.webp';
import lexieLenavitt from '@/assets/testimonials/lexie-lenavitt.webp';
import lisaT from '@/assets/testimonials/lisa-t.webp';
import meaganGegner from '@/assets/testimonials/meagan-gegner.webp';
import nathanNixon from '@/assets/testimonials/nathan-nixon.webp';
import reneeRoss from '@/assets/testimonials/renee-ross.webp';
import saraJaneNixon from '@/assets/testimonials/sara-jane-nixon.webp';
import taylorDore from '@/assets/testimonials/taylor-dore.webp';
import teresaVasquez from '@/assets/testimonials/teresa-vasquez.webp';
import valerieWilliams from '@/assets/testimonials/valerie-williams.webp';

/** Lowercase, strip punctuation, collapse runs of separators to one space. */
export function normalizeAuthor(author: string): string {
  return author
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const PHOTOS: Record<string, ImageMetadata> = {
  'alison blankenship': alisonBlankenship,
  'amanda hackney': amandaHackney,
  'amber cron': amberCron,
  'anita shrestha': anitaShrestha,
  'courtney marquart': courtneyMarquart,
  'daniel hagedorn': danielHagedorn,
  'emily wilkes': emilyWilkes,
  'erin mcquillen': erinMcquillen,
  'erin millspaw': erinMillspaw,
  'erin schmerr': erinSchmerr,
  'jessica swarr': jessicaSwarr,
  'katherine oliver': katherineOliver,
  'kayla moormann': kaylaMoormann,
  'laura gilbert': lauraGilbert,
  'lauren lintz': laurenLintz,
  'lexie lenavitt': lexieLenavitt,
  'lisa t': lisaT,
  'meagan gegner': meaganGegner,
  'nathan nixon': nathanNixon,
  'renee ross': reneeRoss,
  'sara jane nixon': saraJaneNixon,
  'taylor dore': taylorDore,
  'teresa vasquez': teresaVasquez,
  'valerie williams': valerieWilliams,
};

/** The family's snapshot, or undefined when we have no photo for that name. */
export function photoFor(author: string | undefined): ImageMetadata | undefined {
  if (!author) return undefined;
  return PHOTOS[normalizeAuthor(author)];
}
```

`ImageMetadata` is a global type from `astro/client` (already referenced in `src/env.d.ts`), so it needs no import. Under Vitest the `.webp` imports resolve to URL strings rather than metadata objects, which is fine because the tests only assert defined / undefined / identity.

- [ ] **Step 4: Run the test**

Run: `npm run test:unit -- testimonial-photos`
Expected: PASS, 7 tests.

If the every-author test fails, the failure message names the unmatched authors. Fix the map key (the normalized name), not the test.

- [ ] **Step 5: Typecheck**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/testimonial-photos.ts src/lib/testimonial-photos.test.ts
git commit -m "Testimonial photos: author-name lookup with a full-coverage regression test"
```

---

## Task 3: Render the snapshot on the note

**Files:**
- Modify: `src/components/Testimonial.astro`

The note is a stationery object: ruled paper, one tape strip at top-centre (`wcp-tape-tc`), a capped tilt, hand-drawn stars, a Great Vibes signature. The snapshot must read as a print clipped to that note, NOT as the circular review-site avatar the 2026-07-17 redesign deliberately removed.

Design decisions, already settled:
- Use `.wcp-print` (white paper, padding, shadow, `--print-tilt`) but **no second tape strip**. The note already has one at top-centre, and `.wcp-tape-tc`'s strip is 4.6rem wide, wider than the snapshot itself.
- Tilt it `+2.5deg`, counter to the note's own lean, so the two objects read as separately placed.
- `alt=""`. The author is already named in the signature; a real alt would make screen readers announce the name twice.

- [ ] **Step 1: Add the import and prop**

In `src/components/Testimonial.astro`, add to the frontmatter imports (below the existing `import { cn } from '@/lib/utils';`):

```ts
import { Image } from 'astro:assets';
```

Extend the `Props` interface with:

```ts
  /** The family's snapshot, taped to the note. Decorative: the author is
      already named in the signature, so this renders with alt="". */
  photo?: ImageMetadata;
```

And add `photo` to the destructure:

```ts
const {
  quote,
  author,
  context,
  rating = 5,
  confetti = false,
  photo,
  class: className,
} = Astro.props;
```

- [ ] **Step 2: Render it above the star row**

In the template, immediately BEFORE the existing `<div class="flex gap-0.5" aria-hidden="true">` star row, insert:

```astro
  {
    /* A snapshot clipped to the note (the old site's author photo, re-read in
       the scrapbook idiom rather than as a review-card avatar). Tilted against
       the note's own lean; no tape strip, the note already carries one. */
    photo && (
      <div
        class="wcp-print mb-4 w-20 shrink-0 self-start [--print-tilt:2.5deg]"
        aria-hidden="true"
      >
        <Image
          src={photo}
          alt=""
          width={160}
          height={160}
          loading="lazy"
          decoding="async"
          class="aspect-square w-full object-cover"
        />
      </div>
    )
  }
```

`.wcp-print` sets `position: relative` and the tilt; `[--print-tilt:2.5deg]` overrides the alternating-tilt default for this one element.

- [ ] **Step 3: Build and check the home page renders three snapshots**

Run: `npm run build`
Expected: build succeeds.

Run: `grep -c "wcp-print" dist/client/index.html`
Expected: at least `3` (all five featured quotes have photos; the home row shows three).

- [ ] **Step 4: Check /reviews got all 24**

Run: `grep -o 'src="/_astro/[a-z-]*\.[a-z0-9]*\.webp"' dist/client/reviews/index.html | sort -u | wc -l`
Expected: `24`.

- [ ] **Step 5: Commit**

```bash
git add src/components/Testimonial.astro
git commit -m "Testimonial: optional snapshot taped to the parent note"
```

---

## Task 4: Wire the lookup into the section

**Files:**
- Modify: `src/components/sections/TestimonialSection.astro`

- [ ] **Step 1: Import the lookup**

Add below the existing `import { getTestimonials } from '@/lib/cms';`:

```ts
import { photoFor } from '@/lib/testimonial-photos';
```

- [ ] **Step 2: Pass the photo to the grid**

In the non-wall branch, change the `<Testimonial ... />` call to add the `photo` prop:

```astro
            <Testimonial
              quote={t.quote}
              author={t.author ?? ''}
              context={t.role}
              photo={photoFor(t.author)}
              confetti={confetti}
            />
```

Leave everything else alone, including the `/reviews` and `/why-wcp` stopgap branches.

- [ ] **Step 3: Handle the wall separately**

`TestimonialWall.astro` powers the `/reviews` masonry and does **not** use `Testimonial.astro` — it duplicates the note markup inline (same `wcp-testi wcp-tape-tc wcp-note-paper` classes, same star row, same signature). So the snapshot has to be added there too. This duplication predates this change; do not refactor the two into one component as part of this task, just keep them in step.

Add to its frontmatter imports:

```ts
import { Image } from 'astro:assets';
import { photoFor } from '@/lib/testimonial-photos';
```

Then inside the `<figure>`, immediately BEFORE the `<div class="flex gap-0.5" aria-hidden="true">` star row, insert:

```astro
          {photoFor(t.author) && (
            <div
              class="wcp-print mb-4 w-20 shrink-0 [--print-tilt:2.5deg]"
              aria-hidden="true"
            >
              <Image
                src={photoFor(t.author)!}
                alt=""
                width={160}
                height={160}
                loading="lazy"
                decoding="async"
                class="aspect-square w-full object-cover"
              />
            </div>
          )}
```

The wall is a CSS `columns` masonry with `break-inside-avoid` on each `<li>`, so an added image changes card heights but cannot break the layout.

- [ ] **Step 4: Build and verify both surfaces**

Run: `npm run build`
Expected: succeeds.

Run: `grep -c "wcp-print" dist/client/reviews/index.html`
Expected: `24`.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/TestimonialSection.astro src/components/TestimonialWall.astro
git commit -m "Testimonial sections: pass the family snapshot through to the note"
```

---

## Task 5: Add the Sanity `photo` field

**Files:**
- Modify: `src/sanity/schemaTypes/documents/testimonial.ts`

A schema change is code, not a Sanity write, so it ships now and gives `patch-testimonial-photos.mjs` (Task 8) somewhere to write.

- [ ] **Step 1: Read the current schema**

Run: `cat src/sanity/schemaTypes/documents/testimonial.ts`

- [ ] **Step 2: Add the field**

Add to the `fields` array, after the `role` field (match the file's existing `defineField` style exactly):

```ts
    defineField({
      name: 'photo',
      title: 'Family photo',
      type: 'image',
      description:
        'Optional. A photo of the family, shown as a small print clipped to the quote. Square crops look best.',
      options: { hotspot: true },
    }),
```

Do **not** add an `alt` field. The photo renders decoratively (`alt=""`) because the author's name is already in the signature; an alt field would invite volunteers to duplicate the attribution.

- [ ] **Step 3: Verify the Studio still loads**

Schema errors pass the build and crash the Studio at browser runtime, so a build alone does not prove this.

Run: `npx astro check && npm run build`
Expected: 0 errors.

Then open the DEPLOYED `/studio` (local `/studio` is blank because the project path contains spaces) and confirm a testimonial document opens without an error boundary.

- [ ] **Step 4: Commit**

```bash
git add src/sanity/schemaTypes/documents/testimonial.ts
git commit -m "Sanity: optional photo field on testimonial docs"
```

---

## Task 6: Build the visit block

**Files:**
- Create: `src/components/VisitBlock.astro`

Every fact comes from `src/data/site.ts`. Invent nothing. The canonical tour link is `/virtual-tour#sec-pp-tour-form` (the same href `TourPill.astro`, `PageHero.astro` and `data/nav.ts` already use).

- [ ] **Step 1: Create the component**

```astro
---
/* ============================================================================
   VisitBlock — the photo-and-details "come see it" band
   ============================================================================
   CODE STOPGAP (2026-07-19). The old Squarespace home paired a classroom photo
   with the address, the not-a-religious-school line, the phone number and two
   CTAs. The new home carried the copy as a Sanity proseSection (hp-visit),
   which has no image slot, so the photo was lost.

   Code-owned for the same reason HeritageStrip is: photo moments inject BETWEEN
   sections and cannot wrap one, so a side-by-side layout means replacing the
   section. page-doctrine drops hp-visit and the moments map injects this in its
   slot. Facts come from src/data/site.ts, the existing single source of truth,
   so nothing is duplicated.

   TRADEOFF: this takes the address block out of the page-builder, so a
   volunteer can no longer edit it in the Studio. Accepted temporarily.
   CLOSE OUT: run scripts/patch-home-visit-splitmedia.mjs --commit, then delete
   this file, the 'visit' moment, and the SECTION_DROP entry. See docs/PENDING.md.

   Renders text-only when the photo registry is empty, never a broken frame
   (same contract as Interlude and PhotoStrip).
   ============================================================================ */
import Section from '@/components/Section.astro';
import SectionHeader from '@/components/SectionHeader.astro';
import Button from '@/components/ui/Button.astro';
import { photosFor } from '@/lib/photo-registry';
import { imageUrl, imageSrcSet } from '@/lib/image';
import { site } from '@/data/site';

const TOUR_HREF = '/virtual-tour#sec-pp-tour-form';
const MAPS_HREF = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${site.address.street} ${site.address.city} ${site.address.state} ${site.address.zip}`,
)}`;
const TEL = `tel:+1${site.phone.replace(/\D/g, '')}`;

const titleId = 'sec-home-visit-title';
const [photo] = await photosFor('home-visit', 1);
---

<Section bg="white" labelledby={titleId}>
  <div class="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
    {
      photo && (
        <div class="wcp-print wcp-tape-tc relative" data-reveal="settle">
          <img
            src={imageUrl(photo.image as never, 900)}
            srcset={imageSrcSet(photo.image as never)}
            sizes="(min-width: 1024px) 32rem, 92vw"
            alt={photo.alt}
            loading="lazy"
            decoding="async"
            class="aspect-[4/3] w-full object-cover"
          />
        </div>
      )
    }
    <div>
      <SectionHeader
        eyebrow="Find us"
        title="Come find us."
        titleId={titleId}
        align="left"
      />
      <p class="mt-6 text-lg leading-relaxed">
        We are at <strong>{site.address.street}, {site.address.city}, {site.address.state}{' '}
        {site.address.zip}</strong>, inside Crestview Presbyterian Church.
      </p>
      <p class="mt-4 text-lg leading-relaxed">
        <strong>WCP is not a religious school.</strong> We are a secular, non-discriminatory
        cooperative preschool. We rent the space and have no religious affiliation.
      </p>
      <ul class="mt-6 space-y-2 border-l-4 border-sky pl-5 text-lg" role="list">
        <li>
          Call or text <a class="font-bold text-sky-ink underline underline-offset-2" href={TEL}>
            {site.phone}
          </a>
        </li>
        <li>School runs September to May. Tours by appointment June to August.</li>
      </ul>
      <div class="mt-8 flex flex-wrap gap-4">
        <Button href={TOUR_HREF} variant="accent" size="lg">Schedule a Tour</Button>
        <Button href={MAPS_HREF} variant="outline" size="lg" rel="noopener">
          Open in Google Maps
        </Button>
      </div>
    </div>
  </div>
</Section>
```

Copy-voice rule: no em-dashes, no ellipses in visitor-facing text. The strings above comply; keep it that way if you reword.

- [ ] **Step 2: Typecheck**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/VisitBlock.astro
git commit -m "VisitBlock: photo beside the visit details, facts from site.ts"
```

---

## Task 7: Wire the visit moment in

**Files:**
- Modify: `src/lib/photo-moments.ts`
- Modify: `src/components/sections/SectionRenderer.astro`
- Modify: `src/lib/page-doctrine.ts`

- [ ] **Step 1: Extend the moment kind**

In `src/lib/photo-moments.ts`, add `'visit'` to the `kind` union (append to the existing list and extend the doc comment):

```ts
  kind?: 'strip' | 'interlude' | 'tuition-opener' | 'heritage' | 'chooser' | 'septembers' | 'visit';
```

- [ ] **Step 2: Add the home moment**

In the same file, append to the `home` array (after the existing interlude entry):

```ts
    // The visit block replaces the Sanity hp-visit proseSection (dropped in
    // page-doctrine): the old site paired these details with a photo, and a
    // proseSection has no image slot.
    { after: 'hp-instagram', kind: 'visit', slot: 'home-visit' },
```

- [ ] **Step 3: Import and render it in BOTH moment blocks**

In `src/components/sections/SectionRenderer.astro`, add to the imports beside the other moment components:

```ts
import VisitBlock from '@/components/VisitBlock.astro';
```

There are **two** identical moment-render chains, one for `momentsAfter.get(-1)` and one for the per-section `strips`. Add a `'visit'` branch to **both**, before the final `PhotoStrip` fallback:

```astro
    ) : m.kind === 'septembers' ? (
      <SeptembersWall />
    ) : m.kind === 'visit' ? (
      <VisitBlock />
    ) : (
      <PhotoStrip slot={m.slot} bg={m.bg} captions={m.captions} />
    ),
```

Missing the second one is the likely mistake: the first chain only handles moments placed before every section, so a `'visit'` moment anchored to `hp-instagram` would silently render as a `PhotoStrip` instead.

- [ ] **Step 4: Drop the Sanity section**

In `src/lib/page-doctrine.ts`, change the `home` entry of `SECTION_DROP`:

```ts
  // Home: the stat-box band's numbers all live one band up in the class cards
  // ($70/mo etc.) and the heritage strip now owns that slot (photo-moments).
  // hp-visit goes too: VisitBlock (photo-moments 'visit') replaces it so the
  // visit details get their photo back — a proseSection has no image slot.
  home: ['type:statBandSection', 'hp-visit'],
```

- [ ] **Step 5: Build and verify the swap**

Run: `npm run build`
Expected: succeeds.

Run: `grep -c "Come find us" dist/client/index.html`
Expected: `1` — the VisitBlock heading. If you get `0`, the moment did not render; check Step 3's second chain, which is the easy one to miss.

Run: `grep -c "Come see it for yourself" dist/client/index.html`
Expected: `1` — the closing `ctaSection` (k15) only. Nathan settled the collision: the closer keeps that line and VisitBlock gives it up, so a `2` here means Task 6's heading was not applied.

Run: `grep -c "Plan your visit" dist/client/index.html`
Expected: `0` — the old `hp-visit` prose is gone.

Run: `grep -c "not a religious school" dist/client/index.html`
Expected: `1`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/photo-moments.ts src/components/sections/SectionRenderer.astro src/lib/page-doctrine.ts
git commit -m "Home: swap the prose visit block for VisitBlock with a photo"
```

---

## Task 8: Author the two queued patch scripts

**Files:**
- Create: `scripts/patch-testimonial-photos.mjs`
- Create: `scripts/patch-home-visit-splitmedia.mjs`

These are **authored, not run** — Sanity writes return 402. Both must be idempotent and dry-run by default, matching the existing `patch-*.mjs` convention.

- [ ] **Step 1: Read the conventions**

Run: `sed -n '1,60p' scripts/patch-lib.mjs && sed -n '1,50p' scripts/patch-twos-class-pet.mjs`

`patch-twos-class-pet.mjs` is the closest model: it uploads a local image as a Sanity asset and patches a doc with it, which is exactly what the testimonial patch does 24 times.

- [ ] **Step 2: Write `patch-testimonial-photos.mjs`**

Follow `patch-twos-class-pet.mjs`'s structure. Requirements:
- Reuse `patch-lib.mjs` for the client, the `--commit` gate and logging.
- Read the same author → archive-file `MAP` as `scripts/prepare-testimonial-photos.mjs`; import it rather than re-typing it (export `MAP` from that script, or move the shared map into `scripts/testimonial-photo-map.mjs` and import it in both). Two copies of this mapping will drift, and a drifted mapping puts the wrong family's face on a quote.
- Upload the **320px WebP** from `src/assets/testimonials/`, not the multi-megabyte archive original.
- For each `testimonial` doc, match on the `author` field using the SAME normalization as `normalizeAuthor` in `src/lib/testimonial-photos.ts`, and `patch(id).set({ photo: { _type: 'image', asset: { _type: 'reference', _ref: assetId } } })`.
- Skip any doc that already has `photo` set (idempotence).
- Log every author it did NOT match, loudly. A silent miss is a family with no photo and nobody noticing.

- [ ] **Step 3: Write `patch-home-visit-splitmedia.mjs`**

- Reuse `patch-lib.mjs` and the `splitMedia` helper from `pagebuilder-lib.mjs`.
- Rebuild `hp-visit` on `page-home` as a `splitMediaSection` carrying the VisitBlock copy plus an uploaded photo, replacing the current `proseSection`.
- Patch BOTH the published doc and the draft, as `home-parity.mjs` does.
- Keep the `_key` as `hp-visit` so the doctrine drop can be removed cleanly.

- [ ] **Step 4: Confirm both refuse to write without `--commit`**

Run: `node scripts/patch-testimonial-photos.mjs`
Expected: a dry-run plan, no writes. It will likely fail at the API with 402 if it tries to READ Sanity; that is expected under the freeze and is not a script bug. Note whichever behaviour you get in the PENDING row.

- [ ] **Step 5: Commit**

```bash
git add scripts/patch-testimonial-photos.mjs scripts/patch-home-visit-splitmedia.mjs scripts/testimonial-photo-map.mjs
git commit -m "Queue the two patch scripts that move the photos into Sanity"
```

---

## Task 9: Sync the docs

**Files:**
- Modify: `docs/PENDING.md`
- Modify: `docs/PAGE_BUILDER.md`
- Modify: `src/sanity/guides/content.ts`

The repo rule is that a change is not done until the docs match reality.

- [ ] **Step 1: Add two rows to the PENDING code-stopgaps table**

In `docs/PENDING.md`, in the "Code stopgaps" table, add:

| Where | What it papers over | To close out |
| --- | --- | --- |
| `src/lib/testimonial-photos.ts` + `src/assets/testimonials/` | The 24 family snapshots on testimonial notes. The images cannot be Sanity assets yet (uploads are writes), so they ship as local files joined by author name | Run `patch-testimonial-photos.mjs --commit`, then delete the module, its test, `src/assets/testimonials/`, and the `photo={photoFor(...)}` threading in `TestimonialSection.astro` / `TestimonialWall.astro` |
| `VisitBlock.astro` + `photo-moments.ts` `'visit'` + `SECTION_DROP.home` `'hp-visit'` | The home visit block's photo. `hp-visit` is a `proseSection` with no image slot, and moments inject between sections rather than wrapping one, so the section is replaced wholesale. Costs volunteer editability of the address | Run `patch-home-visit-splitmedia.mjs --commit`, then delete `VisitBlock.astro`, the `'visit'` moment and kind, both `SectionRenderer` branches, and `'hp-visit'` from `SECTION_DROP.home` |

- [ ] **Step 2: Document the new moment kind**

In `docs/PAGE_BUILDER.md`, find where the photo-moment kinds are listed and add `visit` with a one-line description alongside `strip`, `interlude`, `heritage`, `chooser`, `septembers`, `tuition-opener`.

Run: `grep -n "septembers\|interlude" docs/PAGE_BUILDER.md`

- [ ] **Step 3: Update the volunteer guide**

The home address block leaving the Studio is a change a volunteer will notice: they will look for it and not find it. In `src/sanity/guides/content.ts`, add a short plain-language note to the home-page guidance saying the "Come see it for yourself" block on the home page is temporarily built into the site and cannot be edited in the Studio, and that the address, phone and hours shown there come from the site's settings.

Also mention that testimonials now have an optional Family photo field.

- [ ] **Step 4: Commit**

```bash
git add docs/PENDING.md docs/PAGE_BUILDER.md src/sanity/guides/content.ts
git commit -m "Docs: PENDING stopgap rows, the visit moment kind, volunteer guide notes"
```

---

## Task 10: Full gate and visual verification

- [ ] **Step 1: Kill any stale dev server**

A daemonized `astro dev` on 4321 silently invalidates the whole Playwright run.

Run: `netstat -ano | findstr :4321`
Expected: no output. If a PID appears, run `taskkill //F //PID <pid>`.

- [ ] **Step 2: Run the full local gate**

```bash
npx astro check
npm run lint
npm run format:check
npm run build
npm run check:links
npm test
npm run test:unit
```

Expected: all pass. `npm test` covers smoke, axe accessibility and reflow at 320/768/1024/1440.

If axe flags the snapshot, the likely cause is the decorative image picking up an accessible name; confirm `alt=""` and `aria-hidden="true"` on the wrapper.

- [ ] **Step 3: Verify in the browser**

Start the preview and check, at minimum:
- Home: three testimonial notes each with a snapshot, and the visit block with a photo beside the details.
- `/reviews`: 24 notes with snapshots, no layout break in the masonry wall.
- 320px width: the visit block stacks, the snapshot does not overflow its note.
- Dark mode: the notes and prints stay light paper (physical-object doctrine); the snapshot must not invert or pick up a theme-token border.

- [ ] **Step 4: Confirm the heading collision stayed resolved**

The home page must contain "Come find us." once (VisitBlock) and "Come see it for yourself." once (the closing CTA). Two of the latter means Task 6's heading regressed.

- [ ] **Step 5: Commit anything outstanding and push**

```bash
git status
git push -u origin feat/home-photo-restoration
```

---

## Self-review notes

Spec coverage checked section by section:

- Testimonial snapshot design → Task 3
- Author-name join, unit tested → Task 2
- 24 assets, preprocessing to 320px WebP → Task 1
- Coverage and `/reviews` page weight → Task 3 Step 4, Task 10 Step 3
- Sanity `photo` field → Task 5
- VisitBlock, facts from `site.ts`, bolded religious line, two CTAs → Task 6
- Moment wiring, both render chains, `SECTION_DROP` → Task 7
- Two queued patch scripts → Task 8
- PENDING / PAGE_BUILDER / volunteer guide → Task 9
- Verification and the full gate → Task 10

Naming is consistent across tasks: `normalizeAuthor` and `photoFor` are defined in Task 2 and used unchanged in Tasks 4 and 8; `slugFor` in Task 1 produces exactly the filenames Task 2 imports.

Known duplication, deliberately not refactored: `Testimonial.astro` and `TestimonialWall.astro` carry the same note markup independently, so the snapshot block is added twice (Task 3 Step 2 and Task 4 Step 3). Merging them is a reasonable follow-up but is out of scope here, and doing it mid-change would make the visual review harder.

Heading collision resolved before execution (Nathan, 2026-07-19): the closing `ctaSection` keeps "Come see it for yourself." and VisitBlock takes "Come find us." Tasks 6, 7 and 10 assert this, so a regression fails a grep rather than reaching review.
