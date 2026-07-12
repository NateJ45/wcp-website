// =============================================================================
// migrate-hub-pages.mjs — move hardcoded Family Hub page content into editable
// `hubPage` docs (the hub page-builder). Idempotent (fixed hubPage-<key> ids).
// Grows one page at a time as hub pages are converted. Run:
//   node scripts/migrate-hub-pages.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { sh, card, cardGrid, cta, callout, act } from './pagebuilder-lib.mjs';

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

const HUB_PAGES = {
  health: {
    title: 'Health',
    heading: 'Health & Safety',
    intro:
      'Emergency contacts, illness policies, immunization requirements, and what to do when your child isn’t feeling well.',
    sections: [
      cardGrid({
        bg: 'grey',
        header: sh(
          'Illness Policy',
          'When to keep your child home',
          'When in doubt, keep them home. These guidelines protect every family at WCP.',
        ),
        columns: 3,
        cards: [
          card(
            'heart-pulse',
            'orange',
            'Fever',
            'Stay home until fever-free for 24 hours without fever-reducing medication.',
          ),
          card(
            'info',
            'orange',
            'Vomiting or diarrhea',
            'Stay home until symptom-free for 24 hours.',
          ),
          card(
            'eye',
            'orange',
            'Pink eye',
            'Stay home until cleared by a doctor or symptom-free for 24 hours.',
          ),
          card(
            'shield-check',
            'orange',
            'Antibiotics',
            'Children must be on antibiotics for at least 24 hours before returning to school.',
          ),
          card(
            'bell',
            'orange',
            'Contagious illness',
            'Notify your teacher right away so other families can be alerted. Names are never shared.',
          ),
        ],
        callout: callout(
          'warm',
          'Allergy awareness: if your child has a food allergy or any condition classroom helpers should know about, make sure it is on file with your teacher and on your Emergency Contact Form. Questions? Contact your teacher directly.',
        ),
      }),
      cta({
        title: 'Closures & the full policy',
        lead: 'WCP follows Lakota Local Schools for weather closures — if Lakota closes, WCP closes. The complete health policy lives in the Family Handbook, and Ohio licensing requirements always apply.',
        tone: 'navy',
        actions: [act('Open the Handbook', 'accent', { url: '/family-hub/documents' })],
      }),
    ],
  },

  fundraising: {
    title: 'Fundraising',
    heading: 'Fundraising',
    intro:
      'What we’re raising money for this year, what’s active right now, and how you can help. Every dollar goes back into the classrooms.',
    sections: [
      cardGrid({
        bg: 'grey',
        header: sh(
          'How We Raise',
          'The ways WCP fundraises',
          'A handful of friendly, low-pressure efforts across the year — join what fits your family.',
        ),
        columns: 2,
        cards: [
          card(
            'hand-heart',
            'amber',
            'Dine to Donate',
            'Local restaurants give back a share of sales on WCP nights. Show up hungry — a portion of your bill comes back to the school.',
          ),
          card(
            'party-popper',
            'amber',
            'Spring Raffle',
            'Our biggest event of the year: themed baskets, donated prizes, and tickets sold across the community.',
          ),
          card(
            'shopping-bag',
            'amber',
            'Seasonal Sales',
            'Smaller fundraisers through the year — spirit wear, holiday items, and one-off sales run by the Fundraising Committee.',
          ),
          card(
            'gift',
            'amber',
            'Direct Giving',
            'Prefer to give directly? Donations are welcome any time and go straight into the classrooms.',
          ),
        ],
      }),
      cta({
        title: 'Where your money goes',
        lead: 'Every dollar raised goes straight back into the classrooms — supplies, enrichment, playground upkeep, and the special days that make WCP feel like home. No overhead, no salaries skimmed off the top.',
        tone: 'navy',
      }),
    ],
  },

  // The document LIBRARY itself is already editable (hubDocument docs). This
  // hubPage carries the editable heading/intro + the closing note. (The shared
  // Drive link is unset in code, so this replaces the placeholder Drive card.)
  documents: {
    title: 'Documents',
    heading: 'Handbook & Documents',
    intro:
      'Family Handbook, Bylaws, Standing Rules, and the state forms families need on file. Everything to read, sign, or refer back to.',
    sections: [
      cta({
        title: 'Need a file that isn’t listed?',
        lead: 'Every WCP document lives in our shared Google Drive folder. Ask any board member for the link, or check the pinned post in our Facebook group.',
        tone: 'navy',
      }),
    ],
  },

  // Calendar: the click-to-load Google Calendar embed + event legend + weather
  // note stay fixed (safety info). This carries the editable heading/intro and
  // an empty section stack the Board can add to.
  calendar: {
    title: 'Calendar',
    heading: 'School Calendar',
    intro:
      'Class days, closures, board meetings, fundraisers, and family events. All the dates that matter this school year, in one place.',
    sections: [],
  },

  // Hub landing: the quick-link nav grids stay fixed; heading/intro editable.
  home: {
    title: 'Hub home',
    heading: 'Welcome back, WCP family.',
    intro:
      'Everything you need for the school year, all in one place. Pick a section above, or jump in below.',
    sections: [],
  },

  // Class pages: facts + pay button + class notes stay fixed (class notes are
  // their own editable docs). Each carries the editable heading/intro.
  twos: {
    title: 'Twos classroom',
    heading: 'Twos Classroom',
    intro: 'A gentle first taste of school, in a small group.',
    sections: [],
  },
  threes: {
    title: 'Threes classroom',
    heading: 'Threes Classroom',
    intro: 'A joyful first real school experience.',
    sections: [],
  },
  'pre-k-am': {
    title: 'Pre-K AM classroom',
    heading: 'Pre-K AM Classroom',
    intro: 'Kindergarten readiness, four mornings a week.',
    sections: [],
  },
  'pre-k-pm': {
    title: 'Pre-K PM classroom',
    heading: 'Pre-K PM Classroom',
    intro: 'Kindergarten readiness on an afternoon schedule.',
    sections: [],
  },

  // Co-op Jobs: the assignment widget, role descriptions (their own docs), and
  // org chart stay fixed; heading/intro editable.
  'coop-jobs': {
    title: 'Co-op Jobs',
    heading: 'Co-op Jobs',
    intro:
      'How WCP is run, the roles families fill each year, and the org chart that ties it together. Your job assignment lives here once it’s set.',
    sections: [],
  },

  // Directory: the opt-in family cards + map + privacy framing stay fixed (PII);
  // heading/intro editable.
  directory: {
    title: 'Directory',
    heading: 'Family Directory',
    intro:
      'Names, photos, and contact info for every WCP family this year. Built for connecting outside the classroom.',
    sections: [],
  },

  // Tuition: the pay cards, fees, PayPal buttons, and payment FAQ stay fixed
  // (real rates + button ids); heading/intro editable.
  tuition: {
    title: 'Tuition',
    heading: 'Tuition & Payments',
    intro:
      'Monthly amounts by class, due dates, late fees, and the buttons to pay your tuition. Questions about your account go to the Treasurer.',
    sections: [],
  },
};

for (const [hubKey, def] of Object.entries(HUB_PAGES)) {
  await client.createOrReplace({
    _id: `hubPage-${hubKey}`,
    _type: 'hubPage',
    hubKey,
    title: def.title,
    heading: def.heading,
    intro: def.intro,
    sections: def.sections,
  });
  console.log(`✓ hubPage-${hubKey} (${def.sections.length} sections)`);
}
console.log('\nDone.');
