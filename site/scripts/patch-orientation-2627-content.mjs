#!/usr/bin/env node
// =============================================================================
// patch-orientation-2627-content.mjs — the hub catches up to the 26-27 deck
// =============================================================================
// The 2026-27 Orientation deck (September 3rd, 2026) carries policy the Family
// Hub had never been told about. Most of the deck was already here: the board
// roster, the seven co-op commitments, the one-cleaning-per-family change, the
// payment schedule, the illness rules, fingerprinting. These were not:
//
//   deck 11-14  hand hygiene, the adult/child bathroom split, diapers in the
//               Twos, and who cleans the classroom (nobody from the church does)
//   deck 15-16  the discipline ladder and the Chronic Aggression Policy, which
//               was on NO hub page in any form
//   deck 17-21  the July 2026 handbook updates: door security, employee conduct,
//               social media and photos, the nursing/pumping space, and the
//               December participation review
//   deck 26/36  snacks are store-bought from this year on (allergies), one
//               serving per child
//   deck 41     when board meetings are and who has to be there
//
// Everything here is Board-editable in the Studio afterwards, like the rest of
// the hub. Sections carry stable `orient2627-*` keys, so a second run is a
// no-op rather than a duplicate.
//
// The Family Handbook is the source of truth, not this script. Where the deck
// summarizes, the copy below says so and points at the Documents page.
//
// WARNING: `seed-hub-knowledge.mjs` RESETS these pages to the seed baseline,
// which does not contain any of this. Run this script again after that one.
//
// Dry run by default. `--commit` to apply.
// =============================================================================
import { apply, client, done } from './patch-lib.mjs';

// -- small builders -----------------------------------------------------------
const header = (eyebrow, title, lead) => ({
  _type: 'sectionHeader',
  align: 'center',
  eyebrow,
  title,
  ...(lead ? { lead } : {}),
});
const card = (key, icon, title, body) => ({ _key: key, _type: 'iconCard', icon, title, body });
const step = (key, title, body, note) => ({ _key: key, title, body, ...(note ? { note } : {}) });
const block = (key, text) => ({
  _key: key,
  _type: 'block',
  style: 'normal',
  markDefs: [],
  children: [{ _key: `${key}s`, _type: 'span', marks: [], text }],
});

/** Insert `section` into the hubPage's sections before `beforeKey`, or at the end. */
async function insertSection(hubKey, section, beforeKey) {
  const page = await client.fetch('*[_type == "hubPage" && hubKey == $k][0]{_id, sections}', {
    k: hubKey,
  });
  if (!page) {
    console.log(`  SKIP ${hubKey}: no hubPage document`);
    return 0;
  }
  if ((page.sections ?? []).some((s) => s._key === section._key)) {
    console.log(`  = ${hubKey} already has "${section._key}"`);
    return 0;
  }
  const anchored = beforeKey && (page.sections ?? []).some((s) => s._key === beforeKey);
  await apply(
    `${hubKey}: add "${section.header?.title ?? section._key}" ` +
      (anchored ? `before ${beforeKey}` : 'at the end'),
    () =>
      anchored
        ? client
            .patch(page._id)
            .insert('before', `sections[_key=="${beforeKey}"]`, [section])
            .commit()
        : client.patch(page._id).append('sections', [section]).commit(),
  );
  return 1;
}

let n = 0;

// -- 1. Getting Started: the July 2026 handbook updates ------------------------
// The deck grouped these under a running "Updated Policies" banner, so they stay
// grouped here rather than being scattered across the hub: new families meet
// them on the runway page, returning families get a diff.
n += await insertSection(
  'getting-started',
  {
    _key: 'orient2627-updates',
    _type: 'cardGridSection',
    background: 'white',
    layout: 'card',
    columns: 2,
    header: header(
      'Updated for 2026-27',
      'What changed in the handbook this year',
      'The Parent Handbook was updated in July 2026. These are the changes worth knowing before your first helper day. The full text is in the handbook itself, on the Documents page.',
    ),
    cards: [
      card(
        'orient2627-u1',
        'lock',
        'Door security',
        'Your door code is for your family only, so please do not share it. Never hold the door open for someone you do not recognize. Anyone looking for the church should be sent around to the church main office on the road side of the building, not through the school hallway.',
      ),
      card(
        'orient2627-u2',
        'phone',
        'Phones and conduct in the classroom',
        'Phones are for taking pictures of class activities, nothing else. Keep your language, tone, and behavior kid-appropriate whenever children are present, and it is always fine to step away for a minute if you feel overwhelmed. A child’s hard day stays in the classroom.',
      ),
      card(
        'orient2627-u3',
        'camera',
        'Social media and photos',
        'Never post a picture of someone else’s child without that family’s explicit permission, and do not name children in the comments of school posts. Comments carrying identifying details get removed. The Publicity team may use ClassDojo photos for the school, always following your child’s photo release, and strips identifying details first: name tags, birthdays, room numbers, real-time locations.',
      ),
      card(
        'orient2627-u4',
        'baby',
        'A space for nursing and pumping',
        'WCP families are welcome to use the Crestview nursery to breastfeed or pump during school hours. Let the Administrator know you plan to use it so the doors are unlocked for you.',
      ),
      card(
        'orient2627-u5',
        'calendar-days',
        'The December participation review',
        'The Board reviews participation each December: helper shifts, co-op jobs, class commitments. A missed shift happens, and the fix is simply to tell someone. Missing them repeatedly without a word is what puts a place at risk. The aim is never to remove a family, it is to catch trouble early enough to help.',
      ),
      card(
        'orient2627-u6',
        'sparkles',
        'One cleaning per family',
        'From this year every family is scheduled for one Saturday-morning deep clean, 9 to 11 am, not just the Housekeeping Committee (committee members stay on their rotation of four). Bleach solution is what sanitizes surfaces and needs two minutes of contact time, it is never used while children are in the room, and washing up happens in the church kitchen sink. Nobody from the church cleans up after class, so the checklist matters.',
      ),
    ],
  },
  'k26',
);

// -- 2. Health & Safety: everyday hygiene (deck 11-13) -------------------------
n += await insertSection(
  'health',
  {
    _key: 'orient2627-hygiene',
    _type: 'cardGridSection',
    background: 'white',
    layout: 'card',
    columns: 2,
    header: header(
      'Hands & Bathrooms',
      'The everyday hygiene rules',
      'Small habits, repeated by every adult in the room, are most of what keeps a preschool healthy.',
    ),
    cards: [
      card(
        'orient2627-h1',
        'hand',
        'When hands get washed',
        'Grown-up helpers and children both: before coming into class, after any contact with bodily fluids (sneezing, coughing, bathroom trips), before snack, and after coming back inside from outdoor play.',
      ),
      card(
        'orient2627-h2',
        'info',
        'Hand sanitizer lives up high',
        'There is sanitizer in every classroom, and it has to stay out of reach of the children. That includes bottles clipped to the outside of a backpack, so please keep those at home.',
      ),
      card(
        'orient2627-h3',
        'door-open',
        'Adults use the adult bathroom',
        'The adult bathroom is next to the copy room. At no point does an adult use the children’s bathrooms. Only teachers and certified Super Helpers may be alone with a child, including walking one to the bathroom, unless the child is your own.',
      ),
      card(
        'orient2627-h4',
        'shield-check',
        'Super Helpers on bathroom trips',
        'Wait in the hallway by the door so you keep visual contact, and let the child problem-solve as much as they can, wiping included. If you do have to step in, keep it brief and then step back out to the hallway.',
      ),
      card(
        'orient2627-h5',
        'baby',
        'Diapers in the Twos',
        'Only parents change their own child. The changing station is inside the adult bathroom by the copy room. Church bins are emptied just once a week, so dirty diapers go out to the church dumpster or home with you. Teachers can hand you a bag.',
      ),
      card(
        'orient2627-h6',
        'check',
        'Before you leave home',
        'Have your child try the bathroom before class, or start the morning in a dry diaper. Threes and Pre-K children need to be daytime potty trained unless a family member stays for the whole session, which is a conversation to have with the teacher and the Administrator.',
      ),
    ],
  },
  'k85',
);

// -- 3. Health & Safety: behavior + the Chronic Aggression Policy (deck 15-16) -
// This one was nowhere on the hub. It is written down so families meet it in
// calm weather rather than on the day the phone rings.
n += await insertSection(
  'health',
  {
    _key: 'orient2627-behavior',
    _type: 'stepListSection',
    background: 'grey',
    header: header(
      'Behavior',
      'When behavior gets big',
      'Nobody expects a preschooler to be perfectly behaved. Most days sort themselves out with natural and logical consequences, positive encouragement, and a teacher and parent working as one team. When something bigger is going on, this is the path, and confidentiality is kept the whole way along it.',
    ),
    footnote:
      'Aggression towards a child, teacher, or parent volunteer follows a shorter path: one warning from the teacher, then a call or text asking you to collect your child within 20 minutes. Three pickups inside two weeks means a one-week suspension, and continued harm to others means disenrollment. Depending on severity, the Board President and the teacher may agree to go straight to suspension. Aggression here means kicking, pushing, hitting, choking, spitting, scratching, or pinching, among others. The full policy is in the Family Handbook.',
    steps: [
      step(
        'orient2627-b1',
        'The teacher and you talk',
        'Your child’s teacher raises it with you early, and the two of you agree on an approach to try in both places. The Board President is told there is an issue, and nothing further is shared.',
      ),
      step(
        'orient2627-b2',
        'A conference is scheduled',
        'If it keeps happening, parents and teacher sit down properly rather than trading notes at pickup.',
      ),
      step(
        'orient2627-b3',
        'Outside eyes, if they would help',
        'The teacher may suggest an observation or evaluation by someone better placed to see what is going on: a school district professional, a speech therapist, your pediatrician.',
        'Any of this is a suggestion, and the referral is yours to make.',
      ),
      step(
        'orient2627-b4',
        'A written action plan',
        'The plan says what everyone is doing, and by when. It exists so progress can be seen rather than argued about.',
      ),
      step(
        'orient2627-b5',
        'Dismissal, as a last resort',
        'This is where the path ends, and it is where we least want to be. Every step before it exists to make this one unnecessary.',
      ),
    ],
  },
  'k85',
);

// -- 4. Both class pages: snacks are store-bought now (deck 26, 36) ------------
// Appended to the existing NUT-FREE callout rather than added as a card: it is
// the same warning, and splitting it would let a family read one half.
for (const [hubKey, sectionKey] of [
  ['twos-threes', 'k29'],
  ['pre-k', 'k51'],
]) {
  const page = await client.fetch('*[_type == "hubPage" && hubKey == $k][0]{_id, sections}', {
    k: hubKey,
  });
  const section = (page?.sections ?? []).find((s) => s._key === sectionKey);
  if (!section?.callout) {
    console.log(`  SKIP ${hubKey}: no snack callout at ${sectionKey}`);
    continue;
  }
  if ((section.callout.body ?? []).some((b) => b._key === 'orient2627-snack')) {
    console.log(`  = ${hubKey} snack callout already updated`);
    continue;
  }
  n++;
  await apply(`${hubKey}: snack callout gains the no-homemade-snacks rule`, () =>
    client
      .patch(page._id)
      .insert('after', `sections[_key=="${sectionKey}"].callout.body[-1]`, [
        block(
          'orient2627-snack',
          'New for 2026-27: no homemade snacks, please. Store-bought and sealed only, so every label can be checked. We are a peanut and tree-nut free school, and one serving per child is plenty.',
        ),
      ])
      .commit(),
  );
}

// -- 5. Calendar: when the Board meets (deck 41) -------------------------------
n += await insertSection('calendar', {
  _key: 'orient2627-board-meetings',
  _type: 'cardGridSection',
  background: 'white',
  layout: 'card',
  columns: 3,
  header: header(
    'Board Meetings',
    'Second Monday of the month',
    'Our school runs on parents knowing what is going on. Board meetings are where most of it is decided, and they are open.',
  ),
  cards: [
    card(
      'orient2627-bm1',
      'calendar-days',
      'When and where',
      'Typically the second Monday of the month, 6 to 8 pm, at the school. The school calendar is the authority when a month moves.',
    ),
    card(
      'orient2627-bm2',
      'users',
      'Who comes',
      'Class reps, board members, teachers, and the Administrator are expected. Everyone else is welcome any time, and never required.',
    ),
    card(
      'orient2627-bm3',
      'file-text',
      'Agendas and minutes',
      'Posted here in the Family Hub after each meeting, so a month you miss is still a month you can read.',
    ),
  ],
});

done(n);
