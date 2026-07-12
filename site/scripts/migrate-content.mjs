import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';

const SITE_DIR = 'C:/Users/natha/Documents/Claude/Projects/West Chester Preschool Website/site';
const DATA = JSON.parse(
  readFileSync(
    'C:/Users/natha/AppData/Local/Temp/claude/C--Users-natha-Documents-Claude-Projects-West-Chester-Preschool-Website/6a64c7f0-166c-4659-ad15-f73c7bb22ae3/scratchpad/migration-data.json',
  ),
);
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

let keyN = 0;
const key = () => `k${keyN++}`;
// plain text (with \n\n paragraph breaks) -> Portable Text blocks
const toPT = (text) =>
  String(text || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({
      _type: 'block',
      _key: key(),
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: key(), text: p, marks: [] }],
    }));
const ref = (id) => ({ _type: 'reference', _ref: id });
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const docs = [];

// ---- Site Settings (singleton) --------------------------------------------
docs.push({
  _id: 'siteSettings',
  _type: 'siteSettings',
  name: 'West Chester Preschool',
  shortName: 'WCP',
  founded: 1969,
  tagline: 'A parent-run cooperative preschool in West Chester, Ohio.',
  url: 'https://www.westchesterpreschool.org',
  phone: '(513) 202-6187',
  emailGeneral: 'president@westchesterpreschool.org',
  emailAdmin: 'admin@westchesterpreschool.org',
  emailTreasurer: 'treasurer@westchesterpreschool.org',
  street: '9463 Cincinnati Columbus Rd',
  city: 'West Chester',
  state: 'OH',
  zip: '45069',
  parkingNote:
    'Enter through the rear west doors — look for Door 5, a set of double white doors with white pillars on either side. Park near the concrete sidewalk by the rear doors.',
  schoolYearLabel: '2026-27',
  enrolling: true,
  closureStatement: 'WCP follows Lakota Local Schools for weather closures.',
  license: 'Licensed under Ohio Day Care Licensing Code 5101:2-12',
  licenseAuthority: 'ODJFS',
  facebook: 'https://www.facebook.com/westchesterpreschool',
  instagram: 'https://www.instagram.com/westchesterpreschool',
});

// ---- Staff -----------------------------------------------------------------
for (const s of DATA.staff) {
  docs.push({
    _id: `staff-${s.key}`,
    _type: 'staff',
    name: s.name,
    honorific: s.honorific || undefined,
    role: s.role || undefined,
    years: s.years || undefined,
    email: s.email || undefined,
    pullQuote: s.pullQuote || undefined,
    bio: toPT(s.bio),
    order: s.key === 'erin' ? 0 : 1,
  });
}

// ---- Classes (reference their teacher) ------------------------------------
const CLASSES = [
  {
    id: 'class-twos',
    name: 'Twos',
    slug: 'twos',
    icon: 'star',
    color: 'amber',
    teacher: 'staff-erin',
    tagline: 'A gentle first taste of school, in a small group.',
    days: 'Thursdays',
    daysCount: '1 day per week',
    time: '9:30 am – 12:00 pm',
    age: 'Age 2 by Sept 30',
    classSizeCap: 7,
    monthly: '$70',
    annual: '$630',
    studentFee: '$45',
    payId: 'NBFM9AD6GTW7A',
    studentFeePayId: 'GQZ67ZRZ4W9UN',
    order: 0,
  },
  {
    id: 'class-threes',
    name: 'Threes',
    slug: 'threes',
    icon: 'sprout',
    color: 'green',
    teacher: 'staff-erin',
    tagline: 'A joyful first real school experience.',
    days: 'Mon, Tue, Wed',
    daysCount: '3 days per week',
    time: '9:30 am – 12:00 pm',
    age: 'Age 3 by Sept 30',
    classSizeCap: 12,
    monthly: '$150',
    annual: '$1,350',
    studentFee: '$45',
    payId: 'J7HLQFJU8NRAG',
    studentFeePayId: 'GQZ67ZRZ4W9UN',
    order: 1,
  },
  {
    id: 'class-pre-k-am',
    name: 'Pre-K AM',
    slug: 'pre-k-am',
    icon: 'sun',
    color: 'orange',
    teacher: 'staff-lisa',
    tagline: 'Kindergarten readiness, four mornings a week.',
    days: 'Mon, Tue, Wed, Thu',
    daysCount: '4 days per week',
    time: '9:15 am – 12:00 pm',
    age: 'Age 4 by Sept 30',
    classSizeCap: 12,
    monthly: '$200',
    annual: '$1,800',
    studentFee: '$50',
    payId: '3WPPH6QVGPPCJ',
    studentFeePayId: 'A797LM4LL5PGJ',
    order: 2,
  },
  {
    id: 'class-pre-k-pm',
    name: 'Pre-K PM',
    slug: 'pre-k-pm',
    icon: 'moon',
    color: 'sky',
    teacher: 'staff-lisa',
    tagline: 'Kindergarten readiness on an afternoon schedule.',
    days: 'Mon, Tue, Wed',
    daysCount: '3 days per week',
    time: '12:30 pm – 3:15 pm',
    age: 'Age 4 by Sept 30',
    classSizeCap: 12,
    monthly: '$175',
    annual: '$1,575',
    studentFee: '$50',
    payId: '63E76WAWQL5WJ',
    studentFeePayId: 'A797LM4LL5PGJ',
    order: 3,
  },
];
for (const c of CLASSES) {
  docs.push({
    _id: c.id,
    _type: 'class',
    name: c.name,
    slug: { _type: 'slug', current: c.slug },
    icon: c.icon,
    color: c.color,
    tagline: c.tagline,
    teacher: ref(c.teacher),
    days: c.days,
    daysCount: c.daysCount,
    time: c.time,
    age: c.age,
    classSizeCap: c.classSizeCap,
    monthly: c.monthly,
    annual: c.annual,
    studentFee: c.studentFee,
    payId: c.payId,
    studentFeePayId: c.studentFeePayId,
    order: c.order,
  });
}

// ---- Fee Schedule (singleton) ---------------------------------------------
docs.push({
  _id: 'feeSchedule',
  _type: 'feeSchedule',
  registrationFee: '$100',
  registrationNote:
    'A one-time fee due at enrollment that secures your child’s place. Non-refundable once enrollment is confirmed.',
  registrationPayId: 'CUDQHL444WZLC',
  participationFee: '$100',
  participationNote:
    'Due at the May Gathering (or at registration if you enroll mid-year). Returned at year-end when all co-op commitments have been fulfilled.',
  participationPayId: 'LB4PP7LPYD5R2',
  annualAdjustmentNote:
    'Tuition is subject to a 5–15% annual adjustment; rates for each school year are confirmed before enrollment opens.',
  studentFeeBands: [
    { _key: key(), label: 'Twos & Threes', amount: '$45', payId: 'GQZ67ZRZ4W9UN' },
    { _key: key(), label: 'Pre-K AM & PM', amount: '$50', payId: 'A797LM4LL5PGJ' },
  ],
  paymentTerms: [
    {
      _key: key(),
      icon: 'calendar-days',
      question: 'When tuition is due',
      answer: 'The 1st of each month. You have through the 7th to pay before a late fee applies.',
    },
    {
      _key: key(),
      icon: 'clock',
      question: 'Late fee',
      answer: '10% of the month’s tuition is added if your payment arrives after the 7th.',
    },
    {
      _key: key(),
      icon: 'circle-dollar-sign',
      question: 'How to pay',
      answer:
        'Use the PayPal buttons on this page (small processing fee), pay by check, or pay in cash. All three work the same to the school.',
    },
    {
      _key: key(),
      icon: 'mail',
      question: 'Paying by check',
      answer:
        'Make checks payable to WCP and write your child’s name in the memo line. Drop it in the Treasurer’s mailbox at school or hand it to her in person.',
    },
    {
      _key: key(),
      icon: 'coins',
      question: 'Paying for the full year',
      answer:
        'There’s no annual discount, but you can skip monthly billing entirely — email the Treasurer to arrange a single yearly payment.',
    },
  ],
});

// ---- Testimonials ----------------------------------------------------------
DATA.testimonials.forEach((t, i) => {
  docs.push({
    _id: `testimonial-${i}`,
    _type: 'testimonial',
    quote: t.quote,
    author: t.author || undefined,
    role: t.role || undefined,
    tags: t.tags && t.tags.length ? t.tags : undefined,
    featured: !!t.featured,
    order: t.order ?? i,
  });
});

// ---- FAQs ------------------------------------------------------------------
DATA.faqs.forEach((f, i) => {
  docs.push({
    _id: `faq-${i}`,
    _type: 'faqItem',
    question: f.question,
    answer: toPT(f.answer),
    category: f.category,
    order: f.order ?? i,
  });
});

// ---- School-Year Events ----------------------------------------------------
DATA.schoolYearEvents.forEach((e, i) => {
  docs.push({
    _id: `event-${i}`,
    _type: 'schoolYearEvent',
    title: e.title,
    month: e.month || undefined,
    body: e.body || undefined,
    icon: e.icon || undefined,
    accent: e.accent || 'sky',
    order: e.order ?? i,
  });
});

// ---- Legal Pages -----------------------------------------------------------
for (const p of DATA.legalPages) {
  docs.push({
    _id: `legal-${p.slug}`,
    _type: 'legalPage',
    title: p.title,
    slug: p.slug,
    eyebrow: p.eyebrow || undefined,
    lead: p.lead || undefined,
    body: toPT(p.body),
    lastUpdated: '2026-07-01', // source said "July 2026"
  });
}

// ---- Page hero copy --------------------------------------------------------
for (const p of DATA.pageHeros) {
  docs.push({
    _id: `page-${slugify(p.slug)}`,
    _type: 'page',
    title: p.slug === 'home' ? 'Home' : p.slug.replace(/\//g, ' / '),
    slug: p.slug,
    eyebrow: p.eyebrow || undefined,
    heroTitle: p.title || undefined,
    lead: p.lead || undefined,
    seoTitle: p.seoTitle || undefined,
    seoDescription: p.seoDescription || undefined,
  });
}

// ---- Co-op Roles -----------------------------------------------------------
// The extraction stored each role's TIER as its display label (e.g. "Executive
// Board"); the coopRole schema's `tier` field expects the short key ("board").
// Normalize here so it matches the schema's option list.
const TIER_LABEL_TO_KEY = {
  'Executive Board': 'board',
  'Cabinet Chairs': 'chairs',
  'Class Representatives': 'reps',
  'Committee Members': 'committee',
};
DATA.coopRoles.forEach((r, i) => {
  docs.push({
    _id: `coop-${i}`,
    _type: 'coopRole',
    name: r.name,
    tier: TIER_LABEL_TO_KEY[r.tier] ?? r.tier,
    icon: r.icon || undefined,
    team: r.team || undefined,
    reportsTo: r.reportsTo || undefined,
    stipend: r.stipend || undefined,
    body: r.body || undefined,
    order: r.order ?? i,
  });
});

// ---- Family Hub: Documents & Forms -----------------------------------------
const HUB_DOC_GROUPS = [
  {
    key: 'required',
    docs: [
      {
        name: 'Health & Immunization Record',
        icon: 'heart-pulse',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'Emergency Contact Form',
        icon: 'phone',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'Medical Authorization Form',
        icon: 'file-check',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'Photo & Media Release Form',
        icon: 'camera',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
    ],
  },
  {
    key: 'handbook',
    docs: [
      {
        name: 'Family Handbook 2026-27',
        icon: 'book-open',
        href: 'https://canva.link/***REMOVED***',
      },
      {
        name: 'WCP Bylaws',
        description: 'Governing documents',
        icon: 'scale',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'Super Helper Guide',
        description: 'Classroom helper certification process',
        icon: 'shield-check',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'WCP Safety Plan',
        description: 'Required by Ohio licensing',
        icon: 'shield-check',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'Co-op Structure Org Chart',
        description: '2026-27 roles and reporting',
        icon: 'clipboard-list',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'Proposed Budget 2026-27',
        description: 'For board transparency',
        icon: 'coins',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
    ],
  },
  {
    key: 'orient',
    docs: [
      {
        name: 'May Gathering Slide Deck',
        description: '2026-27 welcome meeting (May 11, 2026)',
        icon: 'party-popper',
        href: 'https://docs.google.com/presentation/d/***REMOVED***/edit?usp=sharing',
      },
      {
        name: 'Orientation Slide Deck',
        description: '2025-26 version (current)',
        icon: 'graduation-cap',
        href: 'https://canva.link/***REMOVED***',
      },
    ],
  },
];
let hubDocN = 0;
for (const group of HUB_DOC_GROUPS) {
  group.docs.forEach((d, i) => {
    docs.push({
      _id: `hubdoc-${group.key}-${i}`,
      _type: 'hubDocument',
      title: d.name,
      category: group.key,
      description: d.description,
      icon: d.icon,
      sourceType: 'link',
      link: d.href,
      order: hubDocN++,
    });
  });
}

// ---- Write in one transaction ---------------------------------------------
console.log(`Prepared ${docs.length} documents. Writing…`);
const tx = client.transaction();
for (const d of docs) tx.createOrReplace(d);
const res = await tx.commit();
const counts = {};
for (const d of docs) counts[d._type] = (counts[d._type] || 0) + 1;
console.log('✓ committed. By type:', JSON.stringify(counts, null, 0));
console.log('transaction id:', res.transactionId);
