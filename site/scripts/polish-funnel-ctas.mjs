// =============================================================================
// polish-funnel-ctas.mjs — one clear next-step path on every closing CTA
// =============================================================================
// The 2026-07 funnel audit found six pages whose closing CTA had BOTH buttons
// pointing at /enroll. A visitor not ready to enroll had nowhere softer to go,
// so the secondary button becomes "Request a tour" → /virtual-tour (which
// carries the tour-request form). Idempotent: only rewrites a CTA whose two
// actions still both target the enroll page.
// Run: node scripts/polish-funnel-ctas.mjs
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

const SLUGS = [
  'home',
  'a-day-at-wcp',
  'classes/twos',
  'classes/threes',
  'classes/pre-k',
  'co-op-life',
];

const pointsAtEnroll = (a) =>
  (a?.linkType === 'page' && a?.page?._ref === 'page-enroll') ||
  String(a?.url ?? '').replace(/\/$/, '') === '/enroll';

for (const slug of SLUGS) {
  const doc = await client.fetch(`*[_type == "page" && slug == $slug][0]`, { slug });
  if (!doc) {
    console.log(`- ${slug}: no page doc, skipped`);
    continue;
  }
  const cta = [...(doc.sections ?? [])].reverse().find((s) => s._type === 'ctaSection');
  const actions = cta?.actions ?? [];
  if (actions.length !== 2 || !pointsAtEnroll(actions[0]) || !pointsAtEnroll(actions[1])) {
    console.log(`- ${slug}: CTA already differentiated, skipped`);
    continue;
  }
  actions[1] = {
    ...actions[1],
    label: 'Request a tour',
    linkType: 'page',
    page: { _type: 'reference', _ref: 'page-virtual-tour' },
    url: undefined,
  };
  await client.createOrReplace(doc);
  console.log(`✓ ${slug}: secondary CTA → Request a tour (/virtual-tour)`);
}
