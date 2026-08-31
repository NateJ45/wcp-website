// =============================================================================
// patch-navy-bands.mjs — the cool half of the bold pass goes NAVY
// =============================================================================
// Nathan, on seeing the first recolor: "not a fan of the timidity of the
// colors... instead of our bold orange and navy. The older squarespace site
// benefits much more from the bold colors." So the rhythm hardens: the bands
// patch-bold-bands.mjs moved to the pale `sky` tint move again, to full navy —
// giving public pages the old site's orange/navy/white confidence. (`sky`
// stays in the volunteer palette as a soft option; it just stops being part
// of the default rhythm.) Navy bands already flip headings/text to white and
// the navy-adjacency doctrine keeps two navys from touching.
//
// Idempotent (re-running finds no sky left). Dry-run by default; --apply
// writes. Patches published + draft twins, same as patch-bold-bands.mjs.
//   node scripts/patch-navy-bands.mjs --apply
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

const APPLY = process.argv.includes('--apply');

const docs = await client.fetch(
  `*[_type == "page" && count(sections[background == "sky"]) > 0]{
    _id, slug, "keys": sections[background == "sky"]._key
  }`,
);

let bands = 0;
for (const d of docs) {
  const sets = Object.fromEntries(d.keys.map((k) => [`sections[_key=="${k}"].background`, 'navy']));
  bands += d.keys.length;
  console.log(`${d.slug ?? d._id}: ${d.keys.length} band(s) → navy`);
  if (APPLY) await client.patch(d._id).set(sets).commit();
}
console.log(
  bands === 0
    ? '✓ no sky bands left on pages.'
    : APPLY
      ? `✓ ${bands} band(s) → navy.`
      : `DRY RUN: ${bands} band(s) would go navy. Re-run with --apply.`,
);
