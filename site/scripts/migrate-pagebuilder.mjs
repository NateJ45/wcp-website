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

// ---------------------------------------------------------------------------
const tx = pages.reduce((t, doc) => t.createOrReplace(doc), client.transaction());
await tx.commit();
console.log(`migrated ${pages.length} pages:`, pages.map((p) => p.slug).join(', '));
