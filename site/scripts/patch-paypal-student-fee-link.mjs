// =============================================================================
// patch-paypal-student-fee-link.mjs — first PayPal new-style (NCP) button
// =============================================================================
// PayPal retired the button system behind the school's old "webscr" hosted
// buttons, and the old-style transactions were causing QuickBooks trouble.
// Lexie recreated the Twos & Threes $45 student-fee button in PayPal's current
// system (2026-08-08) as a test before migrating the rest.
//
// New-style buttons are stored as their FULL payment link (the only way to
// tell the two generations apart — `payUrl` in src/data/classes.ts passes
// links through and wraps bare legacy codes in the old webscr URL). This sets
// that band's payId to the new link wherever the old code is stored:
//   - feeSchedule.studentFeeBands (what the tuition page renders)
//   - class.studentFeePayId on twos/threes (schema field, kept consistent)
// Drafts are patched too, so a stale Studio draft can't clobber the value.
//
// Idempotent (skips anything already on the new link). Run once:
//   node scripts/patch-paypal-student-fee-link.mjs
// Afterward: click the $45 Pay button on /family-hub/tuition and confirm the
// amount, then tell Lexie so she can verify the transaction in QuickBooks.
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const OLD_CODE = 'GQZ67ZRZ4W9UN';
const NEW_LINK = 'https://www.paypal.com/ncp/payment/PVP3W4TNLKRPA';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vars = readFileSync(`${SITE_DIR}/.dev.vars`, 'utf8');
const token = (vars.match(/SANITY_TOKEN="([^"]+)"/) || [])[1];
if (!token) throw new Error('no SANITY_TOKEN in .dev.vars');

const client = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

// Prove the new link answers before pointing real payments at it.
const res = await fetch(NEW_LINK, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
if (res.status >= 400) throw new Error(`new payment link returned ${res.status} — not patching`);
console.log(`✓ new payment link answers (${res.status})`);

let n = 0;

// The fee-schedule singleton's student-fee bands (draft + published).
const feeDocs = await client.fetch(`*[_type == "feeSchedule"]{ _id, studentFeeBands }`);
for (const doc of feeDocs ?? []) {
  const bands = doc.studentFeeBands ?? [];
  if (!bands.some((b) => b.payId === OLD_CODE)) {
    console.log(`✓ ${doc._id}: no band on the old code, skipped`);
    continue;
  }
  const next = bands.map((b) => (b.payId === OLD_CODE ? { ...b, payId: NEW_LINK } : b));
  await client.patch(doc._id).set({ studentFeeBands: next }).commit();
  console.log(`✓ ${doc._id}: student-fee band moved to the new link`);
  n++;
}

// The twos/threes class docs' student-fee field (draft + published).
const classDocs = await client.fetch(
  `*[_type == "class" && slug.current in ["twos", "threes"] && studentFeePayId == $old]{ _id }`,
  { old: OLD_CODE },
);
for (const doc of classDocs ?? []) {
  await client.patch(doc._id).set({ studentFeePayId: NEW_LINK }).commit();
  console.log(`✓ ${doc._id}: studentFeePayId moved to the new link`);
  n++;
}

console.log(n ? `Done — ${n} doc(s) patched.` : 'Done — nothing to do.');
