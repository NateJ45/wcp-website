// =============================================================================
// patch-org-chart — move the org chart's SHAPE out of code and into documents
// =============================================================================
// One-shot companion to the 2026-08-29 org-chart change. The chart used to be
// drawn from a committed list (src/data/hub/org-holders.ts): its tiers, its two
// branches, its committee pills and its icons were all code, so a school that
// renamed a role, added one, or shrank its board needed a developer.
//
// The chart is DERIVED now (src/lib/hub-org.ts). This script fills in the two
// things the documents did not carry yet, so the derived chart draws exactly
// what the committed one drew:
//
//   1. Each `coopRole` gains "Reports to" as a REFERENCE (it was free text like
//      "Reports to VP", which a chart cannot follow), so the columns and the
//      committee pills fall out of the reporting lines.
//   2. The three PAID STAFF seats (two teachers + the administrator) become
//      `coopRole` documents. They were the only chart boxes with no role
//      document at all, because the old chart carried them in code.
//   3. The Class Rep role is marked "one of these for every class", which is
//      what keeps a new class's rep card automatic.
//   4. Each `roleHolder` gains `seat` (a reference to its role) and, for a class
//      rep, `forClass`. That is the join that survives renaming a role.
//   5. The five job-list headings are seeded onto "How the co-op works", so a
//      school can rename "Cabinet Chairs" without a code change.
//
// Idempotent: anything already set is skipped and logged as such. DRY RUN by
// default; pass --apply to write. Draft-safe: it patches the PUBLISHED docs only
// and refuses a doc with a pending draft, so it can never publish someone's
// half-finished edit.
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

const ref = (id) => ({ _type: 'reference', _ref: id });
const verb = APPLY ? 'setting' : 'would set';

// ---- The structure the committed chart drew ---------------------------------
// Keyed by role NAME because that is what both the documents and the old code
// list agree on today. Each value is the role it reports to.
const REPORTS_TO = {
  'Vice President': 'President',
  Treasurer: 'President',
  Secretary: 'President',
  'Facilities Chair': 'Vice President',
  'Family Activities Chair': 'Vice President',
  'Fundraising Chair': 'Vice President',
  'Publicity Chair': 'Secretary',
  'Enrichment Coordinator': 'Secretary',
  'Class Rep': 'Secretary',
  'Teacher’s Aide': 'Secretary',
  'Copy Room Helper': 'Secretary',
  'Publicity Assistant': 'Publicity Chair',
  'Playground Committee': 'Facilities Chair',
  Laundry: 'Facilities Chair',
  'Family Activities Committee': 'Family Activities Chair',
  'Fundraising Committee': 'Fundraising Chair',
};

// The paid-staff seats the old chart carried in code. Their ids match the
// committed fallback in src/data/hub/org-holders.ts, so a mixed render joins.
const STAFF = [
  {
    _id: 'coop-staff-teacher-pre-k',
    name: 'Teacher — Pre-K',
    icon: 'book-open',
    body: 'Plans and teaches the Pre-K classes. Paid staff, not a co-op job.',
  },
  {
    _id: 'coop-staff-teacher-twos-threes',
    name: 'Teacher — Twos & Threes',
    icon: 'book-open',
    body: 'Plans and teaches the Twos and Threes classes. Paid staff, not a co-op job.',
  },
  {
    _id: 'coop-staff-administrator',
    name: 'Administrator',
    icon: 'building-2',
    body: 'Runs the school office: enrollment paperwork, licensing records, and day-to-day admin. Paid staff, not a co-op job.',
  },
];

// The headings the page had hardcoded. Seeded so they are the school's to edit.
const SECTIONS = [
  {
    _key: 'board',
    _type: 'orgSection',
    key: 'board',
    label: 'Executive Board',
    blurb:
      'Elected each spring, serving one-year terms. Meets monthly to set policy, manage finances, and oversee school operations.',
  },
  {
    _key: 'staff',
    _type: 'orgSection',
    key: 'staff',
    label: 'Paid Staff',
    blurb: 'The school’s only paid employees.',
  },
  {
    _key: 'chairs',
    _type: 'orgSection',
    key: 'chairs',
    label: 'Cabinet Chairs',
    blurb: 'Each chair leads a small team of co-op members and reports to a Board officer.',
  },
  {
    _key: 'reps',
    _type: 'orgSection',
    key: 'reps',
    label: 'Class Representatives',
    blurb: 'One per class — the link between families, the teacher, and the Board.',
  },
  {
    _key: 'committee',
    _type: 'orgSection',
    key: 'committee',
    label: 'Committee Members',
    blurb:
      'The hands-on roles that keep everything running — most are light, predictable commitments.',
  },
];

// -----------------------------------------------------------------------------
console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to write) ===');

const roles = await query(
  `*[_type == "coopRole" && !(_id in path("drafts.**"))] | order(orderRank){
     _id, name, tier, perClass, "reportsTo": reportsTo._ref, orderRank,
     "hasDraft": defined(*[_id == "drafts." + ^._id][0])
   }`,
);
console.log(`${roles.length} published co-op roles.`);

// --- 1. The three paid-staff seats ------------------------------------------
// createIfNotExists, so a re-run adds nothing. They sort after the officers and
// before the chairs; orderRank sorts as a plain string, so a rank between the
// last board rank and the first chair rank puts them in the right place.
const boardRanks = roles.filter((r) => r.tier === 'board').map((r) => r.orderRank);
const staffRank = boardRanks.length ? `${boardRanks[boardRanks.length - 1]}0` : '0|i0000s:';
for (const [i, seat] of STAFF.entries()) {
  if (roles.some((r) => r._id === seat._id || r.name === seat.name)) {
    console.log(`  staff "${seat.name}": already a role - skipped.`);
    continue;
  }
  console.log(`  staff "${seat.name}": ${APPLY ? 'creating' : 'would create'} (${seat._id})`);
  await mutate([
    {
      createIfNotExists: {
        _id: seat._id,
        _type: 'coopRole',
        name: seat.name,
        tier: 'staff',
        icon: seat.icon,
        body: seat.body,
        orderRank: `${staffRank}${i}`,
      },
    },
  ]);
}

// Re-read so the reporting pass can see whatever was just created.
const allRoles = APPLY
  ? await query(`*[_type == "coopRole" && !(_id in path("drafts.**"))]{ _id, name }`)
  : [...roles, ...STAFF.filter((s) => !roles.some((r) => r.name === s.name))];
const byName = new Map(allRoles.map((r) => [r.name, r._id]));

// --- 2. "Reports to" becomes a reference ------------------------------------
for (const role of roles) {
  const parentName = REPORTS_TO[role.name];
  if (!parentName) {
    console.log(`  role "${role.name}": top of the chart or unlisted - no change.`);
    continue;
  }
  const parentId = byName.get(parentName);
  if (!parentId) {
    console.log(`  role "${role.name}": "${parentName}" not found - skipped, set it by hand.`);
    continue;
  }
  if (role.reportsTo === parentId) {
    console.log(`  role "${role.name}": already reports to ${parentName} - skipped.`);
    continue;
  }
  if (role.hasDraft) {
    console.log(`  role "${role.name}": HAS A DRAFT - set "Reports to" by hand in the Studio.`);
    continue;
  }
  console.log(`  role "${role.name}": ${verb} reports to "${parentName}".`);
  await mutate([{ patch: { id: role._id, set: { reportsTo: ref(parentId) } } }]);
}

// --- 3. The Class Rep seat becomes per-class --------------------------------
const repRole = roles.find((r) => r.tier === 'reps') ?? roles.find((r) => r.name === 'Class Rep');
if (!repRole) {
  console.log('  Class Rep: no rep role found - class rep cards will fall back to the label join.');
} else if (repRole.perClass === true) {
  console.log(`  Class Rep "${repRole.name}": already one per class - skipped.`);
} else if (repRole.hasDraft) {
  console.log(`  Class Rep "${repRole.name}": HAS A DRAFT - tick the box by hand in the Studio.`);
} else {
  console.log(`  Class Rep "${repRole.name}": ${verb} "one of these for every class".`);
  await mutate([{ patch: { id: repRole._id, set: { perClass: true } } }]);
}

// --- 4. Every holder points at its seat -------------------------------------
const classes = await query(
  `*[_type == "class" && !(_id in path("drafts.**"))]{ _id, name, "slug": slug.current }`,
);
const holders = await query(
  `*[_type == "roleHolder" && !(_id in path("drafts.**"))]{
     _id, role, "seat": seat._ref, "forClass": forClass._ref,
     "hasDraft": defined(*[_id == "drafts." + ^._id][0])
   }`,
);
console.log(`${holders.length} published role holders, ${classes.length} classes.`);

for (const holder of holders) {
  if (holder.seat) {
    console.log(`  holder "${holder.role ?? holder._id}": already points at its role - skipped.`);
    continue;
  }
  const label = holder.role?.trim();
  if (!label) {
    console.log(`  holder ${holder._id}: no role at all - skipped, fix it by hand.`);
    continue;
  }
  // A "<Class name> Rep" holder joins the ONE Class Rep seat plus its class.
  const cls = classes.find((c) => label === `${c.name} Rep`);
  const seatId = cls ? (repRole && byName.get(repRole.name)) || repRole?._id : byName.get(label);
  if (!seatId) {
    console.log(`  holder "${label}": no matching role - skipped, pick one by hand.`);
    continue;
  }
  if (holder.hasDraft) {
    console.log(`  holder "${label}": HAS A DRAFT - pick its role by hand in the Studio.`);
    continue;
  }
  const set = { seat: ref(seatId) };
  if (cls) set.forClass = ref(cls._id);
  console.log(
    `  holder "${label}": ${verb} role = ${cls ? `Class Rep (${cls.name})` : label}${
      cls ? '' : ''
    }.`,
  );
  await mutate([{ patch: { id: holder._id, set } }]);
}

// --- 5. The job-list headings ------------------------------------------------
const guidance = await query(
  `*[_id == "coopGuidance"][0]{ "n": count(sections),
     "hasDraft": defined(*[_id == "drafts.coopGuidance"][0]) }`,
);
if (!guidance) {
  console.log('Headings: no "How the co-op works" document - skipped.');
} else if (guidance.n > 0) {
  console.log(`Headings: already has ${guidance.n} - skipped.`);
} else if (guidance.hasDraft) {
  console.log('Headings: the document HAS A DRAFT - add the headings by hand.');
} else {
  console.log(`Headings: ${verb} the five standard headings.`);
  await mutate([{ patch: { id: 'coopGuidance', set: { sections: SECTIONS } } }]);
}

console.log(APPLY ? 'Done.' : 'Dry run - nothing written. Pass --apply to write.');
