// =============================================================================
// patch-tour-anchor.mjs — migrate stored tour links to the stable anchor
// =============================================================================
// W3 (2026-08-31) gave the tour form a stable `#tour-form` anchor that
// survives the section being re-created; the code call sites moved in the
// same commit. This migrates the BOARD-STORED copies — section action URLs on
// the eight seeded pages (and any doc that gains one later) — from the old
// `_key`-derived `#sec-pp-tour-form` to the stable anchor. The old id still
// renders, so this is consistency, not a fix for breakage.
//
// Idempotent (re-running finds nothing). Dry-run by default; --apply writes.
//   node scripts/patch-tour-anchor.mjs --apply
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

const APPLY = process.argv.includes('--apply');
const OLD = '/virtual-tour#sec-pp-tour-form';
const NEW = '/virtual-tour#tour-form';

/** Collect { "a.b[_key=="x"].url": NEW } set-patches for every string hit. */
function collect(node, path, sets) {
  if (typeof node === 'string') {
    if (node.includes(OLD)) sets[path] = node.replaceAll(OLD, NEW);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => {
      const seg = v && typeof v === 'object' && v._key ? `[_key=="${v._key}"]` : `[${i}]`;
      collect(v, `${path}${seg}`, sets);
    });
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('_')) continue;
      collect(v, path ? `${path}.${k}` : k, sets);
    }
  }
}

const docs = await client.fetch(`*[!(_id in path("drafts.**")) && !(_type match "sanity.*")]`);
let touched = 0;
for (const doc of docs) {
  if (!JSON.stringify(doc).includes(OLD)) continue;
  const sets = {};
  collect(doc, '', sets);
  if (Object.keys(sets).length === 0) continue;
  touched++;
  console.log(`${doc._id}: ${Object.keys(sets).length} link(s)`);
  for (const p of Object.keys(sets)) console.log(`   ${p}`);
  if (APPLY) await client.patch(doc._id).set(sets).commit();
}
console.log(
  touched === 0
    ? '✓ nothing left on the old anchor.'
    : APPLY
      ? `✓ migrated ${touched} document(s).`
      : `DRY RUN: ${touched} document(s) would change. Re-run with --apply.`,
);
