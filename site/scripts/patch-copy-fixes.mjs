// =============================================================================
// patch-copy-fixes.mjs — voice, seasonality, and title hygiene in one pass
// (docs/PENDING.md queue; dry-run by default)
// =============================================================================
// Bundles the audit's copy-level fixes so the fresh quota is spent once:
//   1. EM-DASH STRIP everywhere: deep-walks every page doc and replaces the
//      em-dashes the house style bans (the SectionRenderer strips them at
//      render time as a stopgap; this fixes the SOURCE so the Studio matches
//      the site — afterwards the render-time deEmDashDeep stays as cheap
//      defense-in-depth).
//   2. TITLE SEPARATORS: seoTitle "X — WCP" → "X | WCP".
//   3. BANNED CONSTRUCTIONS: co-op-life hero "You are not just a parent
//      here. You are an owner." → "You help run this school. It shows."
//   4. SEASONALITY: prepend the July-relevant line to the tuition
//      registration-timeline section lead.
//   node scripts/patch-copy-fixes.mjs            # dry run
//   node scripts/patch-copy-fixes.mjs --commit
// =============================================================================
import { client, apply, done } from './patch-lib.mjs';

const deEmDash = (s) =>
  s
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*–\s*(?![0-9])/g, ', ')
    .replace(/, ,/g, ', ');

let n = 0;

// -- 1 + 2: per-page deep walk ------------------------------------------------
const pages = await client.fetch(`*[_type == "page"]{ ... }`);
for (const doc of pages ?? []) {
  let changed = false;
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out = {};
      for (const [k, val] of Object.entries(v)) out[k] = walk(val);
      return out;
    }
    if (typeof v === 'string' && v.includes('—')) {
      changed = true;
      return deEmDash(v);
    }
    return v;
  };
  const next = walk(doc);
  if (typeof next.seoTitle === 'string' && next.seoTitle.includes(' — ')) {
    next.seoTitle = next.seoTitle.replace(/\s+—\s+/g, ' | ');
    changed = true;
  }
  if (changed) {
    n++;
    await apply(`${doc._id}: strip em-dashes / fix title separator`, () =>
      client.createOrReplace(next),
    );
  }
}

// -- 3: co-op-life hero construction ------------------------------------------
const coop = await client.getDocument('page-co-op-life');
if (coop?.hero?.title?.includes('not just a parent')) {
  n++;
  await apply('co-op-life hero: banned "not just X" construction → owned claim', () =>
    client
      .patch('page-co-op-life')
      .set({ 'hero.title': 'You help run this school. It shows.', 'hero.accentWord': 'run' })
      .commit(),
  );
}

// -- 4: tuition seasonality ----------------------------------------------------
const tuition = await client.getDocument('page-tuition');
const timeline = (tuition?.sections ?? []).find((s) => s._key === 'k64');
const JULY_LINE =
  'Enrolling for this fall? Spots are filled first come, first served until classes are full, and mid-year starts are welcome when space allows.';
if (timeline && !(timeline.header?.lead ?? '').includes('first come')) {
  n++;
  await apply('tuition k64: prepend the July-relevant enrollment line', () =>
    client.patch('page-tuition').set({ 'sections[_key=="k64"].header.lead': JULY_LINE }).commit(),
  );
}

done(n);
console.log('note: re-check the season line each term (it is copy, not logic).');
