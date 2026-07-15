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

// Ms. Erin's own 2026-27 welcome letter (verbatim, one letter for both her
// Twos and Threes families). Bump the version stamp on the notes below if this
// text is ever rewritten, so families who dismissed the old one see the new.
const ERIN_LETTER = [
  `Welcome to "The Happiest Classroom on Earth!" I've loved meeting your family and little ones and I can't wait to get to know everyone better this school year!`,
  `I am an alumni parent who fell in love with West Chester Preschool when my own daughter (Adela) was enrolled in Ms. Lisa's pre-k class. The sense of community in this school is really special and I'm honored to be a part of it.`,
  `Throughout my life, I've worked in numerous children's programs and schools. I've worked with infants to teens and everything in between! I have always loved working with children and cherish all the different experiences I have had. But most of all, West Chester Preschool has a special place in my heart.`,
  `I would describe my class as a place of joy and creativity. We learn about the world around us, but most importantly, we start to work on our social skills and how a classroom works. This is often your child's first ever experience with school. I strive to make it a place that your child will remember as a place of warmth, fun, and growth.`,
  `Every child is important to me and I will do everything I can to make each student feel like Ms. Erin really knows them and what matters to them.`,
  `Thank you for the opportunity to teach your child this school year. I am truly grateful for the opportunity!`,
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
    body: ERIN_LETTER.map(para),
    signName: 'Erin Schmerr',
    signRole: 'Twos Teacher, 2026-27',
    email: 'erin@westchesterpreschool.org',
    photo: photoFor('staff-erin'),
    // Bumped from '2026-27-welcome' (placeholder letter) so families re-see it.
    version: '2026-27-welcome-2',
  },
  {
    _id: 'teacherNote-threes',
    class: 'threes',
    heading: 'Welcome to Threes!',
    salutation: 'Dear Threes Families,',
    body: ERIN_LETTER.map(para),
    signName: 'Erin Schmerr',
    signRole: 'Threes Teacher, 2026-27',
    email: 'erin@westchesterpreschool.org',
    photo: photoFor('staff-erin'),
    version: '2026-27-welcome-2',
  },
  // One note for the merged Pre-K page (AM + PM share the page and teacher).
  {
    _id: 'teacherNote-pre-k',
    class: 'pre-k',
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
  console.log(`✓ ${n._id} seeded (active, version ${n.version ?? '2026-27-welcome'})`);
}
