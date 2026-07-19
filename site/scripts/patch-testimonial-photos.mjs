// =============================================================================
// patch-testimonial-photos.mjs — move the 24 family snapshots into Sanity
// (docs/PENDING.md queue; dry-run by default)
// =============================================================================
// The testimonial photos currently ship as a CODE stopgap
// (src/lib/testimonial-photos.ts → PHOTOS, joined to Sanity `testimonial`
// documents by author name, rendered from local committed WebP files)
// because Sanity WRITES were quota-frozen when Task 5 added the optional
// `photo` image field to the `testimonial` schema. This lands the real thing:
//
//   1. Uploads each of the 24 320x320 WebP files in src/assets/testimonials/
//      (NOT the multi-megabyte archive originals in the gitignored
//      ../assets-from-squarespace/images/ — that directory may not even exist
//      on the machine that runs this; the committed WebP is the only file
//      guaranteed present).
//   2. Finds the matching `testimonial` document by AUTHOR NAME, normalized
//      with the exact same rule as normalizeAuthor() in
//      src/lib/testimonial-photos.ts (duplicated below with a comment, since
//      a .mjs script cannot import a .ts module — see that comment for why
//      this must stay byte-for-byte identical to the original).
//   3. Sets `photo` on the matched document to the uploaded asset.
//
// Matching is EXACT normalized-string equality only. No fuzzy/partial/
// first-name matching: a wrong match would put the wrong family's face on a
// real family's quote. Anything that doesn't match exactly is logged loudly
// at the end instead of guessed.
//
// Idempotent: a document that already has `photo` set is left alone (and its
// asset is never re-uploaded, since the upload only happens right before that
// document's patch).
//
//   node scripts/patch-testimonial-photos.mjs            # dry run
//   node scripts/patch-testimonial-photos.mjs --commit
//
// AFTER RUNNING (same sitting, or the Studio and the site drift):
//   - Delete src/lib/testimonial-photos.ts and its test.
//   - Delete the `photo` prop threading that reads from it in
//     TestimonialSection.astro (and wherever else it's consumed).
//   - Delete the src/assets/testimonials/ directory.
//   - Remove this script's row from docs/PENDING.md.
// =============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { client, COMMIT, apply, done } from './patch-lib.mjs';
import { MAP, slugFor } from './testimonial-photo-map.mjs';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PHOTO_DIR = `${SITE_DIR}/src/assets/testimonials`;

/** Lowercase, strip punctuation, collapse runs of separators to one space.
 *  MUST match normalizeAuthor() in src/lib/testimonial-photos.ts exactly — a
 *  .mjs script can't import that .ts module, so this is a deliberate,
 *  commented duplicate, not a reimplementation. If you change one, change
 *  both, or a family's photo silently stops matching their quote. */
function normalizeAuthor(author) {
  return author
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// GROQ for every testimonial doc that has an author, so we can both match
// against MAP and report any doc whose author matches nothing.
const QUERY = `*[_type == "testimonial" && defined(author)]{ _id, author, photo }`;

let docs;
try {
  docs = await client.fetch(QUERY);
} catch (err) {
  console.error(`Failed to read testimonials from Sanity: ${err.message}`);
  console.error(
    'If this is a 402 plan_limit_reached, the API quota is still frozen (docs/PENDING.md) — this is expected, not a script bug.',
  );
  process.exit(1);
}

const normalizedMap = new Map(
  Object.entries(MAP).map(([author, file]) => [normalizeAuthor(author), { author, file }]),
);

const unmatchedMapAuthors = new Set(Object.keys(MAP));
const unmatchedDocs = [];

let changes = 0;

for (const doc of docs) {
  const key = normalizeAuthor(doc.author);
  const entry = normalizedMap.get(key);

  if (!entry) {
    unmatchedDocs.push(doc);
    continue;
  }

  unmatchedMapAuthors.delete(entry.author);

  if (doc.photo && doc.photo.asset) {
    console.log(`SKIP  ${doc.author} (${doc._id}): already has a photo.`);
    continue;
  }

  const webpPath = `${PHOTO_DIR}/${slugFor(entry.author)}.webp`;
  changes++;

  await apply(
    `${doc.author} (${doc._id}): upload ${slugFor(entry.author)}.webp and set photo`,
    async () => {
      const asset = await client.assets.upload('image', readFileSync(webpPath), {
        filename: `${slugFor(entry.author)}.webp`,
        title: `${entry.author} — testimonial photo`,
      });
      await client
        .patch(doc._id)
        .set({ photo: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } })
        .commit();
    },
  );
}

// --- Loud reporting: a silent miss means a family with no photo. ------------
if (unmatchedMapAuthors.size > 0) {
  console.log(
    `\nNO MATCHING SANITY DOCUMENT for ${unmatchedMapAuthors.size} author(s) in the map (their photo was NOT uploaded):`,
  );
  for (const author of unmatchedMapAuthors) console.log(`  - ${author}`);
}

if (unmatchedDocs.length > 0) {
  console.log(
    `\nSANITY TESTIMONIAL(S) WHOSE AUTHOR MATCHED NOTHING in the photo map (left untouched):`,
  );
  for (const doc of unmatchedDocs) console.log(`  - "${doc.author}" (${doc._id})`);
}

if (unmatchedMapAuthors.size === 0 && unmatchedDocs.length === 0) {
  console.log('\nEvery mapped author matched exactly one testimonial document. No misses.');
}

done(changes);
