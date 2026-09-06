// =============================================================================
// patch-bold-bands.mjs — the 2026-09-01 bold pass over stored page bands
// =============================================================================
// Nathan: "a lot more background color and variety, and less hard section
// borders". The code half added the `sunshine` and `sky` bands and put the
// sweep seam at every color change; this migrates the CONTENT half: every
// public page section stored on the washed-out `grey` band moves to the
// saturated bands, alternating sunshine → sky in page order so neighbours
// differ (which is also what makes the new seams appear between them).
//
// The anti-kitsch budget still holds: DENSE-DATA sections (FAQ, forms,
// tables, downloads, contact) keep their quiet grey — bold color behind a
// pricing table reads as noise, not warmth. hubPage docs are untouched: the
// hub keeps its own canvas.
//
// Idempotent (re-running finds no grey left outside the quiet list). Dry-run
// by default; --apply writes. Patches the published doc AND its draft twin
// when one exists, so a pending edit cannot resurrect the old color.
//   node scripts/patch-bold-bands.mjs --apply
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

// Dense-data types that KEEP grey (the anti-kitsch budget).
const STAY_QUIET = new Set([
  'faqSection',
  'formSection',
  'tuitionTableSection',
  'tuitionCalculatorSection',
  'downloadsSection',
  'contactDetailsSection',
]);

const docs = await client.fetch(
  `*[_type == "page"]{ _id, slug, "sections": sections[]{ _key, _type, background } }`,
);

// Group draft/published twins so both get the SAME new colors.
const byId = new Map();
for (const d of docs) {
  const id = d._id.replace(/^drafts\./, '');
  const entry = byId.get(id) ?? { ids: [], sections: null, slug: d.slug };
  entry.ids.push(d._id);
  // The published twin decides the alternation; a draft-only page uses its own.
  if (!d._id.startsWith('drafts.') || !entry.sections) entry.sections = d.sections ?? [];
  byId.set(id, entry);
}

let pages = 0;
let bands = 0;
for (const [id, { ids, sections, slug }] of byId) {
  let flip = 0;
  const sets = {};
  for (const s of sections ?? []) {
    if (s.background !== 'grey' || STAY_QUIET.has(s._type)) continue;
    sets[`sections[_key=="${s._key}"].background`] = flip % 2 === 0 ? 'sunshine' : 'sky';
    flip += 1;
  }
  if (Object.keys(sets).length === 0) continue;
  pages += 1;
  bands += Object.keys(sets).length;
  console.log(`${slug ?? id}:`);
  for (const [p, v] of Object.entries(sets)) console.log(`   ${p} → ${v}`);
  if (APPLY) {
    for (const docId of ids) {
      // Unset-safe: patch only paths that exist on that twin (set() on a
      // missing array item is a no-op error-free in Sanity? It errors — so
      // filter per twin by re-reading its keys).
      const twin = await client.fetch(`*[_id == $id][0]{ "keys": sections[]._key }`, {
        id: docId,
      });
      const keys = new Set(twin?.keys ?? []);
      const mine = Object.fromEntries(
        Object.entries(sets).filter(([p]) => keys.has(p.match(/_key=="([^"]+)"/)[1])),
      );
      if (Object.keys(mine).length) await client.patch(docId).set(mine).commit();
    }
  }
}
console.log(
  bands === 0
    ? '✓ nothing left on grey outside the quiet list.'
    : APPLY
      ? `✓ recolored ${bands} band(s) across ${pages} page(s).`
      : `DRY RUN: ${bands} band(s) across ${pages} page(s) would change. Re-run with --apply.`,
);
