// =============================================================================
// patch-lib.mjs — shared plumbing for the quota-queued patch scripts
// =============================================================================
// Every patch script in the 2026-07-17 queue (docs/PENDING.md) uses this:
// a token-authed client, a DRY-RUN-BY-DEFAULT commit gate, and small idempotent
// mutation helpers. Scripts print exactly what they would change and write
// nothing unless run with --commit (they were authored while Sanity writes
// were quota-frozen, so none could be tested against live writes — review the
// dry-run output before committing).
// =============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';

const SITE = fileURLToPath(new URL('..', import.meta.url));
const token =
  (readFileSync(`${SITE}/.dev.vars`, 'utf8').match(/SANITY_TOKEN="?([^"\n]+)/) || [])[1] ||
  (readFileSync(`${SITE}/.env`, 'utf8').match(/SANITY_TOKEN="?([^"\n]+)/) || [])[1];
if (!token) throw new Error('no SANITY_TOKEN in .dev.vars/.env');

export const COMMIT = process.argv.includes('--commit');

export const client = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

/** Log one planned change; apply it only under --commit. */
export async function apply(label, fn) {
  console.log(`${COMMIT ? '✓' : 'DRY'} ${label}`);
  if (COMMIT) await fn();
}

export function done(n) {
  console.log(
    `\n${COMMIT ? 'COMMITTED' : 'DRY RUN'}: ${n} change(s).` +
      (COMMIT ? '' : ' Re-run with --commit to apply.'),
  );
}
