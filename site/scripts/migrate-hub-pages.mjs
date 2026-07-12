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
