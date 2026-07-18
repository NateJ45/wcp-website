// =============================================================================
// patch-twos-curriculum-months.mjs — Easter + food and nutrition belong to MARCH
// (docs/PENDING.md queue; dry-run by default)
// =============================================================================
// The Twos & Threes month-by-month curriculum in Sanity has Easter and food and
// nutrition sitting in APRIL, so March reads "St. Patrick's Day, fire safety"
// and April carries six topics. Erin's curriculum sheet puts both in March and
// leaves April as spring, insects, rocks, weather.
//
// A code stopgap (src/lib/hub-stopgaps.ts → twosCurriculumMonths) corrects this
// at render time so families see the right months today. This fixes the SOURCE
// so the Studio matches the site.
//
// Idempotent: re-running after the fix finds no Easter in April and stops.
//
//   node scripts/patch-twos-curriculum-months.mjs            # dry run
//   node scripts/patch-twos-curriculum-months.mjs --commit
//
// AFTER RUNNING (same sitting): delete `twosCurriculumMonths` + its call in
// applyHubStopgaps, delete src/lib/hub-stopgaps.test.ts's cases for it, and
// remove this row from docs/PENDING.md.
// =============================================================================
import { client, COMMIT, done } from './patch-lib.mjs';

const ID = 'hubPage-twos';
const MAR = 'St. Patrick’s Day, fire safety, Easter, food and nutrition';
const APR = 'Spring, insects, rocks, weather';

const doc = await client.getDocument(ID);
if (!doc) throw new Error(`${ID} not found`);
const sections = [...(doc.sections || [])];

// The MISPLACED EASTER identifies the curriculum schedule, not the month rows:
// this page also carries a field-trip scheduleSection with Mar/Apr rows, so the
// content guard below is what keeps this off the wrong section.
const idx = sections.findIndex(
  (s) =>
    s?._type === 'scheduleSection' &&
    Array.isArray(s.entries) &&
    s.entries.some((e) => e?.time === 'Mar') &&
    s.entries.some((e) => e?.time === 'Apr' && /easter/i.test(e?.title ?? '')),
);
if (idx < 0) {
  console.log(`No misplaced Easter row on ${ID}. Nothing to do.`);
  process.exit(0);
}

const sec = sections[idx];
const before = sec.entries
  .filter((e) => e?.time === 'Mar' || e?.time === 'Apr')
  .map((e) => `${e.time}: ${e.title}`);

sections[idx] = {
  ...sec,
  entries: sec.entries.map((e) => {
    if (e?.time === 'Mar') return { ...e, title: MAR };
    if (e?.time === 'Apr') return { ...e, title: APR };
    return e;
  }),
};

if (!COMMIT) {
  console.log(`DRY RUN — ${ID} section ${sec._key}`);
  for (const line of before) console.log(`  before  ${line}`);
  console.log(`  after   Mar: ${MAR}`);
  console.log(`  after   Apr: ${APR}`);
  done(1);
  process.exit(0);
}

await client.patch(ID).set({ sections }).commit();
console.log(`✓ ${ID}: Easter + food and nutrition moved from April to March.`);
done(1);
