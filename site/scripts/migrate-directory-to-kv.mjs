#!/usr/bin/env node
// =============================================================================
// migrate-directory-to-kv.mjs — move the family directory out of a public CMS
// =============================================================================
// Sanity's free plan is "2 datasets (public only)". On 2026-09-06 an anonymous
// query with no token returned all 37 `directoryEntry` documents: 40 children's
// names, 71 parents, 33 home addresses. The Family Hub gate protects the page;
// the Content Lake API is a second door and it was open.
//
// This copies the directory into the DIRECTORY KV namespace, which has no public
// read surface at all. It does NOT delete anything from Sanity — that is a
// separate, deliberate step once the hub has been seen working on the new
// source. Never let one command both migrate and destroy.
//
// USAGE (from site/, with SANITY_TOKEN in .env)
//   node scripts/migrate-directory-to-kv.mjs            # writes directory.json
//   node scripts/migrate-directory-to-kv.mjs --put      # ...and uploads to KV
//   node scripts/migrate-directory-to-kv.mjs --put --env staging
//
// The generated directory.json holds real family data. It is gitignored, and
// this script deletes it after a successful --put. Do not commit it: the repo
// is public, which is the same mistake in a different store.
// =============================================================================
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { loadEnv } from './lib/loadEnv.mjs';

// Read the constants out of src/sanity/env.ts rather than importing it: that is
// a TypeScript module, and depending on Node's type stripping to be enabled is
// a needless way for a one-shot migration to fail.
const envTs = readFileSync('src/sanity/env.ts', 'utf8');
const constant = (name, fallback) => {
  const m = envTs.match(new RegExp(`${name}\\s*=\\s*['"]([^'"]+)['"]`));
  return m ? m[1] : fallback;
};
const projectId = constant('projectId');
const dataset = constant('dataset', 'production');
const apiVersion = constant('apiVersion', '2025-08-15');

const env = loadEnv(process.cwd());
const TOKEN = env.SANITY_TOKEN || env.SANITY_API_WRITE_TOKEN || env.SANITY_AUTH_TOKEN;
const PUT = process.argv.includes('--put');
const TARGET_ENV = (() => {
  const i = process.argv.indexOf('--env');
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
})();

const OUT = 'directory.json';
const KEY = 'directory:v1';

if (!TOKEN) {
  console.error('migrate: no SANITY_TOKEN in the environment or .env.');
  process.exit(1);
}

// EVERY family and EVERY field, not just the opted-in ones the page renders.
// The first run copied only what directory.astro queried, and left `address`
// (33 of 37 documents) and `optedIn` behind. KV is about to become the only
// copy, so anything not carried here would have been destroyed by the purge -
// including the addresses that `location` was geocoded from, without which
// nobody could ever re-geocode. The opt-in filter belongs in the reader, not in
// what gets stored.
const QUERY = `*[_type == "directoryEntry"] | order(familyName asc)`;

const url =
  `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}` +
  `?query=${encodeURIComponent(QUERY)}`;

const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
if (!res.ok) {
  console.error(`migrate: Sanity returned ${res.status}`);
  process.exit(1);
}
const entries = (await res.json()).result || [];

if (!entries.length) {
  // Refuse to write an empty directory over a populated one. A migration that
  // "succeeds" by emptying the hub is the failure mode worth guarding.
  console.error(
    'migrate: Sanity returned 0 opted-in entries. Refusing to write an empty directory.',
  );
  process.exit(1);
}

writeFileSync(OUT, JSON.stringify(entries));
console.log(
  `migrate: wrote ${entries.length} families to ${OUT} (${JSON.stringify(entries).length} bytes)`,
);
console.log(
  `migrate: ${entries.filter((e) => e.optedIn === true).length} opted in, ` +
    `${entries.reduce((n, e) => n + (e.children?.length || 0), 0)} children, ` +
    `${entries.reduce((n, e) => n + (e.parents?.length || 0), 0)} parents, ` +
    `${entries.filter((e) => e.address).length} addresses`,
);

// KV is about to be the only copy. Every field that exists in Sanity must be in
// what we are writing, or the purge will destroy it. Checked rather than
// assumed, because the first run of this script silently dropped two.
const fieldsHere = new Set(entries.flatMap((e) => Object.keys(e)));
for (const expected of ['familyName', 'optedIn', 'address', 'parents', 'children', 'location']) {
  if (!fieldsHere.has(expected)) {
    console.error(
      `migrate: expected field "${expected}" is missing from the export. Refusing to continue.`,
    );
    process.exit(1);
  }
}
console.log(
  `migrate: fields carried: ${[...fieldsHere]
    .filter((f) => !f.startsWith('_'))
    .sort()
    .join(', ')}`,
);

if (!PUT) {
  console.log('\nmigrate: dry run. Re-run with --put to upload, or inspect the file first.');
  console.log('migrate: remember to delete it afterwards - it is real family data.');
  // process.exitCode, not process.exit(): calling exit() here with the fetch's
  // handles still closing trips a libuv assertion on Windows and returns a
  // huge negative code, so a SUCCESSFUL dry run looks like a crash.
  process.exitCode = 0;
}

if (PUT) {
  const args = [
    'wrangler',
    'kv',
    'key',
    'put',
    KEY,
    `--path=${OUT}`,
    '--binding=DIRECTORY',
    '--remote',
  ];
  if (TARGET_ENV) args.push('--env', TARGET_ENV);
  console.log(`\nmigrate: npx ${args.join(' ')}`);
  const r = spawnSync('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });

  if (r.status !== 0) {
    console.error(
      '\nmigrate: the upload failed. directory.json has been LEFT IN PLACE so you can retry.',
    );
    console.error(
      'migrate: delete it by hand once you are done - it is real family data in a public repo.',
    );
    process.exit(1);
  }

  rmSync(OUT);
  console.log(`\nmigrate: uploaded and removed ${OUT}.`);
  console.log('migrate: now open /family-hub/directory and confirm the families render,');
  console.log('migrate: THEN remove the personal fields from Sanity as a separate step.');
  if (existsSync(OUT)) console.error('migrate: WARNING - could not remove ' + OUT);
}
