// =============================================================================
// patch-contact-notes.mjs — make the handbook closing-note email + phone links
// =============================================================================
// Updates ONLY the closing ctaSection's `note` on each class hub page so the
// email becomes a mailto: link and the phone a tel: link. Patches in place by
// the section's _key (does NOT re-seed), so it never touches the rest of the
// page — safe for Pre-K, whose live page carries Board edits.
// Run: node scripts/patch-contact-notes.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { p, link } from './pagebuilder-lib.mjs';

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

const NOTES = {
  'hubPage-pre-k': [
    p(
      'Questions about anything in this handbook? Email ',
      link('lisa@westchesterpreschool.org', 'mailto:lisa@westchesterpreschool.org'),
      ' or call or text ',
      link('503-201-4775', 'tel:+15032014775'),
      '. Mrs. Lisa is always happy to hear from you.',
    ),
  ],
  'hubPage-twos': [
    p(
      'Email ',
      link('erin@westchesterpreschool.org', 'mailto:erin@westchesterpreschool.org'),
      ' or call or text ',
      link('513-543-4824', 'tel:+15135434824'),
      '. Ms. Erin is always happy to hear from you.',
    ),
  ],
};
NOTES['hubPage-threes'] = NOTES['hubPage-twos'];

for (const [id, note] of Object.entries(NOTES)) {
  const sections = await client.fetch(`*[_id == $id][0].sections[]{ _key, _type }`, { id });
  const cta = (sections || []).find((s) => s._type === 'ctaSection');
  if (!cta) {
    console.log(`⚠ ${id}: no ctaSection found, skipped`);
    continue;
  }
  await client
    .patch(id)
    .set({ [`sections[_key=="${cta._key}"].note`]: note })
    .commit();
  console.log(`✓ ${id}: closing note now has mailto:/tel: links (${cta._key})`);
}
