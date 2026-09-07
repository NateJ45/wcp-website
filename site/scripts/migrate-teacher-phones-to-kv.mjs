#!/usr/bin/env node
// =============================================================================
// migrate-teacher-phones-to-kv.mjs — get teachers' mobiles out of public places
// =============================================================================
// The numbers were in two public places at once (2026-09-06): `teacherNote.phone`
// in a PUBLIC Sanity dataset, and `teacherPhoneFallback` committed to a PUBLIC
// repo. Two of the three are not the school's published line.
//
// Reads both sources, prefers the Sanity value (the Studio one has always won at
// render time), writes the merged map to KV, and then STOPS. Removing the
// originals is separate and deliberate:
//   - Sanity:  scripts/purge-teacher-phones.mjs
//   - the repo: delete teacherPhoneFallback from src/data/hub/live-links.ts
//
// USAGE (from site/)
//   node scripts/migrate-teacher-phones-to-kv.mjs         # dry run
//   node scripts/migrate-teacher-phones-to-kv.mjs --put   # upload to KV
//
// Writes teacher-phones.json, which is gitignored. It holds real numbers.
// =============================================================================
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { loadEnv } from './lib/loadEnv.mjs';

const envTs = readFileSync('src/sanity/env.ts', 'utf8');
const constant = (n, f) => (envTs.match(new RegExp(`${n}\\s*=\\s*['"]([^'"]+)['"]`)) || [, f])[1];
const projectId = constant('projectId');
const dataset = constant('dataset', 'production');
const apiVersion = constant('apiVersion', '2025-08-15');

const env = loadEnv(process.cwd());
const TOKEN = env.SANITY_TOKEN || env.SANITY_API_WRITE_TOKEN;
const PUT = process.argv.includes('--put');
const OUT = 'teacher-phones.json';
const KEY = 'teacher-phones:v1';

if (!TOKEN) {
  console.error('migrate: no SANITY_TOKEN in the environment or .env.');
  process.exit(1);
}

// --- the committed fallback, parsed out of the source ------------------------
const links = readFileSync('src/data/hub/live-links.ts', 'utf8');
const block = links.match(/teacherPhoneFallback[^=]*=\s*\{([^}]*)\}/s);
const committed = {};
if (block) {
  for (const m of block[1].matchAll(/['"]?([\w-]+)['"]?\s*:\s*['"]([^'"]+)['"]/g)) {
    committed[m[1]] = m[2];
  }
}

// --- the Sanity values -------------------------------------------------------
const url =
  `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}` +
  `?query=${encodeURIComponent('*[_type=="teacherNote" && defined(phone)]{ "key": class, phone }')}`;
const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
if (!res.ok) {
  console.error(`migrate: Sanity returned ${res.status}`);
  process.exit(1);
}
const fromSanity = (await res.json()).result || [];

// Sanity wins, matching what the components did at render time.
const merged = { ...committed };
for (const row of fromSanity) if (row.key && row.phone) merged[row.key] = row.phone;

const keys = Object.keys(merged);
if (!keys.length) {
  console.error('migrate: found no numbers in either source. Refusing to write an empty map.');
  process.exit(1);
}

writeFileSync(OUT, JSON.stringify(merged));
console.log(`migrate: ${keys.length} numbers -> ${OUT}`);
console.log(
  `migrate:   from the committed fallback: ${Object.keys(committed).join(', ') || 'none'}`,
);
console.log(
  `migrate:   from Sanity (these win)    : ${fromSanity.map((r) => r.key).join(', ') || 'none'}`,
);
console.log(`migrate:   merged keys                : ${keys.join(', ')}`);

if (!PUT) {
  console.log('\nmigrate: dry run. Re-run with --put to upload.');
  console.log(`migrate: delete ${OUT} afterwards - it holds real phone numbers.`);
  process.exitCode = 0;
} else {
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
  console.log(`\nmigrate: npx ${args.join(' ')}`);
  const r = spawnSync('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) {
    console.error(
      `\nmigrate: upload failed. ${OUT} left in place so you can retry - delete it by hand.`,
    );
    process.exit(1);
  }
  rmSync(OUT);
  console.log(`\nmigrate: uploaded and removed ${OUT}.`);
  console.log('migrate: now remove the originals - purge-teacher-phones.mjs, and the');
  console.log('migrate: teacherPhoneFallback constant in src/data/hub/live-links.ts.');
}
