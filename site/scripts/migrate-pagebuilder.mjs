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
};

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
    height: 'medium',
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

// ---------------------------------------------------------------------------
const tx = pages.reduce((t, doc) => t.createOrReplace(doc), client.transaction());
await tx.commit();
console.log(`migrated ${pages.length} pages:`, pages.map((p) => p.slug).join(', '));
