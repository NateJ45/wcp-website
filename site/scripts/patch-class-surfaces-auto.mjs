// =============================================================================
// patch-class-surfaces-auto — flip the all-class surfaces to automatic
// =============================================================================
// One-shot companion to the 2026-08-29 schema change (classCardsSection gained
// `source`, navGroup gained `autoClasses`). Two edits:
//
//   1. Every classCardsSection that ALREADY lists every class switches to
//      source: "all", so it can never go stale again. A row listing a subset
//      (the Pre-K page shows only its own two classes) is left manual.
//   2. The header's "Classes" dropdown turns on autoClasses and drops the
//      hand-written links the automatic list now covers, keeping the rest
//      ("A Day at WCP" stays).
//
// Idempotent: a section already on "all" and a dropdown already automatic are
// skipped. DRY RUN by default; pass --apply to write. Draft-safe: it patches
// the PUBLISHED docs only and refuses a doc that has a pending draft, so it
// can never publish someone's half-finished edit.
// =============================================================================
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadEnv } from './lib/loadEnv.mjs';

const APPLY = process.argv.includes('--apply');
const env = loadEnv(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const token = env.SANITY_TOKEN;
if (!token) {
  console.error('SANITY_TOKEN missing (site/.env).');
  process.exit(1);
}

const API = 'https://niemhgev.api.sanity.io/v2024-01-01';
const DATASET = 'production';

async function query(groq, params = {}) {
  const url = new URL(`${API}/data/query/${DATASET}`);
  url.searchParams.set('query', groq);
  url.searchParams.set('perspective', 'raw');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(`$${k}`, JSON.stringify(v));
  }
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
  return j.result;
}

async function mutate(mutations) {
  if (!APPLY) return { dryRun: true };
  const r = await fetch(`${API}/data/mutate/${DATASET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mutations }),
  });
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
  return j;
}

const classCount = await query('count(*[_type == "class" && !(_id in path("drafts.**"))])');
console.log(`${classCount} published classes.`);

// --- 1. Card rows listing every class -> source: "all" -----------------------
const pages = await query(`*[_type == "page" && !(_id in path("drafts.**"))
  && count(sections[_type == "classCardsSection"]) > 0]{
  _id, slug,
  "hasDraft": defined(*[_id == "drafts." + ^._id][0]),
  "cards": sections[_type == "classCardsSection"]{ _key, source, "n": count(classes) }
}`);

for (const page of pages) {
  for (const card of page.cards) {
    const already = card.source === 'all';
    const subset = (card.n ?? 0) < classCount;
    const skip = already
      ? 'already automatic'
      : subset
        ? `subset (${card.n}/${classCount}), stays manual`
        : page.hasDraft
          ? 'HAS A DRAFT - flip it by hand in the Studio'
          : null;
    if (skip) {
      console.log(`  ${page.slug} [${card._key}]: ${skip}`);
      continue;
    }
    console.log(`  ${page.slug} [${card._key}]: ${APPLY ? 'setting' : 'would set'} source = "all"`);
    await mutate([
      {
        patch: {
          id: page._id,
          set: { [`sections[_key=="${card._key}"].source`]: 'all' },
        },
      },
    ]);
  }
}

// --- 2. The Classes dropdown -> autoClasses ---------------------------------
const nav = await query(`*[_id == "navigation"][0]{
  "hasDraft": defined(*[_id == "drafts.navigation"][0]),
  "group": mainNav[_type == "navGroup" && label == "Classes"][0]{
    _key, autoClasses,
    "children": children[]{ _key, label, "pageSlug": page->slug }
  }
}`);

if (!nav?.group) {
  console.log('No "Classes" dropdown found - nothing to do.');
} else if (nav.group.autoClasses) {
  console.log('Classes dropdown: already automatic.');
} else if (nav.hasDraft) {
  console.log('Classes dropdown: the Menus doc HAS A DRAFT - flip it by hand in the Studio.');
} else {
  // The links the automatic list will now provide (a page at classes/*).
  const covered = (nav.group.children ?? []).filter((c) => c.pageSlug?.startsWith('classes/'));
  const kept = (nav.group.children ?? []).filter((c) => !c.pageSlug?.startsWith('classes/'));
  console.log(
    `Classes dropdown: ${APPLY ? 'turning on' : 'would turn on'} autoClasses; ` +
      `dropping ${covered.length} covered link(s) (${covered.map((c) => c.label).join(', ')}), ` +
      `keeping ${kept.map((c) => c.label).join(', ') || '(none)'}.`,
  );
  const key = nav.group._key;
  await mutate([
    {
      patch: {
        id: 'navigation',
        set: { [`mainNav[_key=="${key}"].autoClasses`]: true },
        unset: covered.map((c) => `mainNav[_key=="${key}"].children[_key=="${c._key}"]`),
      },
    },
  ]);
}

console.log(APPLY ? 'Done.' : 'Dry run - nothing written. Pass --apply to write.');
