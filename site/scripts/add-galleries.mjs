// =============================================================================
// add-galleries.mjs — the two "nice to have" visual bits the audit flagged:
//   • About: the graduation "hat throw" image alongside the 55-years story.
//   • Virtual Tour: a classroom-moments photo gallery.
// Idempotent (fixed pp-* keys). Patches published + draft. Uploads from the
// local assets-from-squarespace copies. Run: node scripts/add-galleries.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { sh, gallery, splitMedia, makeUploader } from './pagebuilder-lib.mjs';

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
const up = makeUploader(client);

// --- About: graduation moment ------------------------------------------------
const gradAsset = await up.upload(
  '../assets-from-squarespace/page-specific/about-graduation-HatThrow.gif',
);
const aboutGrad = {
  ...splitMedia({
    bg: 'cream',
    seam: true,
    header: null,
    rows: [
      {
        assetId: gradAsset,
        alt: 'West Chester Preschool students throwing their graduation caps',
        eyebrow: 'Since 1969',
        title: 'Generations of WCP graduates',
        body: 'Every spring another class of WCP kids tosses their caps and heads off to kindergarten, ready and confident. It has been that way for more than 55 years.',
      },
    ],
  }),
  _key: 'pp-about-grad',
};

// --- Virtual Tour: classroom gallery -----------------------------------------
const tourPhotos = [
  ['images/011-3L7A1350.jpg', 'Children exploring together at West Chester Preschool'],
  ['images/016-3L7A5173.jpg', 'A hands-on classroom activity'],
  ['images/034-3L7A2694.jpg', 'Learning through play at WCP'],
  ['images/040-3L7A4007.jpg', 'A busy morning in a WCP classroom'],
  ['images/043-3L7A1929.jpg', 'Friends at West Chester Preschool'],
  ['images/017-image-asset.jpeg', 'A WCP classroom moment'],
  ['images/019-image-asset.jpeg', 'Creativity in the classroom'],
  ['images/023-image-asset.jpeg', 'Playtime at West Chester Preschool'],
];
const tourPhotoObjs = [];
for (const [rel, alt] of tourPhotos) {
  const assetId = await up.upload(`../assets-from-squarespace/${rel}`);
  tourPhotoObjs.push({ assetId, alt });
}
const tourGallery = {
  ...gallery({
    bg: 'white',
    seam: true,
    header: sh(
      'Around the School',
      'A look inside our rooms',
      'Real moments from around the school, from circle time to the playground.',
    ),
    photos: tourPhotoObjs,
  }),
  _key: 'pp-tour-gallery',
};

async function patch(slug, section, place) {
  for (const id of [`page-${slug}`, `drafts.page-${slug}`]) {
    const doc = await client.getDocument(id).catch(() => null);
    if (!doc) continue;
    let sections = (doc.sections || []).filter((s) => s._key !== section._key);
    let at = place(sections);
    if (at < 0 || at > sections.length) at = sections.length;
    sections = [...sections.slice(0, at), section, ...sections.slice(at)];
    await client.patch(id).set({ sections }).commit();
    console.log(`${id}: -> ${sections.length} sections (inserted ${section._key} at ${at})`);
  }
}

// About: right after the first proseSection (the 55-years story).
await patch('about', aboutGrad, (secs) => {
  const i = secs.findIndex((s) => s._type === 'proseSection');
  return i < 0 ? 1 : i + 1;
});

// Virtual tour: just before the testimonials wall (or the first CTA).
await patch('virtual-tour', tourGallery, (secs) => {
  let i = secs.findIndex((s) => s._key === 'pp-tour-testimonials');
  if (i < 0) i = secs.findIndex((s) => s._type === 'ctaSection');
  return i;
});

console.log('\nDone.');
