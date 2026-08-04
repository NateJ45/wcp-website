// =============================================================================
// remove-directory-families.mjs — take unenrolled families OUT of the Directory
// =============================================================================
// When a family leaves the school, their `directoryEntry` doc (names, emails,
// phones, home address, children, photo) should not linger in the CMS. This
// deletes the whole doc — published AND draft — plus the family photo asset it
// owned, so no PII is left behind.
//
// Surnames are passed as ARGUMENTS, never hardcoded: this repo is public, and a
// list of real family names is exactly the sort of thing that must not be
// committed. Matching is on `familyName`, case-insensitive.
//
//   node scripts/remove-directory-families.mjs Smith Jones        # dry run
//   node scripts/remove-directory-families.mjs Smith Jones --commit
//
// Dry run by default: it prints what it found and what it would delete, and
// touches nothing. Idempotent — a second --commit run finds nothing and exits 0.
//
// Reads SANITY_TOKEN from .dev.vars. This is a WRITE (mutation) over the
// non-CDN API, so it needs API-request quota available (see docs/PENDING.md).
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const commit = args.includes('--commit');
const names = args.filter((a) => !a.startsWith('--'));

if (!names.length) {
  console.error('Usage: node scripts/remove-directory-families.mjs <Surname> [...] [--commit]');
  process.exit(1);
}

const token = (readFileSync(new URL('../.dev.vars', import.meta.url), 'utf8').match(
  /SANITY_TOKEN="([^"]+)"/,
) || [])[1];
if (!token) throw new Error('SANITY_TOKEN not found in .dev.vars');

const client = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

// Match case-insensitively so "smith" and "Smith" both land.
const wanted = names.map((n) => n.toLowerCase());
const entries = await client.fetch(
  `*[_type == "directoryEntry" && lower(familyName) in $names]{
     _id, familyName, "photoRef": photo.asset._ref,
     "adults": parents[].name, "kids": children[].name
   } | order(familyName asc)`,
  { names: wanted },
);

const found = new Set(entries.map((e) => e.familyName.toLowerCase()));
for (const n of wanted) {
  if (!found.has(n)) console.log(`• ${n}: no directory entry (already removed?)`);
}

if (!entries.length) {
  console.log('\nNothing to do.');
  process.exit(0);
}

console.log(`\n${commit ? 'Deleting' : 'Would delete'} ${entries.length} directory entr(ies):\n`);
for (const e of entries) {
  console.log(`  ${e.familyName}`);
  console.log(`    doc      ${e._id} (+ drafts.${e._id})`);
  console.log(`    adults   ${(e.adults ?? []).join(', ') || '(none)'}`);
  console.log(`    children ${(e.kids ?? []).join(', ') || '(none)'}`);
  console.log(`    photo    ${e.photoRef ?? '(none)'}`);
}

if (!commit) {
  console.log('\nDry run — nothing was changed. Re-run with --commit to delete.');
  process.exit(0);
}

for (const e of entries) {
  // Draft first: deleting the published doc while a draft still points at the
  // photo asset would block the asset delete below.
  await client.delete(`drafts.${e._id}`).catch(() => {});
  await client.delete(e._id);
  console.log(`✓ deleted ${e._id}`);

  // The family photo was uploaded for this family only (one asset per family,
  // see migrate-directory.mjs), so it goes with them. Sanity refuses to delete
  // an asset still referenced anywhere, which is the safety net if that ever
  // stops being true — a refusal is logged, not fatal.
  if (e.photoRef) {
    try {
      await client.delete(e.photoRef);
      console.log(`✓ deleted photo asset ${e.photoRef}`);
    } catch (err) {
      console.warn(`  ! photo asset kept (${err.message.split('\n')[0]})`);
    }
  }
}

console.log('\nDone. The directory rebuilds on the next hub request (PII is never cached).');
