// =============================================================================
// seed-order-ranks.mjs — give existing docs an orderRank for drag-to-reorder
// =============================================================================
// The orderable-document-list plugin sorts by a LexoRank string `orderRank`.
// Existing docs don't have one yet, so this seeds ranks from the current (now
// hidden) `order` field, preserving today's ordering with no visible change on
// the site. Idempotent: only touches docs that are missing orderRank, so it
// never clobbers an order a volunteer has since set by dragging.
// Run once after deploying the schema change: node scripts/seed-order-ranks.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { LexoRank } from 'lexorank';

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

const TYPES = ['class', 'testimonial', 'schoolYearEvent', 'coopRole'];

async function run() {
  for (const type of TYPES) {
    // Docs still missing a rank, in their current order (the old `order` field,
    // then oldest-first as a stable tiebreak).
    const docs = await client.fetch(
      `*[_type == $type && !defined(orderRank)] | order(coalesce(order, 9999) asc, _createdAt asc){ _id }`,
      { type },
    );
    if (docs.length === 0) {
      console.log(`${type}: already ranked — skipped`);
      continue;
    }
    let rank = LexoRank.middle();
    const tx = client.transaction();
    for (const doc of docs) {
      tx.patch(doc._id, { set: { orderRank: rank.toString() } });
      rank = rank.genNext();
    }
    await tx.commit();
    console.log(`${type}: seeded ${docs.length} ranks`);
  }
}

run().then(
  () => console.log('done'),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
