// =============================================================================
// polish-public-pages.mjs — public-site audit fixes (2026-07 polish pass)
// =============================================================================
// Content corrections found by auditing every public page against the 2026-27
// Family Handbook + May Gathering deck:
//   1. Unique seoDescription for every page (they were all empty) + a proper
//      homepage seoTitle.
//   2. The co-op commitment is SEVEN items (monthly cleaning was missing) and
//      the meeting is called the "May Gathering" — fixed on /co-op-life and
//      /enroll.
//   3. /a-day-at-wcp claimed "two parent helpers every session" — Pre-K has
//      one; reworded.
//   4. Removed stale "coming soon" copy sitting next to WORKING forms on
//      /enroll and /newsletter.
//   5. The Twos page testimonial praised Mrs. Lisa (the Pre-K teacher) —
//      retagged so a Mrs. Erin quote shows there instead.
//   6. Seeded the two public Open House events so /events isn't empty.
// Idempotent. Run: node scripts/polish-public-pages.mjs
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

// ── 1. SEO: descriptions for every page + the homepage title ─────────────────
const SEO = {
  'page-home': {
    seoTitle: 'West Chester Preschool | Parent Co-op Preschool in West Chester, Ohio',
    seoDescription:
      'A parent-run cooperative preschool in West Chester, Ohio since 1969. Play-based classes for ages 2–5, small class sizes, and tuition from $70/month.',
  },
  'page-about': {
    seoDescription:
      'Founded by parents in 1969, West Chester Preschool is a cooperative preschool where families run the school together. Meet our teachers and story.',
  },
  'page-classes-twos': {
    seoDescription:
      'The WCP Twos class: a gentle, play-based Thursday-morning introduction to school for two-year-olds. Small class of 7, $70/month.',
  },
  'page-classes-threes': {
    seoDescription:
      'The WCP Threes class meets Monday–Wednesday mornings: routine, creativity, and friendships for three-year-olds. $150/month.',
  },
  'page-classes-pre-k': {
    seoDescription:
      'WCP Pre-K prepares four-year-olds for kindergarten with Ohio Early Learning Standards, AM and PM sessions, and a class capped at 12.',
  },
  'page-co-op-life': {
    seoDescription:
      'What co-op life at West Chester Preschool actually involves: helper days, co-op jobs, and the community that makes it worth it.',
  },
  'page-why-wcp': {
    seoDescription:
      'Why families choose West Chester Preschool: a front-row seat to your child’s growth, tuition from $70/month, and 55+ years of community.',
  },
  'page-a-day-at-wcp': {
    seoDescription:
      'What a day at West Chester Preschool looks like — free play, circle time, centers, snack, and outdoor play, class by class.',
  },
  'page-tuition': {
    seoDescription:
      '2026-27 tuition at West Chester Preschool: $70–$200/month by class, with all fees listed up front. The co-op model keeps costs low.',
  },
  'page-faq': {
    seoDescription:
      'Answers to the questions families ask about West Chester Preschool — the co-op model, classes, enrollment, fees, and potty training.',
  },
  'page-enroll': {
    seoDescription:
      'Enroll at West Chester Preschool for 2026-27: reach out, tour the school, and complete paperwork. Classes for ages 2–5, tuition from $70/month.',
  },
  'page-contact': {
    seoDescription:
      'Contact West Chester Preschool: call (513) 202-6187, email us, or visit at 9463 Cincinnati Columbus Rd inside Crestview Presbyterian Church.',
  },
  'page-virtual-tour': {
    seoDescription:
      'Take a virtual look inside West Chester Preschool — the classrooms, gym, playground, and teachers your child will love.',
  },
  'page-work-with-us': {
    seoDescription:
      'Teach at West Chester Preschool: small classes, parent partners in the classroom, and a play-based curriculum. Applications reviewed year-round.',
  },
  'page-donate': {
    seoDescription:
      'Support West Chester Preschool — every donation funds classroom supplies, enrichment, and keeping co-op tuition affordable for local families.',
  },
  'page-newsletter': {
    seoDescription:
      'Get West Chester Preschool news a few times a year: enrollment reminders, event dates, and peeks inside the classrooms.',
  },
  'page-accessibility': {
    seoDescription:
      'West Chester Preschool’s accessibility statement: our commitment to WCAG 2.1 AA and how to reach us if something isn’t working for you.',
  },
  'page-privacy': {
    seoDescription:
      'How West Chester Preschool handles your information: we collect as little as possible and never sell it.',
  },
  'page-terms': {
    seoDescription: 'The terms of use for the West Chester Preschool website, in plain language.',
  },
};
for (const [id, fields] of Object.entries(SEO)) {
  await client.patch(id).set(fields).commit();
}
console.log(`✓ seoDescription set on ${Object.keys(SEO).length} pages (+ home seoTitle)`);

// ── 2. The co-op commitment: seven items, correct meeting names ──────────────
const cleaningCard = (key) => ({
  _key: key,
  icon: 'sparkles',
  chip: 'sky',
  title: 'Join one monthly cleaning',
  body: 'Families deep-clean the classrooms together one Saturday morning per year (9–11 am). Many hands, quick work, and the rooms sparkle for the kids.',
});

// /co-op-life — "Six things" grid (k149)
{
  const doc = await client.getDocument('page-co-op-life');
  const sec = doc.sections.find((s) => s._key === 'k149');
  sec.header.title = 'Seven things every WCP family agrees to';
  sec.header.lead =
    'When you enroll, you take on these seven commitments for the school year. They are what make WCP run.';
  const meetings = sec.cards.find((c) => c.title === 'Attend mandatory meetings');
  meetings.body =
    'Four meetings per year: the May Gathering, Orientation right before school starts, and Fall and Winter informational meetings.';
  if (!sec.cards.some((c) => c.title === 'Join one monthly cleaning')) {
    sec.cards.splice(4, 0, cleaningCard('k149b'));
  }
  await client.createOrReplace(doc);
  console.log('✓ page-co-op-life: seven commitments + May Gathering naming');
}

// /enroll — "What being a co-op family involves" grid (k226) + stale CTA (k229)
{
  const doc = await client.getDocument('page-enroll');
  const sec = doc.sections.find((s) => s._key === 'k226');
  const meetings = sec.cards.find((c) => c.title.startsWith('Attend'));
  meetings.title = 'Attend four meetings';
  meetings.body = 'The May Gathering, Orientation, and Fall and Winter info meetings.';
  if (!sec.cards.some((c) => c.title === 'Join one monthly cleaning')) {
    sec.cards.splice(4, 0, {
      _key: 'k226b',
      icon: 'sparkles',
      chip: 'sky',
      title: 'Join one monthly cleaning',
      body: 'One Saturday-morning classroom deep clean per year.',
    });
  }
  const cta = doc.sections.find((s) => s._key === 'k229');
  cta.lead =
    'We are a parent-run school and we actually reply, usually within a day or two. Send the inquiry form above, or skip straight to a call or email — whichever is easiest.';
  await client.createOrReplace(doc);
  console.log('✓ page-enroll: seven commitments + fresh CTA copy');
}

// ── 3. /a-day-at-wcp — accurate helper count ─────────────────────────────────
{
  const doc = await client.getDocument('page-a-day-at-wcp');
  const sec = doc.sections.find((s) => s._key === 'k90');
  const card = sec.cards.find((c) => c._key === 'k88');
  card.body =
    'Co-op parents help in the classroom every session — two in Twos and Threes, one in each Pre-K class.';
  await client.createOrReplace(doc);
  console.log('✓ page-a-day-at-wcp: helper-count wording fixed');
}

// ── 4. /newsletter — the form exists; stop saying it's coming ────────────────
{
  const doc = await client.getDocument('page-newsletter');
  const cta = doc.sections.find((s) => s._key === 'k211');
  cta.lead =
    'Pop your email into the signup form above and you are on the list — or send us a quick email and we will add you ourselves. Either way, no spam, ever.';
  await client.createOrReplace(doc);
  console.log('✓ page-newsletter: stale "coming soon" copy replaced');
}

// ── 5. Twos page testimonial: show a Mrs. Erin quote ─────────────────────────
{
  const swarr = await client.getDocument('testimonial-15'); // "Ms. Erin is a great teacher…"
  const mcq = await client.getDocument('testimonial-1'); // praises Mrs. Lisa
  const tags = (d) => new Set(d.tags ?? []);
  const sTags = tags(swarr);
  sTags.add('twos');
  await client
    .patch('testimonial-15')
    .set({ tags: [...sTags] })
    .commit();
  const mTags = tags(mcq);
  if (mTags.delete('twos')) {
    mTags.add('prek');
    await client
      .patch('testimonial-1')
      .set({ tags: [...mTags] })
      .commit();
  }
  console.log('✓ Twos page testimonial now praises the Twos teacher');
}

// ── 6. /events — the two public Open Houses (from the school calendar) ───────
const EVENTS = [
  {
    _id: 'event-open-house-jan-2027',
    title: 'Winter Open House',
    startDate: '2027-01-09T10:00:00-05:00',
    endDate: '2027-01-09T12:00:00-05:00',
    allDay: false,
    location: '9463 Cincinnati Columbus Rd, West Chester (Door 5)',
    category: 'openHouse',
    description:
      'Tour the classrooms, meet the teachers, and see the co-op in action. Open registration for 2027-28 begins at Open House — no appointment needed.',
    ctaLabel: 'Plan your visit',
    ctaUrl: '/contact',
  },
  {
    _id: 'event-open-house-mar-2027',
    title: 'Spring Open House',
    startDate: '2027-03-16T18:00:00-04:00',
    endDate: '2027-03-16T19:30:00-04:00',
    allDay: false,
    location: '9463 Cincinnati Columbus Rd, West Chester (Door 5)',
    category: 'openHouse',
    description:
      'An evening look at WCP for families still deciding — walk the classrooms, chat with current co-op parents, and ask the teachers anything.',
    ctaLabel: 'Plan your visit',
    ctaUrl: '/contact',
  },
];
for (const e of EVENTS) {
  await client.createOrReplace({ _type: 'event', ...e });
}
console.log('✓ 2 public Open House events seeded');

console.log('\nDone — public pages polished.');
