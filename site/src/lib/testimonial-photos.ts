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
// CLOSE OUT is a THREE-step sequence and the order matters, because nothing
// reads the Sanity `photo` field yet (the testimonial projections in
// queries.ts select quote/author/role only). Deleting this module first would
// take all 24 photos off the live site:
//   1. run scripts/patch-testimonial-photos.mjs --commit (uploads the assets)
//   2. project `photo` in BOTH testimonial queries (queries.ts: the
//      testimonialSection branch of PAGE_BY_SLUG_QUERY, and getTestimonials)
//      and render it in Testimonial.astro / TestimonialWall.astro
//   3. only then delete this file, its test, src/assets/testimonials/, and the
//      photoFor() threading in TestimonialSection.astro AND TestimonialWall.astro
//      (both import it — deleting on the strength of step 3 alone breaks the build)
// See docs/PENDING.md.
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
