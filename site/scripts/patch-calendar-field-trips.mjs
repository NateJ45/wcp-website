// =============================================================================
// patch-calendar-field-trips.mjs — "How field trips work": prose → card grid
// =============================================================================
// One-off, idempotent patch: replaces the "How field trips work" proseSection
// (a bullet list) on the live hubPage-calendar doc with a cardGridSection of
// policy cards, matching the class handbooks' arrival/dismissal cards. The
// calendar page renders its Board sections through HubSectionedBody, so this
// section then reads as a hub document block (an icon-card grid) instead of a
// bulleted note. The seed (seed-hub-knowledge.mjs) already builds it this way,
// so a re-seed matches; the render-time stopgap in
// src/pages/family-hub/calendar.astro (FIELD_TRIP_CARDS / boardSections) can be
// deleted once this has run. Scoped by the section heading; safe to run
// repeatedly — a no-op once the section is already a cardGridSection.
// Run: node scripts/patch-calendar-field-trips.mjs
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

const ID = 'hubPage-calendar';
const doc = await client.getDocument(ID);
if (!doc) throw new Error(`${ID} not found`);

// Fixed card keys keep the patch deterministic (unique within the array is all
// Sanity needs) and mirror the render-time stopgap.
const FIELD_TRIP_CARDS = [
  {
    _key: 'ft-slip',
    icon: 'file-pen',
    chip: 'sky',
    title: 'Permission slip',
    body: 'Every trip needs a signed slip: your child’s name, the date and timeframe, the destination (including whether there’s water), your signature, and the date. No slip, no trip.',
  },
  {
    _key: 'ft-ride',
    icon: 'users',
    chip: 'sky',
    title: 'Getting there',
    body: 'Families provide the ride, by parent or parent-arranged carpool (the school doesn’t arrange it). Tell the teacher whether your child is coming and how they’re getting there.',
  },
  {
    _key: 'ft-meet',
    icon: 'map-pin',
    chip: 'sky',
    title: 'Meet on time',
    body: 'Meet the teacher at the location at the start time. Parents are fully responsible for their own children for the whole outing.',
  },
  {
    _key: 'ft-out',
    icon: 'shield-check',
    chip: 'sky',
    title: 'Check out before you leave',
    body: 'Check out with the teacher before heading home, with your own child or a carpool, so attendance stays exact. Every trip carries a state-approved first aid kit, a first-aid-trained adult, and each child’s health and emergency forms.',
  },
];

const sections = Array.isArray(doc.sections) ? doc.sections : [];
let converted = 0;
const next = sections.map((s) => {
  if (s?._type === 'proseSection' && s?.header?.title === 'How field trips work') {
    converted += 1;
    return {
      _type: 'cardGridSection',
      _key: s._key,
      header: {
        _type: 'sectionHeader',
        eyebrow: 'Field Trips',
        title: 'How field trips work',
        lead: 'A few rules make every field trip safe and simple.',
        align: 'center',
      },
      background: 'grey',
      columns: 2,
      layout: 'card',
      cards: FIELD_TRIP_CARDS,
    };
  }
  return s;
});

if (converted === 0) {
  console.log(
    `✓ ${ID}: no "How field trips work" proseSection — nothing to do (${sections.length} sections)`,
  );
} else {
  await client.patch(ID).set({ sections: next }).commit();
  console.log(`✓ ${ID}: converted ${converted} field-trips proseSection → cardGridSection`);
}
