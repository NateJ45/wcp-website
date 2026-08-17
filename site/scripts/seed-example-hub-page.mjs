// =============================================================================
// seed-example-hub-page.mjs — a worked example of a Board-created hub page
// =============================================================================
// Creates one `hubPage` with a slug and no hubKey, which is what makes it a
// BOARD-CREATED page served by the gated catch-all (family-hub/[...slug].astro)
// rather than a hand-written route.
//
// It exists for two reasons:
//   1. A TEMPLATE. A volunteer opening it can see exactly how a new page is put
//      together — heading, intro, a few sections — instead of facing a blank
//      form. They can duplicate it, or edit it into something real.
//   2. A TEST FIXTURE. tests/hub-pages.spec.ts loads it to prove the route
//      renders, is gated, and passes axe, so the ability to add a page cannot
//      silently break.
//
// It deliberately has NO `navGroup`, so it does not appear in the rail and
// families never see a stray link. That is also the honest demonstration of the
// "still writing it" state: a page can exist at its address before it is
// announced.
//
// Idempotent. Run:  node scripts/seed-example-hub-page.mjs
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

const ID = 'hubPage-example-committee';
const SLUG = 'example-committee';

const block = (key, text) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}-s`, text, marks: [] }],
});

const doc = {
  _id: ID,
  _type: 'hubPage',
  title: 'Example page (safe to delete)',
  slug: SLUG,
  // No hubKey — that is what routes it through the catch-all.
  // No navGroup — so it stays out of the menu until someone chooses to add it.
  navIcon: 'file-text',
  heading: 'An example page',
  intro:
    'This page was made entirely in the Studio, with no help from a developer. Duplicate it, edit it, or delete it.',
  sections: [
    {
      _type: 'proseSection',
      _key: 'ex-intro',
      background: 'white',
      narrow: true,
      header: { _type: 'sectionHeader', title: 'How this page got here', align: 'left' },
      body: [
        block(
          'ex-b1',
          'Someone opened the Studio, made a new Family Hub page, gave it a web address, and started adding sections. That is the whole process. The page appears at its address straight away, and it only shows up in the menu once you choose a part of the menu for it.',
        ),
        block(
          'ex-b2',
          'Every section type available on the other hub pages is available here too, so a new page is never a lesser page.',
        ),
      ],
    },
    {
      _type: 'cardGridSection',
      _key: 'ex-cards',
      background: 'grey',
      columns: 3,
      header: {
        _type: 'sectionHeader',
        title: 'Sections work exactly as they do elsewhere',
        align: 'left',
      },
      cards: [
        {
          _type: 'iconCard',
          _key: 'ex-c1',
          icon: 'pencil',
          title: 'Write anything',
          body: 'Text, lists, questions and answers, schedules, photo galleries, forms.',
        },
        {
          _type: 'iconCard',
          _key: 'ex-c2',
          icon: 'move',
          title: 'Reorder freely',
          body: 'Drag sections into the order you want. What you see in the Studio is the order families see.',
        },
        {
          _type: 'iconCard',
          _key: 'ex-c3',
          icon: 'eye-off',
          title: 'Announce when ready',
          body: 'Leave the menu section empty while you are drafting. Nobody stumbles across an unfinished page.',
        },
      ],
    },
    {
      _type: 'faqSection',
      _key: 'ex-faq',
      background: 'white',
      source: 'inline',
      header: { _type: 'sectionHeader', title: 'Common questions', align: 'left' },
      inlineItems: [
        {
          _type: 'qa',
          _key: 'ex-q1',
          question: 'Can I delete this page?',
          // `answer` is blockContent (portable text), not a plain string.
          answer: [
            block(
              'ex-a1',
              'Yes. It is only here as an example. Deleting it changes nothing else on the site.',
            ),
          ],
        },
        {
          _type: 'qa',
          _key: 'ex-q2',
          question: 'What web addresses are not allowed?',
          answer: [
            block(
              'ex-a2',
              'Anything already used by a page that came with the site, like calendar or directory. The Studio will tell you if you pick one.',
            ),
          ],
        },
      ],
    },
  ],
};

const existing = await client.getDocument(ID);
await client.createOrReplace(doc);
console.log(
  `${existing ? '✓ refreshed' : '✓ created'} ${ID} → /family-hub/${SLUG} (${doc.sections.length} sections, not in the menu)`,
);
