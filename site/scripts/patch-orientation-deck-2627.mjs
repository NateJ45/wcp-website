#!/usr/bin/env node
// =============================================================================
// patch-orientation-deck-2627.mjs — the Orientation deck families see is 26-27
// =============================================================================
// Family Hub → Documents → Orientation Materials → "Orientation Slide Deck"
// still pointed at the 2025-26 Canva design, labelled "2025-26 version
// (current)". The board ran Orientation for 2026-27 on September 3rd, 2026 and
// the deck for it arrived as a PowerPoint file, not a Canva design.
//
// So this does the same thing the 2026-27 budget, the bylaws and the May
// Gathering slides already do: the deck is exported to PDF and UPLOADED to
// Sanity, and the document flips from sourceType 'link' to 'file'. The
// Documents page already resolves either shape
// (`select(sourceType == "file" => file.asset->url, link)`), so nothing on the
// page has to change.
//
// WHY NOT site/public/ — slide 45 of this deck prints the shared Family Hub
// password. This repo is PUBLIC, and anything under site/public/ is served
// ungated, outside the middleware gate. Committing the PDF would publish the
// password to the internet AND to git history forever. The Sanity asset URL is
// resolved at request time and appears in no committed file. Keep it that way:
// do not paste the cdn.sanity.io URL into this repo.
//
// The old Canva design is left alone — it is still the 2025-26 record, it is
// just no longer what families are handed.
//
// Dry run by default, like every patch script here. `--commit` to apply.
//
// Usage: node scripts/patch-orientation-deck-2627.mjs [--commit] [--pdf <path>]
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { apply, client, done, COMMIT } from './patch-lib.mjs';

const DOC_ID = 'hubdoc-orient-1';
const DESCRIPTION = '2026-27 version (current)';
const FILENAME = 'orientation-2026-27.pdf';

const pdfArg = process.argv.indexOf('--pdf');
const PDF_PATH = pdfArg > -1 ? process.argv[pdfArg + 1] : process.env.ORIENTATION_PDF;
if (!PDF_PATH || !existsSync(PDF_PATH)) {
  console.error(
    `No PDF at ${PDF_PATH ?? '(unset)'}.\n` +
      'Export "Orientation Slideshow 26-27.pptx" to PDF and pass it with --pdf <path>.',
  );
  process.exit(1);
}

const doc = await client.getDocument(DOC_ID);
if (!doc) {
  console.error(`No document ${DOC_ID}. Nothing patched.`);
  process.exit(1);
}

console.log(`  title:  ${doc.title}`);
console.log(`  note:   ${doc.description ?? '(none)'}  →  ${DESCRIPTION}`);
console.log(`  source: ${doc.sourceType}  →  file`);
console.log(`  from:   ${doc.link ?? doc.file?.asset?._ref ?? '(none)'}`);
console.log(`  to:     ${PDF_PATH} (uploaded as ${FILENAME})`);

let n = 0;
await apply(`upload ${FILENAME} + repoint ${DOC_ID} at it`, async () => {
  const asset = await client.assets.upload('file', readFileSync(PDF_PATH), {
    filename: FILENAME,
    contentType: 'application/pdf',
  });
  await client
    .patch(DOC_ID)
    .set({
      description: DESCRIPTION,
      sourceType: 'file',
      file: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } },
    })
    // The Canva link would otherwise sit unused behind the radio button, and a
    // volunteer flipping the radio back would silently republish last year's
    // deck.
    .unset(['link'])
    .commit();
  n = 1;
  console.log(`  uploaded asset: ${asset._id}`);
});

if (!COMMIT) console.log('\n(Nothing was uploaded — dry run.)');
done(n || 1);
