// =============================================================================
// restructure-prek-pet-section.mjs — split the class-pet blurb out of the CTA
// =============================================================================
// The Pre-K handbook's closing CTA had been repurposed to carry the class-pet
// blurb (its title + the paragraph as the CTA lead), so the signed sign-off
// card read oddly. This lifts that content into its OWN section ABOVE the CTA
// and resets the CTA to the standard closing format the Twos & Threes page uses
// ("Questions about anything here?"), so Mrs. Lisa's sign-off sits on a proper
// contact CTA. Idempotent. Run once:
//   node scripts/restructure-prek-pet-section.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

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

// The standard closing-CTA copy, matched to the Twos & Threes page (Erin's).
const CTA_TITLE = 'Questions about anything here?';
const CTA_LEAD =
  'This handbook is your guide to our year, but it is not the last word. If anything is unclear, or you just want to say hello, reach out anytime.';

const ID = 'hubPage-pre-k';
const doc = await client.getDocument(ID);
if (!doc) throw new Error(`${ID} not found`);
const sections = [...(doc.sections || [])];
const ctaIdx = sections.findIndex((s) => s._type === 'ctaSection');
if (ctaIdx < 0) throw new Error('no ctaSection on hubPage-pre-k');
const cta = { ...sections[ctaIdx] };

if (cta.title === CTA_TITLE) {
  console.log('Already restructured (CTA is the standard closing). Nothing to do.');
  process.exit(0);
}

// The class-pet content currently lives in the CTA's title + lead.
const petTitle = cta.title || 'Meet our class pet';
const petBody = cta.lead || '';

// A prose section carrying the class-pet blurb, keyed with a distinct prefix so
// it never collides with the page's existing k-keys.
const petSection = {
  _type: 'proseSection',
  _key: 'prek-pet-sec',
  background: 'white',
  narrow: true,
  header: { _type: 'sectionHeader', title: petTitle, align: 'center' },
  body: [
    {
      _type: 'block',
      _key: 'prek-pet-b1',
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: 'prek-pet-s1', text: petBody, marks: [] }],
    },
  ],
};

// Reset the CTA to the standard closing format (the sign-off card attaches to it).
cta.title = CTA_TITLE;
cta.lead = CTA_LEAD;
sections[ctaIdx] = cta;

// Insert the class-pet section immediately ABOVE the CTA.
sections.splice(ctaIdx, 0, petSection);

await client.patch(ID).set({ sections }).commit();
console.log(
  `✓ ${ID}: "${petTitle}" moved to its own section above the CTA; CTA reset to "${CTA_TITLE}" (${sections.length} sections).`,
);
