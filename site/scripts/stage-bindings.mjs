#!/usr/bin/env node
// =============================================================================
// stage-bindings.mjs — point the staging Worker at STAGING data
// =============================================================================
// deploy-staging.yml deploys the same emitted dist/server/wrangler.json as
// production and changes only `--name wcp-website-staging`. The bindings inside
// that file were therefore production's, and the account had exactly one of
// each — so the "staging" site was reading and WRITING the live family
// directory and the real bucket of children's photographs.
//
// Isolated at the code layer, shared at the data layer. Found 2026-09-07, while
// about to exercise the board admin's add / upload / bulk-remove paths on
// staging: those three would have added, uploaded and DELETED real families.
// The open item asking the board to try the admin end to end on staging had the
// same hazard in it, and bulk-remove exists precisely for the end-of-year
// clear-out.
//
// `wrangler deploy` has no flag to override a namespace id, so the emitted
// config is rewritten in place between build and deploy. It edits ONLY the two
// stores that hold family data:
//
//   KV DIRECTORY      -> the staging namespace  (names, children, addresses)
//   R2 FAMILY_PHOTOS  -> the staging bucket     (pictures of children)
//
// It exits non-zero if a binding it expects is missing, rather than deploying a
// staging Worker still wired to production. Silence here would recreate exactly
// the failure it exists to prevent.
//
// NOT rebound, and worth knowing:
//   KV SESSION — sign-in records. Shared, but the session fingerprint is
//     derived from the shared family password, so staging and production
//     sessions are interchangeable regardless of the store.
//   KV CACHE   — cached third-party reads (calendar feed, gviz sheets). Shared,
//     so a staging fetch can populate a value production later serves. Same
//     upstream sources, so the contents are the same shape; it is untidy rather
//     than dangerous. Split it too if staging ever points at different sources.
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';

const CONFIG = 'dist/server/wrangler.json';
const DIRECTORY_STAGING_ID = '3d658f2ff40449ae95479b19293a40d2';
const PHOTOS_STAGING_BUCKET = 'wcp-family-photos-staging';

const config = JSON.parse(readFileSync(CONFIG, 'utf8'));

const kv = (config.kv_namespaces ?? []).find((n) => n.binding === 'DIRECTORY');
if (!kv) {
  console.error('stage-bindings: no DIRECTORY kv_namespace in the emitted config.');
  process.exit(1);
}
const r2 = (config.r2_buckets ?? []).find((b) => b.binding === 'FAMILY_PHOTOS');
if (!r2) {
  console.error('stage-bindings: no FAMILY_PHOTOS r2_bucket in the emitted config.');
  process.exit(1);
}

// Refuse to no-op silently. If these already point at staging, something else
// has changed and the assumption behind this script no longer holds.
if (kv.id === DIRECTORY_STAGING_ID || r2.bucket_name === PHOTOS_STAGING_BUCKET) {
  console.error('stage-bindings: config already points at staging — check why before deploying.');
  process.exit(1);
}

const wasKv = kv.id;
const wasR2 = r2.bucket_name;
kv.id = DIRECTORY_STAGING_ID;
r2.bucket_name = PHOTOS_STAGING_BUCKET;

writeFileSync(CONFIG, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log(`stage-bindings: DIRECTORY     ${wasKv} -> ${kv.id}`);
console.log(`stage-bindings: FAMILY_PHOTOS ${wasR2} -> ${r2.bucket_name}`);
