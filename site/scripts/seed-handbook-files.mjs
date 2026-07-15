// =============================================================================
// seed-handbook-files.mjs — attach the teachers' handbook PDFs for download
// =============================================================================
// Uploads Ms. Erin's 2026-27 parent-handbook PDF as a Sanity file asset and
// sets it on `handbookFile` for BOTH hubPage-twos and hubPage-threes (they
// share one handbook), so the "Download the handbook (PDF)" button shows at the
// top of those class hub pages. The Pre-K page's button turns on the same way
// once Mrs. Lisa's PDF is uploaded to hubPage-pre-k's "Handbook PDF" field in
// the Studio (Family Hub -> Pre-K classroom).
//
// Idempotent: it finds an already-uploaded asset by filename and reuses it, so
// re-running never creates duplicate assets. Only the initial upload needs the
// source PDF present locally (it lives outside the repo — PDFs are gitignored).
// Run: node scripts/seed-handbook-files.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync, existsSync, createReadStream } from 'node:fs';
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

// The clean name families see when they download, and the local source (only
// needed the first time — after upload the asset is reused by this name).
const FILENAME = 'WCP-Twos-Threes-Parent-Handbook-2026-27.pdf';
const SOURCE = 'C:/Users/natha/Downloads/parent handbook.pdf';

async function assetId() {
  const existing = await client.fetch(
    `*[_type == "sanity.fileAsset" && originalFilename == $n][0]._id`,
    { n: FILENAME },
  );
  if (existing) {
    console.log(`↺ reusing existing asset ${existing} (${FILENAME})`);
    return existing;
  }
  if (!existsSync(SOURCE)) {
    throw new Error(
      `Handbook PDF not found at ${SOURCE} and no matching asset in Sanity yet.\n` +
        `Put the PDF there (or edit SOURCE) and re-run, or upload it in the Studio.`,
    );
  }
  const asset = await client.assets.upload('file', createReadStream(SOURCE), {
    filename: FILENAME,
    contentType: 'application/pdf',
  });
  console.log(`✓ uploaded ${FILENAME} → ${asset._id}`);
  return asset._id;
}

const id = await assetId();
const handbookFile = { _type: 'file', asset: { _type: 'reference', _ref: id } };

for (const docId of ['hubPage-twos', 'hubPage-threes']) {
  await client.patch(docId).set({ handbookFile }).commit();
  console.log(`✓ ${docId}.handbookFile set`);
}
