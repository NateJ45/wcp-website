// =============================================================================
// patch-testimonial-redistribution.mjs — each page a different voice
// (docs/PENDING.md queue; dry-run by default)
// =============================================================================
// The audit: the SAME three quotes repeat verbatim on home / co-op-life (and
// /reviews showed only 3 until a code override forced the full wall). This:
//   1. /reviews testimonialSection (k30): source "all", layout "wall" — the
//      dedicated page owns every voice IN THE DOC (after committing, the
//      pageSlug==='reviews' code override in TestimonialSection.astro can be
//      deleted — see docs/PENDING.md close-out).
//   2. /why-wcp wall section: becomes a curated teaser (source "featured",
//      limit 6, layout grid) pointing readers to /reviews.
//   3. home + co-op-life 3-up sections: rotate to DIFFERENT offsets of the
//      testimonial pool via source "all" + limit 3 — the component slices, so
//      variety needs distinct sources; simplest honest change: home keeps
//      featured, co-op-life switches to tag "co-op" if tagged docs exist,
//      else stays and gets a note to hand-curate in the Studio.
//   node scripts/patch-testimonial-redistribution.mjs            # dry run
//   node scripts/patch-testimonial-redistribution.mjs --commit
// =============================================================================
import { client, apply, done } from './patch-lib.mjs';

let n = 0;

// 1. /reviews → the full wall, in the doc.
const reviews = await client.getDocument('page-reviews');
const rSec = (reviews?.sections ?? []).find((s) => s._type === 'testimonialSection');
if (rSec && (rSec.source !== 'all' || rSec.layout !== 'wall')) {
  n++;
  await apply(`/reviews ${rSec._key}: source=${rSec.source}→all, layout=${rSec.layout}→wall`, () =>
    client
      .patch('page-reviews')
      .set({
        [`sections[_key=="${rSec._key}"].source`]: 'all',
        [`sections[_key=="${rSec._key}"].layout`]: 'wall',
      })
      .commit(),
  );
}

// 2. /why-wcp wall → curated 6-quote teaser.
const why = await client.getDocument('page-why-wcp');
const wSec = (why?.sections ?? []).find(
  (s) => s._type === 'testimonialSection' && s.layout === 'wall',
);
if (wSec) {
  n++;
  await apply(`/why-wcp ${wSec._key}: wall → featured grid, limit 6`, () =>
    client
      .patch('page-why-wcp')
      .set({
        [`sections[_key=="${wSec._key}"].source`]: 'featured',
        [`sections[_key=="${wSec._key}"].layout`]: 'grid',
        [`sections[_key=="${wSec._key}"].limit`]: 6,
      })
      .commit(),
  );
}

// 3. co-op-life: tag-scoped voices when tagged docs exist.
const coopTagged = await client.fetch(`count(*[_type == "testimonial" && "co-op" in tags])`);
if (coopTagged >= 3) {
  const coop = await client.getDocument('page-co-op-life');
  const cSec = (coop?.sections ?? []).find((s) => s._type === 'testimonialSection');
  if (cSec && cSec.source !== 'tag') {
    n++;
    await apply(`/co-op-life ${cSec._key}: source → tag "co-op" (${coopTagged} tagged)`, () =>
      client
        .patch('page-co-op-life')
        .set({
          [`sections[_key=="${cSec._key}"].source`]: 'tag',
          [`sections[_key=="${cSec._key}"].tag`]: 'co-op',
        })
        .commit(),
    );
  }
} else {
  console.log(
    `note: only ${coopTagged} testimonials tagged "co-op" — tag more in the Studio, then re-run for the co-op-life variety step.`,
  );
}

done(n);
