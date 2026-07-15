// =============================================================================
// patch-teacher-phones.mjs — set the new `phone` field on each teacherNote
// =============================================================================
// The class-hub sign-off card + top teacher card show a "Call or text" pill
// from teacherNote.phone (a field added 2026-07-15). The numbers already lived
// only inside each handbook's closing-note text; this lifts them into the
// structured field so the pills work. Idempotent (set by class). Run once:
//   node scripts/patch-teacher-phones.mjs
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

// Ms. Erin (Twos & Threes) and Mrs. Lisa (Pre-K) — the numbers from each
// handbook's closing note (patch-contact-notes.mjs).
const PHONE_BY_CLASS = {
  twos: '513-543-4824',
  threes: '513-543-4824',
  'pre-k': '503-201-4775',
};

const notes = await client.fetch(`*[_type == "teacherNote"]{ _id, class, phone }`);
let n = 0;
for (const note of notes ?? []) {
  const phone = PHONE_BY_CLASS[note.class];
  if (!phone) {
    console.log(`⚠ ${note._id}: class "${note.class}" has no known phone, skipped`);
    continue;
  }
  if (note.phone === phone) {
    console.log(`= ${note._id} (${note.class}): already ${phone}`);
    continue;
  }
  await client.patch(note._id).set({ phone }).commit();
  console.log(`✓ ${note._id} (${note.class}): phone → ${phone}`);
  n++;
}
console.log(`\nDone (${n} updated).`);
