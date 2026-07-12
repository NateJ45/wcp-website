// =============================================================================
// seed-president-note.mjs — load the 2026-27 welcome letter into Sanity
// =============================================================================
// Creates/replaces the `presidentNote` singleton with the President's letter
// carried over from the old Squarespace hub (content unchanged). After this
// runs, the Board edits it in Studio -> Family Hub -> President's note —
// including bumping the "version stamp" when the letter changes so families
// see the new one. Idempotent (fixed _id). Run: node scripts/seed-president-note.mjs
// The photo is NOT seeded (it lived on the Squarespace CDN) — add a headshot
// in the Studio.
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

let k = 0;
const key = () => `pn${(k++).toString(36).padStart(4, '0')}`;
const para = (text) => ({
  _type: 'block',
  _key: key(),
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: key(), text, marks: [] }],
});

const LETTER = [
  'Welcome to West Chester Preschool! As we welcome all of our new and returning families to the 2026-2027 school year, we are looking forward to another amazing year at our school! Together, we create a school community where our children and families thrive. I hope our new WCP Family Hub will help each family stay informed by providing everything you need to know in one place.',
  'Throughout the school year, our board members, teachers, and families collaboratively make school decisions, plan school events, fundraisers, and more. Your engagement and voice as a parent or caregiver shapes the direction of our co-op and we love hearing from you!',
  'Most importantly, we hope your child enjoys their time at our school under the care of our loving teachers, board members, and co-op families who work together to create a nurturing and safe learning environment for each student.',
  'My family is entering our fourth year at our school, and the community we have found here is like no other. I am looking forward to another great year getting to know you and your child!',
  'Thank you for your continued support of our school. Once again, we are looking forward to a great year together!',
];

await client.createOrReplace({
  _id: 'presidentNote',
  _type: 'presidentNote',
  active: true,
  version: '2026-27-welcome',
  heading: 'Welcome to WCP',
  dateLabel: 'May 2026',
  salutation: 'Hello families!',
  body: LETTER.map(para),
  signName: 'Rachel Gumpert',
  signRole: 'Board President, 2026-27',
  email: 'president@westchesterpreschool.org',
});
console.log(
  "✓ presidentNote seeded (version 2026-27-welcome, active). Add Rachel's photo in the Studio.",
);
