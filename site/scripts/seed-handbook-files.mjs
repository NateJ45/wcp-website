// =============================================================================
// seed-handbook-files.mjs — attach the teachers' handbook PDFs for download
// =============================================================================
// Uploads each teacher's 2026-27 parent-handbook PDF as a Sanity file asset and
// sets it on `handbookFile` for their class hub page(s), so the "Download the
// handbook (PDF)" button shows at the top: Ms. Erin's on hubPage-twos AND
// hubPage-threes (they share one handbook / one combined page), Mrs. Lisa's on
// hubPage-pre-k.
//
// Idempotent: it finds an already-uploaded asset by filename and reuses it, so
// re-running never creates duplicate assets. Only the initial upload needs the
// source PDF present locally (it lives outside the repo — PDFs are gitignored).
// Missing source + no existing asset for one handbook just skips it (the others
// still run). Run: node scripts/seed-handbook-files.mjs
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

// Each handbook: the clean download name, its local source (only needed the
// first time — after upload the asset is reused by name), and the hub page(s)
// it attaches to.
const HANDBOOKS = [
  {
    filename: 'WCP-Twos-Threes-Parent-Handbook-2026-27.pdf',
    source: 'C:/Users/natha/Downloads/parent handbook.pdf',
    docs: ['hubPage-twos', 'hubPage-threes'],
  },
  {
    filename: 'WCP-Pre-K-Parent-Handbook-2026-27.pdf',
    source: 'C:/Users/natha/Downloads/PreK parent handbook for nathan 2627.pdf',
    docs: ['hubPage-pre-k'],
  },
];

async function assetId(filename, source) {
  const existing = await client.fetch(
    `*[_type == "sanity.fileAsset" && originalFilename == $n][0]._id`,
    { n: filename },
  );
  if (existing) {
    console.log(`↺ reusing existing asset ${existing} (${filename})`);
    return existing;
  }
  if (!existsSync(source)) {
    console.log(`⚠ ${filename}: not found at ${source} and no asset yet — skipping.`);
    return null;
  }
  const asset = await client.assets.upload('file', createReadStream(source), {
    filename,
    contentType: 'application/pdf',
  });
  console.log(`✓ uploaded ${filename} → ${asset._id}`);
  return asset._id;
}

for (const h of HANDBOOKS) {
  const id = await assetId(h.filename, h.source);
  if (!id) continue;
  const handbookFile = { _type: 'file', asset: { _type: 'reference', _ref: id } };
  for (const docId of h.docs) {
    await client.patch(docId).set({ handbookFile }).commit();
    console.log(`✓ ${docId}.handbookFile set`);
  }
}
