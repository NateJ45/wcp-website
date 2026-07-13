// =============================================================================
// seed-class-stories.mjs — a photo day-rhythm timeline atop each class page
// =============================================================================
// Each class hubPage (twos / threes / pre-k) gets a storyTimelineSection as
// its FIRST section: a scroll-revealed, photo-forward "how our day flows"
// built from that class's own seeded schedule entries (condensed — the full
// timed schedule stays right below it). Photos are borrowed from the public
// A Day at WCP gallery, offset per class so the pages differ; the board swaps
// in real class shots in the Studio. Idempotent: fixed _key per class.
// Run: node scripts/seed-class-stories.mjs
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

// Photo pool: the public gallery on page-a-day-at-wcp (assets referenced, not
// duplicated). Per-class offset keeps the three pages from looking identical.
const aday = await client.getDocument('page-a-day-at-wcp');
const pool = (aday.sections.find((s) => s._key === 'k122')?.photos ?? []).filter((p) => p.image);
if (pool.length < 30) throw new Error('gallery pool unexpectedly small');

const CLASSES = [
  { key: 'twos', label: 'Twos', offset: 20 },
  { key: 'threes', label: 'Threes', offset: 34 },
  { key: 'pre-k', label: 'Pre-K', offset: 48 },
];

const firstSentence = (s) => {
  const text = String(s ?? '').trim();
  if (!text) return undefined;
  const cut = text.match(/^[^.!?]+[.!?]/)?.[0] ?? text;
  return cut.length > 140 ? `${cut.slice(0, 137)}...` : cut;
};

for (const cls of CLASSES) {
  const doc = await client.fetch(`*[_type == "hubPage" && hubKey == $key][0]`, { key: cls.key });
  if (!doc) {
    console.log(`- ${cls.key}: no hubPage doc, skipped`);
    continue;
  }
  const storyKey = `class-story-${cls.key}`;
  const schedule = (doc.sections ?? []).find((s) => s._type === 'scheduleSection');
  const entries = (schedule?.entries ?? []).slice(0, 6);
  if (entries.length < 3) {
    console.log(`- ${cls.key}: no usable schedule entries, skipped`);
    continue;
  }

  const story = {
    _type: 'storyTimelineSection',
    _key: storyKey,
    header: {
      eyebrow: 'Our rhythm',
      title: 'How our day flows',
      lead: `The shape of a ${cls.label} session, moment by moment.`,
      align: 'center',
    },
    moments: entries.map((e, i) => {
      const photo = pool[(cls.offset + i * 2) % pool.length];
      return {
        _type: 'moment',
        _key: `${storyKey}-m${i}`,
        title: e.title,
        body: firstSentence(e.description),
        photos: photo
          ? [
              {
                _type: 'figureImage',
                _key: `${storyKey}-m${i}p0`,
                image: photo.image,
                alt: photo.alt,
              },
            ]
          : [],
      };
    }),
    footnote: 'The full schedule with times is just below.',
    background: 'white',
  };

  doc.sections = (doc.sections ?? []).filter((s) => s._key !== storyKey);
  doc.sections.unshift(story);
  await client.createOrReplace(doc);
  console.log(`✓ ${cls.key}: day-rhythm story (${story.moments.length} moments)`);
}
