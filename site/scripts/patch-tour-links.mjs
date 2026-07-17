// ============================================================================
// patch-tour-links.mjs — repoint every "Schedule a Tour" CTA at the tour form
// ============================================================================
// Phase 0 fixed the tour routing in CODE (Header.astro + nav.ts fallback). This
// finishes the CONTENT layer: the Sanity Menus doc footer link and every
// in-body hero/CTA "Schedule a Tour" / "Book a Tour" button still point at
// /enroll (which has no tour form). This deep-walks every page doc + the
// navigation singleton and repoints any tour-labelled action from /enroll to
// the real tour form (/virtual-tour#sec-pp-tour-form), and fixes the /safety
// hero CTA (which points at the homepage, "/").
//
// SAFETY: dry-run BY DEFAULT. It prints exactly what it would change and writes
// NOTHING. Re-run with `--commit` to apply. Idempotent either way (an action
// already pointing at the tour form is left alone). Authored 2026-07-17 while
// the Sanity write quota was exhausted, so it is UNTESTED against the live
// schema — review the dry-run output before committing.
//   node scripts/patch-tour-links.mjs            # dry run (default)
//   node scripts/patch-tour-links.mjs --commit   # apply
// ============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';

const SITE = fileURLToPath(new URL('..', import.meta.url));
const token =
  (readFileSync(`${SITE}/.dev.vars`, 'utf8').match(/SANITY_TOKEN="?([^"\n]+)/) || [])[1] ||
  (readFileSync(`${SITE}/.env`, 'utf8').match(/SANITY_TOKEN="?([^"\n]+)/) || [])[1];
if (!token) throw new Error('no SANITY_TOKEN in .dev.vars/.env');
const COMMIT = process.argv.includes('--commit');
const c = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

const TOUR_HREF = '/virtual-tour#sec-pp-tour-form';
const isTourLabel = (s) =>
  typeof s === 'string' && /\b(tour)\b/i.test(s) && !/virtual tour/i.test(s);
// An action node points "at enroll or home" if any of these link shapes resolves there.
const pointsAtEnrollOrHome = (node) =>
  node?.url === '/enroll' ||
  node?.url === '/' ||
  node?.pageSlug === 'enroll' ||
  node?.pageSlug === 'home' ||
  node?.href === '/enroll' ||
  node?.href === '/';

// Rewrite an action node in place → a URL-type link at the tour form. Returns
// true if it changed anything. We normalize to a url link and clear pageSlug so
// there's no ambiguity between the two link shapes.
function repoint(node) {
  if (!node || typeof node !== 'object') return false;
  if (!isTourLabel(node.label)) return false;
  if (node.url === TOUR_HREF || node.href === TOUR_HREF) return false; // already done
  if (!pointsAtEnrollOrHome(node)) return false;
  if ('linkType' in node) node.linkType = 'url';
  if ('pageSlug' in node) delete node.pageSlug;
  if ('href' in node) node.href = TOUR_HREF;
  node.url = TOUR_HREF;
  return true;
}

// Deep-walk any value, applying repoint() to every object it meets.
function walk(value, onChange) {
  if (Array.isArray(value)) {
    for (const v of value) walk(v, onChange);
  } else if (value && typeof value === 'object') {
    if (repoint(value)) onChange(value.label);
    for (const k of Object.keys(value)) walk(value[k], onChange);
  }
}

const docs = await c.fetch(`*[_type in ["page","navigation"]]{ ... }`);
let changedDocs = 0;
let changedActions = 0;
for (const doc of docs ?? []) {
  const before = JSON.stringify(doc);
  const hits = [];
  walk(doc, (label) => hits.push(label));
  if (!hits.length) continue;
  changedDocs++;
  changedActions += hits.length;
  console.log(`\n${doc._id}: ${hits.length} tour CTA(s) → ${TOUR_HREF}`);
  for (const h of hits) console.log(`   • "${h}"`);
  if (COMMIT) {
    // Replace whole doc (we mutated it in place). createOrReplace preserves _id.
    if (before !== JSON.stringify(doc)) await c.createOrReplace(doc);
  }
}

console.log(
  `\n${COMMIT ? 'COMMITTED' : 'DRY RUN'}: ${changedActions} action(s) across ${changedDocs} doc(s).` +
    (COMMIT ? '' : '  Re-run with --commit to apply.'),
);
console.log('NOTE: also update the draft home doc if it has its own hero CTAs (drafts.page-home),');
console.log(
  'and confirm /virtual-tour keeps the section _key "pp-tour-form" so the anchor resolves.',
);
