// =============================================================================
// patch-teacher-sections-auto — flip the teacher cards to their derived modes
// =============================================================================
// Companion to the 2026-08-29 teacherSection `source` field. Two rules:
//
//   - A section listing the WHOLE staff (the "people your child will love"
//     walls on Why WCP and Visit) switches to source: "all", so a hire or a
//     leave updates the walls by itself.
//   - A single-teacher section on a CLASS page (classes/*) switches to
//     "classTeacher": it derives this page's class's teacher through the
//     class doc, so repointing class.teacher after a replacement updates the
//     "Meet the teacher" card with no page edit.
//
// Anything else (a curated pick that is neither) is reported and left alone.
// Idempotent; DRY RUN by default, --apply writes; skips a page with a pending
// draft rather than publishing someone's half-finished edit.
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

async function query(groq) {
  const url = new URL(`${API}/data/query/production`);
  url.searchParams.set('query', groq);
  url.searchParams.set('perspective', 'raw');
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
  return j.result;
}

async function mutate(mutations) {
  if (!APPLY) return;
  const r = await fetch(`${API}/data/mutate/production`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mutations }),
  });
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
}

const staffCount = await query('count(*[_type == "staff" && !(_id in path("drafts.**"))])');
console.log(`${staffCount} published staff.`);

const pages = await query(`*[_type == "page" && !(_id in path("drafts.**"))
  && count(sections[_type == "teacherSection"]) > 0]{
  _id, slug,
  "hasDraft": defined(*[_id == "drafts." + ^._id][0]),
  "secs": sections[_type == "teacherSection"]{ _key, source, "n": count(staff) }
}`);

for (const page of pages) {
  const isClassPage = page.slug.startsWith('classes/');
  for (const sec of page.secs) {
    const target = sec.source
      ? null // already chosen, leave it
      : isClassPage && sec.n === 1
        ? 'classTeacher'
        : !isClassPage && sec.n === staffCount
          ? 'all'
          : null;
    const note = sec.source
      ? `already "${sec.source}"`
      : target === null
        ? `curated pick (${sec.n}/${staffCount}), stays manual`
        : page.hasDraft
          ? 'HAS A DRAFT - flip it by hand in the Studio'
          : null;
    if (note) {
      console.log(`  ${page.slug} [${sec._key}]: ${note}`);
      continue;
    }
    console.log(`  ${page.slug} [${sec._key}]: ${APPLY ? 'setting' : 'would set'} "${target}"`);
    await mutate([
      { patch: { id: page._id, set: { [`sections[_key=="${sec._key}"].source`]: target } } },
    ]);
  }
}
console.log(APPLY ? 'Done.' : 'Dry run - nothing written. Pass --apply to write.');
