// =============================================================================
// patch-hub-store-photos.mjs — turn hotlinked product photos into real assets
// =============================================================================
// One-shot, idempotent. The hubStore featured-merch tiles stored hotlinked
// image URLs (Fourthwall's signed imgproxy links, which expire). This
// downloads each one, uploads it as a Sanity image asset, and sets the new
// `photo` field on that product. Products that already have a photo are
// skipped, so a re-run changes nothing. The legacy `image` URL is left in
// place as the render fallback.
//
//   node scripts/patch-hub-store-photos.mjs            # dry run
//   node scripts/patch-hub-store-photos.mjs --commit   # apply
// =============================================================================
import { client, COMMIT, apply, done } from './patch-lib.mjs';

const doc = await client.fetch('*[_id == "hubStore"][0]{ storeProducts }');
const products = doc?.storeProducts ?? [];
let n = 0;

if (products.length === 0) {
  console.log('hubStore has no featured products — nothing to convert.');
}

for (const p of products) {
  if (!p._key) continue;
  if (p.photo?.asset?._ref) {
    console.log(`SKIP ${p.title ?? p._key}: already has an uploaded photo.`);
    continue;
  }
  if (!p.image) {
    console.log(`SKIP ${p.title ?? p._key}: no legacy image URL to convert.`);
    continue;
  }
  n += 1;
  await apply(`upload photo for "${p.title ?? p._key}"`, async () => {
    const res = await fetch(p.image);
    if (!res.ok) throw new Error(`fetch ${res.status} for ${p.title}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const filename = `${(p.title ?? 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`;
    const asset = await client.assets.upload('image', buffer, { filename });
    await client
      .patch('hubStore')
      .set({
        [`storeProducts[_key=="${p._key}"].photo`]: {
          _type: 'image',
          asset: { _type: 'reference', _ref: asset._id },
        },
      })
      .commit();
  });
  // Dry runs still want to prove the URL is alive before promising a convert.
  if (!COMMIT) {
    const head = await fetch(p.image, { method: 'HEAD' }).catch(() => null);
    console.log(`      (source URL answers: ${head ? head.status : 'unreachable'})`);
  }
}

done(n);
