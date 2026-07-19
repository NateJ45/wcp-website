// =============================================================================
// patch-home-visit-splitmedia.mjs — give hp-visit its photo back as a real
// splitMediaSection (docs/PENDING.md queue; dry-run by default)
// =============================================================================
// `page-home`'s stored `hp-visit` section is a `proseSection` (text only — that
// object type has no image field). src/lib/page-doctrine.ts's SECTION_DROP.home
// hides it at render time and src/lib/photo-moments.ts's 'visit' moment injects
// the CODE-owned src/components/VisitBlock.astro in its slot instead, which
// pairs the same copy with a photo. This script does the real thing: replaces
// the stored proseSection with a splitMediaSection carrying a photo + the same
// copy, so the section goes back under volunteer control in the Studio.
//
// Copy is TRANSCRIBED from VisitBlock.astro (2026-07-19), not reworded. The
// splitMediaSection row schema is one photo + eyebrow + title + ONE text
// paragraph + at most one link (src/sanity/schemaTypes/sections/structured.ts):
// VisitBlock renders TWO buttons ("Schedule a Tour" + "Open in Google Maps");
// only the tour CTA survives here, because the schema has room for one link
// per row. That is an accepted shape limitation, not a missed fact — the phone
// number and the maps address text both still appear in the paragraph.
//
//   node scripts/patch-home-visit-splitmedia.mjs            # dry run
//   node scripts/patch-home-visit-splitmedia.mjs --commit
//
// HUMAN DECISION REQUIRED — see PHOTO_PATH below. VisitBlock's photo comes from
// photosFor('home-visit', 1) (src/lib/photo-registry.ts), which picks
// DYNAMICALLY from the already-published A Day gallery pool by hashing the
// slot name — there is no single fixed "the visit photo" to carry over
// automatically, and this script cannot query that pool while the API is
// quota-frozen anyway. A human must look at src/assets/photos/ (or the Sanity
// media library once reachable) and set PHOTO_PATH to a specific file before
// --commit will do anything. Until then this script reads and reports, but
// refuses to write.
//
// Idempotent: a doc whose hp-visit section is ALREADY a splitMediaSection with
// this row's title is left alone. Patches BOTH the published doc and the
// working draft, the same way home-parity.mjs does.
//
// AFTER RUNNING (same sitting, or the Studio and the site drift):
//   - Delete src/components/VisitBlock.astro.
//   - Delete the 'home-visit' 'visit' moment in src/lib/photo-moments.ts.
//   - Delete `'hp-visit'` from SECTION_DROP.home in src/lib/page-doctrine.ts
//     (and its explanatory comment there).
//   - Remove this script's row from docs/PENDING.md.
// =============================================================================
import { client, COMMIT, done } from './patch-lib.mjs';
import { splitMedia, makeUploader } from './pagebuilder-lib.mjs';

const KEY = 'hp-visit';

// --- HUMAN DECISION: pick the photo before --commit will apply anything. ----
// Set to a path relative to the site root, e.g. 'src/assets/photos/outdoor-exploration.jpg'.
// Update ALT to actually describe whatever photo gets chosen.
const PHOTO_PATH = null;
const ALT = 'TODO: describe the chosen photo once PHOTO_PATH is set.';

const EYEBROW = 'Find us';
const TITLE = 'Come find us.';
// Transcribed from VisitBlock.astro's three paragraphs + list, joined into the
// row's single "Text" field (a plain multi-line string, not Portable Text —
// it renders as one <p>, see SplitMediaSection.astro).
const BODY =
  'We are at 9463 Cincinnati Columbus Rd, West Chester, OH 45069, inside Crestview Presbyterian Church. ' +
  'WCP is not a religious school. We are a secular, non-discriminatory cooperative preschool. We rent the ' +
  'space and have no religious affiliation. Call or text (513) 202-6187. School runs September to May. ' +
  'Tours by appointment June to August.';
const LINK_LABEL = 'Schedule a Tour';
const LINK_URL = '/virtual-tour#sec-pp-tour-form';

if (!PHOTO_PATH) {
  console.log(
    'HUMAN DECISION NEEDED: no photo chosen for the home visit block.\n' +
      '  Set PHOTO_PATH (and ALT) near the top of this script to a real file — ' +
      'e.g. one of the candidates already in src/assets/photos/ (outdoor-exploration.jpg, ' +
      'about-hero.jpg, gym-playtime.jpg, ...) or a fresh upload — then re-run.\n',
  );
}

function buildSection(assetId) {
  const section = splitMedia({
    bg: 'white',
    rows: [
      {
        assetId,
        alt: ALT,
        eyebrow: EYEBROW,
        title: TITLE,
        body: BODY,
        linkLabel: LINK_LABEL,
        linkUrl: LINK_URL,
      },
    ],
  });
  section._key = KEY; // keep the _key stable so SECTION_DROP.home['hp-visit'] can be removed cleanly
  return section;
}

// Already-migrated check: same _key AND same row title means a previous
// --commit already did this (idempotent no-op on re-run).
function alreadyMigrated(existing) {
  return existing?._type === 'splitMediaSection' && existing?.rows?.[0]?.title === TITLE;
}

let assetId = null; // uploaded once, lazily, only if some doc actually needs it
let changes = 0;

for (const id of ['page-home', 'drafts.page-home']) {
  let doc;
  try {
    doc = await client.getDocument(id);
  } catch (err) {
    console.log(`${id}: read failed (${err.message}).`);
    console.log(
      '  If this is a 402 plan_limit_reached, the API quota is still frozen (docs/PENDING.md) — expected, not a script bug.',
    );
    continue;
  }
  if (!doc) {
    console.log(`${id}: (none, skipped)`);
    continue;
  }

  const sections = [...(doc.sections || [])];
  const idx = sections.findIndex((s) => s?._key === KEY);
  if (idx < 0) {
    console.log(`${id}: no "${KEY}" section found, skipped.`);
    continue;
  }
  if (alreadyMigrated(sections[idx])) {
    console.log(`${id}: "${KEY}" is already a migrated splitMediaSection. Nothing to do.`);
    continue;
  }

  changes++;

  if (!COMMIT) {
    console.log(
      `DRY — ${id}: would replace "${KEY}" (${sections[idx]._type}) with a splitMediaSection ` +
        `("${TITLE}")${PHOTO_PATH ? '' : ' [BLOCKED: no photo chosen yet]'}.`,
    );
    continue;
  }

  if (!PHOTO_PATH) {
    throw new Error(
      'PHOTO_PATH is not set. Choose a photo (see the HUMAN DECISION comment near the top ' +
        'of this script) before running --commit.',
    );
  }

  if (!assetId) {
    const up = makeUploader(client);
    assetId = await up.upload(PHOTO_PATH);
  }

  sections[idx] = buildSection(assetId);
  await client.patch(id).set({ sections }).commit();
  console.log(`✓ ${id}: "${KEY}" replaced with a splitMediaSection ("${TITLE}").`);
}

done(changes);
