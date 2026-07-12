// =============================================================================
// home-parity.mjs — bring the Sanity home up to parity with the old Squarespace
// home (which the audit found was missing several sections).
// =============================================================================
// Rebuilds the home page's `sections` array: keeps the existing sections
// (notice bar, stat band, testimonials, latest news, CTA), REPLACES the thin
// 3-card grid with the full "why WCP" grid, and INSERTS the co-op explainer,
// class cards, daily schedule, and a visit/location block. Patches BOTH the
// published doc and the working draft. Idempotent (fixed section _keys).
// Run: node scripts/home-parity.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  toPT,
  p,
  link,
  sh,
  card,
  cardGrid,
  splitMedia,
  classCards,
  schedule,
  proseSection,
  makeUploader,
} from './pagebuilder-lib.mjs';

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
const up = makeUploader(client);

const coopImg = await up.upload('../assets-from-squarespace/images/012-3L7A0874.jpg');

function newSections() {
  const cards = cardGrid({
    bg: 'white',
    header: sh(
      'Why families choose us',
      'A different kind of preschool',
      'Most preschools ask you to drop off and trust the process. WCP asks you to be part of it.',
    ),
    columns: 3,
    cards: [
      card(
        'blocks',
        'sky',
        'Play-based learning',
        'Children learn best by doing. Our days are hands-on and curious, built on Ohio early learning standards.',
      ),
      card(
        'heart-handshake',
        'orange',
        'A real co-op community',
        'You are not just dropping off. Parents help in the classroom and run the school together.',
      ),
      card(
        'graduation-cap',
        'navy',
        'Experienced teachers',
        'Our lead teachers have taught here for years and genuinely know young children.',
      ),
      card(
        'piggy-bank',
        'green',
        'Genuinely affordable',
        'Co-op tuition is a fraction of typical preschool cost, starting at $70 a month.',
      ),
      card(
        'users',
        'sky',
        'Small class sizes',
        'Classes stay small, so every child gets real attention from a teacher who knows them.',
      ),
      card(
        'sprout',
        'amber',
        'Kindergarten ready',
        'Our Pre-K sends children on to kindergarten confident, curious, and ready to learn.',
      ),
    ],
  });
  cards._key = 'hp-cards';

  const coop = splitMedia({
    bg: 'grey',
    seam: true,
    header: sh(null, 'More than a preschool. A community that grows with you.', null),
    rows: [
      {
        assetId: coopImg,
        alt: 'West Chester Preschool families together outdoors',
        eyebrow: 'The co-op difference',
        title: 'You help run the school',
        body: 'Families are the school. Parents help in the classroom a couple of times a month, hold a co-op job for the year, and make decisions together. It is more work than a drop-off preschool, and it builds a community your child grows up inside.',
        linkLabel: 'How the co-op works',
        linkUrl: '/co-op-life',
      },
    ],
  });
  coop._key = 'hp-coop';

  const classes = classCards({
    bg: 'white',
    header: sh(
      'Our classes',
      'Find the right fit for your child',
      'Small classes for ages two through five, each on its own gentle schedule.',
    ),
    classRefs: ['class-twos', 'class-threes', 'class-pre-k-am', 'class-pre-k-pm'],
  });
  classes._key = 'hp-classes';

  const sched = schedule({
    bg: 'cream',
    seam: true,
    header: sh(
      null,
      'What does a typical day look like?',
      'Predictable rhythm, lots of play. Every class follows the same gentle flow.',
    ),
    entries: [
      {
        time: '9:30',
        title: 'Greeting & free play',
        desc: 'Hang up your coat, choose a station, and ease into the morning.',
      },
      {
        time: '9:45',
        title: 'Circle time',
        desc: 'Songs, the calendar, weather, and the day theme, all together on the rug.',
      },
      {
        time: '10:00',
        title: 'Centers & activities',
        desc: 'Art, sensory bins, building, and small-group work tied to the week focus.',
      },
      {
        time: '10:50',
        title: 'Snack',
        desc: 'A calm shared snack and a chance to practice pouring, sharing, and cleanup.',
      },
      {
        time: '11:40',
        title: 'Outdoor play & dismissal',
        desc: 'Fresh air on the playground, then hugs goodbye at pickup.',
      },
    ],
  });
  sched._key = 'hp-schedule';

  const visit = proseSection({
    bg: 'white',
    header: sh('Come by and see us', 'Plan your visit', null),
    narrow: true,
    body: [
      p(
        'WCP meets inside Crestview Presbyterian Church, but we are a secular, non-discriminatory preschool with no religious affiliation or instruction. We rent the space, and that is the whole connection. Every family is welcome.',
      ),
      p(
        'We run September through May on the Lakota Local Schools calendar. Prefer a summer look? Tours are by appointment June through August.',
      ),
      p(
        'Find us at 9463 Cincinnati Columbus Rd, West Chester, OH 45069. Call or text ',
        link('(513) 202-6187', 'tel:+15132026187'),
        ', or ',
        link(
          'open us in Google Maps',
          'https://www.google.com/maps/search/?api=1&query=9463+Cincinnati+Columbus+Rd+West+Chester+OH+45069',
        ),
        '.',
      ),
    ],
  });
  visit._key = 'hp-visit';

  return { cards, coop, classes, sched, visit };
}

function compose(existing) {
  const byKey = Object.fromEntries(existing.map((s) => [s._key, s]));
  const includeNews = Boolean(byKey.k20);
  const n = newSections();
  const order = [
    'k2', // notice bar
    'hp-cards',
    'hp-coop',
    'hp-classes',
    'k7', // stat band
    'hp-schedule',
    'k12', // testimonials
    includeNews ? 'k20' : null, // latest news (published only)
    'hp-visit',
    'k15', // CTA
  ].filter(Boolean);
  const added = {
    'hp-cards': n.cards,
    'hp-coop': n.coop,
    'hp-classes': n.classes,
    'hp-schedule': n.sched,
    'hp-visit': n.visit,
  };
  return order.map((k) => added[k] || byKey[k]).filter(Boolean);
}

for (const id of ['page-home', 'drafts.page-home']) {
  const doc = await client.getDocument(id).catch(() => null);
  if (!doc) {
    console.log(`${id}: (none, skipped)`);
    continue;
  }
  const sections = compose(doc.sections || []);
  await client.patch(id).set({ sections }).commit();
  console.log(`${id}: ${sections.length} sections -> ${sections.map((s) => s._type).join(', ')}`);
}
console.log('\nDone.');
