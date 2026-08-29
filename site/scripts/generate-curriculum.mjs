// =============================================================================
// generate-curriculum.mjs — branded class Curriculum Guide PDFs
// =============================================================================
// Rebuilds the three class curriculum PDFs served from public/curriculum/ and
// linked (as a "Curriculum guide (PDF)" pill) beside the handbook on the Family
// Hub class pages. The SOURCE OF TRUTH is the CURRICULA data below — edit the
// objectives here, then `node scripts/generate-curriculum.mjs` to regenerate.
//
// The originals were plain Word exports that still carried the school's old
// name ("West Chester Cooperative Nursery School"). This re-typesets the same
// content in the WCP design system: Captain Comic headings, Quicksand body, the
// per-class brand color (Twos amber, Threes green, Pre-K orange), the sun/cloud
// emblem, and the AA-safe ink palette from globals.css.
//
// Self-contained by construction: fonts + emblem are inlined as data URIs, so
// Chromium renders the exact brand type with no network. Mirrors the OG-card
// generator (scripts/generate-og.mjs) — a postbuild-style asset script, not an
// in-app route.
// =============================================================================
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
// `--dist` (the postbuild path) writes into the built site, so a Studio edit
// plus the publish-webhook deploy regenerates the PDFs with no code change.
// A plain run keeps writing to public/ for local work.
const DIST = process.argv.includes('--dist');
const OUT_DIR = resolve(SITE, DIST ? 'dist/client/curriculum' : 'public/curriculum');

// ---- Brand assets, inlined -------------------------------------------------
const dataUri = (path, mime) =>
  `data:${mime};base64,${readFileSync(resolve(SITE, path)).toString('base64')}`;

const FONT = {
  comic: dataUri('public/fonts/captain-comic-regular.woff2', 'font/woff2'),
  comicBold: dataUri('public/fonts/captain-comic-bold.woff2', 'font/woff2'),
  comicItalic: dataUri('public/fonts/captain-comic-italic.woff2', 'font/woff2'),
  quicksand: dataUri(
    'node_modules/@fontsource-variable/quicksand/files/quicksand-latin-wght-normal.woff2',
    'font/woff2',
  ),
};
const EMBLEM = dataUri('src/assets/brand/wcp-emblem-sm.webp', 'image/webp');

// ---- Per-class brand palette (from src/lib/class-colors.ts + globals.css) ---
// `bright` = decorative fill only; `ink` = AA-safe text/accent; `tint` = soft
// card surface. Navy is the shared heading/body dark.
const NAVY = '#01457e';
const THEMES = {
  amber: { bright: '#ffa334', ink: '#9e5c0a', tint: '#fff4e0', ring: '#f7d9a8' },
  green: { bright: '#22c55e', ink: '#0e7b2e', tint: '#e7f6ec', ring: '#bfe6cb' },
  orange: { bright: '#ff8c00', ink: '#a85300', tint: '#fff1e0', ring: '#f8d3ad' },
  // The other two `class.color` values, so a guide for a class the Board adds
  // renders in its own colour instead of failing on a missing theme.
  sky: { bright: '#40aaed', ink: '#166fa8', tint: '#eaf6fd', ring: '#b9dff6' },
  navy: { bright: '#01457e', ink: '#01457e', tint: '#e6eef6', ring: '#b3c9dd' },
};

// ---------------------------------------------------------------------------
// CONTENT — the same objectives as the originals, aligned to the Ohio Early
// Learning Content Standards. `(p. NN)` refs point to that document. Two clear
// scan/typo fixes from the originals: "group signing" -> "group singing", and
// "shred writing" -> "shared writing".
// A section is either { items: [...] } (bullets) or { groups: [{label,items}] }
// (labelled sub-lists). `tags: true` renders items as pills (the conceptual
// areas), not bullets.
// ---------------------------------------------------------------------------
const STANDARDS_NOTE =
  'Aligned with the Ohio Department of Education Early Learning Content Standards. Page references (p. NN) point to that document.';

const TWOS = {
  slug: 'twos',
  file: 'twos-curriculum.pdf',
  color: 'amber',
  kicker: 'Toddler Class · Age 2',
  title: 'Twos Curriculum Guide',
  intro:
    'Toddler-age preschoolers are constantly growing and changing. These objectives guide their social development and help prepare them for a multi-day preschool. We focus on these goals throughout the year, and along the way toddlers are introduced to many conceptual areas.',
  sections: [
    {
      icon: '📖',
      title: 'Reading & Writing',
      items: [
        'Enjoy listening to stories, rhymes, and finger plays',
        'Introduction to letters',
        'Introduction to their printed name',
        'Introduction to the concepts of print',
        'Respond to and hear sounds through rhythmic activities and movement (p. 12)',
        'Begin to understand the meaning of new words from the context of conversation, pictures that accompany the text, or concrete objects (p. 14)',
        'Begin to distinguish print from pictures (p. 16)',
        'Respond to oral reading by commenting or questioning (p. 17)',
        'Participate in shared reading of repetitious or predictable text (p. 19)',
      ],
    },
    {
      icon: '💬',
      title: 'Communication',
      items: [
        'Begin to attend to speakers, stories, poems, and songs (p. 24)',
        'Begin to speak clearly and understandably to express ideas, feelings, and needs (p. 25)',
        'Begin to follow simple oral directions (p. 24)',
      ],
    },
    {
      icon: '🔢',
      title: 'Math',
      items: [
        'Introduction to colors',
        'Introduction to identifying and naming numerals (p. 29)',
        'Introduction to two-dimensional shapes (p. 31)',
      ],
    },
    {
      icon: '🎨',
      title: 'Music & Art',
      items: [
        'Participate in group singing',
        'Participate in art activities',
        'Introduction to colors',
        'Identify the intended purpose of familiar tools (e.g., scissors, hammer, paint brush, cookie cutter) (p. 40)',
        'Demonstrate the safe use of tools such as scissors, hammers, and writing utensils, with adult guidance (p. 40)',
      ],
    },
    {
      icon: '💛',
      title: 'Social & Emotional Development',
      items: [
        'Separate easily from parents',
        'Obtain things they want in socially acceptable ways (e.g., taking turns, asking) (p. 40)',
        'Demonstrate cooperative behaviors such as helping, turn taking, sharing, comforting, and compromising (p. 41)',
        'Interact with and respond to guidance in socially accepted ways from familiar adults at school and home (p. 49)',
        'Interact with familiar and appropriate adults for assistance when needed (p. 49)',
        'Understand the specific roles and responsibilities within a group (e.g., picking up toys) (p. 49)',
        "Demonstrate awareness of the outcomes of one's own choices (p. 50)",
      ],
    },
  ],
  conceptual: {
    heading: 'Conceptual areas introduced during the year',
    groups: [
      {
        icon: '🔬',
        title: 'Science',
        subgroups: [
          { label: 'Earth Science', items: ['Weather', 'Seasons'] },
          { label: 'Life Science', items: ['Animals', 'Plants', 'Life cycles'] },
          { label: 'Physical Science', items: ['Sensory experiences'] },
          { label: 'Health Science', items: ['Healthy habits (e.g., washing hands)'] },
        ],
        note: 'Explore objects, organisms, and events using simple equipment (e.g., magnets and magnifiers).',
      },
      {
        icon: '🌍',
        title: 'Social Studies',
        subgroups: [
          { label: 'History', items: ['Personal family history (e.g., family stories)'] },
          { label: 'Culture', items: ['Traditions', 'Holidays'] },
        ],
      },
    ],
  },
};

const THREES = {
  slug: 'threes',
  file: 'threes-curriculum.pdf',
  color: 'green',
  kicker: 'Three-Year-Old Class · Age 3',
  title: 'Threes Curriculum Guide',
  intro:
    'Young children learn in a variety of situations. In the Threes class students learn during circle time, at tables, and during play. These experiences expose them to many educational opportunities related to literacy and number sense, and introduce numerous conceptual ideas over the school year.',
  sections: [
    {
      icon: '📖',
      title: 'Reading',
      groups: [
        {
          label: 'Phonemic Awareness & Word Recognition',
          items: [
            'Recognize and name some letters',
            'Identify matching sounds and recognize rhymes in familiar stories, poems, songs, and words (cat/hat, dog/frog) (p. 12)',
            'Differentiate between sounds that are the same and different (environmental sounds, animal sounds, phonemes) (p. 12)',
            'Identify their own name in print (p. 13)',
            'Show reading fluency through phrasing, intonation, and expression in shared reading (p. 13)',
          ],
        },
        {
          label: 'Vocabulary',
          items: [
            'Understand the meaning of new words from the context of conversation, pictures, or concrete objects (p. 14)',
            'Communicate position and directional words (e.g., inside, outside, in front, behind) (p. 14)',
            'Name items in common categories (animals, colors, food, clothing, transportation) (p. 14)',
          ],
        },
        {
          label: 'Reading Process',
          items: [
            'Hold books right-side up; know that we read pages front to back, top to bottom, and words left to right (p. 16)',
            'Respond to oral reading by commenting or questioning (p. 17)',
          ],
        },
        {
          label: 'Reading Applications',
          items: [
            'Use pictures and illustrations to aid comprehension — informational text (p. 18)',
            'Participate in shared reading of repetitious or predictable text — literary text (p. 19)',
          ],
        },
      ],
    },
    {
      icon: '✏️',
      title: 'Writing',
      groups: [
        {
          label: 'Writing Applications',
          items: ['Play at writing from top to bottom, in horizontal rows (p. 21)'],
        },
        {
          label: 'Writing Conventions',
          items: [
            'Print letters of their own name and other meaningful words with assistance, using mock letters and/or conventional print (p. 22)',
          ],
        },
      ],
    },
    {
      icon: '💬',
      title: 'Communication',
      items: [
        'Attend to speakers, stories, poems, and songs (p. 24)',
        'Begin to speak clearly and understandably to express ideas, feelings, and needs (p. 25)',
        'Present their own experiences, products, creations, or writing through language (p. 25)',
        'Follow simple oral directions (p. 24)',
        'Participate in the recitation of books, poems, chants, songs, and nursery rhymes (p. 25)',
      ],
    },
    {
      icon: '🔢',
      title: 'Math',
      items: [
        'Count to 10 in the context of daily activities (p. 29)',
        'Touch objects and say the number names when counting during activities and play (p. 29)',
        'Identify and name numerals 0–5 (p. 29)',
        'Identify, name, create, and describe common two-dimensional shapes (circles, triangles, rectangles, squares) (p. 31)',
        'Sort, order, and classify objects by one attribute (e.g., size, color, shape, use) (p. 32)',
      ],
    },
    {
      icon: '💛',
      title: 'Social & Emotional Development',
      items: [
        'Separate easily from parents',
        'Demonstrate self-confidence and willingly try new things',
        'Follow classroom rules and routines (p. 49)',
        'Transition between activities',
        'Demonstrate cooperative behaviors such as turn taking, sharing, comforting, and compromising (p. 41)',
        'Are considerate of others',
        'Respect authority',
      ],
    },
    {
      icon: '✂️',
      title: 'Fine Motor',
      items: ['Use crayons', 'Use scissors', 'Mold clay'],
    },
    {
      icon: '🤸',
      title: 'Gross Motor',
      items: ['Climb', 'Walk a balance beam', 'Catch a ball', 'Jump'],
    },
    {
      icon: '🎨',
      title: 'Music & Art',
      items: [
        'Participate during group singing',
        'Respond to rhythmic activities',
        'Identify colors',
        'Participate in art activities',
        'Identify the intended purpose of familiar tools (e.g., scissors, hammer, paint brush, cookie cutter) (p. 40)',
        'Demonstrate the safe use of tools such as scissors, hammers, and writing utensils, with adult guidance (p. 40)',
      ],
    },
  ],
  conceptual: {
    heading: 'Conceptual areas introduced during the year',
    groups: [
      {
        icon: '🔬',
        title: 'Science & Health',
        subgroups: [
          { label: 'Earth Science', items: ['Weather', 'Seasons'] },
          {
            label: 'Life Science',
            items: ['Animals', 'Plants', 'Life cycles (e.g., butterflies)'],
          },
          { label: 'Physical Science', items: ['Sensory experiences'] },
          {
            label: 'Health Science',
            items: ['Healthy habits (e.g., washing hands)', 'Dental health'],
          },
        ],
        note: 'Explore objects, organisms, and events using simple equipment (e.g., magnets and magnifiers).',
      },
      {
        icon: '🌍',
        title: 'Social Studies',
        subgroups: [
          { label: 'History', items: ['Heritage (e.g., Shining Poster; Me: I Am Special)'] },
          { label: 'Culture', items: ['Traditions', 'Holidays'] },
          {
            label: 'Government',
            items: [
              'Classroom rules',
              'Authority figures at home, school, and in the community (e.g., parents, teachers, police officers)',
              'Community (e.g., post office, community helpers)',
            ],
          },
        ],
      },
    ],
  },
};

const PREK = {
  slug: 'pre-k',
  file: 'pre-k-curriculum.pdf',
  color: 'orange',
  kicker: 'Older Four / Five-Year-Old Class · Kindergarten Readiness',
  title: 'Pre-K Curriculum Guide',
  intro:
    'Kindergarten readiness is the key to our Pre-K program. Students continue to master the core content needed to become emergent in literacy, develop number sense, and build other basic skills. They are also exposed to additional conceptual ideas, expanding their knowledge through group learning and guided experimentation. These indicators describe the knowledge and skills that form the foundation for meaningful early learning.',
  sections: [
    {
      icon: '📖',
      title: 'Reading',
      groups: [
        {
          label: 'Phonemic Awareness & Word Recognition',
          items: [
            'Identify matching sounds and recognize rhymes in familiar stories, poems, finger plays, songs, and words (cat/hat, dog/frog) (p. 12)',
            'Hear sounds in words by isolating syllables using snapping, clapping, or rhythmic movement (p. 12)',
            'Recognize when words share phonemes and repeat the common phoneme (/b/ as in ball, Bob, baby) (p. 13)',
            'Recognize and name upper- and lower-case letters, including those in their first and last name (p. 13)',
            'Recognize that words are made up of letters (p. 13)',
            'Read their own first and last name',
            'Recognize and "read" familiar words or environmental print (p. 13)',
            'Show reading fluency through phrasing, intonation, and expression in shared reading (p. 13)',
          ],
        },
        {
          label: 'Vocabulary',
          items: [
            'Understand the meaning of new words from conversations, pictures, or concrete objects (p. 14)',
            'Recognize likenesses and differences in objects and pictures',
          ],
        },
        {
          label: 'Reading Process',
          items: [
            'Understand that print has meaning — text provides information or tells a story (p. 16)',
            'Hold books upright; read front to back, top to bottom, words left to right (p. 16)',
            'Predict what might happen next during reading (p. 16)',
            'Answer literal questions to show comprehension of age-appropriate texts read aloud (p. 16)',
            'Respond to oral reading by commenting or questioning (p. 17)',
          ],
        },
        {
          label: 'Reading Applications',
          items: [
            'Use pictures and illustrations to aid comprehension — informational text (p. 18)',
            'Identify characters in favorite books and stories (p. 19)',
            'Retell or re-enact events from a story (p. 19)',
            'Participate in shared reading of repetitious or predictable text (p. 19)',
          ],
        },
      ],
    },
    {
      icon: '✏️',
      title: 'Writing',
      groups: [
        {
          label: 'Writing Process',
          items: ['Generate ideas for a story or shared writing with assistance (p. 20)'],
        },
        {
          label: 'Writing Applications',
          items: ['Play at writing from top to bottom, in horizontal rows (p. 21)'],
        },
        {
          label: 'Writing Conventions',
          items: [
            'Print letters of their own name and other meaningful words with assistance, using conventional print (p. 22)',
            'Begin to demonstrate letter formation in "writing" (p. 22)',
            "Scribble familiar words with mock letters and some actual letters (e.g., love, Mom, child's name) (p. 22)",
          ],
        },
      ],
    },
    {
      icon: '💬',
      title: 'Communication',
      items: [
        'Attend to speakers, stories, poems, and songs (p. 24)',
        'Follow simple oral directions (p. 24)',
        'Speak clearly and understandably to express ideas, feelings, and needs (p. 25)',
        'Initiate and sustain a conversation through turn taking (p. 25)',
        "State their parents' names",
        'Recite their home address',
        'Recite their telephone number',
        'Participate in the recitation of books, poems, chants, songs, and nursery rhymes (p. 25)',
      ],
    },
    {
      icon: '🔢',
      title: 'Math',
      items: [
        'Count to 20 in the context of daily activities (p. 29)',
        'Identify and name numerals 0–20 (p. 29)',
        'Identify penny, nickel, dime, and quarter, and recognize that coins have different values (p. 29)',
        'Count on (forward) using objects such as cards, number cubes, or dominoes with familiar dot patterns (p. 29)',
        'Begin to use the language of units of time (day, night, week; yesterday, today, tomorrow) (p. 30)',
        'Recognize that various devices measure time (clock, timer, calendar) (p. 30)',
        'Identify, name, create, and describe common two-dimensional shapes (circles, triangles, rectangles, squares) (p. 31)',
        "Identify, name, and describe three-dimensional objects in the child's own words (sphere/ball, cube/box) (p. 31)",
        'Identify, copy, extend, and create simple patterns or sequences of sounds, shapes, and motions (p. 32)',
        'Understand relative concepts (e.g., size, heavy, light, over, under)',
        'Differentiate between left and right',
      ],
    },
    {
      icon: '💛',
      title: 'Social & Emotional Development',
      items: [
        'Separate easily from parents',
        'Demonstrate self-confidence and willingly try new things',
        'Follow classroom rules and routines (p. 49)',
        'Transition between activities',
        'Demonstrate cooperative behaviors such as turn taking, sharing, comforting, and compromising (p. 41)',
        'Stay on task',
        'Respect authority',
        'Use self-control',
      ],
    },
    {
      icon: '✂️',
      title: 'Fine Motor',
      items: [
        'Trace along a line',
        'Copy or draw from memory two-dimensional figures (e.g., circle, square, cross, "X")',
        'Use scissors to cut a straight line and a curved line',
        'Use a mature pencil grip',
        'Work a puzzle with ten or more pieces',
        'Use glue properly',
        'Draw a person (head, body, arms, legs, eyes, mouth, nose, hands, feet)',
      ],
    },
    {
      icon: '🤸',
      title: 'Gross Motor',
      items: [
        'Stand on one foot for 5 seconds',
        'Hop on the right and left foot (2 hops)',
        'Skip',
        'Walk a balance beam heel to toe',
        'Catch a ball',
        'Coordinate body movements',
        'Climb using alternating feet',
      ],
    },
    {
      icon: '🎨',
      title: 'Music & Art',
      items: [
        'Participate during group singing',
        'Respond to rhythmic activities',
        'Identify colors',
        'Participate in art activities',
        'Use materials correctly',
        'Identify the intended purpose of familiar tools (e.g., scissors, hammer, paint brush, cookie cutter) (p. 40)',
        'Demonstrate the safe use of tools such as scissors, hammers, and writing utensils, with adult guidance (p. 40)',
      ],
    },
  ],
  conceptual: {
    heading: 'Conceptual areas introduced during the year',
    groups: [
      {
        icon: '🔬',
        title: 'Science & Health',
        subgroups: [
          {
            label: 'Earth & Space Science',
            items: [
              'Weather',
              'Seasons',
              'Environmental changes',
              'Night and day',
              'Planets',
              'Motion',
            ],
          },
          {
            label: 'Life Science',
            items: [
              'Needs of living things',
              'Classifying animals',
              'Life cycles (e.g., butterflies, insects)',
              'Plants',
              'Living environments (air, water, soil)',
              'Dinosaurs',
            ],
          },
          {
            label: 'Physical Science',
            items: [
              'Nature of matter (parts and wholes)',
              'Sensory experiences',
              'Vibration',
              'Forces and motion (e.g., pulleys)',
              'Light',
            ],
          },
          {
            label: 'Health Science',
            items: ['Healthy habits (e.g., washing hands)', 'Dental health', 'Our bodies'],
          },
        ],
        note: 'Explore objects, organisms, and events using simple equipment (e.g., magnets and magnifiers).',
      },
      {
        icon: '🌍',
        title: 'Social Studies',
        subgroups: [
          {
            label: 'History',
            items: [
              'Daily life (personal / family history)',
              'Heritage (e.g., All About Me, family stories)',
            ],
          },
          {
            label: 'Government',
            items: [
              'U.S. symbols (e.g., American flag, Pledge of Allegiance)',
              'Classroom rules',
              'Authority figures at home, school, and in the community (e.g., teachers, parents, police officers)',
            ],
          },
          { label: 'Culture', items: ['Traditions', 'Holidays'] },
          { label: 'Geography', items: ['Different locations and environments', 'Maps'] },
        ],
      },
    ],
  },
};

// Exported: the committed content is the FALLBACK and the seed source. The
// Studio (curriculumGuide documents) is the live source of truth; see
// fetchStudioCurricula() below and scripts/seed-curriculum-guides.mjs.
const CURRICULA = [TWOS, THREES, PREK];
// ---- Studio content --------------------------------------------------------
// Board edits live in `curriculumGuide` documents (one per class). Field-for-
// field the same shape as the committed objects above, minus file/color (design
// stays code-owned). A missing document, field, or token falls back committed.
async function fetchStudioCurricula() {
  const token =
    process.env.SANITY_TOKEN ??
    (() => {
      for (const file of ['.dev.vars', '.env']) {
        try {
          const m = readFileSync(resolve(SITE, file), 'utf8').match(/SANITY_TOKEN="?([^"\n]+)"?/);
          if (m) return m[1];
        } catch {
          /* keep looking */
        }
      }
      return null;
    })();
  if (!token) return null;
  const query = encodeURIComponent(
    // (standardsNote was projected here for a schema field that never
    // existed — removed 2026-08-23, see docs/FIELD_AUDIT.md.)
    // The guide's own words, plus the colour of the class it names (a guide can
    // be filed against a whole class PAGE, in which case the first class on
    // that page gives the colour).
    `*[_type == "curriculumGuide" && defined(class)]{
       "slug": class, kicker, title, intro, sections, conceptual,
       "color": coalesce(
         *[_type == "class" && slug.current == ^.class][0].color,
         *[_type == "hubPage" && coalesce(hubKey, slug) == ^.class][0].classes[0]->color
       )
     }`,
  );
  const res = await fetch(
    `https://niemhgev.api.sanity.io/v2025-01-01/data/query/production?query=${query}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  const rows = (await res.json()).result ?? [];
  return rows.length ? rows : null;
}

/**
 * Committed entries overlaid with their Studio documents, PLUS a guide for any
 * Studio document with no committed twin.
 *
 * That second half is what lets a class the Board adds have a curriculum guide:
 * the list used to be exactly the three objects above, so a fourth document
 * rendered nothing and the hub's "Curriculum guide (PDF)" pill would have
 * pointed at a file that was never written. A new guide gets the same layout,
 * its class's colour, and a file named after the value it is filed under —
 * which is the URL the hub links (src/components/hub/HubClassroomBody.astro).
 */
function mergedCurricula(studioRows) {
  if (!studioRows) return CURRICULA;
  const merged = CURRICULA.map((base) => {
    const doc = studioRows.find((r) => r.slug === base.slug);
    if (!doc) return base;
    return {
      ...base,
      kicker: doc.kicker ?? base.kicker,
      title: doc.title ?? base.title,
      intro: doc.intro ?? base.intro,
      sections: doc.sections?.length ? doc.sections : base.sections,
      conceptual: doc.conceptual?.groups?.length ? doc.conceptual : base.conceptual,
    };
  });
  const known = new Set(CURRICULA.map((c) => c.slug));
  for (const doc of studioRows) {
    // A guide with no words yet would render an empty booklet; skip it until
    // someone writes at least one section.
    if (!doc.slug || known.has(doc.slug) || !doc.sections?.length) continue;
    merged.push({
      slug: doc.slug,
      file: `${doc.slug}-curriculum.pdf`,
      color: THEMES[doc.color] ? doc.color : 'sky',
      kicker: doc.kicker ?? '',
      title: doc.title ?? `${doc.slug} Curriculum`,
      intro: doc.intro ?? '',
      sections: doc.sections,
      conceptual: doc.conceptual?.groups?.length ? doc.conceptual : null,
    });
  }
  return merged;
}
export { CURRICULA };

// ---- HTML helpers ----------------------------------------------------------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Wrap the trailing "(p. NN)" standards ref in a muted tag so it reads as
// metadata, not part of the sentence.
const withRef = (s) => esc(s).replace(/\s*(\(p\.\s*\d+\))\s*$/, ' <span class="ref">$1</span>');

const bullets = (items) =>
  `<ul class="list${items.length > 5 ? ' cols' : ''}">${items
    .map((i) => `<li>${withRef(i)}</li>`)
    .join('')}</ul>`;

function renderSection(s) {
  const body = s.groups
    ? s.groups
        .map((g) => `<div class="subgroup"><h3>${esc(g.label)}</h3>${bullets(g.items)}</div>`)
        .join('')
    : bullets(s.items);
  return `
    <section class="card">
      <div class="card-head">
        <span class="chip">${s.icon}</span>
        <h2>${esc(s.title)}</h2>
      </div>
      ${body}
    </section>`;
}

function renderConceptual(c) {
  // A Board-made guide may have no conceptual-areas block at all.
  if (!c?.groups?.length) return '';
  const groups = c.groups
    .map((g) => {
      const subs = g.subgroups
        .map(
          (sg) =>
            `<div class="sub"><span class="sub-label">${esc(sg.label)}</span>` +
            `<span class="tags">${sg.items
              .map((it) => `<span class="tag">${esc(it)}</span>`)
              .join('')}</span></div>`,
        )
        .join('');
      const note = g.note ? `<p class="note">${esc(g.note)}</p>` : '';
      return `
        <section class="card concept">
          <div class="card-head">
            <span class="chip">${g.icon}</span>
            <h2>${esc(g.title)}</h2>
          </div>
          ${subs}
          ${note}
        </section>`;
    })
    .join('');
  return `
    <div class="concept-band">
      <div class="concept-head"><span class="star">🌟</span><h2>${esc(c.heading)}</h2></div>
      <div class="grid">${groups}</div>
    </div>`;
}

export function html(data) {
  const t = THEMES[data.color];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    @font-face{font-family:'Captain Comic';src:url('${FONT.comic}') format('woff2');font-weight:400;font-style:normal;font-display:block}
    @font-face{font-family:'Captain Comic';src:url('${FONT.comicBold}') format('woff2');font-weight:700;font-style:normal;font-display:block}
    @font-face{font-family:'Captain Comic';src:url('${FONT.comicItalic}') format('woff2');font-weight:400;font-style:italic;font-display:block}
    @font-face{font-family:'Quicksand';src:url('${FONT.quicksand}') format('woff2');font-weight:400 700;font-style:normal;font-display:block}
    :root{--navy:${NAVY};--bright:${t.bright};--ink:${t.ink};--tint:${t.tint};--ring:${t.ring}}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Quicksand',system-ui,sans-serif;color:#1a1a1a;font-size:10.2px;line-height:1.42;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    h1,h2,h3,.wordmark{font-family:'Captain Comic',system-ui,sans-serif}
    .page{padding:2px 6px}

    /* ---- Masthead (first page) ---- */
    .masthead{display:flex;align-items:center;gap:14px;padding-bottom:12px;border-bottom:3px solid var(--bright);margin-bottom:14px}
    .emblem{width:62px;height:62px;flex:0 0 auto;border-radius:50%}
    .brand{flex:1;min-width:0}
    .wordmark{color:var(--navy);font-size:19px;font-weight:700;letter-spacing:.2px;line-height:1}
    .brand .sub{color:#5f6573;font-size:9.5px;font-weight:600;margin-top:3px}
    .eyebrow{display:inline-block;background:var(--ink);color:#fff;font-weight:700;font-size:8.5px;letter-spacing:1.3px;text-transform:uppercase;padding:3px 9px;border-radius:20px}

    .titleblock{margin-bottom:12px}
    .titleblock h1{color:var(--navy);font-size:30px;line-height:1.02;margin:8px 0 4px}
    .titleblock .kicker{color:var(--ink);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.6px}
    .intro{color:#2b2f38;font-size:10.6px;line-height:1.5;max-width:62ch;margin-top:7px}
    .standards{display:flex;gap:7px;align-items:flex-start;background:var(--tint);border:1px solid var(--ring);border-radius:10px;padding:8px 11px;margin-top:11px;font-size:9px;color:#3a3f49;line-height:1.4}
    .standards .b{font-size:12px;line-height:1}

    /* ---- Objective cards ----
       Masonry via CSS multi-column (not grid): cards pack vertically down each
       column, so a short card no longer inherits the row height of a tall
       neighbour. break-inside:avoid keeps each card (and each bullet) whole
       across column AND page fragmentation. */
    .grid{column-count:2;column-gap:9px}
    /* Full-width masthead inside the column flow (anchors columns to page 1). */
    .spanhead{column-span:all;break-after:avoid}
    .card{break-inside:avoid;margin:0 0 9px;background:#fff;border:1px solid #e7e3da;border-radius:11px;padding:10px 12px 11px;box-shadow:0 1px 0 rgba(1,69,126,.04)}
    .card-head{display:flex;align-items:center;gap:8px;margin-bottom:7px}
    .chip{width:22px;height:22px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:13px;background:var(--tint);border-radius:7px}
    .card-head h2{color:var(--navy);font-size:13.5px;line-height:1;font-weight:700}
    .card-head::after{content:"";flex:1;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--ring),transparent)}

    .list{list-style:none}
    .list.cols{column-count:2;column-gap:16px}
    .list li{position:relative;padding-left:12px;margin-bottom:3.5px;break-inside:avoid}
    .list li::before{content:"";position:absolute;left:0;top:6px;width:5px;height:5px;border-radius:50%;background:var(--bright)}
    .ref{color:#8a8f99;font-weight:600;font-size:8.4px;white-space:nowrap}

    .subgroup{margin-bottom:7px}
    .subgroup:last-child{margin-bottom:0}
    .subgroup h3{color:var(--ink);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}

    /* ---- Conceptual areas band ---- */
    .concept-band{margin-top:12px;background:var(--tint);border:1px solid var(--ring);border-radius:13px;padding:12px 13px 13px;break-inside:avoid}
    .concept-head{display:flex;align-items:center;gap:8px;margin-bottom:9px}
    .concept-head h2{color:var(--navy);font-size:14px;font-weight:700}
    .star{font-size:15px}
    .card.concept{background:#fff}
    .sub{margin-bottom:6px}
    .sub:last-of-type{margin-bottom:0}
    .sub-label{display:block;color:var(--ink);font-size:9.2px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px}
    .tags{display:flex;flex-wrap:wrap;gap:4px}
    .tag{background:var(--tint);border:1px solid var(--ring);color:#2b2f38;font-size:8.7px;font-weight:600;padding:2px 7px;border-radius:20px;line-height:1.3}
    .note{margin-top:7px;padding-top:7px;border-top:1px dashed var(--ring);color:#3a3f49;font-size:8.9px;font-style:italic}
  </style></head><body><div class="page">
    <div class="grid">
      <!-- The masthead spans all columns as a full-width magazine header.
           Keeping it INSIDE the multi-column container (not as a preceding
           block) anchors the columns to page 1 — a standalone multicol that
           fragments across pages otherwise gets pushed whole to page 2,
           leaving page 1 blank under the header. -->
      <div class="spanhead">
        <header class="masthead">
          <img class="emblem" src="${EMBLEM}" alt="">
          <div class="brand">
            <div class="wordmark">West Chester Preschool</div>
            <div class="sub">A parent cooperative preschool in West Chester, Ohio</div>
          </div>
          <span class="eyebrow">Curriculum Guide</span>
        </header>
        <div class="titleblock">
          <div class="kicker">${esc(data.kicker)}</div>
          <h1>${esc(data.title)}</h1>
          <p class="intro">${esc(data.intro)}</p>
          <div class="standards"><span class="b">📗</span><span>${esc(STANDARDS_NOTE)}</span></div>
        </div>
      </div>
      ${data.sections.map(renderSection).join('')}
    </div>

    ${renderConceptual(data.conceptual)}
  </div></body></html>`;
}

// ---- Render each curriculum to PDF -----------------------------------------
const footer = (title) => `
  <div style="width:100%;font-family:Arial,sans-serif;font-size:7.5px;color:#8a8f99;
    padding:0 0.55in;display:flex;justify-content:space-between;align-items:center;">
    <span>West Chester Preschool &middot; ${title}</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>`;

async function main() {
  const studio = await fetchStudioCurricula();
  const curricula = mergedCurricula(studio);
  console.log(
    studio
      ? `Curriculum content: Studio (${studio.length} document${studio.length === 1 ? '' : 's'})`
      : 'Curriculum content: committed fallback (no Studio read)',
  );
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const data of curricula) {
      const page = await browser.newPage();
      await page.setContent(html(data), { waitUntil: 'networkidle' });
      await page.emulateMedia({ media: 'print' });
      const out = resolve(OUT_DIR, data.file);
      await page.pdf({
        path: out,
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: footer(data.title),
        margin: { top: '0.5in', bottom: '0.62in', left: '0.55in', right: '0.55in' },
      });
      await page.close();
      console.log(`  ✓ ${data.file}`);
    }
  } finally {
    await browser.close();
  }
  console.log(`Curriculum PDFs written to ${OUT_DIR}`);
}

// Only render when run directly (`node scripts/generate-curriculum.mjs`), so the
// template/data can be imported by a screenshot/preview helper without side effects.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    if (DIST) {
      // The postbuild path must never fail the deploy: without a browser the
      // dist keeps the committed public/ PDFs, which the build already copied.
      console.warn(`[curriculum] skipped (${err?.message ?? err}) — shipping the committed PDFs`);
      process.exit(0);
    }
    console.error(err);
    process.exit(1);
  });
}
