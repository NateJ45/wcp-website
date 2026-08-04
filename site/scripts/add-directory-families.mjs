// =============================================================================
// add-directory-families.mjs — add newly enrolled families to the Directory
// =============================================================================
// Creates one `directoryEntry` doc per family from a JSON file. The JSON holds
// real names, emails, phones and home addresses, so it MUST live outside this
// repo (the repo is public) — pass its path as an argument and keep the file in
// a scratch folder, never in the working tree.
//
//   node scripts/add-directory-families.mjs ../../new-families.json          # dry run
//   node scripts/add-directory-families.mjs ../../new-families.json --commit
//
// Shape (one object per family):
//   { "familyName": "Smith", "optedIn": true, "address": "1 Main St, ...",
//     "parents":  [{ "name": "...", "role": "Parent", "email": "...", "phone": "..." }],
//     "children": [{ "name": "...", "class": "pre-k-pm" }] }
//
// `optedIn` is REQUIRED per family and must be set deliberately: it mirrors the
// registration form's "may we print your family's name, address, email and
// phone on the class roster?" question. A family who answered No goes in with
// optedIn:false — the record exists for the board, but never renders.
//
// Ids are `directoryEntry-<slug of familyName>`, matching migrate-directory.mjs,
// and writes use createIfNotExists, so this can never clobber an existing
// family that a volunteer has since edited in the Studio. Re-running is a no-op.
//
// After --commit, run `node scripts/geocode-directory.mjs` to drop map pins.
// Reads SANITY_TOKEN from .dev.vars. Needs API-request quota (docs/PENDING.md).
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const commit = args.includes('--commit');
const file = args.find((a) => !a.startsWith('--'));

if (!file) {
  console.error('Usage: node scripts/add-directory-families.mjs <families.json> [--commit]');
  process.exit(1);
}

const families = JSON.parse(readFileSync(resolve(process.cwd(), file), 'utf8'));

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

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Valid class slugs come from the Class docs, same source the Studio's class
// picker reads — a typo'd class would save but render as an unknown chip.
// NOTE: `class.slug` is a real Sanity slug OBJECT here ({_type,current}), not
// the plain string that page docs use (see the slug gotcha in CLAUDE.md).
const classes = new Set(await client.fetch(`*[_type == "class"].slug.current`));

const docs = [];
for (const fam of families) {
  if (typeof fam.optedIn !== 'boolean') {
    console.error(
      `! ${fam.familyName}: "optedIn" must be set explicitly (true or false). Aborting.`,
    );
    process.exit(1);
  }
  for (const child of fam.children ?? []) {
    if (!classes.has(child.class)) {
      console.error(
        `! ${fam.familyName}: unknown class "${child.class}". Known: ${[...classes].join(', ')}. Aborting.`,
      );
      process.exit(1);
    }
  }
  const slug = slugify(fam.familyName);
  docs.push({
    _id: `directoryEntry-${slug}`,
    _type: 'directoryEntry',
    familyName: fam.familyName,
    optedIn: fam.optedIn,
    parents: (fam.parents ?? []).map((p, i) => ({
      _key: `${slug}-p${i + 1}`,
      name: p.name,
      role: p.role || 'Parent',
      ...(p.email ? { email: p.email } : {}),
      ...(p.phone ? { phone: p.phone } : {}),
    })),
    children: (fam.children ?? []).map((c, i) => ({
      _key: `${slug}-c${i + 1}`,
      name: c.name,
      class: c.class,
    })),
    ...(fam.address ? { address: fam.address } : {}),
    ...(fam.notes ? { notes: fam.notes } : {}),
  });
}

// Report what already exists so a re-run's no-op is visible, not silent.
const existing = new Set(await client.fetch(`*[_id in $ids]._id`, { ids: docs.map((d) => d._id) }));

console.log(`\n${commit ? 'Writing' : 'Would write'} ${docs.length} directory entr(ies):\n`);
for (const d of docs) {
  const skip = existing.has(d._id);
  console.log(`  ${d.familyName}${skip ? '  — ALREADY EXISTS, will be left untouched' : ''}`);
  console.log(`    doc      ${d._id}`);
  console.log(
    `    visible  ${d.optedIn ? 'YES — shows in the directory' : 'NO — hidden (not opted in)'}`,
  );
  for (const p of d.parents)
    console.log(`    adult    ${p.name} (${p.role})  ${p.email ?? ''} ${p.phone ?? ''}`);
  for (const c of d.children) console.log(`    child    ${c.name} — ${c.class}`);
  console.log(`    address  ${d.address ?? '(none)'}`);
}

if (!commit) {
  console.log('\nDry run — nothing was changed. Re-run with --commit to write.');
  process.exit(0);
}

for (const d of docs) {
  await client.createIfNotExists(d);
  console.log(
    existing.has(d._id) ? `• ${d.familyName} already present — skipped` : `✓ created ${d._id}`,
  );
}

console.log('\nDone. Next: node scripts/geocode-directory.mjs  (drops the map pins)');
