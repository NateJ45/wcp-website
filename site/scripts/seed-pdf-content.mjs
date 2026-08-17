// =============================================================================
// seed-pdf-content.mjs — the curriculum guides + supply list into the Studio
// =============================================================================
// Imports the committed content straight from the two generator scripts (their
// direct-run guards make the import side-effect free) and writes it into the
// `curriculumGuide` documents and the `supplyList` singleton. After this runs,
// the Board edits the PDFs' words in the Studio and the next deploy regenerates
// the files; the committed content stays as the fallback.
//
// Idempotent: existing documents with content are left alone.
//   node scripts/seed-pdf-content.mjs
//   node scripts/seed-pdf-content.mjs --force
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { CURRICULA } from './generate-curriculum.mjs';
import {
  LISTS,
  WISH_LIST,
  YEAR,
  BACKPACK_NOTE,
  DUE_NOTE,
  WATER_NOTE,
} from './generate-supplies.mjs';

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
const FORCE = process.argv.includes('--force');

const key = (prefix, i) => `${prefix}-${i}`;

// --- Curriculum guides -------------------------------------------------------
for (const guide of CURRICULA) {
  const _id = `curriculumGuide-${guide.slug}`;
  const existing = await client.getDocument(_id);
  if (existing?.sections?.length && !FORCE) {
    console.log(`skip (has content) ${_id}`);
    continue;
  }
  await client.createOrReplace({
    _id,
    _type: 'curriculumGuide',
    class: guide.slug,
    kicker: guide.kicker,
    title: guide.title,
    intro: guide.intro,
    sections: guide.sections.map((sec, i) => ({
      _type: 'object',
      _key: key('sec', i),
      icon: sec.icon,
      title: sec.title,
      ...(sec.items ? { items: sec.items } : {}),
      ...(sec.groups
        ? {
            groups: sec.groups.map((g, j) => ({
              _type: 'object',
              _key: key(`sec-${i}-g`, j),
              label: g.label,
              items: g.items,
            })),
          }
        : {}),
    })),
    ...(guide.conceptual
      ? {
          conceptual: {
            heading: guide.conceptual.heading,
            groups: guide.conceptual.groups.map((g, i) => ({
              _type: 'object',
              _key: key('grp', i),
              icon: g.icon,
              title: g.title,
              note: g.note,
              subgroups: (g.subgroups ?? []).map((sub, j) => ({
                _type: 'object',
                _key: key(`grp-${i}-sub`, j),
                label: sub.label,
                items: sub.items,
              })),
            })),
          },
        }
      : {}),
  });
  console.log(`✓ ${_id} (${guide.sections.length} sections)`);
}

// --- Supply list -------------------------------------------------------------
const existing = await client.getDocument('supplyList');
if (existing?.lists?.length && !FORCE) {
  console.log('skip (has content) supplyList');
} else {
  await client.createOrReplace({
    _id: 'supplyList',
    _type: 'supplyList',
    year: YEAR,
    backpackNote: BACKPACK_NOTE,
    dueNote: DUE_NOTE,
    waterNote: WATER_NOTE,
    lists: LISTS.map((l, i) => ({
      _type: 'object',
      _key: key('list', i),
      slug: l.slug,
      items: l.items,
    })),
    wishList: {
      heading: WISH_LIST.heading,
      note: WISH_LIST.note,
      items: WISH_LIST.items,
    },
  });
  console.log(`✓ supplyList (${LISTS.length} class lists)`);
}
