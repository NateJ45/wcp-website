// =============================================================================
// seed-day-story.mjs — the scroll-driven "day in the life" story timeline
// =============================================================================
// Inserts a storyTimelineSection at the top of /a-day-at-wcp (before the big
// gallery, whose header becomes "More moments"). The six moments follow the
// real session rhythm from the parent handbook; each borrows two photos from
// the page's own gallery as a starting point — the board should swap in the
// best-fitting shots in the Studio (Pages → A Day at WCP → Story timeline).
// Idempotent: the section has a fixed _key and is replaced on re-run.
// Run: node scripts/seed-day-story.mjs
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

const STORY_KEY = 'pp-day-story';

// The shared session rhythm every class follows. No clock times on purpose:
// each class's real schedule (with its own times) sits right below this story
// on the page, and inventing a generic time here would contradict them.
const MOMENTS = [
  {
    title: 'Arrival and hellos',
    body: 'Backpacks go in cubbies, coats on hooks, and a teacher who knows your child by name says good morning at the door.',
  },
  {
    title: 'Free play and centers',
    body: 'Blocks, easel paint, dramatic play, puzzles. Children choose where to start and teachers meet them there.',
  },
  {
    title: 'Circle time',
    body: 'Songs, the calendar, a story, and a look at what the day holds. Everyone has a spot on the rug.',
  },
  {
    title: 'Snack together',
    body: 'The helper parent serves snack family-style. Please and thank you get lots of practice.',
  },
  {
    title: 'Outside time',
    body: 'Our playground gets used in almost any weather. Climbing, digging, running, and fresh air every day we can.',
  },
  {
    title: 'Story and goodbye',
    body: 'A quiet wind-down, a recap of the day, and hugs at pickup. Ask your child about their favorite part.',
  },
];

const doc = await client.getDocument('page-a-day-at-wcp');
const gallery = doc.sections.find((s) => s._key === 'k122');
if (!gallery?.photos?.length)
  throw new Error('gallery section k122 not found on page-a-day-at-wcp');

// Two starter photos per moment, drawn from the front of the gallery. The
// board swaps these for better-fitting shots in the Studio; nothing is
// duplicated in Sanity — the same assets are just referenced twice.
const story = {
  _type: 'storyTimelineSection',
  _key: STORY_KEY,
  header: {
    eyebrow: 'Follow along',
    title: 'How a morning unfolds',
    lead: 'From the first hello to the last hug, here is the shape of a WCP session.',
    align: 'center',
  },
  moments: MOMENTS.map((m, i) => ({
    _type: 'moment',
    _key: `daymo${i}`,
    ...m,
    photos: gallery.photos.slice(i * 2, i * 2 + 2).map((p, j) => ({
      _type: 'figureImage',
      _key: `daymo${i}p${j}`,
      image: p.image,
      alt: p.alt,
    })),
  })),
  footnote:
    'Every class follows this rhythm. Exact times for each class are in the schedules below.',
  background: 'white',
};

// Insert before the first per-class schedule (replacing any earlier run): the
// story is the narrative intro, the schedules are the per-class detail.
doc.sections = doc.sections.filter((s) => s._key !== STORY_KEY);
let at = doc.sections.findIndex((s) => s._type === 'scheduleSection');
if (at === -1) at = doc.sections.findIndex((s) => s._key === 'k122');
doc.sections.splice(at, 0, story);
gallery.header.title = 'More moments';
gallery.header.lead =
  'Dozens more real moments from around the school. This is what a WCP session actually looks like.';
gallery.background = 'grey';

await client.createOrReplace(doc);
console.log(`✓ page-a-day-at-wcp: story timeline (${MOMENTS.length} moments) + gallery retitled`);
