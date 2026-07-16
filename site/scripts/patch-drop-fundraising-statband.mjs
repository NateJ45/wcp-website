// =============================================================================
// patch-drop-fundraising-statband.mjs — remove the budget count-up band
// =============================================================================
// One-off, idempotent patch: drops the `statBandSection` (the navy Target
// Revenue / Total Expenses / Projected Net count-up block) from the live
// hubPage-fundraising doc's `sections`, leaving "The Budget" prose section.
// The seed (seed-hub-knowledge.mjs) has already been updated to match, so a
// re-seed won't bring it back. Safe to run repeatedly — a no-op once removed.
// Run: node scripts/patch-drop-fundraising-statband.mjs
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

const ID = 'hubPage-fundraising';
const doc = await client.getDocument(ID);
if (!doc) throw new Error(`${ID} not found`);

const sections = Array.isArray(doc.sections) ? doc.sections : [];
const kept = sections.filter((s) => s?._type !== 'statBandSection');

if (kept.length === sections.length) {
  console.log(`✓ ${ID}: no statBandSection present — nothing to do (${sections.length} sections)`);
} else {
  await client.patch(ID).set({ sections: kept }).commit();
  console.log(
    `✓ ${ID}: removed ${sections.length - kept.length} statBandSection (now ${kept.length} sections)`,
  );
}
