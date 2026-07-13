// =============================================================================
// seed-teacher-notes.mjs — load the 2026-27 teacher welcome letters into Sanity
// =============================================================================
// Creates/replaces one `teacherNote` doc per class with the teachers' welcome
// letters (Erin Schmerr for Twos + Threes, Lisa Cortez for both Pre-K
// classes). After this runs, the teachers/Board edit them in Studio -> Family
// Hub -> Teacher welcome notes — including bumping the "version stamp" when a
// letter changes so families see the new one. Photos are copied from the
// existing `staff` docs' image assets. Idempotent (fixed _ids).
// Run: node scripts/seed-teacher-notes.mjs
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
const key = () => `tn${(k++).toString(36).padStart(4, '0')}`;
const para = (text) => ({
  _type: 'block',
  _key: key(),
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: key(), text, marks: [] }],
});

// Reuse the staff headshots already in the media library.
const staffPhotos = await client.fetch(`*[_type == "staff"]{ _id, "assetId": photo.asset._ref }`);
const photoFor = (staffId) => {
  const assetId = staffPhotos.find((s) => s._id === staffId)?.assetId;
  return assetId ? { _type: 'image', asset: { _type: 'reference', _ref: assetId } } : undefined;
};

const ERIN_LETTER = (who) => [
  'Welcome back - and for those of you joining us for the first time, welcome home. There is no place quite like WCP, and that is entirely because of families like yours.',
  'We are a school built on trust, shared effort, and genuine community. When you chose WCP, you did not just enroll your child in a preschool - you joined a co-op where every family plays a real part in making this place special. That is something we are proud of every single day.',
  `This Family Hub is your go-to resource for everything you need throughout the year - from your co-op job details and helper schedule, to school news, important documents, and information about your child's ${who} class. Please bookmark it and check back often.`,
  'My inbox is always open. If you ever have a question, a concern, or just want to say hello, please reach out. This is your school too.',
];

const LISA_LETTER = [
  "I'm Mrs. Lisa, and I'm so excited to be part of your child's preschool journey. My husband Ben and I have been blessed with three wonderful children, Mari, Jack, and Oliver.",
  "Before they were born, I taught in several states across the country. While I cherished the opportunity to stay home with my children when they were young, returning to the classroom at WCP felt like coming home. There's something truly magical about watching young minds grow and develop.",
  'Our classroom is a place of wonder and discovery. Through playful learning, we nurture curiosity, creativity, and a love for learning. I believe in creating a warm and supportive environment where every child feels valued and encouraged.',
  "This page is your go-to resource for everything you need to know about our class throughout the school year. If you ever have questions or concerns, please don't hesitate to reach out, I'm always happy to hear from you.",
  "I can't wait to get to know each of you and your little ones. Let's make it a wonderful year!",
];

const NOTES = [
  {
    _id: 'teacherNote-twos',
    class: 'twos',
    heading: 'Welcome to Twos!',
    salutation: 'Dear Twos Families,',
    body: ERIN_LETTER('Twos').map(para),
    signName: 'Erin Schmerr',
    signRole: 'Twos Teacher, 2026-27',
    email: 'erin@westchesterpreschool.org',
    photo: photoFor('staff-erin'),
  },
  {
    _id: 'teacherNote-threes',
    class: 'threes',
    heading: 'Welcome to Threes!',
    salutation: 'Dear Threes Families,',
    body: ERIN_LETTER('Threes').map(para),
    signName: 'Erin Schmerr',
    signRole: 'Threes Teacher, 2026-27',
    email: 'erin@westchesterpreschool.org',
    photo: photoFor('staff-erin'),
  },
  {
    _id: 'teacherNote-pre-k-am',
    class: 'pre-k-am',
    heading: 'Welcome to Pre-K!',
    salutation: "Welcome! I'm so happy to have your child in class this year!",
    body: LISA_LETTER.map(para),
    signName: 'Lisa Cortez',
    signRole: 'Pre-K Teacher, 2026-27',
    email: 'lisa@westchesterpreschool.org',
    photo: photoFor('staff-lisa'),
  },
  {
    _id: 'teacherNote-pre-k-pm',
    class: 'pre-k-pm',
    heading: 'Welcome to Pre-K!',
    salutation: "Welcome! I'm so happy to have your child in class this year!",
    body: LISA_LETTER.map(para),
    signName: 'Lisa Cortez',
    signRole: 'Pre-K Teacher, 2026-27',
    email: 'lisa@westchesterpreschool.org',
    photo: photoFor('staff-lisa'),
  },
];

for (const n of NOTES) {
  await client.createOrReplace({
    _type: 'teacherNote',
    active: true,
    version: '2026-27-welcome',
    dateLabel: 'May 2026',
    ...n,
  });
  console.log(`✓ ${n._id} seeded (active, version 2026-27-welcome)`);
}
