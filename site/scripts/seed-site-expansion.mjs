// ============================================================================
// seed-site-expansion.mjs — 2026-07-14 public-site change & expand
// ============================================================================
// From the competitive teardown (docs/superpowers/specs/2026-07-14-public-site-
// change-expand-plan.md). Applies the SAFE, additive slice:
//   1. Home hero headline sharpened (published + draft, non-destructive `set`).
//   2. New /safety page (Safety & Wellness) — the trust gap every chain fills.
//   3. New /reviews page (What Families Say) — social-proof home + Google link.
//   4. /why-wcp: a one-line "rated 4.8 on Google" band near the top.
//   5. /enroll: an appended "How enrollment works" 1-2-3 timeline.
//   6. Nav: Safety in the header; Safety + Reviews in the footer.
//
// Everything is IDEMPOTENT: new pages use createOrReplace with stable ids;
// every patch checks for its own stable _key before inserting, so re-running
// changes nothing. Home is the only page with an active draft, so its hero
// title is `set` on BOTH the published and draft docs and no home SECTIONS are
// touched (avoids clobbering in-flight Board edits). Reuses the existing
// pagebuilder-lib helpers — no new section types, no code.
// ============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import * as B from './pagebuilder-lib.mjs';

const SITE = fileURLToPath(new URL('..', import.meta.url));
const token =
  (readFileSync(`${SITE}/.dev.vars`, 'utf8').match(/SANITY_TOKEN="?([^"\n]+)/) || [])[1] ||
  (readFileSync(`${SITE}/.env`, 'utf8').match(/SANITY_TOKEN="?([^"\n]+)/) || [])[1];
if (!token) throw new Error('no SANITY_TOKEN');
const c = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

const GOOGLE_REVIEWS = 'https://maps.app.goo.gl/Em2P6kyt6u8Se4G26';
const GOOGLE_WRITE = `${GOOGLE_REVIEWS}`; // same listing; families tap "Write a review"

// --- trust stat band (reused on Safety) -------------------------------------
const trustBand = () =>
  B.statBand({
    ariaLabel: 'West Chester Preschool at a glance',
    stats: [
      { value: '4.8', label: 'Rated on Google', note: 'from 19 reviews' },
      { value: '12', label: 'Children per class, max' },
      {
        value: '55',
        suffix: '+',
        label: 'Years in West Chester',
        note: 'Ohio-licensed since 1969.',
      },
      { value: '2', label: 'Teachers in every room' },
    ],
  });

// --- the named co-op signature: "Front-Row Learning" -----------------------
// A consistent framing band (2026-07-14, Nathan approved the name): eyebrow
// names the approach, the display-font title is the tagline, the body explains
// it in the brand voice. Placed on the two "approach" pages (why-wcp,
// co-op-life). Same _key on each doc so re-runs are idempotent per page.
const signatureBand = (k) => ({
  ...B.proseSection({
    bg: 'cream',
    narrow: true,
    header: B.sh('Front-Row Learning', 'Where play is the plan.', null, 'center'),
    body: [
      B.p(
        'Play is the curriculum here, not a break from it. And because we are a co-op, you are in the room to watch it happen: children learning by doing, and you with a front-row seat to who they are becoming.',
      ),
    ],
  }),
  _key: k,
});

// ============================================================================
// 1. Home hero headline
// ============================================================================
async function patchHeroHeadline() {
  const NEW_TITLE = 'A front-row seat to who they’ll become.';
  const ACCENT = 'front-row seat';
  for (const id of ['page-home', 'drafts.page-home']) {
    const exists = await c.fetch('defined(*[_id==$id][0])', { id });
    if (!exists) continue;
    await c.patch(id).set({ 'hero.title': NEW_TITLE, 'hero.accentWord': ACCENT }).commit();
    console.log(`  hero headline set on ${id}`);
  }
}

// ============================================================================
// 2. New page: Safety & Wellness  (/safety)
// ============================================================================
async function safetyPage() {
  const doc = {
    _id: B.pageId('safety'),
    _type: 'page',
    title: 'Safety & Wellness',
    slug: 'safety',
    seoTitle: 'Safety & Wellness | West Chester Preschool',
    seoDescription:
      'How West Chester Preschool keeps your child secure, healthy, and known every day: locked entry, small classes, consistent teachers, and clear health practices.',
    hero: B.hero({
      eyebrow: 'Safety & Wellness',
      title: 'Safe, by habit and by design.',
      accentWord: 'by design',
      lead: 'The specifics behind the peace of mind. Here is exactly how we keep your child secure, healthy, and known, every single day.',
      mediaType: 'none',
      height: 'medium',
      actions: [B.act('Schedule a Tour', 'accent', { url: '/virtual-tour#sec-pp-tour-form' })],
    }),
    sections: [
      trustBand(),
      B.cardGrid({
        bg: 'white',
        header: B.sh(
          'The specifics',
          'Secure, on purpose',
          'No vague reassurance. The real things we do.',
        ),
        columns: 3,
        cards: [
          B.card(
            'lock',
            'navy',
            'Secure entry',
            'Doors stay locked through the day, and every family signs in and out by hand.',
          ),
          B.card(
            'users',
            'sky',
            'Small on purpose',
            'Twelve children per class at most, so every child is genuinely known, not managed.',
          ),
          B.card(
            'heart-handshake',
            'green',
            'The same faces daily',
            'Two consistent teachers in every room, the ones your child already knows and trusts.',
          ),
          B.card(
            'check',
            'orange',
            'Health, handled',
            'Daily cleaning, allergy-aware snacks, and clear, simple sick-day guidance for families.',
          ),
          B.card(
            'award',
            'amber',
            'Licensed and inspected',
            'Ohio-licensed since 1969, inspected regularly, with the record to back it up.',
          ),
          B.card(
            'calendar-days',
            'sky',
            'Weather closures',
            'We follow Lakota Local Schools. If they close for weather, we close too.',
          ),
        ],
      }),
      B.faqSection({
        bg: 'grey',
        header: B.sh(null, 'The questions parents actually ask', null),
        source: 'inline',
        inlineItems: [
          {
            q: 'How does drop-off and pick-up work?',
            a: 'Families walk their child in and sign them in by hand each morning, and sign them out at pick-up. Only the adults you list may collect your child, and we check.',
          },
          {
            q: 'What happens when my child is sick?',
            a: 'We share plain-language guidance on when to keep your child home and when they can return. It protects every family, and it means a sick day is never a guessing game.',
          },
          {
            q: 'How do you handle allergies?',
            a: 'Snacks are allergy-aware and we plan around the allergies in each room. Tell us what we need to know at enrollment and we build it into the day.',
          },
          {
            q: 'What about emergencies or weather?',
            a: 'We follow Lakota Local Schools for weather closures, keep emergency contacts current, and practice our procedures. Closures are posted to families right away.',
          },
        ],
      }),
      B.cta({
        title: 'The best way to know is to see it.',
        lead: 'Walk the classrooms, meet the teachers, and see the day for yourself.',
        actions: [
          B.act('Schedule a Tour', 'accent', { url: '/virtual-tour#sec-pp-tour-form' }),
          B.act('Read our Google reviews', 'outline-white', { url: GOOGLE_REVIEWS }),
        ],
      }),
    ],
  };
  await c.createOrReplace(doc);
  console.log('  /safety page created');
}

// ============================================================================
// 3. New page: What Families Say  (/reviews)
// ============================================================================
async function reviewsPage() {
  const doc = {
    _id: B.pageId('reviews'),
    _type: 'page',
    title: 'What Families Say',
    slug: 'reviews',
    seoTitle: 'What Families Say | West Chester Preschool',
    seoDescription:
      'Real reviews from West Chester Preschool families, and our 4.8 Google rating. Hear why families choose our co-op, in their own words.',
    hero: B.hero({
      eyebrow: 'From our families',
      title: 'In their words.',
      accentWord: 'their words',
      lead: 'Real families, real reviews, and a 4.8 rating across 19 of them. This is what it feels like to be part of West Chester Preschool.',
      mediaType: 'none',
      height: 'short',
      actions: [B.act('Read all 19 reviews on Google', 'accent', { url: GOOGLE_REVIEWS })],
    }),
    sections: [
      B.testimonials({
        bg: 'white',
        header: B.sh(
          null,
          'Heard directly from our families',
          'A few of the notes that mean the most to us.',
        ),
        source: 'featured',
        layout: 'grid',
      }),
      B.cta({
        title: 'Loved your experience at WCP?',
        lead: 'A quick Google review helps the next family find us. It means the world.',
        tone: 'navy',
        actions: [B.act('Leave us a Google review', 'accent', { url: GOOGLE_WRITE })],
      }),
    ],
  };
  await c.createOrReplace(doc);
  console.log('  /reviews page created');
}

// ============================================================================
// 4. /why-wcp: a one-line Google-rating band near the top (idempotent)
// ============================================================================
async function patchWhyWcp() {
  const KEY = 'seed-rating-line';
  const page = await c.fetch('*[_id==$id][0]{ _id, "keys": sections[]._key }', {
    id: B.pageId('why-wcp'),
  });
  if (!page) return console.log('  /why-wcp not found, skipped');
  if ((page.keys || []).includes(KEY)) return console.log('  /why-wcp rating line already present');
  const banner = {
    _type: 'proseSection',
    _key: KEY,
    background: 'cream',
    compact: true,
    narrow: true,
    body: [
      B.p(
        B.strong('WCP families rate us 4.8 on Google, across 19 reviews. '),
        B.link('Read them', GOOGLE_REVIEWS),
      ),
    ],
  };
  await c.patch(page._id).insert('after', 'sections[0]', [banner]).commit();
  console.log('  /why-wcp rating line inserted');
}

// ============================================================================
// 5. /enroll: append a "How enrollment works" 1-2-3 timeline (idempotent)
// ============================================================================
async function patchEnroll() {
  const KEY = 'seed-enroll-steps';
  const page = await c.fetch('*[_id==$id][0]{ _id, "keys": sections[]._key }', {
    id: B.pageId('enroll'),
  });
  if (!page) return console.log('  /enroll not found, skipped');
  if ((page.keys || []).includes(KEY)) return console.log('  /enroll steps already present');
  const steps = {
    ...B.stepList({
      bg: 'grey',
      header: B.sh(
        null,
        'How enrolling works',
        'Three steps, no mystery, and real prices you can see up front.',
      ),
      steps: [
        {
          title: 'Come for a tour',
          body: 'Walk the classrooms, meet the teachers, and ask us anything. No pressure, no sales pitch.',
        },
        {
          title: 'Choose your class',
          body: 'Pick the class that fits your child’s age and your family’s week. Tuition is listed openly, from $70 a month.',
        },
        {
          title: 'Register your spot',
          body: 'Send in the enrollment form and registration fee, and you are in. We will be in touch about your child’s first day.',
        },
      ],
    }),
    _key: KEY,
  };
  // append at the end
  await c.patch(page._id).insert('after', 'sections[-1]', [steps]).commit();
  console.log('  /enroll steps appended');
}

// ============================================================================
// 6. Nav: Safety in header + Safety/Reviews in footer (idempotent)
// ============================================================================
async function patchNav() {
  const nav = await c.fetch('*[_id=="navigation"][0]');
  if (!nav) return console.log('  navigation doc not found, skipped');
  const sample = (nav.mainNav || []).find((l) => l.linkType === 'page') || {};
  const mainHasSafety = (nav.mainNav || []).some((l) => l.label === 'Safety');
  const patch = c.patch('navigation');
  let touched = false;

  if (!mainHasSafety) {
    const safetyLink = {
      _key: 'seed-nav-safety',
      _type: sample._type || 'navLink',
      label: 'Safety',
      linkType: 'page',
      page: B.ref(B.pageId('safety')),
    };
    // insert after "About" if present, else append
    const aboutIdx = (nav.mainNav || []).findIndex((l) => l.label === 'About');
    if (aboutIdx >= 0) patch.insert('after', `mainNav[${aboutIdx}]`, [safetyLink]);
    else patch.insert('after', 'mainNav[-1]', [safetyLink]);
    touched = true;
  }

  // Footer: add Safety + Reviews to the "Get Started" column if it exists.
  const cols = nav.footerColumns || [];
  const gsIdx = cols.findIndex((col) => /get started|families|explore/i.test(col.label || ''));
  if (gsIdx >= 0) {
    const col = cols[gsIdx];
    const have = new Set((col.links || []).map((l) => l.label));
    const additions = [];
    if (!have.has('Safety & Wellness'))
      additions.push({
        _key: 'seed-fnav-safety',
        _type: 'navLink',
        label: 'Safety & Wellness',
        linkType: 'page',
        page: B.ref(B.pageId('safety')),
      });
    if (!have.has('What Families Say'))
      additions.push({
        _key: 'seed-fnav-reviews',
        _type: 'navLink',
        label: 'What Families Say',
        linkType: 'page',
        page: B.ref(B.pageId('reviews')),
      });
    if (additions.length) {
      patch.insert('after', `footerColumns[${gsIdx}].links[-1]`, additions);
      touched = true;
    }
  }

  if (touched) {
    await patch.commit();
    console.log('  nav links added');
  } else {
    console.log('  nav already up to date');
  }
}

// ============================================================================
// 7. The "Front-Row Learning" signature on the two approach pages (idempotent)
// ============================================================================
async function patchSignature() {
  for (const [slug, after] of [
    ['why-wcp', 'sections[1]'], // after the rating line
    ['co-op-life', 'sections[0]'], // after the opening "what is a co-op" prose
  ]) {
    const page = await c.fetch('*[_id==$id][0]{ _id, "keys": sections[]._key }', {
      id: B.pageId(slug),
    });
    if (!page) {
      console.log(`  /${slug} not found, skipped`);
      continue;
    }
    if ((page.keys || []).includes('seed-signature')) {
      console.log(`  /${slug} signature already present`);
      continue;
    }
    await c
      .patch(page._id)
      .insert('after', after, [signatureBand('seed-signature')])
      .commit();
    console.log(`  /${slug} signature band inserted`);
  }

  // Home: both the published AND draft docs share the same first five sections
  // (noticeBar, cardGrid, splitMedia[co-op], classCards, statBand), so the
  // signature goes after the co-op splitMedia (sections[2]) consistently in
  // each. Patching both keeps live and Studio in sync no matter which the
  // Board eventually publishes.
  for (const id of ['page-home', 'drafts.page-home']) {
    const page = await c.fetch('*[_id==$id][0]{ _id, "keys": sections[]._key }', { id });
    if (!page) continue;
    if ((page.keys || []).includes('seed-signature')) {
      console.log(`  ${id} signature already present`);
      continue;
    }
    await c
      .patch(id)
      .insert('after', 'sections[2]', [signatureBand('seed-signature')])
      .commit();
    console.log(`  ${id} signature band inserted`);
  }
}

// ============================================================================
(async () => {
  console.log('Seeding public-site expansion...');
  await patchHeroHeadline();
  await safetyPage();
  await reviewsPage();
  await patchWhyWcp();
  await patchEnroll();
  await patchSignature();
  await patchNav();
  console.log('Done.');
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
