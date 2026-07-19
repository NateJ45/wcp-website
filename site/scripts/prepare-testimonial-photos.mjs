// =============================================================================
// prepare-testimonial-photos.mjs — one-shot: archive headshots → committed WebP
// =============================================================================
// The old Squarespace site showed a photo beside every family quote. All 24
// source files live in the gitignored ../assets-from-squarespace/images/, at
// 7.5MB total, for images that render ~80px. This downscales them to 320px
// square WebP (~400KB total) into src/assets/testimonials/, which IS committed.
//
// The author→file mapping (MAP) and the naming rule (slugFor) live in
// testimonial-photo-map.mjs, shared with patch-testimonial-photos.mjs — see
// that file's header for why a second copy would be dangerous.
//
// Run once: node scripts/prepare-testimonial-photos.mjs
// =============================================================================
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { MAP, slugFor } from './testimonial-photo-map.mjs';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(SITE_DIR, '../assets-from-squarespace/images');
const OUT = resolve(SITE_DIR, 'src/assets/testimonials');

if (!existsSync(SRC)) {
  throw new Error(`archive not found at ${SRC} (it is gitignored — ask Nathan for it)`);
}
mkdirSync(OUT, { recursive: true });

let bytes = 0;
for (const [author, file] of Object.entries(MAP)) {
  const from = join(SRC, file);
  if (!existsSync(from)) throw new Error(`missing source for ${author}: ${file}`);
  const to = join(OUT, `${slugFor(author)}.webp`);
  const info = await sharp(from)
    .resize(320, 320, { fit: 'cover', position: 'attention' })
    .webp({ quality: 82 })
    .toFile(to);
  bytes += info.size;
  console.log(
    `${author.padEnd(20)} -> ${slugFor(author)}.webp  ${(info.size / 1024).toFixed(0)}KB`,
  );
}
console.log(`\n${Object.keys(MAP).length} photos, ${(bytes / 1024).toFixed(0)}KB total`);
