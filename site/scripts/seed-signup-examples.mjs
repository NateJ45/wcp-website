// =============================================================================
// seed-signup-examples.mjs — two example sheets for the hub Sign-ups page
// =============================================================================
// Gives the board a working pattern to copy (and the page something to show):
// one slot-based sign-up sheet and one event RSVP, both clearly titled
// "Example" so they're obvious to edit or delete in the Studio (Family Hub →
// Sign-ups & RSVPs). Idempotent: fixed ids, createOrReplace.
// Run: node scripts/seed-signup-examples.mjs
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

await client.createOrReplace({
  _id: 'signup-example-workday',
  _type: 'signupSheet',
  title: 'Example sign-up: Playground workday',
  description:
    'A sample sheet the board can rename or delete. Each slot can cap how many families it needs.',
  kind: 'signup',
  open: true,
  slots: [
    {
      _type: 'slot',
      _key: 'mulch',
      label: 'Spread mulch',
      detail: 'Bring a rake if you have one',
      capacity: 4,
    },
    { _type: 'slot', _key: 'paint', label: 'Touch-up painting', capacity: 2 },
    { _type: 'slot', _key: 'snacks', label: 'Bring snacks for the crew', capacity: 0 },
  ],
});

await client.createOrReplace({
  _id: 'signup-example-rsvp',
  _type: 'signupSheet',
  title: 'Example RSVP: Fall Family Picnic',
  description: 'A sample RSVP card — families tap once and the count climbs.',
  kind: 'rsvp',
  eventDate: '2026-10-03',
  open: true,
});

console.log('✓ 2 example sign-up sheets seeded (Studio → Family Hub → Sign-ups & RSVPs)');
