// =============================================================================
// patch-hub-classrooms — make the two shipped class pages say which classes
// =============================================================================
// One-shot companion to the 2026-08-29 hub change (hubPage gained "Classes on
// this page"; the `class` icon field went live again). The hub's class pages
// are derived from the class documents now (src/lib/hub-classrooms.ts), so the
// two pages that cover MORE THAN ONE class have to say so, or Twos, Threes,
// Pre-K AM and Pre-K PM would each get their own page and the shipped
// addresses /family-hub/twos-threes and /family-hub/pre-k would 404.
//
// Three edits:
//   1. hubPage "twos-threes"  -> classes: [Twos, Threes]
//   2. hubPage "pre-k"        -> classes: [Pre-K AM, Pre-K PM]
//   3. Each of the four classes gets the icon the code used to own, so the
//      Studio holds it and a class added later can pick its own.
//
// Idempotent: a page that already names its classes, and a class that already
// has an icon, are skipped. DRY RUN by default; pass --apply to write.
// Draft-safe: it patches the PUBLISHED docs only and refuses a doc with a
// pending draft, so it can never publish someone's half-finished edit.
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

// The pairings the site shipped with: two classes to a page, because each pair
// shares one teacher and one handbook.
const PAGES = [
  { hubKey: 'twos-threes', classSlugs: ['twos', 'threes'] },
  { hubKey: 'pre-k', classSlugs: ['pre-k-am', 'pre-k-pm'] },
];

// The icons src/data/classes.ts owned. Moving them into the documents is what
// lets a class the Board adds pick its own picture.
const ICONS = { twos: 'blocks', threes: 'sprout', 'pre-k-am': 'sun', 'pre-k-pm': 'moon' };

const classes = await query(
  `*[_type == "class" && !(_id in path("drafts.**"))]{
     _id, name, icon, "slug": slug.current,
     "hasDraft": defined(*[_id == "drafts." + ^._id][0])
   }`,
);
const bySlug = Object.fromEntries(classes.map((c) => [c.slug, c]));
console.log(`${classes.length} published classes: ${classes.map((c) => c.slug).join(', ')}`);

// --- 1 + 2. The two shared class pages name their classes --------------------
for (const page of PAGES) {
  const doc = await query(
    `*[_type == "hubPage" && hubKey == $key && !(_id in path("drafts.**"))][0]{
       _id, title, "n": count(classes),
       "hasDraft": defined(*[_id == "drafts." + ^._id][0])
     }`,
    { key: page.hubKey },
  );
  if (!doc) {
    console.log(`  hubPage "${page.hubKey}": not found - skipped.`);
    continue;
  }
  if (doc.n > 0) {
    console.log(`  hubPage "${page.hubKey}": already names ${doc.n} class(es) - skipped.`);
    continue;
  }
  const refs = page.classSlugs.map((s) => bySlug[s]).filter(Boolean);
  if (refs.length !== page.classSlugs.length) {
    console.log(`  hubPage "${page.hubKey}": a class is missing - skipped, fix it by hand.`);
    continue;
  }
  if (doc.hasDraft) {
    console.log(`  hubPage "${page.hubKey}": HAS A DRAFT - set it by hand in the Studio.`);
    continue;
  }
  console.log(
    `  hubPage "${page.hubKey}": ${APPLY ? 'setting' : 'would set'} classes = ` +
      refs.map((r) => r.name).join(', '),
  );
  await mutate([
    {
      patch: {
        id: doc._id,
        set: {
          classes: refs.map((r, i) => ({
            _type: 'reference',
            _key: `${page.hubKey}-${i}`,
            _ref: r._id,
          })),
        },
      },
    },
  ]);
}

// --- 3. The class icons move into the documents ------------------------------
for (const [slug, icon] of Object.entries(ICONS)) {
  const doc = bySlug[slug];
  if (!doc) {
    console.log(`  class "${slug}": not found - skipped.`);
    continue;
  }
  if (doc.icon === icon) {
    console.log(`  class "${slug}": icon already "${icon}" - skipped.`);
    continue;
  }
  if (doc.hasDraft) {
    console.log(`  class "${slug}": HAS A DRAFT - set the icon by hand in the Studio.`);
    continue;
  }
  console.log(`  class "${slug}": ${APPLY ? 'setting' : 'would set'} icon = "${icon}"`);
  await mutate([{ patch: { id: doc._id, set: { icon } } }]);
}

// --- The Classes menu group -> automatic --------------------------------------
// Found live 2026-08-29, AFTER the first run of this script: the redesign
// removed the class pages from BUILTIN_HUB_LINKS, so the menu's two stored
// Classes links turned invalid - a red "2 errors" badge on the volunteer's
// screen, and (before the validation fix in hubNavMenu.ts) a publish block
// with the failing fields hidden. The conversion belongs to this migration:
// turn the group automatic and drop the links the automatic list replaces.
const menu = await query(`*[_id == "hubNavMenu"][0]{
  "hasDraft": defined(*[_id == "drafts.hubNavMenu"][0]),
  "group": groups[_key == "classes"][0]{ autoClasses, "links": links[]{_key, target} }
}`);
if (!menu?.group) {
  console.log('Menu: no Classes group - nothing to do.');
} else if (menu.group.autoClasses) {
  console.log('Menu: Classes group already automatic.');
} else if (menu.hasDraft) {
  console.log(
    'Menu: the menu doc HAS A DRAFT - flip "Fill this section with the class pages" by hand.',
  );
} else {
  const dead = (menu.group.links ?? []).filter((l) => l.target?.startsWith('/family-hub/'));
  console.log(
    `Menu: ${APPLY ? 'turning' : 'would turn'} the Classes group automatic, removing ${dead.length} legacy link(s).`,
  );
  await mutate([
    {
      patch: {
        id: 'hubNavMenu',
        set: { 'groups[_key=="classes"].autoClasses': true },
        unset: dead.map((l) => `groups[_key=="classes"].links[_key=="${l._key}"]`),
      },
    },
  ]);
}

console.log(APPLY ? 'Done.' : 'Dry run - nothing written. Pass --apply to write.');
