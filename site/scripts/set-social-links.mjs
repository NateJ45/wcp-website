// =============================================================================
// set-social-links.mjs — put the Facebook + Instagram URLs on Site Settings
// =============================================================================
// The header/footer social icons read siteSettings.facebook / .instagram (via
// getSiteSettings), so setting them here makes the icons appear on the built
// site and leaves them editable in Studio -> Site Settings -> Social. This is a
// surgical PATCH (only these two fields) so it never clobbers other Studio
// edits. Idempotent. Run: node scripts/set-social-links.mjs
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

const social = {
  facebook: 'https://www.facebook.com/westchesterpreschool',
  instagram: 'https://www.instagram.com/westchesterpreschool',
};

await client.patch('siteSettings').set(social).commit();
console.log('✓ siteSettings social links set:', social);
