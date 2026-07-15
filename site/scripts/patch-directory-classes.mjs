// =============================================================================
// patch-directory-classes.mjs — one-off: fix two families' Pre-K session
// =============================================================================
// The Burtenshaw child moves from Pre-K AM → Pre-K PM; the Riley child moves
// from Pre-K PM → Pre-K AM (a straight swap of their Pre-K session). Every
// other child (e.g. Riley's Twos) is left untouched. Idempotent: re-running
// after it has applied is a no-op.
//
// Reads SANITY_TOKEN from .env. NOTE: this is a WRITE (mutation) and goes
// through the non-CDN API, so it needs API-request quota available.
//   node scripts/patch-directory-classes.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const token = (env.match(/SANITY_TOKEN=(.+)/) || [])[1]?.trim();
if (!token) throw new Error('SANITY_TOKEN not found in .env');

const client = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
});

// familyName → { from: classToMove, to: newClass }
const MOVES = {
  Burtenshaw: { from: 'pre-k-am', to: 'pre-k-pm' },
  Riley: { from: 'pre-k-pm', to: 'pre-k-am' },
};

const entries = await client.fetch(
  `*[_type == "directoryEntry" && familyName in $names]{ _id, familyName, children[]{ _key, name, class } }`,
  { names: Object.keys(MOVES) },
);

if (!entries.length) {
  console.error('No matching directory entries found for:', Object.keys(MOVES).join(', '));
  process.exit(1);
}

for (const entry of entries) {
  const move = MOVES[entry.familyName];
  const hits = (entry.children ?? []).filter((c) => c.class === move.from);
  if (!hits.length) {
    console.log(`• ${entry.familyName}: nobody in ${move.from} (already moved?) — skipping`);
    continue;
  }
  let patch = client.patch(entry._id);
  for (const child of hits) {
    patch = patch.set({ [`children[_key=="${child._key}"].class`]: move.to });
    console.log(`• ${entry.familyName}: ${child.name} ${move.from} → ${move.to}`);
  }
  await patch.commit();
}

console.log('Done.');
