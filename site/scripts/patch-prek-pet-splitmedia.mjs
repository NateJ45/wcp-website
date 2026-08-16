// =============================================================================
// patch-prek-pet-splitmedia.mjs — give Pickles the same treatment as Kit the Kat
// =============================================================================
// The Twos page introduces its class pet with a splitMediaSection (photo in a
// framed print beside the blurb). The Pre-K page carried the same content as a
// centered proseSection with no photo, so the two class pets read as different
// kinds of thing. This converts the Pre-K one to a splitMediaSection matching
// the Twos section exactly, and uploads a PLACEHOLDER image so the layout is
// real while the Board waits on a photo of Pickles.
//
// Nathan: replace the placeholder in the Studio (Family Hub → Pre-K Classroom →
// the class-pet section → the row's image) with a real photo when you have one.
// Nothing else needs changing; the alt text prompts for it too.
//
// Idempotent — re-running finds the section already converted and stops. Run:
//   node scripts/patch-prek-pet-splitmedia.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const token = (readFileSync(`${SITE_DIR}/.dev.vars`, 'utf8').match(/SANITY_TOKEN="([^"]+)"/) ||
  [])[1];
if (!token) throw new Error('no SANITY_TOKEN in .dev.vars');
const client = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

const ID = 'hubPage-pre-k';
const KEY = 'prek-pet-sec';
const ASSET_TITLE = 'Placeholder — Pickles, the Pre-K class pet';

const doc = await client.getDocument(ID);
if (!doc) throw new Error(`${ID} not found`);
const sections = [...(doc.sections || [])];
const idx = sections.findIndex((s) => s._key === KEY);
if (idx < 0) throw new Error(`no section keyed ${KEY} on ${ID}`);

const existing = sections[idx];
if (existing._type === 'splitMediaSection') {
  console.log('Already a splitMediaSection. Nothing to do.');
  process.exit(0);
}

// Carry the existing copy across rather than retyping it, so a Board edit made
// since the section was seeded is preserved.
const title = existing.header?.title || 'Meet our class pet';
const body = (existing.body || [])
  .flatMap((block) => (block.children || []).map((c) => c.text || ''))
  .join(' ')
  .trim();
if (!body) throw new Error('the prose section has no body text to carry over');

// -- The placeholder image --------------------------------------------------
// Brand cream with a soft dashed frame and a caption saying what it is, at the
// same 900x506 (16:9-ish) as the Kit the Kat photo so the row's aspect box is
// filled exactly. Deliberately plain: it should read as "a photo goes here",
// never as artwork someone might mistake for final.
const W = 900;
const H = 506;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#fdf8ec"/>
  <rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none"
        stroke="#c9bda4" stroke-width="3" stroke-dasharray="14 12" rx="10"/>
  <circle cx="${W / 2}" cy="${H / 2 - 46}" r="46" fill="#f2e6cd"/>
  <text x="${W / 2}" y="${H / 2 - 30}" text-anchor="middle" font-size="46">🐶</text>
  <text x="${W / 2}" y="${H / 2 + 52}" text-anchor="middle"
        font-family="Georgia, serif" font-size="30" fill="#01203a">A photo of Pickles goes here</text>
  <text x="${W / 2}" y="${H / 2 + 92}" text-anchor="middle"
        font-family="Georgia, serif" font-size="20" fill="#6b6152">Replace this in the Studio</text>
</svg>`;
const png = await sharp(Buffer.from(svg)).png().toBuffer();

// Reuse the asset if this script already uploaded one (keeps re-runs clean).
const priorAsset = await client.fetch(`*[_type == "sanity.imageAsset" && title == $t][0]._id`, {
  t: ASSET_TITLE,
});
const assetId =
  priorAsset ||
  (
    await client.assets.upload('image', png, {
      filename: 'prek-pet-placeholder.png',
      title: ASSET_TITLE,
    })
  )._id;

const petSection = {
  _type: 'splitMediaSection',
  _key: KEY,
  background: existing.background || 'white',
  rows: [
    {
      _type: 'row',
      _key: 'prek-pet-row',
      title,
      body,
      // Names the placeholder honestly: alt text is read aloud, so it must not
      // claim to describe a photo that isn't there yet.
      alt: 'Placeholder image. A photo of Pickles, the Pre-K class pet, goes here.',
      image: { _type: 'image', asset: { _type: 'reference', _ref: assetId } },
    },
  ],
};

sections[idx] = petSection;
await client.patch(ID).set({ sections }).commit();
console.log(
  `✓ ${ID}: "${title}" is now a splitMediaSection with a placeholder image (asset ${assetId}).`,
);
