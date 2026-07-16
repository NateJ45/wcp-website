// =============================================================================
// seed-hub-knowledge.mjs — the school's full knowledge base, onto the hub
// =============================================================================
// Transcribes the 2026-27 source documents (Family Handbook, May Gathering
// orientation deck, Safety Plan, bylaws digest, proposed budget, Super Helper
// certification) into Studio-editable page-builder sections across the hub:
//   getting-started (NEW) · health · coop-jobs · tuition · fundraising ·
//   calendar · twos · threes
// and uploads the source PDFs as gated `hubDocument` files on the Documents
// page. Idempotent (fixed ids). Re-running RESETS those pages to this
// baseline — day-to-day edits happen in the Studio.
// Run: node scripts/seed-hub-knowledge.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync, createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  sh,
  card,
  cardGrid,
  cta,
  act,
  callout,
  schedule,
  stepList,
  proseSection,
  faqSection,
  p,
  bullet,
  strong,
  h3,
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

// ─────────────────────────────────────────────────────────────────────────────
// GETTING STARTED — enrollment, paperwork, and the lay of the land
// (May Gathering deck + Handbook VI "Admissions & Enrollment" + I "Staying
// Connected")
// ─────────────────────────────────────────────────────────────────────────────
const gettingStarted = {
  title: 'Getting Started',
  heading: 'Getting Started at WCP',
  intro:
    'New to the co-op, or need a refresher? Everything between “we’re in!” and the first day of school lives here — paperwork, background checks, key dates, and how our little school works.',
  sections: [
    stepList({
      bg: 'white',
      header: sh(
        'Welcome!',
        'Your enrollment checklist',
        'From registration to the first day, here’s the whole runway. Most steps take minutes — the background check is the one to start early.',
      ),
      steps: [
        {
          title: 'Register & hold your spot',
          body: 'A one-time, non-refundable $100 registration fee per family holds your child’s place. Current families register each January before open registration; new families join at Open House or any time a seat is open.',
        },
        {
          title: 'Come to the May Gathering',
          body: 'The required evening meeting for every enrolling family (no kids at this one). You’ll meet the Board and teachers, get your paperwork packet, and pay September tuition plus the $100 participation deposit.',
        },
        {
          title: 'Finish paperwork by August 1',
          body: 'Student forms arrive by DocuSign. Your child’s medical form must be completed and signed by their pediatrician with an up-to-date immunization record — summer appointments fill fast, so book early.',
        },
        {
          title: 'Complete your background check (June–July!)',
          body: 'Ohio requires every classroom helper to be fingerprinted and on file before school starts. Checks take 2–3 weeks to come back, so get printed in June or July — see the “Where to get fingerprinted” answer below.',
        },
        {
          title: 'Create your OCCRRA account',
          body: 'All class helpers are technically “WCP employees” under state rules. Your packet’s “Becoming a WCP Employee” guide walks you through the OCCRRA account and the employee medical form (signed by your doctor).',
        },
        {
          title: 'Orientation, picnics, and the first day',
          body: 'Orientation is a half-day workshop right before school starts (babysitting provided) — tour the building, meet your teacher, and learn the ropes. Back-to-school picnics at Keehner Park follow, then the first days of class.',
        },
      ],
      footnote:
        'Paperwork questions go to admin@westchesterpreschool.org — the Administrator is the paperwork wizard and is happy to help.',
    }),

    cardGrid({
      bg: 'grey',
      header: sh(
        'The Co-op Commitment',
        'What every family signs up for',
        'We’re parent-owned and parent-run. Seven commitments keep the whole thing humming — the participation deposit comes back at year-end when they’re met.',
      ),
      columns: 4,
      cards: [
        card(
          'heart-handshake',
          'orange',
          'Helper shifts',
          'Help in the classroom 1–3 times a month, scheduled around your availability by your class rep.',
        ),
        card(
          'clipboard-list',
          'orange',
          'One co-op job',
          'Each family holds one job for the year — from class rep to fundraising to laundry. See Co-op Jobs for the menu.',
        ),
        card(
          'sparkles',
          'orange',
          'One monthly cleaning',
          'Every family joins one Saturday-morning deep clean per year (9–11 am). Housekeeping Committee members attend four as their job.',
        ),
        card(
          'users',
          'orange',
          'Four parent meetings',
          'May Gathering, Orientation, plus Fall and Winter info meetings. Can’t make one? Tell your teacher or the Board so you can catch up.',
        ),
        card(
          'heart-pulse',
          'orange',
          'Health rules',
          'Current signed medical forms, up-to-date immunizations, the sick-day policy, and daytime potty training (Twos/Threes excepted while a parent is in the building).',
        ),
        card(
          'circle-dollar-sign',
          'orange',
          'Pay on time',
          'Tuition is due the 1st of each month; after the 7th a 10% late fee applies. No monthly statements — set a reminder!',
        ),
        card(
          'party-popper',
          'orange',
          'Fundraising & publicity',
          'Join at least one fundraiser a year, and help spread the word — reviews, shares, and yard signs are our advertising budget.',
        ),
        card(
          'rocket',
          'orange',
          'Why it works',
          'These commitments are the heartbeat of the co-op — they keep tuition low and the community close. The details live on the Co-op Jobs page.',
        ),
      ],
    }),

    cardGrid({
      bg: 'white',
      header: sh(
        'Finding Us',
        'The building, the door, the code',
        'We share our home with Crestview Church at 9463 Cincinnati-Columbus Rd — here’s how to find your way in.',
      ),
      columns: 2,
      cards: [
        card(
          'door-open',
          'sky',
          'Door 5',
          'The main entrance is the set of double white doors with white pillars, marked “Door 5,” on the building’s west side. It stays locked at all times — your family gets a door code before school starts (active during school hours only). Please don’t share it or hold the door for anyone you don’t recognize.',
        ),
        card(
          'map-pin',
          'sky',
          'Parking',
          'Park near the concrete sidewalk by the rear doors for class, or in the middle section of the lot at pickup. Parking next to the playground isn’t permitted, for safety.',
        ),
        card(
          'clock',
          'sky',
          'School hours',
          'September–May: Monday–Wednesday 9:15 am–3:15 pm, Thursday 9:15 am–12:00 pm. June–August: tours by appointment only.',
        ),
        card(
          'shield-check',
          'sky',
          'Accessible entrance',
          'Door 5 has a few steps. If those are tricky with a stroller, wheelchair, or other mobility needs, the entrance by the gym is step-free. Just let the Board know and we’ll have it open for you.',
        ),
      ],
    }),

    cardGrid({
      bg: 'grey',
      header: sh(
        'Communication',
        'Staying in the loop',
        'A busy little school, kept organized by a few well-chosen channels.',
      ),
      columns: 2,
      cards: [
        card(
          'smartphone',
          'green',
          'ClassDojo',
          'Our classroom app: photos, reminders, class news, and private messages with your teacher. Download the free app, then join with the link or QR code your teacher sends at the start of the year.',
        ),
        card(
          'mail',
          'green',
          'Email',
          'contact@ for general questions · admin@ for paperwork · president@ for concerns · lisa@ (Pre-K) and erin@ (Twos & Threes) for teachers — all @westchesterpreschool.org. School phone: (513) 202-6187.',
        ),
        card(
          'newspaper',
          'green',
          'This Family Hub',
          'Calendars, announcements, forms, the directory, helper schedules — bookmark it. Keep the family password within your household.',
        ),
        card(
          'camera',
          'green',
          'Social media',
          'Follow WCP on Facebook and Instagram for event highlights, closure announcements, and classroom moments — and share them! Word of mouth is our best advertising.',
        ),
      ],
    }),

    faqSection({
      bg: 'white',
      header: sh('Good to Know', 'First-year questions, answered', undefined),
      source: 'inline',
      inlineItems: [
        {
          q: 'Where do I get fingerprinted, and what does it cost?',
          a: 'Butler County Sheriff’s Office (705 Hanover St, Hamilton — M–F 8–4, cash only, $65) or Warren County Sheriff’s Office (822 Memorial Dr, Lebanon — M–F 8:30–3, $65; or the Deerfield Township post at 4900 Parkway Dr, Mason — M–F 9–3, card only). Bring the completed WebCheck form from your packet. One helper per family is covered; additional adults can be fingerprinted at their own cost (about $70). Everything must be done before September 1 — June or July is ideal.',
        },
        {
          q: 'Why do background checks say “WCCNS”?',
          a: 'Our legal name is still West Chester Cooperative Nursery School — “West Chester Preschool” became our trade name in 2025. If government paperwork or a background check asks for the school, WCCNS is the name to use. Checks can be made out to either.',
        },
        {
          q: 'Can we join mid-year?',
          a: 'Yes — WCP has open enrollment while seats last, with teacher and Board approval. Starting after the end of February generally isn’t recommended, since late transitions are harder on little ones.',
        },
        {
          q: 'What are summer playdates?',
          a: 'Optional, casual meetups at parks around the area over the summer — a lovely way for kids (and parents) to make friends before the first day. The schedule is in your packet and on our social media.',
        },
        {
          q: 'Is WCP licensed?',
          a: 'Yes — by the Ohio Department of Job and Family Services (ODJFS), with an annual state inspection. The license is posted in each classroom, inspection reports are on the hallway bulletin boards, and parents always have unlimited access to the building during operating hours (just check in with the Administrator).',
        },
      ],
    }),

    cta({
      title: 'You’re going to love it here',
      lead: 'Fifty-five years of families have found something special at WCP — a school that feels a lot like family. If anything here is unclear, ask! The Board is a friendly bunch and no question is too small.',
      tone: 'navy',
      actions: [
        act('Meet the co-op', 'accent', { url: '/family-hub/coop-jobs' }),
        act('Forms & documents', 'ghost', { url: '/family-hub/documents' }),
      ],
    }),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH & SAFETY — Handbook III (health rules) + VII (emergencies) + the
// 2025-26 Safety Plan. NOTE: the handbook's fever rule is 48 HOURS.
// ─────────────────────────────────────────────────────────────────────────────
const health = {
  sections: [
    cardGrid({
      bg: 'white',
      header: sh(
        'Illness Policy',
        'When to keep your child home',
        'When in doubt, keep them home — it protects every family at WCP. Do not send your child to school if they have:',
      ),
      columns: 3,
      cards: [
        card(
          'heart-pulse',
          'orange',
          'Been sick overnight',
          'Vomiting, diarrhea, or fever during the night means a home day. Children must be fever-free for 48 hours before returning.',
        ),
        card(
          'info',
          'orange',
          'An elevated temperature',
          'Any fever above normal keeps them home.',
        ),
        card(
          'eye',
          'orange',
          'A contagious-looking rash',
          'Any rash or skin condition that may be contagious needs to be checked out first.',
        ),
        card(
          'bell',
          'orange',
          'Severe nasal discharge',
          'The heavy, constant kind — give it a day.',
        ),
        card(
          'shield-check',
          'orange',
          'A severe cough',
          'Persistent, harsh coughing means rest at home.',
        ),
      ],
      callout: callout(
        'warm',
        'Diagnosed with something communicable (strep, bronchitis, pneumonia, impetigo, pink eye, flu, a vomiting illness…)? Your child stays home for 48 hours from diagnosis and/or the start of antibiotics, and must be symptom-free for 48 hours (or longer if the doctor says so). Notify the teacher AND the Administrator right away — even for mild things like colds or chicken pox — so an exposure notice can be posted. Families are notified of any classroom exposure by the end of the next business day.',
      ),
    }),

    proseSection({
      bg: 'grey',
      header: sh(
        'Same-Day Pickup',
        'Symptoms that mean a call home',
        'A trained staff member observes each child at arrival, and teachers train yearly in recognizing communicable disease. A child showing any of these will be gently separated from the group — comfortable, just outside the classroom door within sight and hearing of the teacher — until a parent arrives:',
      ),
      body: [
        bullet('Fever of 100°F or higher together with another symptom'),
        bullet('Diarrhea (three or more loose stools in 24 hours)'),
        bullet('Severe coughing (red or blue face, whooping sound), or difficult/rapid breathing'),
        bullet('Yellowing of the skin or eyes · dark urine and/or gray or white stool'),
        bullet('Eye redness, discharge, matted eyelashes, burning, or itching'),
        bullet('Untreated infected skin patches, or unusual spots and rashes'),
        bullet('Stiff neck with a fever · sore throat or trouble swallowing'),
        bullet('Vomiting more than once, or vomiting with another symptom'),
        bullet('Evidence of lice, scabies, or another parasitic infestation'),
        p(
          'A cot is available while waiting for pickup, and a physician’s statement may be required before returning. A Communicable Disease Chart is posted in each classroom (usually on the back of the door). Teachers who catch something communicable stay home too — a substitute covers the class.',
        ),
      ],
    }),

    cardGrid({
      bg: 'white',
      header: sh('Forms & Medication', 'The health paperwork', undefined),
      columns: 2,
      cards: [
        card(
          'file-check',
          'sky',
          'Medical forms',
          'Every child needs a current, valid, signed medical form and up-to-date immunization record on file — completed by the pediatrician, updated (or re-initialed) each year.',
        ),
        card(
          'shield-check',
          'sky',
          'Medication at school',
          'WCP administers medication only when a physician says it’s necessary, with written instructions and permission in your child’s paperwork. Prescriptions must be labeled — child’s name and dosage on the container itself. The Admin checks for expirations through the year.',
        ),
        card(
          'heart-pulse',
          'sky',
          'Health conditions & allergies',
          'A condition or allergy that classroom helpers should know about needs the state’s additional medical form, so staff can respond quickly and correctly. Records live in a locked file cabinet.',
        ),
        card(
          'baby',
          'sky',
          'Potty training & accidents',
          'Everyone must be daytime potty-trained (Twos/Threes excepted while a parent stays in the building) — WCP isn’t licensed for diapers or pull-ups; medical exceptions go through the Board. Accidents happen: your child changes into spare clothes, soiled ones come home in a bag, and you’ll hear about it at pickup (in writing from the second accident on).',
        ),
      ],
    }),

    cardGrid({
      bg: 'grey',
      header: sh(
        'Emergency Preparedness',
        'Practiced, posted, and ready',
        'From the WCP Safety Plan — reviewed by staff every year, posted in Room 104, and drilled with the children all year long, in age-appropriate ways.',
      ),
      columns: 3,
      cards: [
        card(
          'bell',
          'sky',
          'Fire',
          'Drills monthly. In a real fire, classes follow the posted evacuation plan across the lot toward the Memorial Garden, take attendance, and call families — school resumes once the fire department clears the building.',
        ),
        card(
          'snowflake',
          'sky',
          'Severe weather',
          'Every classroom has a weather-alert radio. Tornado warning? Classes move to the basement shelter (map posted by each door) until the all-clear. Weather drills run in September and March–May.',
        ),
        card(
          'shield-check',
          'sky',
          'Lockdown',
          'Quarterly, age-appropriate drills (the “quiet game” by an interior wall). In a real threat: lights out, door locked and jammed, shade down, 911 — no one moves until law enforcement says so. Weapons are never permitted on school grounds.',
        ),
        card(
          'map-pin',
          'sky',
          'Evacuation & reunification',
          'If the building must be evacuated, classes walk to Biggby Coffee (9433A Cincinnati-Columbus Rd) and families are called to reunite there. Teachers carry a to-go bag with attendance, emergency contacts, and health forms everywhere the class goes.',
        ),
        card(
          'heart-pulse',
          'sky',
          'Medical & dental emergencies',
          'The teacher stays with the child while a helper calls 911; records travel with the child, and every family signs an emergency-transportation authorization. For a dental emergency, there’s a first-aid chart in every room (and yes, the tooth goes in gauze).',
        ),
        card(
          'phone',
          'sky',
          'Numbers by the phone',
          'Emergency 911 · Police (513) 777-2231 · Fire (513) 777-1133 · Poison Control (800) 222-1222 · Cincinnati Children’s Liberty (513) 803-9600 · West Chester Hospital (513) 298-3000 · Crestview office (513) 777-6555.',
        ),
      ],
    }),

    cardGrid({
      bg: 'white',
      header: sh(
        'Closures',
        'If school closes suddenly',
        'WCP follows Lakota Local Schools: any Lakota delay or cancellation means WCP is closed for the day.',
      ),
      columns: 2,
      cards: [
        card(
          'snowflake',
          'orange',
          'How you’ll hear',
          'An all-school email plus a confirmation from your class rep or teacher. Lakota’s announcements also run on WLW 700 AM, WMOH 1450 AM, and WMUB 88.5 FM.',
        ),
        card(
          'info',
          'orange',
          'Other closures',
          'The President may also cancel independently — for example if classroom temperatures fall below 65°F, or if the building loses power, heat, or water. Whenever school is canceled, Enrichment is too.',
        ),
        card(
          'clock',
          'orange',
          'Early dismissal',
          'If an unscheduled early release is ever needed, you’ll be notified right away — teachers stay with every child until pickup, so please come promptly.',
        ),
        card(
          'circle-dollar-sign',
          'orange',
          'Make-ups & tuition',
          'Lakota’s snow make-up days don’t apply to WCP, and tuition isn’t refunded for weather days.',
        ),
      ],
    }),

    cta({
      title: 'The full policies, in writing',
      lead: 'The complete Family Handbook and the WCP Safety Plan live on the Documents page — every policy on this page comes straight from them, and Ohio licensing requirements always apply.',
      tone: 'navy',
      actions: [act('Open Documents', 'accent', { url: '/family-hub/documents' })],
    }),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CO-OP JOBS — Handbook III (the commitment, helpers, super helpers) + VIII +
// bylaws digest + May Gathering deck (cleaning, meetings)
// ─────────────────────────────────────────────────────────────────────────────
const coopJobs = {
  sections: [
    stepList({
      bg: 'white',
      header: sh(
        'Helper Days',
        'A helper day, hour by hour',
        'Helping in class 1–3 times a month is the heart of the co-op — a front-row seat to your child’s day. Arrive 15 minutes early, plan to stay about 15 after, and here’s how the day flows:',
      ),
      steps: [
        {
          title: 'Set up & welcome',
          body: 'Help prepare the classroom, playground, or gym. As children arrive, get down and play — encouraging sharing and turn-taking frees the teacher to greet families.',
        },
        {
          title: 'Clean-up & gathering',
          body: 'When the teacher calls clean-up, guide children to put toys away themselves (that’s the skill!). Then sit with the class on the rug — a wiggly child often settles when a friendly adult sits close.',
        },
        {
          title: 'Table activities',
          body: 'Lead the teacher-planned activity with small groups — no more than three children per table.',
        },
        {
          title: 'Bathroom break',
          body: 'One helper stays back to clean tables and set out snack; the other walks with the teacher and class and waits in the hallway.',
        },
        {
          title: 'Snack time',
          body: 'Sit, chat, and enjoy — you’ll hear some truly wonderful stories.',
        },
        {
          title: 'Transitions & recess',
          body: 'Help with backpacks and coats, then join the fun on the playground or in the gym.',
        },
        {
          title: 'End-of-day cleaning',
          body: 'Follow the daily cleaning log — vacuum, wipe surfaces, empty trash (Swiffer on Thursdays) — so the room is ready for tomorrow.',
        },
      ],
      footnote:
        'Helpers are never alone with children and don’t count as childcare staff (that’s what Super Helpers are for, below). Snack rule of thumb: store-bought, healthy, and nut-free — save the cupcakes for birthdays.',
    }),

    cardGrid({
      bg: 'grey',
      header: sh(
        'Helper Ethics',
        'The ground rules',
        'Four professional habits that keep our classrooms safe, kind, and drama-free.',
      ),
      columns: 2,
      cards: [
        card(
          'shield-check',
          'amber',
          'Keep it confidential',
          'Anything you learn about a child while helping stays in the classroom. Full stop.',
        ),
        card(
          'message-circle',
          'amber',
          'Route concerns properly',
          'Questions about a teacher, a child, or anything professional go to the teacher or the Board President — not the parking lot.',
        ),
        card(
          'heart-handshake',
          'amber',
          'Speak positively',
          'Support the teacher and the children with encouraging language. Unsure about something? Ask privately.',
        ),
        card(
          'sparkles',
          'amber',
          'Be a warm presence',
          'Your tone and reactions shape how children see themselves. A supportive adult changes a child’s whole day.',
        ),
      ],
      callout: callout(
        'sky',
        'Bathroom rules: helpers use the single-stall “Post Office” bathroom near the copier room — never the children’s bathrooms. Only teachers and Super Helpers may walk children to the restroom (your own child excepted): stay in the hallway, keep a clear line of sight, and keep any help brief.',
      ),
    }),

    proseSection({
      bg: 'white',
      header: sh('Scheduling', 'Your schedule, and how to change it', undefined),
      body: [
        bullet(
          'Your class rep builds the helper schedule monthly and emails it out — submit your availability by their deadline, or you’ll be scheduled anyway and own finding coverage.',
        ),
        bullet(
          'Can’t make your day? Trade with another co-op parent — early asks are easiest, and a “just in case” backup buddy is smart if your child seems off.',
        ),
        bullet(
          'Every switch (giving or taking a day) gets reported to your class rep, who keeps participation fair and balanced across families.',
        ),
        bullet(
          'New baby? Helpers get six weeks off classroom duty, WCP pays fingerprinting for a designated substitute adult, and your rep can front-load days before a mid-year due date.',
        ),
      ],
    }),

    cardGrid({
      bg: 'grey',
      header: sh(
        'Super Helpers',
        'Level up: become a Super Helper',
        'Super Helpers can supervise children without the teacher present — walking a child to the restroom, or minding the class for a moment. It gives teachers real flexibility, and WCP reimburses your CPR training.',
      ),
      columns: 3,
      cards: [
        card(
          'book-open',
          'green',
          '1 · Online training',
          'About 6 hours through your OCCRRA account: the “Child Care Center Orientation Training” plus the one-hour ODJFS Child Abuse Overview — both free.',
        ),
        card(
          'heart-pulse',
          'green',
          '2 · CPR & First Aid',
          'In-person Adult AND Pediatric CPR/First Aid, state-certified (Red Cross classes work well — online-plus-classroom combos are fine). WCP reimburses the cost.',
        ),
        card(
          'file-check',
          'green',
          '3 · Send it in',
          'Forward your completion certificates and proof of high-school completion to admin@westchesterpreschool.org, and log the CPR training in OCCRRA.',
        ),
      ],
      callout: callout(
        'warm',
        'Bonus: certified Super Helpers can also substitute teach (currently $12.50/hour) — a real help in keeping the co-op running when a teacher is out.',
      ),
    }),

    proseSection({
      bg: 'white',
      header: sh('Everything Else', 'Jobs, cleanings, meetings, and safety', undefined),
      body: [
        h3('Your co-op job'),
        bullet(
          'Read your job description as soon as you get it — even if the work starts later in the year — and ask chairs, Board members, or teachers anything.',
        ),
        bullet(
          'If life gets in the way, arrange coverage and tell a Board member. An uncompleted job doesn’t disappear — it lands on someone else, so speak up early and we’ll make a plan together.',
        ),
        h3('Monthly cleanings'),
        bullet(
          'One Saturday a month, 9–11 am, families deep-clean the classrooms: vacuuming and mopping, wiping every surface, deep-cleaning toys, sensory bins, doors and walls. Every family attends one per year (Housekeeping Committee members do four as their job). No children at cleanings.',
        ),
        h3('Meetings'),
        bullet(
          'Four required parent meetings a year: May Gathering, August/September Orientation, a Fall info meeting, and a Winter info meeting (babysitting usually available). Miss one? Tell your teacher or the Board and they’ll catch you up.',
        ),
        bullet(
          'Board meetings run monthly and every family is welcome — it’s where budgets, fundraisers, and school decisions actually happen.',
        ),
        h3('Classroom & playground safety'),
        bullet(
          'Blocks are never for throwing (balls and bean bags only) · spray aerosols never run while children are present · hand sanitizer needs signed permission for kids and stays out of reach · purses live out of reach too.',
        ),
        bullet(
          'Outside daily unless it’s below 32°F, above 90°F, raining, or otherwise unsafe — children come dressed for weather (label those mittens; skip open-toed shoes and Crocs in summer). Kids stay in the mulched play area, walk indoors, check for cars at the curb, and get an adult stationed by climbing equipment and the slide. At the whistle, everyone lines up and is dismissed one at a time to an approved adult.',
        ),
      ],
    }),

    proseSection({
      bg: 'grey',
      header: sh(
        'Governance',
        'How WCP is governed',
        'The co-op runs on real bylaws — here’s the plain-English digest.',
      ),
      body: [
        h3('Who we are'),
        p(
          'Legally the West Chester Cooperative Nursery School (founded 1969); “West Chester Preschool” became our trade name in 2025. Our purpose: a safe, engaging environment for each child’s growth — and for parents to enjoy early childhood right alongside them.',
        ),
        h3('Membership'),
        p(
          'Enrolling a child makes you a member, with duties (the Co-op Commitment) and a voice. Total enrollment is 43 children across the four classes.',
        ),
        h3('The Board'),
        p(
          'President, Vice President, Treasurer, and Secretary, elected at the end of each school year (the President may be elected in January for a smoother handoff), plus class reps as appointed voting members. The Board meets monthly and every member may attend.',
        ),
        h3('Money'),
        p(
          'The Treasurer is bonded, the books are audited each year-end, the school carries liability insurance, and the annual budget is presented to members for a vote at the May Gathering.',
        ),
        h3('Changes'),
        p(
          'Bylaws are amended by member vote at meetings; Standing Rules can be adopted by Board majority and are recorded by the Secretary. Suspected child abuse or neglect is always reported per Ohio law (ORC 2151.421).',
        ),
        p(
          'The full bylaws and standing rules live on the Documents page — the legal source of truth behind this summary.',
        ),
      ],
    }),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// TUITION — Handbook II (financial policies) + May Gathering treasurer info
// ─────────────────────────────────────────────────────────────────────────────
const tuition = {
  sections: [
    stepList({
      bg: 'white',
      header: sh(
        'The Payment Year',
        'When money is due, all year long',
        'Per the bylaws — the rhythm is simple once you see it laid out.',
      ),
      steps: [
        {
          title: 'At the May Gathering',
          body: 'September tuition and the $100 participation deposit are due before the school year starts (new families pay the deposit; it carries over for returning ones).',
        },
        {
          title: 'Before August 1',
          body: 'May tuition and the annual student fees are due, along with all required paperwork.',
        },
        {
          title: 'October through April',
          body: 'Monthly tuition is due on the 1st. Payments received after the 7th get a 10% late fee — and no monthly statements go out, so set that reminder.',
        },
        {
          title: 'At year end',
          body: 'The participation deposit comes back once your family’s co-op commitments are met (or rolls into next year) — with input from teachers, Board, chairs, and reps.',
        },
      ],
    }),
    cardGrid({
      bg: 'grey',
      header: sh('The Fine Print', 'Payment logistics & policies', undefined),
      columns: 2,
      cards: [
        card(
          'circle-dollar-sign',
          'green',
          'How to pay',
          'Check payable to WCP (child’s name in the memo) into the Treasurer’s mailbox or hand-delivered · cash · or PayPal right here on the hub (~2% processing fee — ask the Treasurer about automatic monthly invoices). Bank bill-pay? Time it to arrive by the 1st.',
        ),
        card(
          'piggy-bank',
          'green',
          'What the fees fund',
          'Student fees cover enrichment, family outings, and class supplies. The $100 registration fee (one per family, non-refundable) holds your spot. Fundraising fills the gap that keeps tuition low.',
        ),
        card(
          'info',
          'green',
          'Withdrawing mid-year',
          'Give the Board 30 days’ notice for a tuition refund — without it, the current month’s tuition and the participation deposit are non-refundable.',
        ),
        card(
          'heart-handshake',
          'green',
          'Money tight this month?',
          'Talk to the Treasurer — payment plans exist for exactly this. A conversation beats a late fee every time.',
        ),
      ],
    }),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNDRAISING — Handbook II + the 2026-27 proposed budget
// ─────────────────────────────────────────────────────────────────────────────
const fundraisingSections = [
  proseSection({
    bg: 'white',
    header: sh(
      'The Budget',
      'Where the money goes',
      'The member-approved 2026-27 operating budget, in plain English.',
    ),
    body: [
      h3('Revenue'),
      p(
        'Tuition $54,810 · registration $3,800 · student fees $1,855 · participation deposits $1,000 · fundraising $5,700 (mums, spring flowers, DoubleGood popcorn, Mike’s Car Wash, shirt sales, Kroger rewards).',
      ),
      h3('Expenses'),
      p(
        'Teacher and staff wages $39,500 · rent $10,125 · insurance $4,000 · legal & professional $4,000 · class supplies $2,200 · publicity $1,566 · family outings $1,092 · playground upkeep, events, teacher education, and Board stipends round it out.',
      ),
      h3('The bottom line'),
      p(
        'A $101 planning shortfall at 39 students — with room for 43, every summer enrollment pushes us into surplus. Fundraising targets are conservative, several line items are down thanks to operational changes (Google Voice, DocuSign), and wages reflect the bigger projected enrollment.',
      ),
      p(
        'Every family joins at least one fundraiser a year (more is always welcome!) — plus the easy extras: link your Kroger card to Community Rewards and wear the school merch. Extra fundraising money goes to improving the school, maintaining equipment, and teacher raises — allocated by the Board at the monthly meetings everyone is invited to. The full line-item budget lives on the Documents page.',
      ),
    ],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// CALENDAR — Handbook V (special events, field trips, enrichment)
// ─────────────────────────────────────────────────────────────────────────────
const calendar = {
  sections: [
    cardGrid({
      bg: 'white',
      header: sh(
        'A Year at WCP',
        'The traditions to look forward to',
        'Events vary a little year to year, but the rhythm is beloved. (Personal or religious conflict with an activity? Just talk to your teacher or the Board.)',
      ),
      columns: 4,
      cards: [
        card('sun', 'amber', 'September', 'Start-of-school picnics at the park.'),
        card('party-popper', 'amber', 'October', 'Halloween parties.'),
        card(
          'gift',
          'amber',
          'November & December',
          'Thanksgiving sharing, then the holiday party.',
        ),
        card('heart-handshake', 'amber', 'February', 'Valentine’s parties.'),
        card('egg', 'amber', 'April', 'Easter egg hunts.'),
        card('cake', 'amber', 'May', 'Mother’s Day parties and class graduations.'),
        card(
          'sparkles',
          'amber',
          'All year: Enrichment',
          'An optional extracurricular program led by a WCP teacher or qualified instructor — first-come enrollment, a small fee, no refunds for missed days.',
        ),
        card(
          'trees',
          'amber',
          'All year: Family outings',
          'Field trips and Family Fun Days — separate from your helper days, and the best kind of chaos.',
        ),
      ],
    }),
    proseSection({
      bg: 'grey',
      header: sh('Field Trips', 'How field trips work', undefined),
      body: [
        bullet(
          'A signed permission slip is required for every trip — child’s name, date, timeframe, destination (including whether there’s water), signature, and date signed. No slip, no trip.',
        ),
        bullet(
          'Families drive: transportation is by parents or parent-arranged carpools (WCP doesn’t arrange it). Tell the teacher whether your child is coming and how they’re getting there.',
        ),
        bullet(
          'Meet the teacher at the location, on time — parents are fully responsible for their children for the whole outing.',
        ),
        bullet(
          'Before leaving — with your own child or a carpool — check out with the teacher so attendance stays exact. A state-approved first aid kit and a first-aid-trained adult are on every trip, along with each child’s health records and emergency transportation forms.',
        ),
      ],
    }),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// TWOS & THREES class pages — daily schedules (Handbook IV) + the classroom
// policies every family needs (arrival/dismissal, discipline, good-to-knows)
// ─────────────────────────────────────────────────────────────────────────────
const classPolicySections = () => [
  cardGrid({
    bg: 'grey',
    header: sh(
      'Drop-off & Pick-up',
      'Arrival and dismissal, smoothly',
      'Never left alone, never unsupervised — here’s how the bookends of the day work.',
    ),
    columns: 2,
    cards: [
      card(
        'door-open',
        'sky',
        'Arriving',
        'Park by the concrete sidewalk, come in through the rear (west) doors, and wait in the hallway until class time — teachers and helpers are prepping the room. As the year goes on, practice quick goodbyes at the doorway; confident separation is a skill, and your teacher can help.',
      ),
      card(
        'shield-check',
        'sky',
        'Who can pick up',
        'Children are released only to adults on the Child Release Form (update it any time). An emergency pickup by someone else needs written permission, and custody agreements on file are always followed.',
      ),
      card(
        'map-pin',
        'sky',
        'Picking up',
        'Dismissal happens on the playground or in the classroom, weather deciding. Always come inside — children never run out to the lot — and keep them close until they’re buckled in.',
      ),
      card(
        'clock',
        'sky',
        'Running late',
        'Five-plus minutes late goes in the late log with a signature. First time: a written warning. After that: $1 per minute beyond the five-minute grace. (Teachers give up lunch when we’re late — let’s not.)',
      ),
    ],
  }),
  proseSection({
    bg: 'white',
    header: sh(
      'Guidance',
      'How we guide behavior',
      'Preschoolers are still learning their world. Our approach is positive direction, gentle correction, and strategies that fit their age.',
    ),
    body: [
      bullet(
        'Everyday moments get redirection, natural consequences (the thrown toy takes a break), classroom systems, and sparing, appropriate time-outs.',
      ),
      bullet(
        'On your helper day, you may address your own child’s behavior — or ask the teacher to take the lead; just agree beforehand.',
      ),
      bullet(
        'Persistent concerns follow a partnership path: the teacher tells you what’s happening, you plan together, a conference follows if needed, and outside professionals (pediatrician, speech, public-school preschool intervention) may be recommended — always confidentially, with the Board President kept informed.',
      ),
      bullet(
        'Aggression (hitting, kicking, pushing, biting-adjacent behavior) gets one warning; if it continues, a same-day pickup within 20 minutes. Three pickups in two weeks means a one-week suspension, and if nothing helps, disenrollment — always the last resort, with remaining tuition refunded.',
      ),
    ],
  }),
  proseSection({
    bg: 'grey',
    header: sh('Good to Know', 'The little things', undefined),
    body: [
      bullet(
        strong('Toys stay home: '),
        'personal toys get lost or broken; comfort items are fine with a heads-up to the teacher.',
      ),
      bullet(
        strong('Dress for play: '),
        'weather-appropriate, floor-friendly clothes and closed-toe shoes; a warm coat, hat, and mittens in winter (we play outside above 32°F) — and label everything.',
      ),
      bullet(
        strong('Snack: '),
        'the helper brings a healthy, store-bought, nut-free snack — fresh fruit, crackers and cheese, granola bars, trail mix; save sugary treats for birthday celebrations.',
      ),
      bullet(
        strong('Potty note: '),
        'Twos/Threes children don’t need to be potty-trained while a parent or caregiver stays in the building — the changing station is in the single bathroom by the copier room (diapers go in the diaper pail or dumpster, never the classroom trash).',
      ),
    ],
  }),
];

const twos = {
  sections: [
    schedule({
      bg: 'white',
      header: sh(
        'The Daily Rhythm',
        'A Thursday in Twos',
        'One joyful morning a week, 9:30 to noon — here’s how it flows.',
      ),
      entries: [
        {
          time: '9:30',
          title: 'Greeting & free play',
          desc: 'Warm hellos and easing into the room.',
        },
        {
          time: '9:45',
          title: 'First circle time',
          desc: 'Songs, stories, and togetherness on the rug.',
        },
        {
          time: '10:00',
          title: 'Sensory bins & free play',
          desc: 'Little hands, big discoveries.',
        },
        { time: '10:50', title: 'Restroom & snack', desc: 'Wash up and share snack with friends.' },
        { time: '11:15', title: 'Storytime', desc: 'A story to settle in with.' },
        {
          time: '11:30',
          title: 'Prepare for dismissal',
          desc: 'Backpacks, coats, and last songs.',
        },
        { time: '11:40', title: 'Recess', desc: 'Playground or gym — big movement to finish big.' },
        { time: '12:00', title: 'Dismissal', desc: 'One at a time, to an approved grown-up.' },
      ],
    }),
    ...classPolicySections(),
  ],
};

const threes = {
  sections: [
    schedule({
      bg: 'white',
      header: sh(
        'The Daily Rhythm',
        'A morning in Threes',
        'Monday through Wednesday, 9:30 to noon — here’s how it flows.',
      ),
      entries: [
        {
          time: '9:30',
          title: 'Greeting & free play',
          desc: 'Warm hellos and easing into the room.',
        },
        {
          time: '9:45',
          title: 'First circle time',
          desc: 'Songs, stories, and calendar together.',
        },
        { time: '10:00', title: 'Group activity', desc: 'A short all-together activity.' },
        {
          time: '10:10',
          title: 'Centers & free play',
          desc: 'Child-led stations around the room.',
        },
        { time: '10:50', title: 'Restroom & snack', desc: 'Wash up and share snack with friends.' },
        {
          time: '11:15',
          title: 'Second circle time',
          desc: 'Back to the rug for stories and songs.',
        },
        { time: '11:30', title: 'Prepare for dismissal', desc: 'Backpacks, coats, and wrap-up.' },
        { time: '11:40', title: 'Recess', desc: 'Playground or gym — big movement to finish big.' },
        { time: '12:00', title: 'Dismissal', desc: 'One at a time, to an approved grown-up.' },
      ],
    }),
    ...classPolicySections(),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Write it all
// ─────────────────────────────────────────────────────────────────────────────
await client.createOrReplace({
  _id: 'hubPage-getting-started',
  _type: 'hubPage',
  hubKey: 'getting-started',
  title: gettingStarted.title,
  heading: gettingStarted.heading,
  intro: gettingStarted.intro,
  sections: gettingStarted.sections,
});
console.log(`✓ hubPage-getting-started (${gettingStarted.sections.length} sections)`);

const PATCHES = [
  ['hubPage-health', health.sections],
  ['hubPage-coop-jobs', coopJobs.sections],
  ['hubPage-tuition', tuition.sections],
  ['hubPage-fundraising', fundraisingSections],
  ['hubPage-calendar', calendar.sections],
  ['hubPage-twos', twos.sections],
  ['hubPage-threes', threes.sections],
];
for (const [id, sections] of PATCHES) {
  await client.patch(id).set({ sections }).commit();
  console.log(`✓ ${id} (${sections.length} sections)`);
}

// ── Source PDFs → gated hubDocument files on the Documents page ──────────────
const PDFS = [
  {
    id: 'hubDoc-family-handbook-2627',
    title: 'Family Handbook 2026-27',
    category: 'handbook',
    order: 1,
    file: 'src/assets/Operations – Family Handbook – 2026-27 – FINAL.pdf',
  },
  {
    id: 'hubDoc-safety-plan',
    title: 'WCP Safety Plan',
    category: 'handbook',
    order: 2,
    file: 'src/assets/2025-2026 WCCNS_Safety_Plan.docx.pdf',
  },
  {
    id: 'hubDoc-bylaws',
    title: 'Bylaws & Standing Rules (WCCNS)',
    category: 'handbook',
    order: 3,
    file: 'src/assets/wccns_bylaws_working.pdf',
  },
  {
    id: 'hubDoc-budget-2627',
    title: '2026-27 Proposed Budget (member-approved)',
    category: 'handbook',
    order: 4,
    file: 'src/assets/WCP_2026-27_Proposed_Budget.pdf',
  },
  {
    id: 'hubDoc-may-gathering-2627',
    title: 'May Gathering Slides 2026-27',
    category: 'orient',
    order: 10,
    file: 'src/assets/May Gathering 26-27 Slides.pdf',
  },
  {
    id: 'hubDoc-super-helper',
    title: 'Super Helper Certification Guide',
    category: 'orient',
    order: 11,
    file: 'src/assets/WCP Info Super Helper Certification Process.pdf',
  },
];
for (const d of PDFS) {
  const asset = await client.assets.upload('file', createReadStream(`${SITE_DIR}/${d.file}`), {
    filename: d.file.split('/').pop(),
  });
  await client.createOrReplace({
    _id: d.id,
    _type: 'hubDocument',
    title: d.title,
    category: d.category,
    order: d.order,
    sourceType: 'file',
    file: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } },
  });
  console.log(`✓ ${d.id} (${d.title})`);
}
console.log('\nDone — the school’s knowledge base is on the hub.');
