// =============================================================================
// seed-newsletter.mjs — add a sign-up form to the Newsletter page (idempotent)
// =============================================================================
// Inserts a newsletterSignupSection just before the closing CTA on the
// Newsletter page IF one isn't already there. Additive, safe to re-run.
// Run: node scripts/seed-newsletter.mjs
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

const signup = () => ({
  _type: 'newsletterSignupSection',
  _key: key(),
  header: sh(
    '',
    'Sign up for updates',
    'A few emails a year, all worth opening. No spam, unsubscribe any time.',
  ),
  askName: false,
  buttonLabel: 'Subscribe',
  successMessage: "You're on the list! Watch your inbox for our next update.",
  background: 'cream',
  seam: true,
});

async function run() {
  const doc = await client.getDocument(pageId('newsletter'));
  if (!doc) {
    console.log('no newsletter page doc found — nothing to do');
    return;
  }
  const sections = Array.isArray(doc.sections) ? doc.sections : [];
  if (sections.some((s) => s._type === 'newsletterSignupSection')) {
    console.log('newsletter page already has a sign-up form — left as is');
    return;
  }
  // Insert before the final section (usually the closing CTA).
  const insertAt = Math.max(0, sections.length - 1);
  const next = [...sections];
  next.splice(insertAt, 0, signup());
  await client.patch(pageId('newsletter')).set({ sections: next }).commit();
  console.log('added a sign-up form to the Newsletter page');
}

run().then(
  () => console.log('done'),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
