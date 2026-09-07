#!/usr/bin/env node
// =============================================================================
// migrate-photos-to-r2.mjs — family photos off a public CDN and behind the gate
// =============================================================================
// The directory's data moved to KV on 2026-09-06, but the photographs stayed as
// Sanity image assets. Sanity's CDN serves an asset to ANYONE holding the URL:
// no gate, no expiry, and the URL is an unguessable hash, which is obscurity
// rather than access control. These are photographs of children.
//
// This copies each one into the FAMILY_PHOTOS R2 bucket, which has no public
// endpoint at all - /family-hub/photo/<key> is the only way in, and that path
// sits inside the hub gate.
//
// It updates the KV records to point at the new key. It does NOT delete the
// Sanity assets: the entries keep `photo` as a fallback until every family has
// a `photoKey`, so a half-finished run never leaves a family with no picture.
// Delete the assets once this reports "0 still on Sanity".
//
// USAGE (from site/)
//   node scripts/migrate-photos-to-r2.mjs          # report only
//   node scripts/migrate-photos-to-r2.mjs --put    # do it
// =============================================================================
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const envTs = readFileSync('src/sanity/env.ts', 'utf8');
const constant = (n, f) =>
  (envTs.match(new RegExp(n + String.raw`\s*=\s*['"]([^'"]+)['"]`)) || [, f])[1];
const projectId = constant('projectId');
const PUT = process.argv.includes('--put');
const TMP = '.photo-migration';

const wrangler = (args, opts = {}) =>
  spawnSync('npx', ['wrangler', ...args], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...opts,
  });

// --- the directory, from KV --------------------------------------------------
const read = wrangler(['kv', 'key', 'get', 'directory:v1', '--binding=DIRECTORY', '--remote']);
if (read.status !== 0) {
  console.error('photos: could not read the directory from KV.');
  process.exit(1);
}
const raw = read.stdout.slice(
  Math.min(
    ...['[', '{'].map((c) => {
      const i = read.stdout.indexOf(c);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    }),
  ),
);
const parsed = JSON.parse(raw);
const doc = Array.isArray(parsed) ? { version: 0, entries: parsed } : parsed;
const entries = doc.entries ?? [];

// A Sanity image ref looks like image-<hash>-<w>x<h>-<ext>; the CDN path is
// derived from it. Deriving it here avoids depending on @sanity/image-url in a
// one-shot script.
const cdnUrl = (ref) => {
  const m = /^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/.exec(ref || '');
  if (!m) return null;
  return `https://cdn.sanity.io/images/${projectId}/production/${m[1]}-${m[2]}.${m[3]}`;
};

const pending = entries.filter((e) => !e.photoKey && e.photo?.asset?._ref);
console.log(`photos: ${entries.length} families`);
console.log(`photos:   already on R2 : ${entries.filter((e) => e.photoKey).length}`);
console.log(`photos:   still on Sanity: ${pending.length}`);
console.log(
  `photos:   no photo       : ${entries.filter((e) => !e.photoKey && !e.photo?.asset?._ref).length}`,
);

if (!pending.length) {
  console.log('\nphotos: nothing to migrate.');
  process.exit(0);
}
if (!PUT) {
  console.log('\nphotos: report only. Re-run with --put to migrate.');
  process.exit(0);
}

mkdirSync(TMP, { recursive: true });
let moved = 0;
for (const entry of pending) {
  const url = cdnUrl(entry.photo.asset._ref);
  if (!url) {
    console.log(`  ${entry._id}: unrecognised asset ref, skipped`);
    continue;
  }
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`  ${entry._id}: CDN returned ${res.status}, skipped`);
    continue;
  }
  const type = res.headers.get('content-type') || 'image/jpeg';
  const ext = (type.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5);
  const key = `${entry._id}-${Date.now()}.${ext}`;
  const tmpFile = join(TMP, key);
  writeFileSync(tmpFile, Buffer.from(await res.arrayBuffer()));

  const put = wrangler([
    'r2',
    'object',
    'put',
    `wcp-family-photos/${key}`,
    `--file=${tmpFile}`,
    `--content-type=${type}`,
    '--remote',
  ]);
  rmSync(tmpFile);
  if (put.status !== 0) {
    console.log(`  ${entry._id}: R2 upload failed, left on Sanity`);
    continue;
  }
  entry.photoKey = key;
  moved++;
  console.log(`  ${entry._id}: -> ${key}`);
}

if (!moved) {
  console.log('\nphotos: nothing moved; KV not touched.');
  process.exit(1);
}

// Bump the version like a normal save, so an admin tab open during the
// migration is told to reload rather than writing over it.
const next = { version: (doc.version ?? 0) + 1, updatedAt: new Date().toISOString(), entries };
const out = join(TMP, 'directory.json');
writeFileSync(out, JSON.stringify(next));
const save = wrangler([
  'kv',
  'key',
  'put',
  'directory:v1',
  `--path=${out}`,
  '--binding=DIRECTORY',
  '--remote',
]);
rmSync(out);
if (save.status !== 0) {
  console.error('\nphotos: R2 has the images but KV was NOT updated. Re-run to finish.');
  process.exit(1);
}
if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
console.log(`\nphotos: moved ${moved}. Re-run without --put to confirm 0 remain on Sanity.`);
