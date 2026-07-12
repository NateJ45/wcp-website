// =============================================================================
// add-instagram-home.mjs — create the "Life inside WCP" fallback album and add
// the Instagram bulletin-board section to the home page.
// =============================================================================
// The instagramSection shows the live Instagram feed once INSTAGRAM_TOKEN is
// set; until then it shows this curated album (real WCP photos). Idempotent.
// Run: node scripts/add-instagram-home.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { key, sh, ref, imageValue, makeUploader } from './pagebuilder-lib.mjs';

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

const photos = [
  ['about-hero-DSC8231.jpg', 'Children exploring together at West Chester Preschool'],
  ['twos-hero-PXL_20250507.jpg', 'A Twos classroom morning'],
  ['threes-hero-3L7A0257.jpg', 'Threes busy at play'],
  ['prek-hero-IMG_8825.jpg', 'Pre-K children learning together'],
  ['shared-3L7A4007.jpg', 'A hands-on day at WCP'],
  ['shared-3L7A4018.jpg', 'Making and building at WCP'],
  ['prek-testimonial-495704435.jpg', 'A happy WCP family'],
  ['threes-testimonial-448967548.jpg', 'WCP friends together'],
  ['twos-testimonial-TayloreDore.jpg', 'A joyful moment at WCP'],
];

const photoObjs = [];
for (const [file, alt] of photos) {
  const assetId = await up.upload(`../assets-from-squarespace/page-specific/${file}`);
  photoObjs.push({ _type: 'figureImage', _key: key(), image: imageValue(assetId), alt });
}

await client.createOrReplace({
  _id: 'album-life-inside-wcp',
  _type: 'photoAlbum',
  title: 'Life inside WCP',
  description:
    'Recent moments from around the school. Shown until the live Instagram feed is connected.',
  photos: photoObjs,
});
console.log(`✓ album-life-inside-wcp (${photoObjs.length} photos)`);

const igSection = {
  _type: 'instagramSection',
  _key: 'hp-instagram',
  header: sh(
    'Follow along',
    'Life inside WCP.',
    'Classroom moments, school events, and the everyday joy of being part of a co-op community.',
  ),
  fallbackAlbum: ref('album-life-inside-wcp'),
  background: 'navy',
  seam: true,
};

for (const id of ['page-home', 'drafts.page-home']) {
  const doc = await client.getDocument(id).catch(() => null);
  if (!doc) {
    console.log(`${id}: (none)`);
    continue;
  }
  const sections = (doc.sections || []).filter((s) => s._key !== 'hp-instagram');
  let at = sections.findIndex((s) => s._key === 'hp-visit');
  if (at < 0) at = sections.findIndex((s) => s._key === 'k15');
  if (at < 0) sections.push(igSection);
  else sections.splice(at, 0, igSection);
  await client.patch(id).set({ sections }).commit();
  console.log(`${id}: ${sections.length} sections`);
}
console.log('\nDone.');
