// =============================================================================
// migrate-aday-gallery.mjs — the old site's big classroom photo gallery
// =============================================================================
// The old Squarespace /a-day-at-wcp page carried an ~80-photo gallery that the
// original migration reduced to 6 curated shots. This brings the WHOLE gallery
// over: every image matched from the assets-from-squarespace download (plus
// one fetched straight from the Squarespace CDN), uploaded to Sanity with the
// old page's real alt text, replacing the photos on the page's existing
// gallery section. Idempotent (uploads cached in scripts/.asset-map.json).
// Requires: scratchpad JSON from the parity audit — regenerate by extracting
// <img data-src/alt> pairs from the old page if re-running from scratch.
// Run: node scripts/migrate-aday-gallery.mjs <path-to-aday-matched.json>
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { makeUploader, imageValue, key } from './pagebuilder-lib.mjs';

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

const matchedPath = process.argv[2];
if (!matchedPath)
  throw new Error('usage: node scripts/migrate-aday-gallery.mjs <aday-matched.json>');
const matched = JSON.parse(readFileSync(matchedPath, 'utf8'));

const FALLBACK_ALT = 'A moment from a WCP classroom session';
const photos = [];
let n = 0;
for (const m of matched) {
  const assetId = await up.upload(`../assets-from-squarespace/${m.file}`);
  photos.push({
    _type: 'figureImage',
    _key: `adayg${(n++).toString(36).padStart(3, '0')}`,
    image: imageValue(assetId),
    alt: m.alt?.trim() || FALLBACK_ALT,
  });
  if (n % 10 === 0) console.log(`  …${n}/${matched.length} uploaded`);
}

// The one gallery image not in the local download — fetch from the CDN.
const CDN_EXTRA =
  'https://images.squarespace-cdn.com/content/v1/633e448a92b9f75e88623884/1741792954347-YHNPB40MFO0DWNVJJW02/PXL_20260312_150234544.RAW-01.MP.COVER+%281%29.jpg';
try {
  const res = await fetch(CDN_EXTRA);
  if (res.ok) {
    const buf = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload('image', buf, { filename: 'aday-extra-cover.jpg' });
    photos.push({
      _type: 'figureImage',
      _key: 'adaygextra',
      image: imageValue(asset._id),
      alt: FALLBACK_ALT,
    });
    console.log('  + 1 fetched from the Squarespace CDN');
  }
} catch {
  console.log('  (CDN extra skipped — unreachable)');
}

// Replace the photos on the page's existing gallery section (k122), and let
// the header own the story of what this now is.
const doc = await client.getDocument('page-a-day-at-wcp');
const sec = doc.sections.find((s) => s._key === 'k122');
sec.header.lead =
  'Dozens of real moments from around the school — the activities, the helpers, the outdoor time, and everything in between. This is what a WCP session actually looks like.';
sec.photos = photos;
await client.createOrReplace(doc);
console.log(`✓ page-a-day-at-wcp gallery: ${photos.length} photos (was 6)`);
