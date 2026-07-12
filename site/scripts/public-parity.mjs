// =============================================================================
// public-parity.mjs — close the content gaps an audit found on the public
// pages migrated "from memory" (enroll, contact, virtual-tour, work-with-us).
// =============================================================================
// Inserts the missing sections (inquiry/application forms, class cards, tuition
// table, contact FAQ + CTA, tour testimonials, job qualifications) into each
// page's `sections` array, before its first CTA. Reuses existing class /
// feeSchedule / testimonial docs. Idempotent (fixed pp-* section keys). Patches
// published + draft. Run: node scripts/public-parity.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  sh,
  p,
  bullet,
  cardGrid,
  card,
  classCards,
  tuitionTable,
  testimonials,
  faqSection,
  proseSection,
  cta,
  act,
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

const CLASS_REFS = ['class-twos', 'class-threes', 'class-pre-k-am', 'class-pre-k-pm'];

// A formSection object (fixed fields: name/email/phone/message + a topic tag).
const form = (o) => ({
  _type: 'formSection',
  ...(o.bg ? { background: o.bg } : { background: 'grey' }),
  ...(o.seam ? { seam: true } : {}),
  ...(o.header ? { header: o.header } : {}),
  topic: o.topic,
  showPhone: o.showPhone !== false,
  buttonLabel: o.buttonLabel ?? 'Send message',
  ...(o.successMessage ? { successMessage: o.successMessage } : {}),
});

// Missing sections per page. Each gets a stable pp-* _key so re-runs replace.
function additionsFor(slug) {
  switch (slug) {
    case 'enroll':
      return [
        {
          ...classCards({
            bg: 'white',
            header: sh(
              'Our classes',
              'Which class is right for your child?',
              'Ages two through five, each on its own schedule. Your child needs to reach the class age by September 30.',
            ),
            classRefs: CLASS_REFS,
          }),
          _key: 'pp-enroll-classes',
        },
        {
          ...tuitionTable({
            bg: 'grey',
            seam: true,
            header: sh(
              'Tuition',
              'Clear, affordable pricing',
              'Pay monthly or annually, plus one-time registration and student fees. The registration fee is due at enrollment.',
            ),
          }),
          _key: 'pp-enroll-tuition',
        },
        {
          ...form({
            bg: 'white',
            seam: true,
            header: sh(
              'Get started',
              'Ask about enrolling',
              'Send us your child’s name and birthdate and the class you’re interested in, and we’ll follow up within a day or two.',
            ),
            topic: 'Enrollment inquiry',
            showPhone: true,
            buttonLabel: 'Send inquiry',
            successMessage:
              'Thank you! We have your enrollment inquiry and will be in touch within a day or two.',
          }),
          _key: 'pp-enroll-form',
        },
      ];

    case 'contact':
      return [
        {
          ...faqSection({
            bg: 'grey',
            seam: true,
            header: sh('Quick Answers', 'Common questions', null),
            source: 'inline',
            inlineItems: [
              {
                q: 'How do I enroll?',
                a: 'Head to our Enroll page, pick a class, and send the inquiry form. We follow up within a day or two to set up a tour and walk you through the next steps.',
              },
              {
                q: 'What does it cost?',
                a: 'Tuition starts at $70 a month for our Twos class and rises by class. The full breakdown, including fees, is on the Tuition page.',
              },
              {
                q: 'How does the co-op work?',
                a: 'Every family helps in the classroom a couple of times a month and holds one co-op job for the year. It is what keeps tuition low and the community close. The Co-op Life page has the details.',
              },
              {
                q: 'Which class is right for my child?',
                a: 'It comes down to your child’s age by September 30 and your schedule. Each class page lays out the days, times, and what the room is like.',
              },
              {
                q: 'I have more questions.',
                a: 'Send them through the form above or call us at (513) 202-6187. A real parent volunteer will get back to you.',
              },
              {
                q: 'Can we see the school first?',
                a: 'Yes, please. A tour is the best way to know if WCP fits your family. Ask for one through the form or on the Enroll page.',
              },
            ],
          }),
          _key: 'pp-contact-faq',
        },
        {
          ...cta({
            title: 'Come for a tour. No commitment needed.',
            lead: 'Meet the teachers, walk through the classrooms, and see if WCP is the right fit for your family.',
            tone: 'navy',
            actions: [
              act('Schedule a tour', 'accent', { pageSlug: 'enroll' }),
              act('Take the virtual tour', 'outline-white', { pageSlug: 'virtual-tour' }),
            ],
          }),
          _key: 'pp-contact-cta',
        },
      ];

    case 'virtual-tour':
      return [
        {
          ...testimonials({
            bg: 'cream',
            seam: true,
            header: sh('Parent Voices', 'What parents say', null),
            source: 'all',
            limit: 6,
          }),
          _key: 'pp-tour-testimonials',
        },
      ];

    case 'work-with-us':
      return [
        {
          ...proseSection({
            bg: 'grey',
            seam: true,
            header: sh('What We Look For', 'Qualifications we look for', null),
            body: [
              p('We review applications on a rolling basis. The people who thrive here bring:'),
              bullet(
                'An early childhood education degree, or equivalent experience with young children.',
              ),
              bullet('A genuine love of working with preschoolers.'),
              bullet('Comfort with a cooperative model, where parents are in the classroom.'),
              bullet('Ohio BCI and FBI background-check clearance (we help you get this).'),
            ],
          }),
          _key: 'pp-jobs-quals',
        },
        {
          ...form({
            bg: 'white',
            seam: true,
            header: sh(
              'Apply',
              'Apply to work at WCP',
              'Send your name, the age group you’d love to teach, and a note about your experience, and we’ll be in touch.',
            ),
            topic: 'Job application',
            showPhone: true,
            buttonLabel: 'Send application',
            successMessage: 'Thank you! We have your application and will be in touch.',
          }),
          _key: 'pp-jobs-form',
        },
      ];

    default:
      return [];
  }
}

const PAGES = ['enroll', 'contact', 'virtual-tour', 'work-with-us'];
const idFor = (slug, draft) => `${draft ? 'drafts.' : ''}page-${slug}`;

for (const slug of PAGES) {
  const additions = additionsFor(slug);
  const addKeys = new Set(additions.map((s) => s._key));
  for (const draft of [false, true]) {
    const id = idFor(slug, draft);
    const doc = await client.getDocument(id).catch(() => null);
    if (!doc) continue;
    let sections = (doc.sections || []).filter((s) => !addKeys.has(s._key));
    let at = sections.findIndex((s) => s._type === 'ctaSection');
    if (at < 0) at = sections.length;
    sections = [...sections.slice(0, at), ...additions, ...sections.slice(at)];
    await client.patch(id).set({ sections }).commit();
    console.log(`${id}: +${additions.length} -> ${sections.length} sections`);
  }
}
console.log('\nDone.');
