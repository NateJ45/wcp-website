// =============================================================================
// patch-twos-class-pet.mjs — move Kit the Kat into Sanity (docs/PENDING.md queue;
// dry-run by default)
// =============================================================================
// The Twos & Threes class-pet section currently ships as a CODE stopgap
// (src/lib/hub-stopgaps.ts → twosClassPet, rendered by the code-owned
// `classPetSection` type) because the Sanity write quota blocked both the doc
// edit and the photo upload. This lands the real thing:
//
//   1. Uploads src/assets/photos/kit-the-kat-sm.webp as a Sanity image asset.
//      This is the 900x506 copy, NOT the camera original: the original is
//      deliberately untracked (see .gitignore) because this repo is public and
//      the photo shows an identifiable child, while the hub page it appears on
//      is behind the family login. 900px is comfortably above the ~600px the
//      section renders at, and Sanity derives its responsive variants from it.
//      If you want a higher-resolution master in Sanity, upload the original by
//      hand in the Studio instead of committing it here.
//   2. Inserts a REAL `splitMediaSection` carrying the photo + blurb directly
//      ABOVE the closing CTA on `hubPage-twos`, matching where the stopgap put
//      it and mirroring the Pre-K handbook's Pickles section.
//
// Idempotent: re-running finds the existing section by _key and does nothing.
//
//   node scripts/patch-twos-class-pet.mjs            # dry run
//   node scripts/patch-twos-class-pet.mjs --commit
//
// AFTER RUNNING (same sitting, or the Studio and the site drift):
//   - Delete `twosClassPet` from src/lib/hub-stopgaps.ts, drop the `page`
//     argument at the twos-threes.astro call site, and delete
//     src/components/sections/ClassPetSection.astro plus its import,
//     BLEED entry, and render branch in HubSectionedBody.astro.
//   - Delete src/assets/photos/kit-the-kat-sm.webp (the pre-sized stopgap copy).
//   - Remove this script's row from docs/PENDING.md.
// =============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { client, COMMIT, done } from './patch-lib.mjs';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PHOTO = `${SITE_DIR}/src/assets/photos/kit-the-kat-sm.webp`;
const ID = 'hubPage-twos';
const KEY = 'twos-pet-kit';

const TITLE = 'Meet Kit the Kat, our class pet';
const BODY =
  'Kit the Kat is our class pet, shared by the Twos and the Threes. Starting in ' +
  'October, each child gets a weekend with Kit: take Kit everywhere, snap photos ' +
  'or draw pictures of the adventures (Kit at the playground! Kit at the dinner ' +
  'table!), and bring the backpack and story binder back Monday to share with ' +
  'the class.';
const ALT =
  'Kit the Kat, a plush cat, sitting on the playground next to a smiling child in a bike helmet.';

const doc = await client.getDocument(ID);
if (!doc) throw new Error(`${ID} not found`);
const sections = [...(doc.sections || [])];

if (sections.some((s) => s?._key === KEY)) {
  console.log(`Already present on ${ID} (_key "${KEY}"). Nothing to do.`);
  process.exit(0);
}

// Sit above the CLOSING CTA (the last one), so a mid-handbook CTA never catches
// this — same rule the stopgap and HubSectionedBody's sign-off logic use.
const ctaIdx = sections.map((s) => s?._type).lastIndexOf('ctaSection');
if (ctaIdx < 0) throw new Error(`no ctaSection on ${ID}`);

if (!COMMIT) {
  console.log(`DRY RUN — would upload ${PHOTO}`);
  console.log(`DRY RUN — would insert "${TITLE}" at index ${ctaIdx} of ${sections.length}`);
  done(1);
  process.exit(0);
}

const asset = await client.assets.upload('image', readFileSync(PHOTO), {
  filename: 'kit-the-kat.webp',
  title: 'Kit the Kat, the Twos and Threes class pet',
});

sections.splice(ctaIdx, 0, {
  _type: 'splitMediaSection',
  _key: KEY,
  background: 'white',
  rows: [
    {
      _type: 'row',
      _key: `${KEY}-row`,
      image: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
      alt: ALT,
      title: TITLE,
      body: BODY,
    },
  ],
});

await client.patch(ID).set({ sections }).commit();
console.log(`✓ ${ID}: "${TITLE}" inserted above the closing CTA (${sections.length} sections).`);
done(1);
