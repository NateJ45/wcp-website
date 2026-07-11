// =============================================================================
// seed-form.mjs — add a contact form to the Contact page (idempotent)
// =============================================================================
// Appends a formSection to the Contact page IF one isn't already there.
// Additive and safe to re-run. Run: node scripts/seed-form.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { key, sh, pageId } from './pagebuilder-lib.mjs';

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

const formSection = () => ({
  _type: 'formSection',
  _key: key(),
  header: sh(
    '',
    'Send us a message',
    'Have a question or want to schedule a tour? We would love to hear from you.',
  ),
  topic: 'Contact form',
  showPhone: true,
  buttonLabel: 'Send message',
  successMessage: 'Thank you! We have your message and will be in touch soon.',
  background: 'grey',
  seam: true,
});

async function run() {
  const contact = await client.getDocument(pageId('contact'));
  if (!contact) {
    console.log('no contact page doc found — nothing to do');
    return;
  }
  const sections = Array.isArray(contact.sections) ? contact.sections : [];
  if (sections.some((s) => s._type === 'formSection')) {
    console.log('contact page already has a form — left as is');
    return;
  }
  await client
    .patch(pageId('contact'))
    .set({ sections: [...sections, formSection()] })
    .commit();
  console.log('added a contact form to the Contact page');
}

run().then(
  () => console.log('done'),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
