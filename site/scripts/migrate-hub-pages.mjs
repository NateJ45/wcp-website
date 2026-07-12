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
