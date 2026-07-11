// Seeds a single "sandbox" builder page to test the section renderer end to
// end (hero + a spread of section types). Safe + idempotent (createOrReplace).
// Run: node scripts/seed-sandbox.mjs
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';

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

let n = 0;
const key = () => `k${n++}`;
const pt = (text) => [
  {
    _type: 'block',
    _key: key(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
  },
];

const doc = {
  _id: 'page-sandbox',
  _type: 'page',
  title: 'Sandbox',
  slug: 'sandbox',
  hero: {
    _type: 'heroObject',
    eyebrow: 'Page builder',
    title: 'A page you can build and belong to.',
    accentWord: 'belong',
    accentColor: 'amber',
    lead: 'This sandbox page is composed entirely from Sanity sections to prove the renderer.',
    height: 'medium',
    mediaType: 'none',
    actions: [
      { _key: key(), label: 'Enroll Now', style: 'accent', linkType: 'url', url: '/enroll' },
    ],
  },
  sections: [
    {
      _type: 'proseSection',
      _key: key(),
      background: 'white',
      narrow: true,
      header: {
        _type: 'sectionHeader',
        eyebrow: 'Our Story',
        title: 'A prose section',
        align: 'center',
      },
      body: pt('This is a prose section rendered from richProse through Prose.astro.'),
    },
    {
      _type: 'cardGridSection',
      _key: key(),
      background: 'grey',
      columns: 3,
      layout: 'card',
      header: { _type: 'sectionHeader', eyebrow: 'Why WCP', title: 'A card grid', align: 'center' },
      cards: [
        {
          _key: key(),
          icon: 'users',
          chip: 'sky',
          title: 'A real co-op',
          body: 'Families run the school alongside the teachers.',
        },
        {
          _key: key(),
          icon: 'palette',
          chip: 'orange',
          title: 'Play-based',
          body: 'Built on Ohio standards, delivered through play.',
        },
        {
          _key: key(),
          icon: 'piggy-bank',
          chip: 'green',
          title: 'Affordable',
          body: 'Starting at $70 a month.',
        },
      ],
    },
    {
      _type: 'statBandSection',
      _key: key(),
      ariaLabel: 'By the numbers',
      stats: [
        { _key: key(), value: '55', suffix: '+', label: 'Years', note: 'Founded 1969.' },
        { _key: key(), value: '70', prefix: '$', label: 'Tuition from', note: 'Per month.' },
        { _key: key(), value: '12', label: 'Per class', note: 'Small by design.' },
        { _key: key(), value: '4', label: 'Class options', note: 'Twos to Pre-K.' },
      ],
    },
    {
      _type: 'testimonialSection',
      _key: key(),
      background: 'white',
      seam: true,
      source: 'featured',
      limit: 3,
      layout: 'grid',
      confetti: true,
      header: {
        _type: 'sectionHeader',
        eyebrow: 'From our families',
        title: 'Testimonials (from the library)',
        align: 'center',
      },
    },
    {
      _type: 'faqSection',
      _key: key(),
      background: 'grey',
      source: 'category',
      category: 'coop',
      header: {
        _type: 'sectionHeader',
        eyebrow: 'Questions',
        title: 'FAQ (from the library)',
        align: 'center',
      },
    },
    {
      _type: 'ctaSection',
      _key: key(),
      title: 'Come see it for yourself.',
      lead: 'Reach out and we will be in touch within a day or two.',
      tone: 'navy',
      seam: true,
      actions: [
        { _key: key(), label: 'Enroll Now', style: 'accent', linkType: 'url', url: '/enroll' },
        {
          _key: key(),
          label: 'Schedule a Tour',
          style: 'outline-white',
          linkType: 'url',
          url: '/enroll',
        },
      ],
    },
  ],
};

const res = await client.createOrReplace(doc);
console.log('seeded', res._id);
