#!/usr/bin/env node
// =============================================================================
// purge-teacher-phones.mjs — unset teacherNote.phone in Sanity
// =============================================================================
// The dataset is PUBLIC on the free plan, so these numbers were readable by
// anyone with the project id. They now live in the DIRECTORY KV namespace
// (scripts/migrate-teacher-phones-to-kv.mjs), read server-side behind the hub
// gate. This removes the public copy.
//
// Refuses to unset anything it cannot first see in KV, and verifies afterwards
// against an ANONYMOUS read rather than its own token.
//
//   node scripts/purge-teacher-phones.mjs           # dry run
//   node scripts/purge-teacher-phones.mjs --delete  # do it
// =============================================================================
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { loadEnv } from './lib/loadEnv.mjs';

const envTs = readFileSync('src/sanity/env.ts', 'utf8');
// String.raw, not a bare template literal: `\s` in a template literal is just
// "s", so this regex silently became `projectIds*=s*` and matched nothing.
// projectId then read `undefined`, the request went to undefined.api.sanity.io,
// and Sanity answered 401 "Session does not match project host" - which reads
// like a bad token and was not one.
const constant = (n, f) =>
  (envTs.match(new RegExp(n + String.raw`\s*=\s*['"]([^'"]+)['"]`)) || [, f])[1];
const projectId = constant('projectId');
if (!projectId) {
  console.error('purge: could not read projectId from src/sanity/env.ts.');
  process.exit(1);
}
const dataset = constant('dataset', 'production');
const apiVersion = constant('apiVersion', '2025-08-15');

const env = loadEnv(process.cwd());
const TOKEN = env.SANITY_TOKEN || env.SANITY_API_WRITE_TOKEN;
const DO = process.argv.includes('--delete');
if (!TOKEN) {
  console.error('purge: no SANITY_TOKEN.');
  process.exit(1);
}

const api = async (path, init = {}) => {
  const r = await fetch(`https://${projectId}.api.sanity.io${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!r.ok) throw new Error(`Sanity ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return r.json();
};
const q = async (g) =>
  (await api(`/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(g)}`)).result;

const docs = await q('*[_type=="teacherNote" && defined(phone)]{_id, "key": class}');
console.log(`purge: ${docs.length} teacherNote documents carry a phone.`);
if (!docs.length) {
  console.log('purge: nothing to do.');
  process.exit(0);
}

const kvRaw = spawnSync(
  'npx',
  ['wrangler', 'kv', 'key', 'get', 'teacher-phones:v1', '--binding=DIRECTORY', '--remote'],
  {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  },
);
if (kvRaw.status !== 0) {
  console.error('purge: could not read the KV copy. Refusing to unset anything.');
  process.exit(1);
}
const kv = JSON.parse(kvRaw.stdout.slice(kvRaw.stdout.indexOf('{')));
const missing = docs.filter((d) => !d.key || !kv[d.key]);
if (missing.length) {
  console.error(
    `purge: REFUSING - ${missing.length} number(s) are not in KV: ${missing.map((m) => m.key).join(', ')}`,
  );
  console.error('purge: run scripts/migrate-teacher-phones-to-kv.mjs --put first.');
  process.exit(1);
}
console.log(`purge: all ${docs.length} are present in KV (${Object.keys(kv).join(', ')}).`);

if (!DO) {
  console.log('\npurge: dry run. Re-run with --delete to unset them.');
  process.exitCode = 0;
} else {
  await api(`/v${apiVersion}/data/mutate/${dataset}`, {
    method: 'POST',
    body: JSON.stringify({
      mutations: docs.map((d) => ({ patch: { id: d._id, unset: ['phone'] } })),
    }),
  });
  const anon = await (
    await fetch(
      `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent('count(*[_type=="teacherNote" && defined(phone)])')}`,
    )
  ).json();
  console.log(`\npurge: teacherNote phones still publicly readable: ${anon.result}`);
  if (anon.result !== 0) {
    console.error('purge: some survived. Investigate.');
    process.exit(1);
  }
}
