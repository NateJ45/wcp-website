// =============================================================================
// seed-twos-threes-page.mjs — Ms. Erin's 2026-27 Twos & Threes handbook
// =============================================================================
// Loads Ms. Erin's parent handbook onto BOTH class hub pages (`hubPage-twos`
// HISTORICAL (do NOT re-run): the per-class doc pair this seeds was merged
// into the single `hubPage-twos-threes` doc on 2026-08-24
// (patch-merge-twos-threes.mjs). Re-running would resurrect the old docs,
// which nothing renders any more.
// and `hubPage-threes`) as page-builder sections, matching the Pre-K page's
// look (see seed-pre-k-page.mjs). The Twos and Threes share one teacher, one
// handbook, and one 9:30-12:00 rhythm (Twos meet Thursdays, Threes Mon-Wed), so
// both pages get the SAME handbook sections; only the heading/intro and the
// existing intro timeline differ per page. The welcome letter is NOT here —
// it's the first-visit teacherNote modal (seed-teacher-notes.mjs).
//
// PRESERVES the existing `storyTimelineSection` intro at sections[0] on each
// page (the "How our day flows" timeline the Board already has), then installs
// the full handbook below it. Idempotent (fixed _ids). Re-running resets the
// handbook to this baseline — so only re-run to reset; day-to-day edits happen
// in the Studio.
// Run: node scripts/seed-twos-threes-page.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  sh,
  card,
  cardGrid,
  cta,
  callout,
  schedule,
  stepList,
  proseSection,
  bullet,
  p,
  link,
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

// The handbook, identical for both classes (one teacher, one shared handbook).
const handbook = () => [
  // ── The daily schedule (handbook p. 1) ────────────────────────────────────
  schedule({
    bg: 'white',
    header: sh(
      'The Daily Rhythm',
      'A morning in our classroom',
      'Twos meet on Thursdays and Threes on Monday through Wednesday, and both classes follow the same happy 9:30 to noon rhythm.',
    ),
    entries: [
      {
        time: '9:30',
        title: 'Arrival',
        desc: 'Hang up a backpack and coat, then answer the Question of the Day.',
      },
      {
        time: '9:40',
        title: 'Circle time',
        desc: 'Welcome song, calendar, weather, and an activity tied to the day’s theme.',
      },
      {
        time: '9:50',
        title: 'Learning stations',
        desc: 'Rotations through literacy, art, math, or science with Ms. Erin and a helper, plus free choice at the sensory bin, easel, and dramatic play.',
      },
      {
        time: '10:50',
        title: 'Clean up, restroom & snack',
        desc: 'Tidy up, wash hands, and share snack together.',
      },
      {
        time: '11:25',
        title: 'Circle time two',
        desc: 'Back to the rug, or a chance to finish earlier work.',
      },
      {
        time: '11:35',
        title: 'Pack up & gross motor',
        desc: 'Backpacks on, then big movement at recess.',
      },
      {
        time: '12:00',
        title: 'Dismissal',
        desc: 'Line up, clean hands, and off to a grown-up.',
      },
    ],
  }),

  // ── Classroom rules + Red/Green Choices (p. 2) ────────────────────────────
  cardGrid({
    bg: 'grey',
    header: sh(
      'Our Classroom',
      'Four little rules',
      'We keep it simple for little ones, four “I can” promises that keep our room kind and busy.',
    ),
    columns: 2,
    cards: [
      card('hand-heart', 'orange', 'Gentle hands and feet', 'I can use gentle hands and feet.'),
      card('sparkles', 'orange', 'Clean up my area', 'I can clean up the area when I am finished.'),
      card('heart-handshake', 'orange', 'Kind and helpful', 'I can be kind and helpful.'),
      card('party-popper', 'orange', 'Play hard, have fun!', 'I can play hard and have fun!'),
    ],
    callout: callout(
      'warm',
      'Red & Green Choices: we guide behavior with a simple system the children learn quickly. Green choices are acceptable and expected, red choices are not, and we treat them as teachable moments rather than discipline. Every adult in the room is an equal helper, there to help children work through big emotions, with problem-solving and calming-down strategies always close at hand.',
    ),
  }),

  // ── Drop-off & check-in (p. 3) ────────────────────────────────────────────
  stepList({
    bg: 'white',
    header: sh(
      'Arrival',
      'Drop-off & check-in',
      'Check-in opens at 9:30 and circle time starts at 9:40. For safety and licensing, children cannot be left before 9:30. First stop is the restroom for a potty try and a soap-and-water hand wash (we prefer soap and water over sanitizer). Then, parents welcome in the classroom, help your child lead the routine:',
    ),
    steps: [
      { title: 'Hang it up', body: 'Backpacks and coats go on the hooks.' },
      { title: 'Question of the Day', body: 'Answer the day’s big question together.' },
    ],
    footnote:
      'Separation is easiest when it is quick, so feel free to say goodbye at the door. Drop-off is also the moment to pass along anything the teacher should know that day, an early pick-up, a different pick-up person, or a rough night’s sleep.',
  }),

  // ── Dismissal (p. 3) ──────────────────────────────────────────────────────
  cardGrid({
    bg: 'grey',
    header: sh(
      'Pick-up',
      'Dismissal, without the chaos',
      'Children line up at 12:00, clean their hands with sanitizer or wipes, and are dismissed one at a time to their grown-ups.',
    ),
    columns: 2,
    cards: [
      card(
        'trees',
        'sky',
        'From the playground',
        'Most days we dismiss from the playground. Meet your child by the playground gates. Children are never allowed to walk across the parking lot.',
      ),
      card(
        'door-open',
        'sky',
        'From the classroom',
        'If weather or time keeps us inside, we play in the gym and dismiss from the classroom doors. Recess moves indoors whenever it is below 32°F.',
      ),
      card(
        'clock',
        'sky',
        'Running late?',
        'Please text Ms. Erin at 513-543-4824 if you will be late for the noon pick-up.',
      ),
      card(
        'shield-check',
        'sky',
        'Approved pick-ups only',
        'Adults picking up must be on the approved list kept on file. To update yours, email admin@westchesterpreschool.org.',
      ),
    ],
  }),

  // ── Snack (p. 4) ──────────────────────────────────────────────────────────
  cardGrid({
    bg: 'white',
    header: sh(
      'Snack Duty',
      'Feeding the flock',
      'The day’s helper brings snack for the whole class, either individual servings or large unopened packages served onto small plates, napkins, or paper towels.',
    ),
    columns: 2,
    cards: [
      card(
        'apple',
        'green',
        'Keep it healthy',
        'Great picks: bananas, yogurt pouches or tubes, baby carrots, applesauce pouches, cheese sticks, and apple slices, alongside pretzels, Goldfish, Pirate’s Booty, and whole-grain crackers.',
      ),
      card(
        'cup-soda',
        'green',
        'Water only, from home',
        'Send your child each day with a water bottle labeled with their name, and please send only water.',
      ),
      card(
        'star',
        'green',
        'Two safety musts',
        'Grapes must be cut before serving, and we skip popcorn for this age group.',
      ),
      card(
        'cake',
        'green',
        'Birthday treats',
        'Schedule your helper day on or near your child’s birthday and bring a small store-bought treat. Bite-size portions are just right for snack. Non-food treats for the class are welcome too, popped into backpacks or handed out at pick-up.',
      ),
    ],
    callout: callout(
      'warm',
      'We are a NUT-FREE classroom! Please check all packaging to be sure foods are made in nut-free facilities. Thank you!',
    ),
  }),

  // ── The helper day (pp. 5-6) ──────────────────────────────────────────────
  stepList({
    bg: 'grey',
    header: sh(
      'Co-op Life',
      'Your helper-day playbook',
      'Two adult helpers join class each day. The essentials: arrive by 9:15, plan to stay about 15 minutes after class to help set up and clean up, and keep your own child with you during those times. The rest is friendly guidance for how the day flows:',
    ),
    steps: [
      {
        title: 'Circle time',
        body: 'Finish any prep for centers, then join the class on the rug for circle time.',
      },
      {
        title: 'Tables & centers',
        body: 'Ms. Erin sets out activities to invite children into, no more than 3 children per table. Wander the room and engage with the children at free choice too.',
      },
      {
        title: 'Clean up',
        body: 'Clear and clean the tables and help the children tidy up. Bleach spray is never used around the children.',
      },
      {
        title: 'Bathroom break',
        body: 'Sanitize the snack tables with the bleach-solution spray, pull each child’s water bottle from their backpack, and set out napkins and small plates. One helper takes the class to the hallway for hand-washing and potty while the other sets up snack.',
      },
      {
        title: 'Snack',
        body: 'Encourage good table manners, chat with the children, and let them clean their own spills. Sanitize the tables again once every child has left the area.',
      },
      {
        title: 'Backpacks',
        body: 'Help children pack up, check that mailbox contents are heading home, and help with coats, while encouraging independence.',
      },
      {
        title: 'Recess & cleaning',
        body: 'One helper starts the cleaning checklist (in the white notebook at the back of the class), the other stays with the class at recess. All surfaces are disinfected daily with the bleach-water solution and Clorox wipes, and the basket of “yuck” toys is washed and sanitized daily.',
      },
    ],
    footnote:
      'A quick heads-up: if you cannot make your scheduled day, contact your class rep as early as you can so they can help you swap, since leaving class short on helpers puts a real strain on the day. Class helpers are never alone with children and do not count as child-care staff unless certified as a Super Helper.',
  }),

  // ── Working with young children (p. 7) ────────────────────────────────────
  proseSection({
    bg: 'white',
    header: sh(
      'Helper Wisdom',
      'The gentle art of working with little ones',
      'A few tried-and-true guidelines for every adult in the room.',
    ),
    body: [
      bullet(
        'Cultivate a calm attitude. A quiet manner helps prevent excitement and over-stimulation.',
      ),
      bullet(
        'When giving directions, make sure the child understands. Get to their level, both in your choice of words and by bending down.',
      ),
      bullet(
        'Children are never forced to participate. Some need to observe a while before they are ready to try something new.',
      ),
      bullet(
        'Offer a choice of action when you can. “Where would you like to put your train, here or there?” builds initiative and independence.',
      ),
      bullet(
        'Let children learn by experience. Help only when it is needed to avoid discouragement. You could do it faster, but by doing it themselves, they are learning.',
      ),
      bullet('When children are in social conflict, let them work it through if they can.'),
      bullet('Remember that sharing is still a foreign concept for small children.'),
      bullet('Disapprove of the act, never the child.'),
    ],
  }),

  // ── Communication (p. 8) ──────────────────────────────────────────────────
  cardGrid({
    bg: 'grey',
    header: sh('Communication', 'Staying in the loop', 'A few channels, each with its job.'),
    columns: 2,
    cards: [
      card(
        'smartphone',
        'sky',
        'ClassDojo',
        'Our class page for group messages and reminders about class and school happenings.',
      ),
      card(
        'camera',
        'sky',
        'Private Facebook group',
        'Daily classroom photos are posted here so you can peek into the day.',
      ),
      card(
        'folder-open',
        'sky',
        'Check backpacks',
        'Flyers, handouts, newsletters, and Scholastic order forms all travel home in the backpack, so check it often.',
      ),
      card(
        'calendar-days',
        'sky',
        'Conferences & contact',
        'Parent-teacher conferences are held in April, watch for details as the time nears. For anything else, email or text Ms. Erin anytime at erin@westchesterpreschool.org or 513-543-4824.',
      ),
    ],
  }),

  // ── Dressing for school + toys from home (p. 8) ───────────────────────────
  cardGrid({
    bg: 'white',
    header: sh(
      'What to Wear',
      'Dressed for play',
      'Every day is a play-hard day, so send weather-appropriate clothes and shoes to match.',
    ),
    columns: 2,
    cards: [
      card(
        'shirt',
        'amber',
        'Play clothes',
        'Casual, comfortable, and ready for mess. Expect plenty of floor play and art, so please skip anything that cannot get dirty, even with smocks.',
      ),
      card(
        'footprints',
        'amber',
        'Shoes that stay on',
        'Closed-toe shoes are best. Flip-flops and easy-off shoes are a tripping hazard on the playground.',
      ),
      card(
        'snowflake',
        'amber',
        'Cold-weather gear',
        'A warm coat, hat, and gloves on cold days, we bundle up and head outside whenever we can.',
      ),
      card(
        'package',
        'amber',
        'A spare outfit',
        'Accidents happen! Keep a seasonal change of clothes (underwear, socks, shirt, pants, and shorts) in a labeled ziplock bag in the backpack. We store it in the metal cabinet at the back of the room.',
      ),
    ],
    callout: callout(
      'warm',
      'Toys from home: please keep personal toys at home so favorites do not get lost or broken. Comfort items are welcome, just talk with Ms. Erin about it in advance.',
    ),
  }),

  // ── Enrichment: family outings (p. 9) ─────────────────────────────────────
  schedule({
    bg: 'grey',
    header: sh(
      'Enrichment',
      'Something special every month',
      'As a school we love to offer a family outing or enrichment opportunity at least once a month. Dates are announced once the schedule is set.',
    ),
    entries: [
      { time: 'Sept', title: 'Class picnic', desc: 'At Keehner Park.' },
      { time: 'Oct', title: 'Pumpkin farm', desc: 'A fall favorite for the whole family.' },
      { time: 'Nov', title: 'Music demo', desc: 'A hands-on morning of music.' },
      { time: 'Jan', title: 'Midpoint Library', desc: 'A class visit (Threes only).' },
      { time: 'Feb', title: 'Visit from the dentist', desc: 'With Dr. Webb.' },
      { time: 'Mar', title: 'Local fire station', desc: 'A class visit (Threes only).' },
      { time: 'Apr', title: 'Creeking', desc: 'At Keehner Park.' },
    ],
  }),

  // ── Enrichment: specials (p. 9) ───────────────────────────────────────────
  cardGrid({
    bg: 'white',
    header: sh(
      'Specials',
      'More ways we make it special',
      'A few of the extra touches woven through our year.',
    ),
    columns: 2,
    cards: [
      card(
        'dumbbell',
        'sky',
        'Coach Danny',
        'WCP parent “Coach Danny” leads special gross-motor sessions through the year. Stay tuned!',
      ),
      card(
        'book-open',
        'sky',
        'Mystery Reader',
        'Have a grandparent, neighbor, sibling, or special person who would love to read a favorite story to the class? Let Ms. Erin know and we will find a time.',
      ),
      card(
        'party-popper',
        'sky',
        'Parties for all',
        'A fall costume parade, a holiday party, and a spring egg hunt, all with an open invitation for WCP families.',
      ),
      card(
        'star',
        'sky',
        'Share your gift',
        'Have a special interest, talent, or skill to share with the class? Please reach out, Ms. Erin would love to schedule you.',
      ),
    ],
  }),

  // ── Curriculum at a glance (p. 10) ────────────────────────────────────────
  schedule({
    bg: 'grey',
    header: sh(
      'Curriculum',
      'What we are learning, month by month',
      'Our 2026-27 themes for the 2s and 3s, woven through stories, art, and play.',
    ),
    entries: [
      { time: 'Sept', title: 'Apples, community helpers, fairy tales' },
      { time: 'Oct', title: 'Fall, farm, pumpkins, Halloween, Diwali' },
      { time: 'Nov', title: 'Gratitude, family, leaves, Thanksgiving' },
      { time: 'Dec', title: 'Holidays around the world' },
      { time: 'Jan', title: 'Arctic animals, snow, transportation, space' },
      { time: 'Feb', title: 'Valentine’s Day, dental health, colors, my 5 senses' },
      { time: 'Mar', title: 'St. Patrick’s Day, fire safety' },
      { time: 'Apr', title: 'Easter, food and nutrition, spring, insects, rocks, weather' },
      { time: 'May', title: 'Mother’s Day, shells' },
    ],
  }),

  // ── Closing note ──────────────────────────────────────────────────────────
  cta({
    title: 'Questions about anything here?',
    lead: 'This handbook is your guide to our year, but it is not the last word. If anything is unclear, or you just want to say hello, reach out anytime.',
    tone: 'navy',
    note: [
      p(
        'Email ',
        link('erin@westchesterpreschool.org', 'mailto:erin@westchesterpreschool.org'),
        ' or call or text ',
        link('513-543-4824', 'tel:+15135434824'),
        '. Ms. Erin is always happy to hear from you.',
      ),
    ],
  }),
];

for (const hubKey of ['twos', 'threes']) {
  // Preserve the page's existing intro timeline + heading/intro; rebuild the
  // handbook below it.
  const existing = await client.fetch(
    `*[_type=="hubPage" && hubKey==$k][0]{ _id, title, heading, intro, sections }`,
    { k: hubKey },
  );
  const intro0 =
    existing?.sections?.[0]?._type === 'storyTimelineSection' ? [existing.sections[0]] : [];
  const sections = [...intro0, ...handbook()];
  await client.createOrReplace({
    _id: `hubPage-${hubKey}`,
    _type: 'hubPage',
    hubKey,
    title: existing?.title || `${hubKey} classroom`,
    heading: existing?.heading || `${hubKey[0].toUpperCase()}${hubKey.slice(1)} Classroom`,
    intro: existing?.intro,
    sections,
  });
  console.log(
    `✓ hubPage-${hubKey} (${sections.length} sections: ${intro0.length} preserved intro + ${sections.length - intro0.length} handbook)`,
  );
}
