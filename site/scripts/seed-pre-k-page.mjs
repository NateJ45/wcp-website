// =============================================================================
// seed-pre-k-page.mjs — Mrs. Lisa's 2026-27 Pre-K parent handbook, as sections
// =============================================================================
// Loads the ENTIRE Pre-K parent handbook (the 13-page PDF) onto the merged
// Pre-K hub page (`hubPage-pre-k`) as page-builder sections, so the teacher /
// Board edit every word in the Studio as needs change. The welcome letter is
// NOT here — it's the first-visit teacherNote modal (seed-teacher-notes.mjs).
// Idempotent (fixed _id). Re-running replaces the page with this baseline, so
// only re-run to reset — day-to-day edits happen in the Studio.
// Run: node scripts/seed-pre-k-page.mjs
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
  faqSection,
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

const sections = [
  // ── The daily schedules (handbook pp. 3-4) ────────────────────────────────
  schedule({
    bg: 'white',
    header: sh(
      'The Daily Rhythm',
      'A morning in Pre-K',
      'Here’s how the AM class flows, from the first backpack on the hook to the noon wave goodbye.',
    ),
    entries: [
      {
        time: '9:15–9:30',
        title: 'Arrival & tubbing',
        desc: 'Morning routine, then hands-on play with the morning tubs.',
      },
      {
        time: '9:30–9:50',
        title: 'Literacy circle time',
        desc: 'Stories, songs, letters, and language together on the rug.',
      },
      {
        time: '9:50–10:00',
        title: 'Whole-group fine motor',
        desc: 'Little hands get strong — scissors, tweezers, tracing, and more.',
      },
      {
        time: '10:00–11:00',
        title: 'Centers',
        desc: 'The heart of the morning: child-led learning stations around the room.',
      },
      {
        time: '11:00–11:20',
        title: 'Restroom & snack',
        desc: 'Wash up, pour your own water, and share snack with friends.',
      },
      {
        time: '11:20–11:40',
        title: 'Circle time',
        desc: 'Back to the rug for calendar, counting, and conversation.',
      },
      {
        time: '11:40–12:00',
        title: 'Gross motor',
        desc: 'Big movement — playground or gym, weather deciding.',
      },
      {
        time: '12:00',
        title: 'Dismissal',
        desc: 'Line up, sanitize hands, and off to your grown-up.',
      },
    ],
  }),
  schedule({
    bg: 'grey',
    header: sh(
      undefined,
      'An afternoon in Pre-K',
      'The PM class runs the very same rhythm on an afternoon clock.',
    ),
    entries: [
      {
        time: '12:30–12:45',
        title: 'Arrival & tubbing',
        desc: 'Afternoon routine, then hands-on play with the tubs.',
      },
      {
        time: '12:45–1:05',
        title: 'Literacy circle time',
        desc: 'Stories, songs, letters, and language together on the rug.',
      },
      {
        time: '1:05–1:15',
        title: 'Whole-group fine motor',
        desc: 'Little hands get strong — scissors, tweezers, tracing, and more.',
      },
      {
        time: '1:15–2:15',
        title: 'Centers',
        desc: 'The heart of the afternoon: child-led learning stations around the room.',
      },
      {
        time: '2:15–2:35',
        title: 'Restroom & snack',
        desc: 'Wash up, pour your own water, and share snack with friends.',
      },
      {
        time: '2:35–2:55',
        title: 'Circle time',
        desc: 'Back to the rug for calendar, counting, and conversation.',
      },
      {
        time: '2:55–3:15',
        title: 'Gross motor',
        desc: 'Big movement — playground or gym, weather deciding.',
      },
      {
        time: '3:15',
        title: 'Dismissal',
        desc: 'Line up, sanitize hands, and off to your grown-up.',
      },
    ],
  }),

  // ── Classroom rules + Red/Green Choices (p. 5) ────────────────────────────
  cardGrid({
    bg: 'white',
    header: sh(
      'Our Classroom',
      'Four little rules',
      'We keep it simple and to the point for the children — four “I can” promises that keep our room kind and busy.',
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
      'Red & Green Choices: we guide behavior with a simple system the children learn quickly — green choices are acceptable and expected, red choices are not. We treat these as teachable moments rather than discipline. A handout with more detail lives in your child’s folder pocket. Adult helpers are equals in the classroom — every grown-up is there to help children work through emotions, with the teacher’s problem-solving and calming-down strategies close at hand.',
    ),
  }),

  // ── Drop-off & check-in (p. 6) ────────────────────────────────────────────
  stepList({
    bg: 'grey',
    header: sh(
      'Arrival',
      'Drop-off & check-in',
      'Check-in opens at 9:15 (AM) / 12:30 (PM), and circle time starts fifteen minutes later. First stop: the restroom for a potty try and hand-wash. Then — parents welcome in the classroom! — your child runs the routine. Help them lead it, but the goal is that they own these steps:',
    ),
    steps: [
      { title: 'Hang it up', body: 'Backpacks and jackets on the hooks.' },
      { title: 'Mailbox time', body: 'Take-home folder goes into their mailbox.' },
      { title: 'Sign in', body: 'Write their own name — every day is handwriting practice.' },
      { title: 'Question of the Day', body: 'Cast a vote on the day’s big question.' },
      {
        title: 'Morning tubs',
        body: 'Play with the tub materials until calendar time begins.',
      },
    ],
    footnote:
      'Separation is easiest when it’s quick — feel free to say goodbye at the door, and the teacher and helpers will see the rest of the steps through. Drop-off is also the moment to pass along anything important: an early pick-up, an alternate pick-up person, or even “my child didn’t sleep very well last night.”',
  }),

  // ── Dismissal (p. 7) ──────────────────────────────────────────────────────
  cardGrid({
    bg: 'white',
    header: sh(
      'Pick-up',
      'Dismissal, without the chaos',
      'Children line up at 11:55 (AM) / 3:10 (PM) and clean their hands with sanitizer before being dismissed one at a time to their grown-ups.',
    ),
    columns: 2,
    cards: [
      card(
        'trees',
        'sky',
        'From the playground',
        'Most days we dismiss from the playground. Meet your child by the playground gates — children are never allowed to walk across the parking lot.',
      ),
      card(
        'door-open',
        'sky',
        'From the classroom',
        'If weather or time keeps us inside, we play in the gym and dismiss from the classroom doors (not the gym). Please wait in the hallway until every child has been dismissed to their grown-up.',
      ),
      card(
        'clock',
        'sky',
        'Running late?',
        'Please text the teacher if you’ll be late for the noon (AM) or 3:15 (PM) pick-up.',
      ),
      card(
        'shield-check',
        'sky',
        'Approved pick-ups only',
        'Adults picking up must be on the approved pick-up list kept on file at the school.',
      ),
    ],
  }),

  // ── The helper day (p. 8) ─────────────────────────────────────────────────
  stepList({
    bg: 'grey',
    header: sh(
      'Co-op Life',
      'Your helper-day playbook',
      'One adult helper joins class each day. The only true “musts”: arrive 15 minutes before class, plan to stay about 15 minutes after to help set up and clean up, and keep your own child with you during those times. The rest is friendly guidance for how the day flows:',
    ),
    steps: [
      {
        title: 'Tubs',
        body: 'Get down on the floor and play! Assist and supervise the tub games, and help with clean-up.',
      },
      {
        title: 'Circle time',
        body: 'Finish any prep for centers, then join the class in circle. It’s also a good moment to clean items from the tubs if needed.',
      },
      {
        title: 'Tables & centers',
        body: 'The teacher provides activities children can be invited to do with the adults — no more than 3 children per table! Wander the centers and engage wherever the play is.',
      },
      {
        title: 'Clean up',
        body: 'Clear and clean the tables and help the children tidy up. No cleaning solutions at this stage — the children are still nearby.',
      },
      {
        title: 'Bathroom break',
        body: 'Fill the community water pitchers, sanitize the snack table with the bleach-solution spray, and set out small water cups, napkins, and plates if needed.',
      },
      {
        title: 'Snack',
        body: 'Encourage good table manners, chat with the children, and let them clean up their own spills. Sanitize the tables again once every child has left the area.',
      },
      {
        title: 'Backpacks & recess',
        body: 'Help students pack up while encouraging independence. If the class heads outside, walk with them through the parking lot — then it’s fine to slip back in and start the cleaning jobs.',
      },
      {
        title: 'Daily cleaning',
        body: 'All surfaces are disinfected daily (Clorox wipes and/or the bleach-water solution), and the basket of “yuck” toys — anything mouthed or exposed to body fluids — gets washed and sanitized. The cleaning notebook has the details.',
      },
    ],
    footnote:
      'Please note: class helpers are never alone with children and do not count as “child care staff.”',
  }),

  // ── Snack duty (p. 9) ─────────────────────────────────────────────────────
  cardGrid({
    bg: 'white',
    header: sh(
      'Snack Duty',
      'Feeding the flock',
      'The day’s helper brings snack for the whole class — individual servings, or large unopened packages the helper serves out on small plates, napkins, or paper towels.',
    ),
    columns: 2,
    cards: [
      card(
        'apple',
        'green',
        'The healthy formula',
        'Pair a fruit, veggie, or protein with a carb. Need to prep — like cutting fruit into bite-size pieces? The church kitchen is yours.',
      ),
      card(
        'cup-soda',
        'green',
        'Water, poured by them',
        'We love independence practice: water is the drink, and the children pour their own cups.',
      ),
      card(
        'star',
        'green',
        'Crowd favorites',
        'Bananas, yogurt tubes, baby carrots, unsweetened applesauce, cheese sticks, apple slices, and freeze-dried strawberries — alongside pretzels, popcorn, Goldfish, Pirate’s Booty, and whole-grain crackers. Your child’s favorite healthy snack is welcome too!',
      ),
      card(
        'cake',
        'green',
        'Birthday treats',
        'Schedule your helper day on or near your child’s birthday and bring a small store-bought treat — bite-size portions are just right for snack time. Non-food treats for the class are welcome too: pop them straight into backpacks or hand them out at pick-up.',
      ),
    ],
    callout: callout(
      'warm',
      'We are a NUT-FREE classroom! Please check all packaging to make sure foods are made in nut-free facilities. Thank you!',
    ),
  }),

  // ── Working with young children (p. 10) ───────────────────────────────────
  proseSection({
    bg: 'grey',
    header: sh(
      'Helper Wisdom',
      'The gentle art of working with little ones',
      'A few tried-and-true guidelines for every adult in the room.',
    ),
    body: [
      bullet(
        'Cultivate a calm attitude — a quiet manner helps prevent excitement and over-stimulation.',
      ),
      bullet(
        'When giving directions, make sure the child understands: get to their level, both in your choice of words and by bending down.',
      ),
      bullet(
        'Children are never forced to participate. Some need to observe a while before they’re ready to try something new.',
      ),
      bullet(
        'Offer a choice of action when you can — “Where would you like to put your train, here or there?” builds initiative and independence.',
      ),
      bullet(
        'Let children learn by experience. Help only when it’s needed to avoid discouragement — you could do it faster, but by doing it themselves, they’re learning.',
      ),
      bullet('When children are in social conflict, let them work it through if they can.'),
      bullet('Remember that sharing is still a foreign concept for small children.'),
      bullet('Disapprove of the act, never the child.'),
      bullet('Most importantly: relax and enjoy yourself!'),
    ],
  }),

  // ── Communication (p. 11) ─────────────────────────────────────────────────
  cardGrid({
    bg: 'white',
    header: sh('Communication', 'Staying in the loop', 'Three channels, each with its job.'),
    columns: 3,
    cards: [
      card(
        'folder-open',
        'sky',
        'Take-home folders',
        'Comes to class every day. Monthly newsletters, Scholastic order forms, and class items travel home in it — please check it regularly!',
      ),
      card(
        'smartphone',
        'sky',
        'ClassDojo — new this year!',
        'Our class page for group communication: photos of daily class happenings, reminders about class and school events, and direct messages with the teacher.',
      ),
      card(
        'message-circle',
        'sky',
        'Text or email',
        'For anything urgent, texting or emailing the teacher (or your class rep) directly is still best.',
      ),
    ],
  }),

  // ── Dressing for school + extra clothes (p. 11) ───────────────────────────
  cardGrid({
    bg: 'grey',
    header: sh(
      'What to Wear',
      'Dressed for play',
      'Every day is a play-hard day — send weather-appropriate clothes and shoes to match.',
    ),
    columns: 2,
    cards: [
      card(
        'shirt',
        'amber',
        'Play clothes',
        'Casual, comfortable, and suitable for play — expect plenty of sitting and playing on the floor.',
      ),
      card(
        'footprints',
        'amber',
        'Shoes that stay on',
        'Closed-toe shoes are best. Flip-flops and easy-off shoes aren’t playground-friendly — they’re a tripping hazard.',
      ),
      card(
        'snowflake',
        'amber',
        'Cold-weather gear',
        'A warm coat, hat, and gloves or mittens every cold day — we play outside whenever it’s above 32°.',
      ),
      card(
        'package',
        'amber',
        'A spare outfit',
        'Accidents happen, especially in preschool! Keep a seasonal change of clothes in the backpack — underwear, socks, shirt, and pants or shorts, in a plastic bag for easy swaps.',
      ),
    ],
  }),

  // ── The little things (p. 12) ─────────────────────────────────────────────
  faqSection({
    bg: 'white',
    header: sh('Good to Know', 'The little things', undefined),
    source: 'inline',
    inlineItems: [
      {
        q: 'Can my child bring a toy from home?',
        a: 'Please try to keep personal toys at home — it saves favorite things from getting lost or broken in class. Comfort toys are allowed, but please talk with the teacher about it in advance.',
      },
      {
        q: 'When are parent-teacher conferences?',
        a: 'Conferences are held in April and last about 15 minutes. Watch for information as the time approaches.',
      },
      {
        q: 'What about next year — kindergarten or more preschool?',
        a: 'Registration for the next preschool year happens in December. If you’re wondering whether your child is ready for kindergarten or whether another year of preschool is the right fit, reach out — the teacher will happily provide guidance.',
      },
    ],
  }),

  // ── The class pets (p. 13) — the fun closing note ─────────────────────────
  cta({
    title: 'Meet Pickles, our class pet',
    lead: 'The AM class pet is Pickles, a stuffed dog — and the PM class will name a pup of their own. Starting in October, each child gets a weekend with the class pet: take them everywhere, snap photos or draw pictures of the adventures (Pickles at the ballpark! Pickles at the dinner table!), and bring the backpack and story binder back Monday to share with the class.',
    tone: 'navy',
    note: [
      p(
        'Questions about anything in this handbook? Email ',
        link('lisa@westchesterpreschool.org', 'mailto:lisa@westchesterpreschool.org'),
        ' or call or text ',
        link('503-201-4775', 'tel:+15032014775'),
        '. Mrs. Lisa is always happy to hear from you.',
      ),
    ],
  }),
];

await client.createOrReplace({
  _id: 'hubPage-pre-k',
  _type: 'hubPage',
  hubKey: 'pre-k',
  title: 'Pre-K classroom',
  heading: 'Pre-K Classroom',
  intro:
    'Kindergarten readiness with Mrs. Lisa — everything about the Pre-K year in one place, for both the morning and afternoon classes.',
  sections,
});
console.log(`✓ hubPage-pre-k (${sections.length} sections — the full 2026-27 parent handbook)`);
