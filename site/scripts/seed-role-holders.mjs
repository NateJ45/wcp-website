// =============================================================================
// seed-role-holders.mjs — move the who's-who out of code and into the Studio
// =============================================================================
// Creates one `roleHolder` document per seat on the org chart, carrying the
// names that used to live only in src/data/hub/org-holders.ts. After this runs,
// the Board updates the chart in Studio → Family Hub → "Who's who this year"
// instead of asking for a code change and a deploy.
//
// Each class rep is LINKED to her Directory entry (`contactFrom`), so her email
// and phone come from the one place they are already stored and are never typed
// twice. The link is resolved by matching her name to an adult on the entry.
//
// Idempotent: documents use deterministic ids, and a re-run PATCHES rather than
// overwrites — it only fills fields that are still empty, so a Board edit is
// never clobbered. Run:
//   node scripts/seed-role-holders.mjs           (create/fill)
//   node scripts/seed-role-holders.mjs --force   (also overwrite existing values)
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

// Mirrors src/data/hub/org-holders.ts. `person: null` = a genuinely open seat,
// which is seeded as a document with no name so the Board can see the vacancy
// in the Studio rather than wondering why a role is missing.
// `directoryName` links the seat to a Directory adult (class reps only).
const SEATS = [
  { role: 'President', person: 'Rachel Gumpert', email: 'president@westchesterpreschool.org' },
  {
    role: 'Vice President',
    person: 'Joy Rasfeld',
    email: 'vicepresident@westchesterpreschool.org',
  },
  { role: 'Treasurer', person: 'Kate Carnahan', email: 'treasurer@westchesterpreschool.org' },
  { role: 'Secretary', person: 'Margot Hisle', email: 'contact@westchesterpreschool.org' },
  { role: 'Teacher — Pre-K', person: 'Mrs. Lisa Cortez', email: 'lisa@westchesterpreschool.org' },
  {
    role: 'Teacher — Twos & Threes',
    person: 'Mrs. Erin Schmerr',
    email: 'erin@westchesterpreschool.org',
  },
  {
    role: 'Administrator',
    person: 'Mrs. Lexie Lenavitt',
    email: 'admin@westchesterpreschool.org',
  },
  { role: 'Publicity Chair', person: 'Nathan Nixon', email: 'publicity@westchesterpreschool.org' },
  {
    role: 'Enrichment Coordinator',
    person: 'Daniel Hagedorn',
    email: 'coach@westchesterpreschool.org',
  },
  { role: 'Copy Room Helper', person: null },
  { role: 'Facilities Chair', person: null },
  { role: 'Family Activities Chair', person: null },
  {
    role: 'Fundraising Chair',
    person: 'Nicole Hagedorn',
    email: 'fundraising@westchesterpreschool.org',
  },
  { role: 'Twos Rep', person: 'Laura Gilbert', directoryName: 'Laura Gilbert' },
  { role: 'Threes Rep', person: 'Jordyn Frasier', directoryName: 'Jordyn Frasier' },
  { role: 'Pre-K AM Rep', person: 'Megan Waid', directoryName: 'Megan Waid' },
  { role: 'Pre-K PM Rep', person: "Melissa O'Brien", directoryName: "Melissa O'Brien" },
];

const idFor = (role) =>
  'roleHolder-' +
  role
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// Resolve each rep's Directory entry by the adult's name, so the seeded link
// points at a real family rather than a guessed id.
const wanted = SEATS.map((s) => s.directoryName).filter(Boolean);
const entries = await client.fetch(
  `*[_type == "directoryEntry" && count(parents[@.name in $names]) > 0]{ _id, "names": parents[].name }`,
  { names: wanted },
);
const entryFor = (name) =>
  entries.find((e) => (e.names || []).some((n) => (n || '').trim() === name))?._id;

const unlinked = wanted.filter((n) => !entryFor(n));
if (unlinked.length) {
  // Loud, not silent: an unmatched rep is exactly the failure the reference was
  // introduced to make visible.
  console.warn(`! no Directory entry matched: ${unlinked.join(', ')} — seeding without a link`);
}

const tx = client.transaction();
let created = 0;
let patched = 0;
for (const seat of SEATS) {
  const _id = idFor(seat.role);
  const existing = await client.getDocument(_id);
  const fields = {
    role: seat.role,
    ...(seat.person ? { person: seat.person } : {}),
    ...(seat.email ? { email: seat.email } : {}),
    ...(seat.directoryName && entryFor(seat.directoryName)
      ? {
          contactFrom: {
            _type: 'reference',
            _ref: entryFor(seat.directoryName),
          },
        }
      : {}),
  };

  if (!existing) {
    tx.create({ _id, _type: 'roleHolder', ...fields });
    created++;
  } else if (FORCE) {
    tx.patch(_id, (p) => p.set(fields));
    patched++;
  } else {
    // setIfMissing: fill the blanks, never clobber a Board edit.
    tx.patch(_id, (p) => p.setIfMissing(fields));
    patched++;
  }
}
await tx.commit();

console.log(
  `✓ Who's who seeded: ${created} created, ${patched} ${FORCE ? 'overwritten' : 'filled where empty'} (${SEATS.length} seats).`,
);
console.log(
  `  Open roles seeded with no name: ${SEATS.filter((s) => !s.person)
    .map((s) => s.role)
    .join(', ')}`,
);
