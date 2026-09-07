#!/usr/bin/env node
// =============================================================================
// purge-directory-from-sanity.mjs — delete the family directory from the CMS
// =============================================================================
// The last step of moving the directory into KV. Sanity's dataset is PUBLIC on
// the free plan, so while these documents exist they are readable by anyone with
// the project id, whatever the Family Hub gate does.
//
// UNSETS every field on each `directoryEntry`, leaving an empty shell document.
// Not a delete: four class-rep `roleHolder` documents reference these by
// `contactFrom`, and Sanity refuses to delete a referenced document. Emptying
// them removes 100% of the personal data - no familyName either, since "these
// 36 families attend this preschool" is personal data on its own - while the
// references stay structurally valid.
//
// The reps' contact details still work: they now come from KV via
// `attachDirectoryContacts` (src/lib/hub-directory.ts) rather than the GROQ join
// that used to serve parents' emails out of a public dataset.
//
// IT REFUSES TO DELETE ANYTHING IT CANNOT SEE IN KV FIRST. Every document, and
// every field of every document, must already be present in the KV copy. That
// check is the whole reason this is a separate script from the migration: the
// first migration silently dropped two fields, and a purge that trusted it would
// have destroyed 33 home addresses.
//
// USAGE (from site/)
//   node scripts/purge-directory-from-sanity.mjs           # dry run, compares
//   node scripts/purge-directory-from-sanity.mjs --delete  # actually deletes
//
// Photos are NOT deleted: the hub still renders them from cdn.sanity.io, and the
// KV records reference them. Asset URLs are opaque hashes rather than a
// queryable list, so this is a much smaller residual than a structured
// directory - but it is not zero, and it is a separate decision.
// =============================================================================
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { loadEnv } from './lib/loadEnv.mjs';

const envTs = readFileSync('src/sanity/env.ts', 'utf8');
const constant = (name, fallback) => {
  const m = envTs.match(new RegExp(`${name}\\s*=\\s*['"]([^'"]+)['"]`));
  return m ? m[1] : fallback;
};
const projectId = constant('projectId');
const dataset = constant('dataset', 'production');
const apiVersion = constant('apiVersion', '2025-08-15');

const env = loadEnv(process.cwd());
const TOKEN = env.SANITY_TOKEN || env.SANITY_API_WRITE_TOKEN;
const DELETE = process.argv.includes('--delete');

if (!TOKEN) {
  console.error('purge: no SANITY_TOKEN in the environment or .env.');
  process.exit(1);
}

const sanity = async (path, init = {}) => {
  const res = await fetch(`https://${projectId}.api.sanity.io${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Sanity ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
};

const q = async (groq) =>
  (await sanity(`/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(groq)}`)).result;

// --- 1. What is in Sanity right now -----------------------------------------
const docs = await q('*[_type == "directoryEntry"]');
console.log(`purge: Sanity holds ${docs.length} directoryEntry documents.`);
if (!docs.length) {
  console.log('purge: nothing to do.');
  process.exitCode = 0;
}

// --- 2. Is every one of them safely in KV? ----------------------------------
const kvRaw = spawnSync(
  'npx',
  ['wrangler', 'kv', 'key', 'get', 'directory:v1', '--binding=DIRECTORY', '--remote'],
  { encoding: 'utf8', shell: process.platform === 'win32' },
);
if (kvRaw.status !== 0) {
  console.error('purge: could not read the KV copy. Refusing to delete anything.');
  process.exit(1);
}
let kv;
try {
  kv = JSON.parse(kvRaw.stdout.slice(kvRaw.stdout.indexOf('[')));
} catch {
  console.error('purge: the KV copy did not parse as JSON. Refusing to delete anything.');
  process.exit(1);
}
console.log(`purge: KV holds ${kv.length} families.`);

const kvById = new Map(kv.map((e) => [e._id, e]));
const problems = [];
for (const doc of docs) {
  const copy = kvById.get(doc._id);
  if (!copy) {
    problems.push(`${doc._id}: not in KV at all`);
    continue;
  }
  for (const [k, v] of Object.entries(doc)) {
    if (k.startsWith('_')) continue;
    if (v === null || v === undefined || v === '') continue;
    if (copy[k] === undefined)
      problems.push(`${doc._id}: field "${k}" is missing from the KV copy`);
  }
}

if (problems.length) {
  console.error(`\npurge: REFUSING TO DELETE - ${problems.length} thing(s) are not safely in KV:`);
  for (const p of problems.slice(0, 20)) console.error(`  ${p}`);
  console.error('\npurge: re-run scripts/migrate-directory-to-kv.mjs --put first.');
  process.exit(1);
}
console.log('purge: every document and every field is present in the KV copy.');

if (!DELETE) {
  const fields = [
    ...new Set(docs.flatMap((d) => Object.keys(d).filter((k) => !k.startsWith('_')))),
  ];
  console.log(
    `\npurge: dry run. ${docs.length} documents WOULD be emptied in ${projectId}/${dataset}.`,
  );
  console.log(`purge: fields to unset: ${fields.join(', ')}`);
  console.log('purge: re-run with --delete to do it. This cannot be undone from here');
  console.log(
    'purge: (KV holds the copy, and the nightly encrypted backup is the other way back).',
  );
  process.exitCode = 0;
} else {
  // --- 3. Empty every document -----------------------------------------------
  // `unset` every non-system field. Listed from the documents themselves rather
  // than hardcoded, so a field added later cannot be quietly left behind.
  const mutations = docs.map((d) => ({
    patch: {
      id: d._id,
      unset: Object.keys(d).filter((k) => !k.startsWith('_')),
    },
  }));
  const result = await sanity(`/v${apiVersion}/data/mutate/${dataset}`, {
    method: 'POST',
    body: JSON.stringify({ mutations }),
  });
  console.log(`\npurge: emptied ${result.results?.length ?? mutations.length} documents.`);

  // Verify against what a STRANGER sees, not what our token sees. The documents
  // are SUPPOSED to survive - emptied, not deleted - so counting them proves
  // nothing. What matters is that no field comes back on an anonymous read.
  const anonRes = await fetch(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}` +
      `?query=${encodeURIComponent('*[_type=="directoryEntry"]')}`,
  );
  const anon = await anonRes.json();
  const leftovers = [
    ...new Set(
      (anon.result || []).flatMap((d) => Object.keys(d).filter((k) => !k.startsWith('_'))),
    ),
  ];
  console.log(`purge: shells remaining (expected): ${(anon.result || []).length}`);
  console.log(
    `purge: fields still publicly readable: ${leftovers.length ? leftovers.join(', ') : 'none'}`,
  );
  if (leftovers.length) {
    console.error('purge: personal data survives. Investigate before calling this done.');
    process.exit(1);
  }
  console.log('purge: run scripts/public-data-audit.mjs to confirm the exposure is closed.');
}
