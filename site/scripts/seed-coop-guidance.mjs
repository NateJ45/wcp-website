// =============================================================================
// seed-coop-guidance.mjs — the co-op explainer blocks into the Studio
// =============================================================================
// Fills the `coopGuidance` singleton with the wording that was hardcoded in
// src/data/hub/coop-roles.ts (the four commitment cards) and ClassAskGuide.astro
// (the teacher-vs-rep lists), so the Board opens a populated document rather
// than a blank form and can edit from what is already live.
//
// The values are imported from the data file where possible rather than
// retyped. The ask lists live inside an .astro component, so they are the one
// thing transcribed here; the counts are asserted against the component so a
// silent drift shows up as a failure instead of a quietly short list.
//
// Idempotent: by default it will not overwrite a document that already has
// content. Run:
//   node scripts/seed-coop-guidance.mjs
//   node scripts/seed-coop-guidance.mjs --force
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
const FORCE = process.argv.includes('--force');
const ID = 'coopGuidance';

// The four rules come straight from the data file — no transcription risk.
const { coopPrinciples } = await import('../src/data/hub/coop-roles.ts');

// The ask lists live in the component, so they are typed here. The assertion
// below catches the case where someone edits the component and forgets this.
const teacherAsks = [
  'How your child is doing, and what they’re learning',
  'A worry about your child, or extra support they need',
  'Drop-off, pick-up, running late, or an absence',
  'Allergies, health, or anything they need in class',
];
const repAsks = [
  'Your classroom helping schedule, or swapping a day',
  'Getting to know the other families in the class',
  'Class parties and Teacher Appreciation Week',
  'Your co-op job, or passing something to the Board',
];

const component = readFileSync(`${SITE_DIR}/src/components/hub/ClassAskGuide.astro`, 'utf8');
for (const [label, list] of [
  ['teacherAsks', teacherAsks],
  ['repAsks', repAsks],
]) {
  const block = component.slice(component.indexOf(`const ${label}Fallback = [`));
  const count = block
    .slice(0, block.indexOf('];'))
    .split('\n')
    .filter((l) => l.trim().startsWith("'")).length;
  if (count !== list.length) {
    throw new Error(
      `${label}: component has ${count} items, this script has ${list.length} — reconcile before seeding`,
    );
  }
}

const existing = await client.getDocument(ID);
if ((existing?.principles?.length || existing?.teacherAsks?.length) && !FORCE) {
  console.log('Guidance already has content in the Studio. Nothing written (use --force).');
  process.exit(0);
}

await client.createOrReplace({
  _type: 'coopGuidance',
  _id: ID,
  principles: coopPrinciples.map((p, i) => ({
    _type: 'principle',
    _key: `principle-${i}`,
    icon: p.icon,
    title: p.title,
    body: p.body,
  })),
  teacherAsks,
  repAsks,
});
console.log(
  `✓ ${ID}: ${coopPrinciples.length} rules, ${teacherAsks.length} teacher asks, ${repAsks.length} rep asks.`,
);
