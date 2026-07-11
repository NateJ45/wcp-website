// =============================================================================
// Migrate the hardcoded pages into Sanity page-builder documents.
// Idempotent: createOrReplace with stable ids (page-<slug>) + cached uploads.
// Run: node scripts/migrate-pagebuilder.mjs
// =============================================================================
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';
import * as B from './pagebuilder-lib.mjs';

const SITE_DIR = 'C:/Users/natha/Documents/Claude/Projects/West Chester Preschool Website/site';
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
const up = B.makeUploader(client);

const CALL_NOTE = 'Call (513) 202-6187 or email president@westchesterpreschool.org';

// Upload shared assets up front.
const A = {
  aboutHero: await up.upload('src/assets/photos/about-hero.jpg'),
  heroPoster: await up.upload('public/hero/wcp-hero-poster.webp'),
  heroMp4: await up.uploadFile('public/hero/wcp-hero.mp4'),
  heroWebm: await up.uploadFile('public/hero/wcp-hero.webm'),
  outdoor: await up.upload('src/assets/photos/outdoor-exploration.jpg'),
  firetruck: await up.upload('src/assets/photos/firetruck-field-trip.jpg'),
  prekCircle: await up.upload('src/assets/photos/prek-circle-time.jpg'),
  unicorn: await up.upload('src/assets/photos/unicorn-hug.jpg'),
  dressUp: await up.upload('src/assets/photos/dress-up-play.jpg'),
  gym: await up.upload('src/assets/photos/gym-playtime.jpg'),
  twosHero: await up.upload('src/assets/photos/twos-hero.jpg'),
  threesHero: await up.upload('src/assets/photos/threes-hero.jpg'),
  prekHero: await up.upload('src/assets/photos/prek-hero.jpg'),
  lisa: await up.upload('src/assets/staff/lisa-cortez.jpg'),
  erin: await up.upload('src/assets/staff/erin-schmerr.jpg'),
};

// Ensure staff docs carry their photos — teacher sections dereference staff.photo.
await client
  .patch('staff-lisa')
  .set({ photo: B.imageValue(A.lisa) })
  .commit();
await client
  .patch('staff-erin')
  .set({ photo: B.imageValue(A.erin) })
  .commit();

const pages = [];
const P = (slug, title, hero, sections, seo = {}) =>
  pages.push({ _id: B.pageId(slug), _type: 'page', title, slug, hero, sections, ...seo });

// ---------------------------------------------------------------- home
P(
  'home',
  'Home',
  B.hero({
    eyebrow: 'Now Enrolling 2026-27',
    title: 'Where little ones learn, grow, and belong.',
    accentWord: 'belong',
    accentColor: 'amber',
    lead: 'West Chester Preschool is a cooperative preschool in West Chester, Ohio. Play-based learning, experienced teachers, and a parent community unlike any other.',
    height: 'tall',
    mediaType: 'video',
    assetId: A.heroPoster,
    imageAlt: 'Children playing together at West Chester Preschool',
    videoFileId: A.heroMp4,
    videoWebmId: A.heroWebm,
    actions: [
      B.act('Enroll Your Child', 'accent', { url: '/enroll' }),
      B.act('Schedule a Tour', 'outline-white', { url: '/enroll' }),
    ],
  }),
  [
    B.noticeBar({
      text: 'Summer Playdates are open to all families.',
      linkLabel: 'Ask us for dates',
      pageSlug: 'contact',
    }),
    B.cardGrid({
      bg: 'grey',
      columns: 3,
      header: B.sh('Why families choose WCP', 'Small classes. Real community.'),
      cards: [
        B.card(
          'users',
          'sky',
          'A real co-op',
          "Families run the school alongside the teachers. You're in the classroom two or three times a month, not waiting at the door.",
        ),
        B.card(
          'palette',
          'orange',
          'Play-based, standards-based',
          "Every class is built on Ohio's Early Learning Content Standards and delivered through play, art, music, and outdoor time.",
        ),
        B.card(
          'piggy-bank',
          'green',
          'Tuition that makes sense',
          'Starting at $70 a month, the co-op model keeps WCP one of the most affordable preschools in West Chester.',
        ),
      ],
    }),
    B.statBand({
      ariaLabel: 'West Chester Preschool by the numbers',
      stats: [
        {
          value: '55',
          suffix: '+',
          label: 'Years in West Chester',
          note: 'Founded in 1969 and still going strong.',
        },
        {
          value: '70',
          prefix: '$',
          label: 'Tuition from, per month',
          note: 'The co-op model keeps costs low without cutting corners.',
        },
        {
          value: '12',
          label: 'Children per class, max',
          note: 'Small enough that every child is known by name.',
        },
        {
          value: '4',
          label: 'Class options',
          note: 'Twos, Threes, and Pre-K morning or afternoon.',
        },
      ],
    }),
    B.testimonials({
      bg: 'white',
      seam: true,
      header: B.sh('From our families', 'Heard directly from our community'),
      source: 'featured',
      limit: 3,
      confetti: true,
    }),
    B.cta({
      title: 'Come see it for yourself.',
      lead: "The best way to know if WCP is right for your family is to walk through the door. Reach out and we'll be in touch within a day or two.",
      actions: [
        B.act('Enroll Now', 'accent', { url: '/enroll' }),
        B.act('Schedule a Tour', 'outline-white', { url: '/enroll' }),
      ],
      note: CALL_NOTE,
    }),
  ],
);

// ---------------------------------------------------------------- about
P(
  'about',
  'About',
  B.hero({
    eyebrow: 'Founded 1969 · West Chester, Ohio',
    title: 'Built by parents. Run by community.',
    lead: 'West Chester Preschool has been a cornerstone of this community for over 55 years. We are a parent-run cooperative preschool for children ages 2-5, and there is nothing else quite like us in Cincinnati.',
    height: 'tall',
    mediaType: 'image',
    assetId: A.aboutHero,
    imageAlt: 'A black-and-white photo of children playing in a West Chester Preschool classroom',
    actions: [
      B.act('Enroll Your Child', 'accent', { url: '/enroll' }),
      B.act('How the Co-op Works', 'outline-white', { url: '/co-op-life' }),
    ],
  }),
  [
    B.proseSection({
      bg: 'white',
      header: B.sh('Our Story', 'Over 55 years and still going strong.'),
      body: B.toPT(
        'West Chester Preschool was founded in 1969, originally known as West Chester Cooperative Nursery School, by a group of local parents who believed they could build something better together.\n\nThat spirit has never changed. Today WCP is still entirely parent-run. Our teachers are the only paid staff. Every other role, administration, fundraising, classroom support, maintenance, event planning, is handled by the families enrolled.\n\nIt sounds like a lot. Families who join almost always say the same thing: it gives back far more than it asks.',
      ),
    }),
    B.cardGrid({
      bg: 'grey',
      columns: 3,
      header: B.sh(
        'Our Approach',
        'What we believe about early childhood',
        'Every decision we make comes back to these principles.',
      ),
      cards: [
        B.card(
          'palette',
          'orange',
          'Learning should feel like play',
          "Children learn best through hands-on exploration. Our curriculum is based on Ohio's Early Learning Content Standards and delivered through crafts, music, games, stories, science, and outdoor time.",
        ),
        B.card(
          'sprout',
          'green',
          'Social skills come first',
          'Before letters and numbers, we focus on independence, creativity, self-esteem, and how to treat other people. These are the foundations that make everything else possible.',
        ),
        B.card(
          'heart-handshake',
          'sky',
          'Parents belong in the classroom',
          'When parents are present and involved, children feel more secure and school feels less foreign. The co-op model keeps parents close during the years it matters most.',
        ),
      ],
    }),
    B.teachers({
      bg: 'white',
      header: B.sh(
        'Our Teachers',
        'The people your child will love',
        'Our teachers are certified early childhood professionals with years of experience. They set the tone for everything that happens at WCP.',
      ),
      staffRefs: ['staff-lisa', 'staff-erin'],
    }),
    B.cardGrid({
      bg: 'grey',
      columns: 3,
      header: B.sh(
        'Our Facilities',
        'A space built for little learners',
        'WCP is located inside Crestview Presbyterian Church at 9463 Cincinnati Columbus Rd, West Chester OH 45069. We are not a religious school, we simply rent a wonderful space from great neighbors.',
      ),
      cards: [
        B.card(
          'school',
          'orange',
          'Dedicated classrooms',
          'Each classroom is designed for hands-on learning, creativity, and small group interaction.',
          '2',
        ),
        B.card(
          'dumbbell',
          'sky',
          'Full gymnasium',
          'Kids get access to a full gym for movement activities, indoor play, and physical development.',
          '1',
        ),
        B.card(
          'trees',
          'green',
          'Expansive outdoor area',
          'A large playground and open field give kids fresh air and space to run, explore, and play every single day.',
          '1',
        ),
      ],
      callout: B.callout(
        'sky',
        'Got questions before you decide? Our FAQ covers everything from potty training to co-op jobs to what happens on a helper day.',
      ),
    }),
    B.cta({
      title: 'Ready to see it in person?',
      lead: 'Meet the teachers, walk through the classrooms, and let your child spend some time in the space.',
      actions: [B.act('Schedule a Tour', 'accent', { url: '/enroll' })],
      note: CALL_NOTE,
    }),
  ],
);

// ---------------------------------------------------------------- tuition
P(
  'tuition',
  'Tuition & Fees',
  B.hero({
    eyebrow: '2026-27 Tuition Rates',
    title: 'Quality early education. At a price that works.',
    lead: 'The co-op model keeps our tuition lower than most preschools in West Chester, without cutting corners on teaching quality or class experience.',
    height: 'tall',
    mediaType: 'none',
    actions: [
      B.act('Enroll Now', 'accent', { url: '/enroll' }),
      B.act('See Full Breakdown', 'outline-white', { url: '#tuition-table' }),
    ],
  }),
  [
    B.cardGrid({
      bg: 'white',
      columns: 4,
      header: B.sh(
        'Why WCP Costs Less',
        'The co-op model makes it possible.',
        'At most preschools every role is a paid position, and those salaries get passed on to families. At WCP, our teachers are the only paid staff. You are the reason the school can afford to be this good.',
      ),
      cards: [
        B.card(
          'award',
          'sky',
          'Expert teachers',
          'Our only paid staff. Certified, experienced, and genuinely invested in every child.',
        ),
        B.card(
          'users',
          'orange',
          'Parent-powered',
          'Everything else is run by the families enrolled, which is also what makes WCP special.',
        ),
        B.card(
          'trending-down',
          'green',
          'Lower overhead',
          'No admin salaries, no outside contractors, no unnecessary costs passed on to you.',
        ),
        B.card(
          'star',
          'amber',
          'High standards',
          'Affordable does not mean lower quality. WCP families consistently say it exceeded expectations.',
        ),
      ],
    }),
    B.tuitionTable({
      bg: 'grey',
      header: B.sh(
        '2026-27 Tuition',
        'Full breakdown — no surprises',
        "All fees listed below. The registration fee is due at sign-up to hold your child's spot; the participation deposit is due at the May Gathering, and student fees at the start of the school year.",
      ),
      caption: 'West Chester Preschool 2026-27 tuition and fees by class',
      callout: B.callout(
        'warm',
        "Annual payment: families who pay the full year's tuition and fees can skip the monthly billing cycle. Tuition is subject to a 5–15% annual adjustment, and rates for each school year are confirmed before enrollment opens. First month's tuition and fees are due in May.",
      ),
    }),
    B.cardGrid({
      bg: 'white',
      columns: 3,
      header: B.sh('What Each Fee Covers', 'Where your money goes'),
      cards: [
        B.card(
          'file-check',
          'orange',
          'Registration fee · $100',
          "A one-time fee due at enrollment that secures your child's place. Non-refundable once enrollment is confirmed.",
        ),
        B.card(
          'shield-check',
          'sky',
          'Participation deposit · $100',
          'Due at the May Gathering (or at registration if you enroll mid-year). Held to ensure the co-op commitment is met, and returned at the end of the year when all obligations have been fulfilled.',
        ),
        B.card(
          'palette',
          'green',
          'Student fees · $45–$50',
          'Covers classroom supplies, art materials, snack contributions, and other resources used directly by children.',
        ),
      ],
    }),
    B.cardGrid({
      bg: 'navy',
      seam: true,
      columns: 4,
      header: B.sh(
        'Registration Timeline',
        'Spots go fast. Here is how it works.',
        'Registration opens each January and follows a priority order. Families who move quickly are almost always placed in their first-choice class.',
      ),
      cards: [
        B.card(
          'users',
          'sky',
          'Current families',
          'Families already enrolled get first pick. Registration forms are distributed in December.',
        ),
        B.card(
          'heart',
          'orange',
          'Alumni and Crestview members',
          'Families who have previously enrolled at WCP, and Crestview Church members, register next in order received.',
        ),
        B.card(
          'door-open',
          'green',
          'Open House — public',
          'Open registration begins at Open House in January. New families register on a first-come, first-served basis.',
        ),
        B.card(
          'list',
          'amber',
          'Waiting list',
          'Once a class is full, a free waiting list is created. Families are contacted in order as spots open up.',
        ),
      ],
      callout: B.callout(
        'warm',
        'Good to know: WCP also accepts open enrollment mid-year if space is available and the teacher and board approve. So even if you missed the start of the school year, it is worth reaching out.',
      ),
    }),
    B.cta({
      title: 'Ready to get started?',
      lead: 'Enrollment for 2026-27 is open. Reach out and we will walk you through the paperwork and schedule a tour.',
      seam: false,
      actions: [
        B.act('Enroll Now', 'accent', { url: '/enroll' }),
        B.act('Ask a Question', 'outline-white', { url: '/contact' }),
      ],
      note: CALL_NOTE,
    }),
  ],
);

// ---------------------------------------------------------------- faq
P(
  'faq',
  'FAQ',
  B.hero({
    eyebrow: 'Common Questions Answered',
    title: 'Got questions? We have answers.',
    lead: "Everything families ask us before and after enrolling, all in one place. If you don't find what you need, just reach out.",
    height: 'tall',
    mediaType: 'none',
    actions: [B.act('Ask Us Directly', 'accent', { url: '/contact' })],
  }),
  [
    B.faqSection({
      bg: 'grey',
      header: B.sh('About the Co-op', 'How the cooperative model works'),
      source: 'category',
      category: 'coop',
    }),
    B.faqSection({
      bg: 'white',
      header: B.sh('Classes and Schedules', 'What classes are available and when'),
      source: 'category',
      category: 'classes',
    }),
    B.faqSection({
      bg: 'grey',
      header: B.sh('Enrollment and Fees', 'How to join and what it costs'),
      source: 'category',
      category: 'enrollment',
    }),
    B.faqSection({
      bg: 'white',
      header: B.sh('About WCP', 'The school itself'),
      source: 'category',
      category: 'about',
    }),
    B.cta({
      title: 'Still have questions?',
      lead: 'We are a parent-run school and we actually reply. Call, email, or send us a message.',
      tone: 'navy',
      actions: [
        B.act('Enroll Now', 'accent', { url: '/enroll' }),
        B.act('Get in Touch', 'outline-white', { url: '/contact' }),
      ],
      note: CALL_NOTE,
    }),
  ],
);

// ---------------------------------------------------------------- contact
P(
  'contact',
  'Contact',
  B.hero({
    eyebrow: 'Get In Touch',
    title: 'We would love to hear from you.',
    lead: 'Call, email, or stop by. We are a parent-run school and we actually reply.',
    height: 'tall',
    mediaType: 'none',
    actions: [
      B.act('Call (513) 202-6187', 'accent', { url: 'tel:5132026187' }),
      B.act('Email Us', 'outline-white', { url: 'mailto:president@westchesterpreschool.org' }),
    ],
  }),
  [
    B.contactDetails({
      bg: 'grey',
      reachHeading: 'Reach us',
      visitHeading: 'Visit',
      showParking: true,
    }),
  ],
);

// ---------------------------------------------------------------- a-day-at-wcp
P(
  'a-day-at-wcp',
  'A Day at WCP',
  B.hero({
    eyebrow: 'A Peek Inside a WCP Morning',
    title: 'What a day at WCP actually looks like.',
    lead: 'Every session at WCP is a mix of free play, guided activities, snack, and outdoor time. Here is a full look at how each class spends their morning, or afternoon.',
    height: 'tall',
    mediaType: 'image',
    assetId: A.prekCircle,
    imageAlt:
      'A teacher reads to a class of children sitting together on the classroom rug during circle time',
    actions: [
      B.act('Enroll Your Child', 'accent', { url: '/enroll' }),
      B.act('Schedule a Tour', 'outline-white', { url: '/enroll' }),
    ],
  }),
  [
    B.cardGrid({
      bg: 'white',
      columns: 3,
      header: B.sh(
        'Every Single Session',
        'What all three classes have in common',
        'No matter which class your child is in, every WCP session includes these five things.',
      ),
      cards: [
        B.card(
          'palette',
          'orange',
          'Free Play',
          'Child-led exploration with toys, art, and open materials.',
        ),
        B.card('users', 'sky', 'Circle Time', 'Songs, stories, and group conversation on the rug.'),
        B.card(
          'cake',
          'amber',
          'Snack Time',
          'Parent helpers bring snack. Kids eat and talk together.',
        ),
        B.card(
          'heart-handshake',
          'green',
          'Parent Helpers',
          'Two parents in the classroom every session to support learning.',
        ),
        B.card(
          'door-open',
          'orange',
          'Outdoor Play',
          'Every session ends with fresh air and playground time.',
        ),
      ],
    }),
    B.schedule({
      bg: 'grey',
      header: B.sh('Twos Class', 'Thursday mornings, 9:30–12:00 pm'),
      intro:
        'The Twos class meets once a week. The pace is gentle and the session is short by design: two-year-olds need transition time, sensory play, and a calm environment to feel safe in a new place.',
      entries: [
        {
          time: '9:30 am',
          title: 'Greeting and Free Play',
          desc: 'Kids arrive and settle in at their own pace.',
        },
        {
          time: '9:45 am',
          title: 'First Circle Time',
          desc: 'Songs, simple activities, and group time on the rug.',
        },
        {
          time: '10:00 am',
          title: 'Sensory Bins and Free Play',
          desc: 'Hands-on sensory exploration and open play.',
        },
        {
          time: '10:50 am',
          title: 'Snack Time',
          desc: 'Parent helpers bring snack. Kids eat and wind down.',
        },
        { time: '11:15 am', title: 'Storytime', desc: 'A quiet wind-down with books and songs.' },
        {
          time: '11:40 am',
          title: 'Outdoor Play and Dismissal',
          desc: 'Playground time. Pickup at 12:00 pm.',
        },
      ],
    }),
    B.schedule({
      bg: 'white',
      header: B.sh('Threes Class', 'Mon–Wed mornings, 9:30–12:00 pm'),
      entries: [
        {
          time: '9:30 am',
          title: 'Greeting and Free Play',
          desc: 'Kids arrive and start playing with friends right away.',
        },
        {
          time: '9:45 am',
          title: 'First Circle Time',
          desc: 'Songs, calendar, and group conversation to open the morning.',
        },
        {
          time: '10:00 am',
          title: 'Group Activity',
          desc: 'A teacher-led project: crafts, science, or cooking.',
        },
        {
          time: '10:10 am',
          title: 'Centers and Free Play',
          desc: 'Open play across activity stations with parent helpers.',
        },
        {
          time: '10:50 am',
          title: 'Snack Time',
          desc: 'Parent helpers bring snack. Kids eat and talk together.',
        },
        {
          time: '11:15 am',
          title: 'Second Circle Time',
          desc: 'Stories and literacy activities before outdoor play.',
        },
        {
          time: '11:40 am',
          title: 'Outdoor Play and Dismissal',
          desc: 'Playground time. Pickup at 12:00 pm.',
        },
      ],
    }),
    B.schedule({
      bg: 'grey',
      header: B.sh('Pre-K AM Class', 'Mon–Thurs mornings, 9:15–12:00 pm'),
      entries: [
        {
          time: '9:15 am',
          title: 'Arrival',
          desc: 'Children arrive and transition into the classroom routine.',
        },
        {
          time: '9:30 am',
          title: 'Calendar',
          desc: 'Days, months, patterns, and counting: a daily warm-up.',
        },
        {
          time: '9:45 am',
          title: 'Fine Motor Activity',
          desc: 'Handwriting Without Tears and fine motor exercises.',
        },
        {
          time: '9:55 am',
          title: 'Centers',
          desc: 'Reading, math, science, art, and play stations.',
        },
        {
          time: '11:00 am',
          title: 'Snack',
          desc: 'Parent helpers bring snack and kids eat as a class.',
        },
        {
          time: '11:20 am',
          title: 'Circle Time',
          desc: 'Stories and group conversation before outdoor play.',
        },
        {
          time: '11:35 am',
          title: 'Outdoor Play and Dismissal',
          desc: 'Playground time. Pickup at 12:00 pm.',
        },
      ],
    }),
    B.schedule({
      bg: 'white',
      header: B.sh('Pre-K PM Class', 'Mon–Wed afternoons, 12:30–3:15 pm'),
      entries: [
        {
          time: '12:30 pm',
          title: 'Arrival',
          desc: 'Children arrive and settle into the afternoon routine.',
        },
        {
          time: '12:45 pm',
          title: 'Calendar',
          desc: 'Days, months, patterns, and counting to open the session.',
        },
        {
          time: '1:00 pm',
          title: 'Fine Motor Activity',
          desc: 'Handwriting and fine motor exercises.',
        },
        {
          time: '1:10 pm',
          title: 'Centers',
          desc: 'Reading, math, science, art, and play stations.',
        },
        { time: '2:15 pm', title: 'Snack', desc: 'A mid-afternoon refuel and social moment.' },
        {
          time: '2:35 pm',
          title: 'Circle Time',
          desc: 'Stories and group conversation to close the day.',
        },
        {
          time: '2:50 pm',
          title: 'Outdoor Play and Dismissal',
          desc: 'Playground time. Pickup at 3:15 pm.',
        },
      ],
    }),
    B.gallery({
      bg: 'grey',
      header: B.sh(
        'See It in Action',
        'Photos from our classrooms',
        'A look at what a real WCP session looks like: the activities, the helpers, the outdoor time, and the moments in between.',
      ),
      photos: [
        {
          assetId: A.prekCircle,
          alt: 'A teacher reads to the Pre-K class during circle time on the classroom rug',
          caption: 'Circle time',
        },
        {
          assetId: A.unicorn,
          alt: 'Three children sharing a group hug with a stuffed unicorn toy',
          caption: 'Free play',
        },
        {
          assetId: A.dressUp,
          alt: 'Two children in firefighter dress-up costumes playing together in the classroom',
          caption: 'Dress-up play',
        },
        {
          assetId: A.gym,
          alt: 'A teacher and children playing together on the gymnasium floor',
          caption: 'Gym time',
        },
        {
          assetId: A.outdoor,
          alt: 'A teacher and children examining something together outdoors',
          caption: 'Outdoor exploration',
        },
        {
          assetId: A.firetruck,
          alt: 'WCP children on a field trip exploring a fire truck',
          caption: 'Field trip',
        },
      ],
    }),
    B.cta({
      title: 'Want to see it in person?',
      lead: 'Come for a tour and watch a real session in action. Meet the teachers, see the space, and let your child spend time in the classroom.',
      actions: [
        B.act('Schedule a Tour', 'accent', { url: '/enroll' }),
        B.act('Enroll Now', 'outline-white', { url: '/enroll' }),
      ],
      note: CALL_NOTE,
    }),
  ],
);

// ---------------------------------------------------------------- co-op-life
P(
  'co-op-life',
  'Co-op Life',
  B.hero({
    eyebrow: 'Parent-Run Since 1969',
    title: 'You are not just a parent here. You are an owner.',
    lead: 'WCP is a cooperative preschool: the families run the school alongside the teachers. Here is what the co-op commitment actually involves, and why families love it.',
    height: 'tall',
    mediaType: 'image',
    assetId: A.firetruck,
    imageAlt:
      'WCP children on a field trip to a local fire station, exploring the fire truck with a parent volunteer and firefighter',
    actions: [
      B.act('Join the Co-op', 'accent', { url: '/enroll' }),
      B.act('See What’s Involved', 'outline-white', { url: '#commitments' }),
    ],
  }),
  [
    B.proseSection({
      bg: 'white',
      header: B.sh('The Co-op Model', 'What does it actually mean?'),
      body: B.toPT(
        'A cooperative preschool is owned and operated by the families of enrolled students. Our teachers are the only paid staff. Every other role is handled by parents.\n\nThis is what keeps tuition low, class sizes small, and the community genuinely close. When parents are in the building regularly, they know every child, every family, and every teacher.\n\nMost families say the co-op ask is one of the best parts of WCP. You get a front-row seat to your child’s first school experiences — and you build real friendships along the way.',
      ),
    }),
    B.cardGrid({
      bg: 'grey',
      columns: 3,
      header: B.sh(
        'The Co-op Commitment',
        'Six things every WCP family agrees to',
        'When you enroll, you take on these six commitments for the school year. They are what make WCP run.',
      ),
      cards: [
        B.card(
          'heart-handshake',
          'orange',
          'Help in the classroom',
          'Every family helps in their child’s classroom 1–3 times per month (depending on class size and age of class). You work alongside the teacher and get to watch your child in their element.',
        ),
        B.card(
          'users',
          'sky',
          'Hold a co-op job',
          'Every family is assigned a role for the full year — from board positions to event planning to school maintenance. Jobs are matched to your skills and availability.',
        ),
        B.card(
          'shield-check',
          'green',
          'Comply with health requirements',
          'All classroom helpers must complete an Ohio state background and health check before their first shift.',
        ),
        B.card(
          'megaphone',
          'amber',
          'Participate in fundraising',
          'Families take part in fundraising activities throughout the year. There are multiple events to choose from so you can get involved in ways that suit you.',
        ),
        B.card(
          'calendar-days',
          'sky',
          'Attend mandatory meetings',
          'Four meetings per year: the May Parent Conference, two Informational Meetings, and September Orientation.',
        ),
        B.card(
          'piggy-bank',
          'orange',
          'Pay tuition on time',
          'Tuition is due monthly, with an annual payment option for families who prefer to pay the full year up front.',
        ),
      ],
    }),
    B.stepList({
      bg: 'white',
      header: B.sh(
        'Your Helper Day',
        'A morning you will actually look forward to',
        'Here is what happens from the moment you arrive to the moment you head home.',
      ),
      steps: [
        {
          title: 'Arrive 15 minutes early',
          body: 'Help set up the classroom and get the playground or gym ready. Your teacher will walk you through exactly what needs doing.',
        },
        {
          title: 'Welcome the children',
          body: 'Jump straight into play. Encourage sharing, help kids settle in, and get ready to be asked to play — it is the best feeling.',
        },
        {
          title: 'Join in all morning long',
          body: 'Circle time, small group activities, the restroom routine, snack prep, and outdoor play. You are fully in the middle of it all.',
        },
        {
          title: 'Snack time is the highlight',
          body: 'Sit down with the kids and just listen. The stories you will hear are priceless. Every parent helper says this is their favorite part.',
          note: 'Parents always leave wishing snack time lasted longer',
        },
        {
          title: 'Head outside with the class',
          body: 'Playground or gym time. Your energy sets the tone. Get in there and play — kids light up when helpers are having fun too.',
        },
        {
          title: 'Quick tidy-up and you are done',
          body: 'Follow the simple cleaning checklist to reset the room. Takes about 10 minutes.',
        },
      ],
      footnote: 'Total time in class: roughly 2.5 hours start to finish.',
    }),
    B.schoolYear({
      bg: 'grey',
      header: B.sh(
        'The School Year',
        'A year full of things to look forward to',
        'WCP is not just classes. The school year is packed with events, celebrations, and community moments that families talk about long after their kids graduate.',
      ),
    }),
    B.cardGrid({
      bg: 'white',
      columns: 4,
      header: B.sh(
        'Stay Connected',
        'Your window into the classroom — every week',
        'WCP uses ClassDojo as our main classroom communication tool. Teachers use it to share photos, updates, reminders, and news from the school day — so you always know what is happening, even when you are not there.',
      ),
      cards: [
        B.card(
          'camera',
          'orange',
          'Classroom photos',
          'See what your child worked on today. Teachers share photos and highlights from every session.',
        ),
        B.card(
          'megaphone',
          'sky',
          'Announcements',
          'Reminders, schedule changes, and event updates delivered directly to your phone or computer.',
        ),
        B.card(
          'message-circle',
          'green',
          'Direct messaging',
          'Send and receive private messages with your child’s teacher anytime during the year.',
        ),
        B.card(
          'users',
          'amber',
          'Class community',
          'Chat with other families in your class and build connections before you even meet in person.',
        ),
      ],
      callout: B.callout(
        'sky',
        'ClassDojo is private and secure. Only enrolled WCP families and staff have access. No ads, no public sharing.',
      ),
    }),
    B.testimonials({
      bg: 'grey',
      source: 'featured',
      limit: 3,
      header: B.sh(
        'From Our Families',
        'What co-op parents say',
        'The co-op commitment sounds like work. Here is what families actually experience.',
      ),
    }),
    B.cta({
      title: 'Ready to be part of something different?',
      lead: 'Enrollment for 2026-27 is open. Come for a tour, meet the teachers, and see the co-op in action.',
      actions: [
        B.act('Enroll Your Child', 'accent', { url: '/enroll' }),
        B.act('Schedule a Tour', 'outline-white', { url: '/enroll' }),
      ],
      note: CALL_NOTE,
    }),
  ],
);

// ---------------------------------------------------------------- why-wcp
P(
  'why-wcp',
  'Why WCP?',
  B.hero({
    eyebrow: 'Still Comparing Schools?',
    title: 'Here is why families choose WCP.',
    lead: 'We are not the biggest preschool in West Chester. We are the one families talk about for years after their kids graduate. Here is what makes the difference.',
    height: 'tall',
    mediaType: 'image',
    assetId: A.outdoor,
    imageAlt:
      'A WCP teacher and a small group of children examining something together outdoors during a nature exploration activity',
    actions: [
      B.act('Enroll Your Child', 'accent', { url: '/enroll' }),
      B.act('Schedule a Tour', 'outline-white', { url: '/enroll' }),
    ],
  }),
  [
    B.cardGrid({
      bg: 'grey',
      columns: 3,
      header: B.sh(
        'What Sets Us Apart',
        'Six reasons families pick WCP',
        'These are the things families tell us they wish they had known before they started looking.',
      ),
      cards: [
        B.card(
          'door-open',
          'sky',
          'You get a front-row seat',
          'Most preschools keep parents at the door. At WCP you are in the classroom, watching your child make friends, solve problems, and grow in real time.',
        ),
        B.card(
          'piggy-bank',
          'green',
          'Tuition that makes sense',
          'Starting at $70 a month, WCP is one of the most affordable preschools in West Chester. The co-op model keeps costs low without cutting corners.',
        ),
        B.card(
          'graduation-cap',
          'orange',
          'Teachers who know your child',
          'Small classes and the same teachers every day. Our staff know every child by name, every quirk, every strength.',
        ),
        B.card(
          'users',
          'amber',
          'A community that sticks around',
          'WCP families become actual friends who stay in touch long after their kids move on.',
        ),
        B.card(
          'award',
          'sky',
          'Kids leave ready for kindergarten',
          'Our curriculum follows Ohio’s Early Learning Content Standards. By Pre-K graduation, their kindergarten teachers notice the difference.',
        ),
        B.card(
          'heart',
          'orange',
          '55 years of doing this well',
          'WCP has been here since 1969. Families keep coming back, often enrolling a second or third child before the first has finished.',
        ),
      ],
    }),
    B.statBand({
      ariaLabel: 'West Chester Preschool by the numbers',
      stats: [
        {
          value: '55',
          suffix: '+',
          label: 'Years in West Chester',
          note: 'Founded in 1969 and still going strong.',
        },
        { value: '4', label: 'Classes for ages 2-5', note: 'Twos, Threes, and Pre-K AM and PM.' },
        {
          value: '70',
          prefix: '$',
          label: 'Tuition from, per month',
          note: 'The co-op model keeps our tuition low.',
        },
        {
          value: '100',
          suffix: '%',
          label: 'Ohio licensed',
          note: 'Fully licensed and non-discriminatory. Every family is welcome.',
        },
      ],
    }),
    B.compare({
      bg: 'white',
      seam: true,
      header: B.sh(
        'How We Compare',
        'WCP vs a typical preschool',
        'An honest look at what makes the co-op model different.',
      ),
      rows: [
        {
          feature: 'Parent involvement in classroom',
          wcp: 'Yes — 1–3× per month',
          typical: 'Rarely or never',
        },
        {
          feature: 'Monthly tuition (4-year-old)',
          wcp: 'From $175–$200',
          typical: 'Often $500–$1,500+',
        },
        { feature: 'Class size', wcp: 'Small, intentional', typical: 'Varies, often larger' },
        { feature: 'Know every classmate’s family', wcp: 'Yes', typical: 'Unlikely' },
        {
          feature: 'Curriculum basis',
          wcp: 'Ohio Early Learning Standards',
          typical: 'Varies by school',
        },
        { feature: 'Parent community', wcp: 'Built in by design', typical: 'Up to you to find' },
        { feature: 'State licensed', wcp: 'Yes, by ODJFS', typical: 'Varies' },
        { feature: 'Non-discriminatory', wcp: 'Yes, always', typical: 'Varies' },
      ],
    }),
    B.cardGrid({
      bg: 'grey',
      columns: 3,
      header: B.sh(
        'Your Child’s Progress',
        'You will always know how your child is doing.',
        'Between ClassDojo updates, your own classroom helper days, and formal conferences, you will never feel out of the loop.',
      ),
      cards: [
        B.card(
          'file-check',
          'sky',
          'Annual parent-teacher conferences',
          'Threes and Pre-K families receive a formal conference each year where the teacher reviews your child’s development in detail. You can also request a conference at any time — no waiting for a scheduled slot.',
        ),
        B.card(
          'graduation-cap',
          'orange',
          'Early Pre-K conferences',
          'Pre-K conferences are scheduled early in the year specifically to help families make informed decisions about kindergarten readiness or whether an additional Pre-K year would benefit their child.',
        ),
        B.card(
          'eye',
          'green',
          'You see it yourself',
          'Because you help in the classroom 1–3 times a month, you do not have to wait for a conference to know how your child is doing. You watch them learn, grow, and make friends in real time.',
        ),
      ],
    }),
    B.schoolYear({
      bg: 'white',
      header: B.sh(
        'The School Year',
        'A year full of things to look forward to',
        'WCP is not just classes. The school year is packed with events, celebrations, and community moments that families talk about long after their kids graduate.',
      ),
    }),
    B.testimonials({
      bg: 'grey',
      source: 'all',
      layout: 'wall',
      header: B.sh(
        'Family Stories',
        'Heard directly from our community',
        'Real families. Real words. Not ours.',
      ),
    }),
    B.cta({
      title: 'Come see it for yourself.',
      lead: 'The best way to know if WCP is right for your family is to walk through the door. Meet the teachers, see the classrooms, and let your child spend time in the space.',
      actions: [
        B.act('Schedule a Tour', 'accent', { url: '/enroll' }),
        B.act('View Tuition', 'outline-white', { url: '/tuition' }),
      ],
      note: CALL_NOTE,
    }),
  ],
);

// ---------------------------------------------------------------- newsletter
P(
  'newsletter',
  'Newsletter',
  B.hero({
    eyebrow: 'Stay in the Loop',
    title: 'Get WCP news before anyone else.',
    lead: 'We send a short newsletter a few times a year with school updates, enrollment reminders, event dates, and the occasional peek inside our classrooms. No spam. Unsubscribe any time.',
    height: 'tall',
    mediaType: 'none',
    actions: [B.act('Sign Up', 'accent', { url: '#signup' })],
  }),
  [
    B.cardGrid({
      bg: 'grey',
      columns: 3,
      header: B.sh('What You’ll Get', 'A few emails a year, all worth opening'),
      cards: [
        B.card(
          'calendar-days',
          'orange',
          'Enrollment reminders',
          'Know when registration opens so you never miss a spot in your first-choice class.',
        ),
        B.card(
          'party-popper',
          'sky',
          'Event dates',
          'Picnics, parties, the Easter egg hunt, graduation — the moments that make the WCP year.',
        ),
        B.card(
          'camera',
          'green',
          'Peeks inside',
          'The occasional look inside our classrooms and the little wins that make us smile.',
        ),
      ],
    }),
    B.cta({
      title: 'Join the WCP newsletter',
      lead: 'Send us a quick email with your name and we will add you to the list. One-click online signup is coming soon.',
      tone: 'cream',
      actions: [
        B.act('Subscribe by Email', 'primary', {
          url: 'mailto:president@westchesterpreschool.org?subject=Newsletter%20signup&body=Please%20add%20me%20to%20the%20WCP%20newsletter.%20My%20name%20is%3A',
        }),
      ],
      note: 'We respect your privacy. Unsubscribe any time.',
    }),
  ],
);

// ---------------------------------------------------------------- enroll
P(
  'enroll',
  'Enroll',
  B.hero({
    eyebrow: 'Now Enrolling 2026-27',
    title: 'Let’s get your child started.',
    lead: 'Enrollment for 2026-27 is open. Reach out and we will schedule a tour, answer your questions, and walk you through everything.',
    height: 'tall',
    mediaType: 'none',
    actions: [
      B.act('Call (513) 202-6187', 'accent', { url: 'tel:5132026187' }),
      B.act('Email Us', 'outline-white', { url: 'mailto:president@westchesterpreschool.org' }),
    ],
  }),
  [
    B.cardGrid({
      bg: 'grey',
      columns: 3,
      header: B.sh('How It Works', 'Enrolling takes three steps'),
      cards: [
        B.card(
          'phone',
          'sky',
          '1. Reach out',
          'Call, email, or send us a message. Tell us your child’s age and which class you are considering.',
        ),
        B.card(
          'map-pin',
          'orange',
          '2. Schedule a tour',
          'Come see the classrooms, meet the teachers, and let your child spend some time in the space.',
        ),
        B.card(
          'file-pen',
          'green',
          '3. Complete paperwork',
          'We walk you through the enrollment forms. The $100 registration fee is due now to secure your spot; the participation deposit follows at the May Gathering.',
        ),
      ],
    }),
    B.cardGrid({
      bg: 'white',
      columns: 3,
      layout: 'compactIcon',
      header: B.sh(
        'Good to Know',
        'What being a co-op family involves',
        'Enrolling at WCP means joining the co-op. Here is the commitment at a glance — it gives back far more than it asks.',
      ),
      cards: [
        B.card(
          'heart-handshake',
          'sky',
          'Help in the classroom',
          '1–3 times per month, alongside the teacher.',
        ),
        B.card(
          'users',
          'sky',
          'Hold a co-op job',
          'One role for the year, matched to your skills.',
        ),
        B.card(
          'shield-check',
          'sky',
          'Complete a background check',
          'Required by Ohio before your first shift.',
        ),
        B.card(
          'megaphone',
          'sky',
          'Join in fundraising',
          'At least one fundraiser a year — your pick.',
        ),
        B.card(
          'calendar-days',
          'sky',
          'Attend four meetings',
          'May Parent Conference, two info meetings, and September Orientation.',
        ),
        B.card(
          'piggy-bank',
          'sky',
          'Pay tuition on time',
          'Monthly, with an annual-payment option.',
        ),
      ],
    }),
    B.cta({
      title: 'Talk to a real parent volunteer',
      lead: 'We are a parent-run school and we actually reply, usually within a day or two. An online enrollment form is on the way. In the meantime, the fastest way to start is to call or email.',
      tone: 'cream',
      actions: [
        B.act('Call (513) 202-6187', 'primary', { url: 'tel:5132026187' }),
        B.act('Email Us', 'outline', { url: 'mailto:president@westchesterpreschool.org' }),
      ],
      note: '9463 Cincinnati Columbus Rd, West Chester, OH 45069 · inside Crestview Presbyterian Church',
    }),
    B.cta({
      title: 'Not sure which class fits?',
      lead: 'Tell us your child’s age and we will help you find the right fit, from Twos through Pre-K.',
      tone: 'navy',
      actions: [
        B.act('See the Classes', 'accent', { url: '/classes/twos' }),
        B.act('View Tuition', 'outline-white', { url: '/tuition' }),
      ],
    }),
  ],
);

// ---------------------------------------------------------------- work-with-us
P(
  'work-with-us',
  'Work With Us',
  B.hero({
    eyebrow: 'Join Our Team',
    title: 'Work with us. Teach with purpose.',
    lead: 'WCP is a cooperative preschool where teachers are valued, supported, and genuinely part of the community. If you love early childhood education, we would love to meet you.',
    height: 'tall',
    mediaType: 'none',
    actions: [
      B.act('Apply Now', 'accent', {
        url: 'mailto:president@westchesterpreschool.org?subject=Teaching%20at%20WCP',
      }),
      B.act('Learn About the Role', 'outline-white', { url: '#the-role' }),
    ],
  }),
  [
    B.cardGrid({
      bg: 'white',
      columns: 3,
      header: B.sh('Why WCP', 'A different kind of place to teach'),
      cards: [
        B.card(
          'heart-handshake',
          'orange',
          'Parents are partners',
          'Parent helpers are in the classroom every session. Teachers lead — parents support. It means smaller effective ratios and more time for individual attention.',
        ),
        B.card(
          'users',
          'sky',
          'A real community',
          'You will know every child and every family by name. WCP families are engaged, present, and genuinely invested in the school. Teaching here feels collaborative, not isolating.',
        ),
        B.card(
          'palette',
          'green',
          'Play-based curriculum',
          'Our curriculum follows Ohio’s Early Learning Content Standards and is delivered through play, creativity, and exploration. No rigid scripted lessons — real teaching.',
        ),
      ],
    }),
    B.cardGrid({
      bg: 'grey',
      columns: 3,
      header: B.sh('The Role', 'What teaching at WCP looks like'),
      cards: [
        B.card(
          'notebook-pen',
          'orange',
          'Lesson planning',
          'Teachers design and deliver all lesson plans aligned to Ohio’s Early Learning Standards. You have full creative ownership of your classroom curriculum.',
        ),
        B.card(
          'baby',
          'sky',
          'Small class sizes',
          'WCP keeps class sizes intentionally small. You work with the same children every session, building real relationships and tracking individual progress over the year.',
        ),
        B.card(
          'calendar-days',
          'green',
          'School year schedule',
          'The school year runs September through May and follows the Lakota School District calendar. Morning sessions only — a schedule that works for teachers with families too.',
        ),
      ],
    }),
    B.proseSection({
      bg: 'white',
      header: B.sh('Current Openings', 'We review applications on a rolling basis'),
      body: B.toPT(
        'We do not always have open positions but we keep every submission on file. When a role opens, we reach out to candidates we have already heard from first. If you are passionate about early childhood education and want to be considered, send us your details and we will be in touch.',
      ),
      callout: B.callout(
        'warm',
        'Qualifications we look for: an early childhood education degree or equivalent experience, a genuine love of working with young children, comfort with a cooperative model where parents are present, and Ohio BCI and FBI background check clearance.',
      ),
    }),
    B.cta({
      title: 'Apply to work at WCP.',
      lead: 'We are a small parent-run co-op and our teachers are the heart of everything we do. Send us your details and we will be in touch when a position opens up.',
      tone: 'navy',
      actions: [
        B.act('Apply Now', 'accent', {
          url: 'mailto:president@westchesterpreschool.org?subject=Teaching%20at%20WCP',
        }),
      ],
    }),
  ],
);

// ---------------------------------------------------------------- virtual-tour
P(
  'virtual-tour',
  'Virtual Tour',
  B.hero({
    eyebrow: 'See Our School · Photos Inside',
    title: 'Take a look around before you visit.',
    lead: 'Browse the classrooms, hear from our teachers, and explore the spaces your child will love. Then book a tour or jump straight to enrollment.',
    height: 'tall',
    mediaType: 'image',
    assetId: A.gym,
    imageAlt: 'A WCP teacher and children playing together on the gymnasium floor',
    actions: [
      B.act('Book a Tour', 'accent', { url: '/enroll' }),
      B.act('Enroll Now', 'outline-white', { url: '/enroll' }),
    ],
  }),
  [
    B.teachers({
      bg: 'white',
      header: B.sh('Meet Your Teachers', 'The people your child will love'),
      staffRefs: ['staff-lisa', 'staff-erin'],
    }),
    B.splitMedia({
      bg: 'grey',
      header: B.sh(
        'Our Spaces',
        'Where your child will learn and play',
        'WCP has two dedicated classrooms, a full gymnasium, and an outdoor playground. Every space is set up for hands-on exploration, movement, and fun.',
      ),
      rows: [
        {
          assetId: A.twosHero,
          alt: 'Children exploring a sensory bin in the Twos and Threes classroom',
          eyebrow: 'Bright, warm, and built for little hands.',
          title: 'Twos & Threes Classroom',
          body: 'Low tables, soft seating, sensory bins, a cozy reading nook, and art stations. Everything in this room is sized for two and three-year-olds and designed to invite exploration. This is where your child will have circle time on the rug, work on crafts at the tables, and play alongside friends and parent helpers every session.',
        },
        {
          assetId: A.prekCircle,
          alt: 'The Pre-K classroom during circle time, with the teacher reading to the class',
          eyebrow: 'Kindergarten readiness starts here.',
          title: 'Pre-K Classroom',
          body: 'Learning centers for reading, math, science, and art. A calendar wall. A Handwriting Without Tears station. This room is set up for structured learning through play. Mrs. Lisa runs the same curriculum in both AM and PM sessions. By May, Pre-K graduates walk into kindergarten ready and confident.',
        },
        {
          assetId: A.gym,
          alt: 'A teacher and children playing together on the gymnasium floor',
          eyebrow: 'The gym and playground.',
          title: 'Movement & Outdoor Play',
          body: 'Every session includes time for big-body movement. On nice days, kids head to the playground and open field to run, climb, and explore. On cold or rainy days, the gym has plenty of space for running, jumping, and games.',
        },
      ],
    }),
    B.cardGrid({
      bg: 'white',
      columns: 3,
      header: B.sh(
        'A Typical Morning',
        'What school actually looks like',
        'From drop-off to pickup, every morning has free play, circle time, a group activity, snack, and outdoor time.',
      ),
      cards: [
        B.card(
          'sun',
          'orange',
          'Arrival and free play',
          'Kids arrive and settle in at their own pace. Parent helpers are already in the classroom welcoming everyone as they come through the door.',
        ),
        B.card(
          'palette',
          'sky',
          'Activities and centers',
          'Crafts, science, sensory play, and group projects. The teacher leads, parent helpers work at every table. Every activity is built around Ohio’s Early Learning Standards.',
        ),
        B.card(
          'trees',
          'green',
          'Outdoor play and pickup',
          'Every session ends on the playground. Kids burn energy, make friends, and transition out of school mode before families pick up.',
        ),
      ],
    }),
    B.classCards({
      bg: 'grey',
      header: B.sh(
        'Find Your Class',
        'Which class is right for your child?',
        'Check your child’s age against September 30 of the enrollment year. Four classes for ages 2–5.',
      ),
      classRefs: ['class-twos', 'class-threes', 'class-pre-k-am', 'class-pre-k-pm'],
    }),
    B.cta({
      title: 'Ready to see it in person?',
      lead: 'Book an in-person tour and we will show you around. Tours are casual and low-pressure — come see the classrooms, meet the teachers, and ask anything.',
      actions: [
        B.act('Book a Tour', 'accent', { url: '/enroll' }),
        B.act('Enroll Now', 'outline-white', { url: '/enroll' }),
      ],
      note: CALL_NOTE,
    }),
  ],
);

// ---------------------------------------------------------------- classes/twos
P(
  'classes/twos',
  'Twos Class',
  B.hero({
    eyebrow: 'Now Enrolling 2026-27 · Ages 2+',
    title: 'A gentle first step into school life.',
    lead: 'The Twos class meets every Thursday morning. It is a calm, play-based introduction to being at school, made for children who are just starting out.',
    height: 'tall',
    mediaType: 'image',
    assetId: A.twosHero,
    imageAlt:
      'Two Twos-class children exploring a sensory bin filled with beans and toy animals together',
    actions: [
      B.act('Enroll Your Child', 'accent', { url: '/enroll' }),
      B.act('Schedule a Tour', 'outline-white', { url: '/enroll' }),
    ],
  }),
  [
    B.cardGrid({
      bg: 'grey',
      columns: 4,
      header: B.sh('Twos Class', 'Everything you need to know'),
      cards: [
        B.card(
          'calendar-days',
          'sky',
          'Thursdays only',
          'One morning a week, perfect for little ones just starting out.',
        ),
        B.card(
          'clock',
          'orange',
          '9:30 am – 12:00 pm',
          'Drop off, enjoy your morning, and pick up at noon.',
        ),
        B.card(
          'cake',
          'amber',
          'Age 2 by Sept 30',
          'Your child must turn 2 by September 30 of the enrollment year.',
        ),
        B.card(
          'piggy-bank',
          'green',
          '$70 per month',
          '$100 registration fee holds your spot at sign-up. $100 deposit due at the May Gathering.',
        ),
      ],
    }),
    B.cardGrid({
      bg: 'white',
      columns: 3,
      header: B.sh(
        'Class Size',
        'Small classes. Real attention.',
        'The Twos class is intentionally tiny. Seven children, one teacher, and two parent helpers every single session. Your child will never be a face in a crowd.',
      ),
      cards: [
        B.card(
          'users',
          'amber',
          '7 children max',
          'The Twos class is capped at 7 children so every child gets real individual attention from the teacher.',
        ),
        B.card(
          'graduation-cap',
          'sky',
          'Certified teacher',
          'Mrs. Erin leads every Twos session. She knows every child by name before the second week.',
        ),
        B.card(
          'heart-handshake',
          'orange',
          'Two parent helpers',
          'Two co-op parents help in the classroom every session. One of them could be you.',
        ),
      ],
      callout: B.callout(
        'sky',
        'Caregiver and Me option: if your child is not yet fully potty trained, a parent or guardian is welcome to stay in the building for the entire session. No child is ever turned away.',
      ),
    }),
    B.schedule({
      bg: 'grey',
      header: B.sh(
        'A Typical Thursday',
        'What your child’s morning looks like',
        'Each session is paced for two-year-olds: short bursts of activity, plenty of free time, and a snack and outdoor play to finish the morning.',
      ),
      entries: [
        {
          time: '9:30 am',
          title: 'Greeting and Free Play',
          desc: 'Kids arrive and settle in at their own pace. Free exploration of toys and materials.',
        },
        {
          time: '9:45 am',
          title: 'First Circle Time',
          desc: 'Songs, simple activities, and group time on the rug together.',
        },
        {
          time: '10:00 am',
          title: 'Sensory Bins and Free Play',
          desc: 'Hands-on sensory exploration and open play with parent helpers at every table.',
        },
        {
          time: '10:50 am',
          title: 'Snack Time',
          desc: 'Parent helpers bring snack. Kids eat together and start winding down.',
        },
        {
          time: '11:15 am',
          title: 'Storytime',
          desc: 'A quiet wind-down with books and songs before heading outside.',
        },
        {
          time: '11:40 am',
          title: 'Outdoor Play and Dismissal',
          desc: 'Playground time. Families pick up at 12:00 pm.',
        },
      ],
    }),
    B.cardGrid({
      bg: 'white',
      columns: 3,
      header: B.sh(
        'Ohio Early Learning Standards',
        'What your two-year-old learns at WCP',
        'Our curriculum is built on Ohio’s Early Learning Content Standards. For two-year-olds, every goal is delivered through play.',
      ),
      cards: [
        B.card(
          undefined,
          'sky',
          'Reading and language',
          'Children are introduced to letters, printed names, and how books work. They enjoy stories and rhymes and begin recognising print vs pictures.',
        ),
        B.card(
          undefined,
          'sky',
          'Communication',
          'Toddlers begin to speak more clearly to express ideas, feelings, and needs, follow simple directions, and grow their vocabulary through conversation.',
        ),
        B.card(
          undefined,
          'sky',
          'Early math',
          'An introduction to colours, numbers, and basic shapes through play, hands-on materials, and daily activities.',
        ),
        B.card(
          undefined,
          'sky',
          'Social and emotional',
          'Learning to separate from parents, take turns, share, and ask for things in appropriate ways, building confidence with teachers and peers.',
        ),
        B.card(
          undefined,
          'sky',
          'Music and art',
          'Group singing, art projects, and creative exploration with tools like scissors, paintbrushes, and cookie cutters.',
        ),
        B.card(
          undefined,
          'sky',
          'Science and social studies',
          'Exploring weather and seasons, animals, plants, and life cycles, plus family history, cultural traditions, and seasonal holidays.',
        ),
      ],
      callout: B.callout(
        'warm',
        'Every goal above is drawn directly from Ohio’s Early Learning Content Standards and delivered through play, every single session.',
      ),
    }),
    B.teachers({
      bg: 'grey',
      header: B.sh('Your Child’s Teacher', 'Meet Mrs. Erin'),
      staffRefs: ['staff-erin'],
    }),
    B.testimonials({ bg: 'white', source: 'tag', tag: 'twos', limit: 1 }),
    B.cta({
      title: 'Ready to get your two-year-old started?',
      lead: 'Enrollment for 2026-27 is open now. Send us a message and we will be in touch within a day or two.',
      actions: [
        B.act('Enroll Now', 'accent', { url: '/enroll' }),
        B.act('Schedule a Tour', 'outline-white', { url: '/enroll' }),
      ],
      note: CALL_NOTE,
    }),
  ],
);

// ---------------------------------------------------------------- classes/threes
P(
  'classes/threes',
  'Threes Class',
  B.hero({
    eyebrow: 'Now Enrolling 2026-27 · Ages 3+',
    title: 'Building independence, one morning at a time.',
    lead: 'The Threes class meets Monday through Wednesday. Kids this age are ready for more structure, more creativity, and more time with friends.',
    height: 'tall',
    mediaType: 'image',
    assetId: A.threesHero,
    imageAlt:
      'A Threes-class group exploring a creek with a parent volunteer during an outdoor nature walk',
    actions: [
      B.act('Enroll Your Child', 'accent', { url: '/enroll' }),
      B.act('Schedule a Tour', 'outline-white', { url: '/enroll' }),
    ],
  }),
  [
    B.cardGrid({
      bg: 'grey',
      columns: 4,
      header: B.sh('Threes Class', 'Everything you need to know'),
      cards: [
        B.card(
          'calendar-days',
          'green',
          'Mon, Tue, Wed',
          'Three mornings a week gives kids real routine and rhythm.',
        ),
        B.card(
          'clock',
          'sky',
          '9:30 am – 12:00 pm',
          'Drop off, enjoy your morning, and pick up at noon.',
        ),
        B.card(
          'cake',
          'amber',
          'Age 3 by Sept 30',
          'Your child must turn 3 by September 30 of the enrollment year.',
        ),
        B.card(
          'piggy-bank',
          'orange',
          '$150 per month',
          '$100 registration fee holds your spot at sign-up. $100 deposit due at the May Gathering.',
        ),
      ],
    }),
    B.cardGrid({
      bg: 'white',
      columns: 3,
      header: B.sh(
        'Class Size',
        'Small classes. Real attention.',
        'Twelve children, one teacher, and two parent helpers every session. Small enough that every child is known. Large enough that friendships form fast.',
      ),
      cards: [
        B.card(
          'users',
          'green',
          '12 children max',
          'Small enough for individual attention, large enough for real friendships.',
        ),
        B.card(
          'graduation-cap',
          'sky',
          'Certified teacher',
          'Mrs. Erin leads every Threes session with years of experience in early childhood education.',
        ),
        B.card(
          'heart-handshake',
          'orange',
          'Two parent helpers',
          'Two co-op parents help in the classroom every session. You will be one of them 2 to 3 times a month.',
        ),
      ],
      callout: B.callout(
        'sky',
        'Caregiver and Me option: if your child is not yet fully potty trained, a parent or guardian is welcome to stay in the building for the entire session. No child is ever turned away.',
      ),
    }),
    B.schedule({
      bg: 'grey',
      header: B.sh(
        'A Typical Morning',
        'What your child’s day looks like',
        'The Threes day has more structure: two circle times, group activities, and centers, while still leaving room for free play and outdoor time every session.',
      ),
      entries: [
        {
          time: '9:30 am',
          title: 'Greeting and Free Play',
          desc: 'Kids arrive and start playing with friends right away.',
        },
        {
          time: '9:45 am',
          title: 'First Circle Time',
          desc: 'Songs, calendar, and group conversation to start the morning.',
        },
        {
          time: '10:00 am',
          title: 'Group Activity',
          desc: 'A teacher-led activity: crafts, science, cooking, or a themed project.',
        },
        {
          time: '10:10 am',
          title: 'Centers and Free Play',
          desc: 'Open play across activity stations with parent helpers.',
        },
        {
          time: '10:50 am',
          title: 'Snack Time',
          desc: 'Parent helpers bring snack. Kids eat and talk together.',
        },
        {
          time: '11:15 am',
          title: 'Second Circle Time',
          desc: 'Stories, literacy activities, and a group wind-down before outdoor play.',
        },
        {
          time: '11:40 am',
          title: 'Outdoor Play and Dismissal',
          desc: 'Playground time. Families pick up at 12:00 pm.',
        },
      ],
    }),
    B.cardGrid({
      bg: 'white',
      columns: 3,
      header: B.sh(
        'Ohio Early Learning Standards',
        'What your three-year-old learns at WCP',
        'The Threes curriculum introduces real literacy and number skills alongside science, social studies, and creative expression, all grounded in Ohio’s Early Learning Standards.',
      ),
      cards: [
        B.card(
          undefined,
          'sky',
          'Reading and phonics',
          'Recognising and naming letters, identifying rhymes, spotting their own name in print, and responding to read-alouds.',
        ),
        B.card(
          undefined,
          'sky',
          'Writing',
          'Practising writing from top to bottom and printing letters from their own name with assistance.',
        ),
        B.card(
          undefined,
          'sky',
          'Math',
          'Counting to 10, identifying numerals 0-5, naming shapes, and sorting by size, colour, and shape.',
        ),
        B.card(
          undefined,
          'sky',
          'Social and emotional',
          'Following classroom routines, self-confidence, sharing and turn-taking, and respecting authority.',
        ),
        B.card(
          undefined,
          'sky',
          'Fine and gross motor',
          'Crayons, scissors, and clay build small-muscle control; climbing and balancing build coordination for kindergarten.',
        ),
        B.card(
          undefined,
          'sky',
          'Science and social studies',
          'Weather, seasons, animals, plants, and life cycles, plus family heritage, community helpers, and holidays.',
        ),
      ],
      callout: B.callout(
        'warm',
        'Every goal above is drawn directly from Ohio’s Early Learning Content Standards and delivered through play, every single session.',
      ),
    }),
    B.teachers({
      bg: 'grey',
      header: B.sh('Your Child’s Teacher', 'Meet Mrs. Erin'),
      staffRefs: ['staff-erin'],
    }),
    B.testimonials({ bg: 'white', source: 'tag', tag: 'threes', limit: 1 }),
    B.cta({
      title: 'Ready to enroll your three-year-old?',
      lead: 'Enrollment for 2026-27 is open now. Reach out and we will get back to you within a day or two.',
      actions: [
        B.act('Enroll Now', 'accent', { url: '/enroll' }),
        B.act('Schedule a Tour', 'outline-white', { url: '/enroll' }),
      ],
      note: CALL_NOTE,
    }),
  ],
);

// ---------------------------------------------------------------- classes/pre-k
P(
  'classes/pre-k',
  'Pre-K Class',
  B.hero({
    eyebrow: 'Now Enrolling 2026-27 · Ages 4+ · AM and PM',
    title: 'Ready for kindergarten. Ready for anything.',
    lead: 'Pre-K at WCP gives four-year-olds the skills, confidence, and love of learning they need to walk into kindergarten ready. Two session options to fit your family.',
    height: 'tall',
    mediaType: 'image',
    assetId: A.prekHero,
    imageAlt:
      'A Pre-K teacher reads to the class during circle time, with a second teacher assisting',
    actions: [
      B.act('Enroll Your Child', 'accent', { url: '/enroll' }),
      B.act('Schedule a Tour', 'outline-white', { url: '/enroll' }),
    ],
  }),
  [
    B.cardGrid({
      bg: 'grey',
      columns: 3,
      header: B.sh(
        'Class Size',
        'Small classes. Real attention.',
        'Both Pre-K sessions are capped at 12 children with one lead teacher: small enough that Mrs. Lisa knows every child deeply, large enough for the social experience of a real classroom.',
      ),
      cards: [
        B.card(
          'users',
          'orange',
          '12 children max',
          'Both AM and PM sessions are capped at 12 children, well below the averages at larger preschools.',
        ),
        B.card(
          'graduation-cap',
          'sky',
          'Mrs. Lisa, lead teacher',
          'A certified early childhood educator who leads every Pre-K session, AM and PM, with years of experience.',
        ),
        B.card(
          'calendar-days',
          'green',
          'Annual conferences',
          'Pre-K families receive parent-teacher conferences early in the year to help with kindergarten placement.',
        ),
      ],
    }),
    B.classCards({
      bg: 'white',
      header: B.sh(
        'Pre-K Class',
        'Two options to fit your schedule',
        'Both sessions cover the same curriculum. Pick the time that works best for your family.',
      ),
      classRefs: ['class-pre-k-am', 'class-pre-k-pm'],
    }),
    B.cardGrid({
      bg: 'grey',
      columns: 3,
      header: B.sh(
        'Ohio Early Learning Standards',
        'What your Pre-K child learns at WCP',
        'Kindergarten readiness is the heart of our Pre-K program. Every goal below is drawn directly from Ohio’s Early Learning Content Standards and delivered through a structured but playful daily routine.',
      ),
      cards: [
        B.card(
          'book-open',
          'orange',
          'Reading and phonics',
          'Children recognize upper and lower case letters, identify rhymes, isolate syllables through clapping and movement, and begin reading their own first and last name. They predict story events, answer comprehension questions, and retell stories after read-alouds.',
        ),
        B.card(
          'pencil',
          'sky',
          'Writing',
          'Using the Handwriting Without Tears approach, children practice printing letters of their name and other meaningful words. They learn proper letter formation, write from top to bottom in horizontal rows, and develop a mature pencil grip through daily fine motor exercises.',
        ),
        B.card(
          'message-circle',
          'green',
          'Communication',
          'Children speak clearly to express ideas and needs, sustain back-and-forth conversations, recite their home address and phone number, and participate in poems, chants, and nursery rhymes. They also state their parents’ names and follow multi-step oral directions.',
        ),
        B.card(
          'calculator',
          'amber',
          'Math',
          'Counting to 20, identifying numerals 0–20, recognizing coins and their values, identifying 2D and 3D shapes, creating and extending patterns, differentiating left from right, and using the language of time — day, night, yesterday, today, and tomorrow.',
        ),
        B.card(
          'hand',
          'sky',
          'Fine and gross motor',
          'Tracing lines, cutting straight and curved lines, drawing from memory, working puzzles with ten or more pieces, and drawing a person with full body detail. Gross motor includes hopping, skipping, balancing, catching a ball, and climbing with alternating feet.',
        ),
        B.card(
          'microscope',
          'orange',
          'Science and social studies',
          'Weather, seasons, planets, life cycles, dinosaurs, forces and motion, dental health, and our bodies. Social studies covers U.S. symbols, the Pledge of Allegiance, authority figures, community helpers, maps, and different environments.',
        ),
      ],
    }),
    B.teachers({
      bg: 'white',
      header: B.sh('Your Child’s Teacher', 'Meet Mrs. Lisa'),
      staffRefs: ['staff-lisa'],
    }),
    B.cardGrid({
      bg: 'grey',
      columns: 3,
      header: B.sh(
        'Kindergarten Readiness',
        'What WCP Pre-K graduates walk in with',
        'Our curriculum is built around Ohio’s Early Learning Content Standards, aligned with what kindergarten teachers expect on day one.',
      ),
      cards: [
        B.card(
          'book-open',
          'orange',
          'Literacy',
          'Alphabet recognition, phonics basics, and comprehension through daily storytime and reading centers.',
        ),
        B.card(
          'calculator',
          'sky',
          'Math',
          'Counting, patterning, shapes, classifying, and number recognition through hands-on activities every session.',
        ),
        B.card(
          'file-check',
          'green',
          'Fine motor',
          'Handwriting Without Tears builds the pencil control kids need for writing in kindergarten.',
        ),
        B.card(
          'heart-handshake',
          'amber',
          'Social skills',
          'Cooperating, listening, following routines, and managing emotions — the skills teachers say matter most.',
        ),
        B.card(
          'microscope',
          'sky',
          'Science',
          'Curiosity-driven exploration through experiments, sensory bins, and outdoor observation.',
        ),
        B.card(
          'sparkles',
          'orange',
          'Independence',
          'Managing belongings, following directions, and navigating routines without constant adult support.',
        ),
      ],
    }),
    B.testimonials({ bg: 'white', source: 'tag', tag: 'prek', limit: 1 }),
    B.cta({
      title: 'Give your four-year-old the best start.',
      lead: 'Enrollment for 2026-27 Pre-K is open now. AM and PM spots fill up, so reach out soon.',
      actions: [
        B.act('Enroll Now', 'accent', { url: '/enroll' }),
        B.act('Schedule a Tour', 'outline-white', { url: '/enroll' }),
      ],
      note: CALL_NOTE,
    }),
  ],
);

// ---------------------------------------------------------------- donate
P(
  'donate',
  'Donate',
  B.hero({
    eyebrow: 'Support West Chester Preschool',
    title: 'Help a child’s school year shine.',
    lead: 'WCP has been a cornerstone of the West Chester community since 1969. Every dollar donated goes directly toward enriching classrooms, supporting teachers, and keeping our co-op strong for the families who need us most.',
    height: 'tall',
    mediaType: 'none',
    actions: [B.act('Make a Gift', 'accent', { url: '#give' })],
  }),
  [
    B.cardGrid({
      bg: 'white',
      columns: 4,
      header: B.sh(
        'Your Impact',
        'Every gift goes straight to the classroom',
        'WCP is a parent-run cooperative. There is no large administrative overhead — donations fund things families and teachers can actually see and use.',
      ),
      cards: [
        B.card(
          'palette',
          'orange',
          'Classroom Supplies',
          'Covers a full month of art supplies for one class — paint, paper, glue, and craft materials kids love.',
          '$25',
        ),
        B.card(
          'book-open',
          'sky',
          'New Books',
          'Adds a collection of new books to a classroom library that children read every single day.',
          '$50',
        ),
        B.card(
          'puzzle',
          'green',
          'Learning Materials',
          'Funds sensory bins, puzzles, or manipulatives — the hands-on tools that make play-based learning work.',
          '$100',
        ),
        B.card(
          'star',
          'amber',
          'Enrichment Programs',
          'Sponsors a special event or enrichment session for all WCP children — field trips, guests, and seasonal celebrations.',
          '$250+',
        ),
      ],
    }),
    B.cta({
      title: 'Ready to support WCP?',
      lead: 'Online giving is coming soon. In the meantime, the fastest way to give is to reach the treasurer directly.',
      tone: 'cream',
      actions: [
        B.act('Email the Treasurer', 'primary', {
          url: 'mailto:treasurer@westchesterpreschool.org',
        }),
        B.act('Call (513) 202-6187', 'outline', { url: 'tel:5132026187' }),
      ],
      note: 'Secure giving · 100% to WCP · Receipt on request',
    }),
    B.cardGrid({
      bg: 'white',
      columns: 3,
      header: B.sh(
        'Where Your Money Goes',
        'Transparent. Local. All for the kids.',
        'Our fundraising is managed by the WCP Vice President in coordination with the Executive Board. All spending decisions are made at open monthly board meetings where any family can attend and participate.',
      ),
      cards: [
        B.card(
          'blocks',
          'orange',
          'Classroom resources and supplies',
          'Art materials, sensory tools, games, books, and the hands-on supplies that fill our classrooms with things for children to explore and create with.',
        ),
        B.card(
          'trees',
          'green',
          'Playground and facility upgrades',
          'Donations help maintain and improve our outdoor play space, gym equipment, and classroom furnishings — keeping the school a safe, joyful place to learn.',
        ),
        B.card(
          'party-popper',
          'sky',
          'Enrichment and special events',
          'Field trips, enrichment programs, seasonal celebrations, and the extra experiences that make a school year memorable for children and families alike.',
        ),
        B.card(
          'graduation-cap',
          'amber',
          'Teacher appreciation and development',
          'Extra fundraising goes toward teacher bonuses, raises, and professional development. Our teachers are the heart of WCP and we work to show it.',
        ),
        B.card(
          'piggy-bank',
          'green',
          'Keeping tuition affordable',
          'Donations help close the gap between tuition revenue and operating costs. The less we need to raise tuition, the more accessible WCP stays for every family.',
        ),
        B.card(
          'hand-heart',
          'orange',
          'Community programs',
          'Support for open house events, new family orientations, and outreach that helps families discover WCP and feel at home when they arrive.',
        ),
      ],
    }),
    B.cardGrid({
      bg: 'grey',
      columns: 3,
      header: B.sh(
        'More Ways to Help',
        'Not just cash — every kind of support counts',
        'Money is helpful. But WCP also thrives on in-kind support, business partnerships, and community word-of-mouth.',
      ),
      cards: [
        B.card(
          'building-2',
          'sky',
          'Business and corporate giving',
          'Local businesses can sponsor classroom supplies, enrichment events, or annual fundraisers. Your business name is acknowledged in school communications. Email us to discuss partnership options.',
        ),
        B.card(
          'shopping-bag',
          'green',
          'In-kind donations',
          'New or gently-used classroom materials, art supplies, books, games, and sensory items are always welcome. Reach out before donating so we can confirm what is most needed.',
        ),
        B.card(
          'megaphone',
          'orange',
          'Spread the word',
          'Leave a Google or Facebook review. Share WCP posts on social media. Tell a friend who is looking for a preschool. Word-of-mouth is the most powerful support a small school can get.',
        ),
      ],
    }),
    B.faqSection({
      bg: 'white',
      source: 'inline',
      header: B.sh('Questions About Giving', 'Donation FAQ'),
      inlineItems: [
        {
          q: 'Is my donation tax-deductible?',
          a: 'WCP is a nonprofit parent cooperative. We recommend speaking with your tax advisor regarding deductibility. For questions about our tax status or to request documentation, email treasurer@westchesterpreschool.org.',
        },
        {
          q: 'How is my donation used?',
          a: 'All donations support WCP’s operating budget and enrichment programs. This includes classroom supplies, playground upkeep, teacher support, special events, and keeping tuition affordable for enrolled families. Spending decisions are made by the volunteer parent board at open monthly meetings.',
        },
        {
          q: 'Can I set up a recurring monthly gift?',
          a: 'Yes. Once online giving is live, our donation form will support both one-time and recurring monthly gifts. Monthly giving helps us plan ahead and is especially valuable for a small school like WCP. In the meantime, contact the treasurer to arrange recurring support.',
        },
        {
          q: 'Can my business make a donation or sponsorship?',
          a: 'Absolutely. We welcome business sponsorships of classroom materials, enrichment events, and annual fundraisers. Your support is acknowledged in school communications. Email president@westchesterpreschool.org to start a conversation.',
        },
        {
          q: 'Will I receive a receipt for my donation?',
          a: 'Yes. A receipt is provided for every gift — keep it for your records. Email the treasurer if you need documentation for a specific donation.',
        },
        {
          q: 'I don’t have children at WCP — can I still donate?',
          a: 'Of course. WCP has been part of the West Chester community since 1969. We welcome support from alumni families, neighbors, local businesses, and anyone who values quality early childhood education in our area.',
        },
      ],
    }),
    B.cta({
      title: 'Every gift makes a difference.',
      lead: 'Your donation, whatever the size, makes a real difference for the children and families in our community.',
      tone: 'navy',
      actions: [
        B.act('Email the Treasurer', 'accent', {
          url: 'mailto:treasurer@westchesterpreschool.org',
        }),
      ],
    }),
  ],
);

// ---------------------------------------------------------------- accessibility
P(
  'accessibility',
  'Accessibility',
  B.hero({
    eyebrow: 'Accessibility',
    title: 'A website everyone can use.',
    lead: 'We want every family to be able to use this site — including people who use assistive technology.',
    height: 'medium',
    mediaType: 'none',
  }),
  [
    B.proseSection({
      bg: 'white',
      body: [
        B.p(B.strong('Last updated:'), ' July 2026'),
        B.h2('Our commitment'),
        B.p(
          'West Chester Preschool is committed to making its website accessible to everyone, including people with disabilities. We aim to conform to the ',
          B.link(
            'Web Content Accessibility Guidelines (WCAG) 2.1, Level AA',
            'https://www.w3.org/WAI/WCAG21/quickref/',
          ),
          ', which explain how to make web content more accessible for people with a wide range of abilities.',
        ),
        B.h2('What we have done'),
        B.bullet(
          'Built the site with semantic HTML and labeled landmarks so screen readers can navigate it.',
        ),
        B.bullet(
          'Made every interactive element usable with a keyboard, with a visible focus indicator and a skip-to-content link.',
        ),
        B.bullet('Chosen text and color combinations that meet AA contrast ratios.'),
        B.bullet('Provided descriptive alternative text for meaningful images.'),
        B.bullet(
          'Respected the “reduce motion” setting — animations are minimized for visitors who prefer that.',
        ),
        B.bullet(
          'Ensured the site reflows without horizontal scrolling down to a 320-pixel width and at 400% zoom.',
        ),
        B.h2('Ongoing effort'),
        B.p(
          'Accessibility is an ongoing effort, not a one-time fix. We continue to test the site and improve it over time. Some content — such as documents or third-party tools we link to — may not yet be fully accessible, and we are working on it.',
        ),
        B.h2('Tell us if something isn’t working'),
        B.p(
          'If you run into a barrier on this site, or need information in a different format, please let us know and we will help. We aim to respond within 1–2 business days.',
        ),
        B.bullet(
          'Email: ',
          B.link('president@westchesterpreschool.org', 'mailto:president@westchesterpreschool.org'),
        ),
        B.bullet('Phone: ', B.link('(513) 202-6187', 'tel:5132026187')),
      ],
    }),
  ],
);

// ---------------------------------------------------------------- privacy
P(
  'privacy',
  'Privacy',
  B.hero({
    eyebrow: 'Privacy',
    title: 'Your privacy matters to us.',
    lead: 'We keep this simple: we collect as little as possible, and we never sell your information.',
    height: 'medium',
    mediaType: 'none',
  }),
  [
    B.proseSection({
      bg: 'white',
      body: [
        B.p(B.strong('Last updated:'), ' July 2026'),
        B.p(
          'This policy explains how West Chester Preschool (“WCP,” “we,” “us”) handles personal information in connection with this website. WCP is a parent-run cooperative preschool in West Chester, Ohio.',
        ),
        B.h2('Information we collect'),
        B.p(
          'This website is largely static and does not require you to create an account. We only receive personal information that you choose to give us:',
        ),
        B.bullet(
          B.strong('When you contact us'),
          ' — if you email, call, or send an enrollment or tour request, we receive the details you provide, such as your name, email address, phone number, and your child’s age.',
        ),
        B.bullet(
          B.strong('Basic site analytics'),
          ' — we may use privacy-respecting analytics to understand which pages are visited so we can improve the site. This is aggregate information and is not used to identify you personally.',
        ),
        B.h2('How we use it'),
        B.p(
          'We use the information you provide only to respond to you, schedule tours, process enrollment interest, and communicate about the school. We do not sell, rent, or trade your personal information to anyone.',
        ),
        B.h2('Enrolled-family information'),
        B.p(
          'Information about enrolled families — such as the family directory — is kept separate from this public website and is only available to logged-in WCP families. It is never published publicly.',
        ),
        B.h2('Children’s privacy'),
        B.p(
          'This website is intended for parents and guardians, not children. We do not knowingly collect personal information from children under 13.',
        ),
        B.h2('Cookies and third-party links'),
        B.p(
          'We use only the cookies necessary for the site to function and, where enabled, analytics cookies. This site links to third-party services — for example ClassDojo, Google Maps, and our online store — which have their own privacy policies. We are not responsible for the practices of those services.',
        ),
        B.h2('Your choices'),
        B.p(
          'You can ask us what personal information you have shared with us, and request that we correct or delete it, by contacting us. You can also decline non-essential cookies in your browser settings.',
        ),
        B.h2('Changes to this policy'),
        B.p(
          'We may update this policy from time to time. When we do, we will revise the “last updated” date above.',
        ),
        B.h2('Contact us'),
        B.bullet(
          'Email: ',
          B.link('president@westchesterpreschool.org', 'mailto:president@westchesterpreschool.org'),
        ),
        B.bullet('Phone: ', B.link('(513) 202-6187', 'tel:5132026187')),
        B.bullet('Mail: 9463 Cincinnati Columbus Rd, West Chester, OH 45069'),
      ],
    }),
  ],
);

// ---------------------------------------------------------------- terms
P(
  'terms',
  'Terms of Use',
  B.hero({
    eyebrow: 'Terms of Use',
    title: 'The fine print, in plain language.',
    lead: 'A few things to know about using this website.',
    height: 'medium',
    mediaType: 'none',
  }),
  [
    B.proseSection({
      bg: 'white',
      body: [
        B.p(B.strong('Last updated:'), ' July 2026'),
        B.p(
          'These terms apply to your use of the West Chester Preschool (“WCP”) website. By using the site, you agree to them. If you do not agree, please do not use the site.',
        ),
        B.h2('Informational purpose'),
        B.p(
          'This website is provided for general information about our school. It is not itself an enrollment agreement or a contract. Enrollment, tuition, and co-op participation are governed by the separate paperwork you complete when you register.',
        ),
        B.h2('Accuracy and changes'),
        B.p(
          'We work hard to keep the information here accurate and up to date, but details such as tuition, fees, schedules, and dates can change. We may update or correct content at any time without notice. If a specific detail matters to your decision, please confirm it with us directly.',
        ),
        B.h2('Our content'),
        B.p(
          'The text, photographs, logo, and design on this site belong to West Chester Preschool or are used with permission, and are protected by copyright and trademark law. Please do not reuse them without our permission. Photographs of children are published with their families’ permission.',
        ),
        B.h2('Links to other sites'),
        B.p(
          'This site links to third-party services and websites — for example our online store, ClassDojo, and Google Maps. We do not control those sites and are not responsible for their content or practices. Visiting them is at your own discretion.',
        ),
        B.h2('No warranty'),
        B.p(
          'This site is provided “as is.” We make no warranties about its availability or that it will be error-free, and to the extent permitted by law we are not liable for any loss arising from your use of it.',
        ),
        B.h2('Governing law'),
        B.p('These terms are governed by the laws of the State of Ohio.'),
        B.h2('Contact us'),
        B.bullet(
          'Email: ',
          B.link('president@westchesterpreschool.org', 'mailto:president@westchesterpreschool.org'),
        ),
        B.bullet('Phone: ', B.link('(513) 202-6187', 'tel:5132026187')),
      ],
    }),
  ],
);

// ---------------------------------------------------------------- navigation
const nl = (label, slug) => ({
  _type: 'navLink',
  _key: B.key(),
  label,
  linkType: 'page',
  page: B.ref(B.pageId(slug)),
});
const nlUrl = (label, url) => ({ _type: 'navLink', _key: B.key(), label, linkType: 'url', url });
const ng = (label, children) => ({ _type: 'navGroup', _key: B.key(), label, children });
const col = (label, links) => ({ _key: B.key(), label, links });

pages.push({
  _id: 'navigation',
  _type: 'navigation',
  mainNav: [
    nl('Home', 'home'),
    nl('About', 'about'),
    ng('Classes', [
      nl('Twos Class', 'classes/twos'),
      nl('Threes Class', 'classes/threes'),
      nl('Pre-K Class', 'classes/pre-k'),
      nl('Co-op Life', 'co-op-life'),
    ]),
    nl('Enroll', 'enroll'),
    nl('Virtual Tour', 'virtual-tour'),
    ng('Families', [
      nl('Why WCP?', 'why-wcp'),
      nlUrl('Enrolled Families', '/family-hub'),
      nlUrl('Store', 'https://store.westchesterpreschool.org'),
    ]),
    nl('Contact', 'contact'),
  ],
  footerColumns: [
    col('Classes', [
      nl('Twos Class', 'classes/twos'),
      nl('Threes Class', 'classes/threes'),
      nl('Pre-K Class', 'classes/pre-k'),
      nl('Co-op Life', 'co-op-life'),
    ]),
    col('Families', [
      nl('Why WCP?', 'why-wcp'),
      nl('A Day at WCP', 'a-day-at-wcp'),
      nl('Tuition & Fees', 'tuition'),
      nl('FAQ', 'faq'),
      nlUrl('Enrolled Families', '/family-hub'),
    ]),
    col('Get Started', [
      nl('Enroll', 'enroll'),
      nl('Schedule a Tour', 'enroll'),
      nl('Virtual Tour', 'virtual-tour'),
      nl('Contact', 'contact'),
    ]),
    col('Get Involved', [
      nl('Work With Us', 'work-with-us'),
      nl('Donate', 'donate'),
      nl('Newsletter', 'newsletter'),
      nlUrl('Store', 'https://store.westchesterpreschool.org'),
    ]),
  ],
  legalNav: [
    nl('Accessibility', 'accessibility'),
    nl('Privacy', 'privacy'),
    nl('Terms of Use', 'terms'),
  ],
});

// ---------------------------------------------------------------------------
const tx = pages.reduce((t, doc) => t.createOrReplace(doc), client.transaction());
await tx.commit();
console.log(`migrated ${pages.length} pages:`, pages.map((p) => p.slug).join(', '));
