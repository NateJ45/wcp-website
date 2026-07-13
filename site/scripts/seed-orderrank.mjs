// =============================================================================
// Seed orderRank for the types converted from number-sort to drag-to-reorder
// =============================================================================
// One-time, idempotent: gives every faqItem / hubDocument that has no orderRank
// a LexoRank matching TODAY'S order (category asc, legacy `order` asc), so the
// first time a volunteer opens the drag list nothing jumps around. Additive
// only — never touches a document that already has an orderRank, and the
// frontend queries fall back to the legacy `order` field until this runs.
// Run: node scripts/seed-orderrank.mjs
// =============================================================================
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';
import { LexoRank } from 'lexorank';

const SITE_DIR = 'C:/Users/natha/Documents/Claude/Projects/West Chester Preschool Website/site';
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

for (const type of ['faqItem', 'hubDocument']) {
  // Drafts keep their published twin's rank when publishing, so seed both.
  const docs = await client.fetch(
    `*[_type == $type] | order(category asc, order asc){ _id, orderRank, category, order }`,
    { type },
  );
  let rank = LexoRank.middle();
  const tx = client.transaction();
  let patched = 0;
  for (const doc of docs) {
    rank = rank.genNext();
    if (doc.orderRank) continue; // already ranked (or already seeded) — leave it
    tx.patch(doc._id, (p) => p.setIfMissing({ orderRank: rank.toString() }));
    patched++;
  }
  if (patched > 0) await tx.commit();
  console.log(`${type}: ${docs.length} docs, seeded ${patched}`);
}
console.log('done');
