// =============================================================================
// geocode-directory.mjs — turn directory home addresses into map pins.
// =============================================================================
// Reads every directoryEntry that has an `address` but no `location` yet,
// geocodes the address with OpenStreetMap's free Nominatim service (no API key)
// and writes back a `location` geopoint. Idempotent — only touches entries that
// still need a pin, and rate-limited to Nominatim's 1 request/second policy.
// Run after families add/update addresses: node scripts/geocode-directory.mjs
// (Could also be a scheduled GitHub Action.)
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

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

const entries = await client.fetch(
  `*[_type == "directoryEntry" && defined(address) && !defined(location)]{ _id, familyName, address }`,
);
console.log(`${entries.length} address(es) to geocode.`);

let ok = 0;
for (const e of entries) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(e.address)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'wcp-website directory geocoder' } });
    const data = await res.json();
    if (Array.isArray(data) && data[0]) {
      await client
        .patch(e._id)
        .set({
          location: {
            _type: 'geopoint',
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          },
        })
        .commit();
      ok++;
      console.log(`  ✓ ${e.familyName}: ${data[0].lat}, ${data[0].lon}`);
    } else {
      console.log(`  ✗ ${e.familyName}: no match for "${e.address}"`);
    }
  } catch (err) {
    console.log(`  ! ${e.familyName}: ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, 1100)); // Nominatim: max 1 req/sec
}
console.log(`\nDone. Geocoded ${ok}/${entries.length}.`);
