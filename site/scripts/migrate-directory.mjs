// =============================================================================
// migrate-directory.mjs — load the real Family Directory into Sanity (PII)
// =============================================================================
// Parses the FAMILIES array from the saved Squarespace code block
// (../wcp-directory-block.html, gitignored PII), uploads each family photo to
// Sanity, and creates one editable `directoryEntry` doc per family. Every field
// (parents + their email/phone, children + class, address, map pin, photo,
// notes) becomes editable in Studio -> Family Hub -> Directory. The directory
// page sorts by familyName (surname) so it renders alphabetically.
//
// Idempotent: fixed `directoryEntry-<surname>` ids + a photo-URL cache
// (scripts/.dir-photos.json, gitignored) so re-runs don't re-upload.
// Run: node scripts/migrate-directory.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(SITE_DIR, '..', 'wcp-directory-block.html');
const PHOTO_CACHE = resolve(SITE_DIR, 'scripts', '.dir-photos.json');

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

// --- Extract the FAMILIES array from the code block --------------------------
// The array is JS object-literal syntax (unquoted keys, trailing commas). Rather
// than eval it, write it out as a tiny ES module of pure data and import that.
const html = readFileSync(SRC, 'utf8');
const m = html.match(/const FAMILIES\s*=\s*(\[[\s\S]*?\]);/);
if (!m) throw new Error('Could not find the FAMILIES array in ' + SRC);
const tmp = resolve(SITE_DIR, 'scripts', '.families.tmp.mjs');
writeFileSync(tmp, 'export default ' + m[1] + ';\n');
const FAMILIES = (await import(pathToFileURL(tmp).href + '?t=' + process.hrtime.bigint())).default;
unlinkSync(tmp);
console.log(`Parsed ${FAMILIES.length} families from the code block.`);

// --- Helpers -----------------------------------------------------------------
let n = 0;
const key = () => `k${n++}`;

// "The Swarrs" -> "Swarr"; "The Wilkeses" -> "Wilkes"; "The O'Briens" -> "O'Brien".
function surname(name) {
  let s = String(name)
    .replace(/^The\s+/i, '')
    .trim();
  if (/(?:s|z|ch|sh|x)es$/i.test(s)) s = s.replace(/es$/i, '');
  else s = s.replace(/s$/i, '');
  return s;
}
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
// First name for matching a labelled email/phone — drop any honorific so
// "Mrs. Lisa Cortez" matches the "Lisa" label.
const firstName = (nm) =>
  String(nm || '')
    .replace(/^(?:mr|mrs|ms|dr|miss)\.?\s+/i, '')
    .trim()
    .split(/\s+/)[0];
const CLASS_SLUG = {
  Twos: 'twos',
  Threes: 'threes',
  'Pre-K AM': 'pre-k-am',
  'Pre-K PM': 'pre-k-pm',
};

// --- Photo upload (cached by source URL) -------------------------------------
const photoCache = existsSync(PHOTO_CACHE) ? JSON.parse(readFileSync(PHOTO_CACHE, 'utf8')) : {};
async function uploadPhoto(url, label) {
  if (!url) return null;
  if (photoCache[url]) return photoCache[url];
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload('image', buf, {
      filename: `${slugify(label)}-family.jpg`,
    });
    photoCache[url] = asset._id;
    writeFileSync(PHOTO_CACHE, JSON.stringify(photoCache, null, 2));
    return asset._id;
  } catch (e) {
    console.warn(`  ! photo failed for ${label}: ${e.message}`);
    return null;
  }
}

// --- Build + write each family ----------------------------------------------
for (const fam of FAMILIES) {
  const fname = surname(fam.name);
  const emailByLabel = Object.fromEntries((fam.emails || []).map((e) => [e.label, e.value]));
  const phoneByLabel = Object.fromEntries((fam.phones || []).map((p) => [p.label, p.value]));

  // Adults (parents, grandparents, staff) vs children (a class role). Keep each
  // adult's real role from the source instead of assuming "Parent".
  const parents = (fam.members || [])
    .filter((mm) => !CLASS_SLUG[mm.role])
    .map((mm) => {
      const fn = firstName(mm.name);
      return {
        _key: key(),
        name: mm.name,
        role: mm.role || 'Parent',
        ...(emailByLabel[fn] ? { email: emailByLabel[fn] } : {}),
        ...(phoneByLabel[fn] ? { phone: phoneByLabel[fn] } : {}),
      };
    });

  const children = (fam.members || [])
    .filter((mm) => CLASS_SLUG[mm.role])
    .map((mm) => ({ _key: key(), name: mm.name, class: CLASS_SLUG[mm.role] }));

  const doc = {
    _id: `directoryEntry-${slugify(fname)}`,
    _type: 'directoryEntry',
    familyName: fname,
    optedIn: true,
    parents,
    children,
    ...(fam.address ? { address: fam.address } : {}),
    ...(fam.coords && typeof fam.coords.lat === 'number'
      ? { location: { _type: 'geopoint', lat: fam.coords.lat, lng: fam.coords.lng } }
      : {}),
    ...(fam.note ? { notes: fam.note } : {}),
  };

  const assetId = await uploadPhoto(fam.photo, fname);
  if (assetId) {
    doc.photo = {
      _type: 'image',
      asset: { _type: 'reference', _ref: assetId },
      alt: `The ${fname} family`,
    };
  }

  await client.createOrReplace(doc);
  console.log(
    `✓ ${fname}  (${parents.length} parent(s), ${children.length} child(ren)${assetId ? ', photo' : ''}${doc.location ? ', pin' : ''})`,
  );
}

console.log(`\nDone. ${FAMILIES.length} families in the directory.`);
