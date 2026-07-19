// =============================================================================
// prepare-testimonial-photos.mjs — one-shot: archive headshots → committed WebP
// =============================================================================
// The old Squarespace site showed a photo beside every family quote. All 24
// source files live in the gitignored ../assets-from-squarespace/images/, at
// 7.5MB total, for images that render ~80px. This downscales them to 320px
// square WebP (~400KB total) into src/assets/testimonials/, which IS committed.
//
// The author→file mapping below is NOT guessed from filenames (an earlier pass
// did that and got three wrong). It is transcribed from the live old site,
// where every testimonial <img> carries the author's name in its alt attribute.
//
// Run once: node scripts/prepare-testimonial-photos.mjs
// =============================================================================
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(SITE_DIR, '../assets-from-squarespace/images');
const OUT = resolve(SITE_DIR, 'src/assets/testimonials');

// author → archive filename (verified present on disk, 24/24)
const MAP = {
  'Alison Blankenship': '013-Alison.jpg',
  'Erin McQuillen': '014-ErinMcqueen.jpg',
  'Amanda Hackney': '015-Amanda.jpg',
  'Taylor Dore': '047-TayloreDore.jpg',
  'Amber Cron': '050-448967548_10228935510510140_9150997885768748421_n.jpg',
  'Meagan Gegner': '054-495704435_10228526804301141_3646875931461916867_n.jpg',
  'Katherine Oliver': '056-Katherine.jpg',
  'Daniel Hagedorn': '057-395417966_10163531036432468_1334487575746853067_n.jpg',
  'Erin Schmerr': '062-Erin.jpg',
  'Lauren Lintz': '063-LaurenLintz.jpg',
  'Laura Gilbert': '064-LaurenGilbert.jpg',
  'Valerie Williams': '065-462682701_10233598382801508_8541926930120176671_n.jpg',
  'Nathan Nixon': '066-img_1_1711415359262.jpg',
  'Erin Millspaw': '067-erinmills.jpg',
  'Emily Wilkes': '068-3L7A7100.jpg',
  'Jessica Swarr': '069-2c95e942-0336-4fa5-938d-769de6e8b301.jpg',
  'Kayla Moormann': '070-image0.jpeg',
  'Lisa T.': '071-lisat.png',
  'Lexie Lenavitt': '072-512151748_10163404040888436_3057702550802177284_n.jpg',
  'Anita Shrestha': '073-3L7A7071.jpg',
  'Sara Jane Nixon': '074-SaraJaneNixon.jpg',
  'Courtney Marquart': '075-510583991_10226240783832728_8660122827878054808_n.jpg',
  'Teresa Vasquez': '076-FullSizeRender.jpeg',
  'Renee Ross': '077-reneeross.jpg',
};

// Must match normalizeAuthor() in src/lib/testimonial-photos.ts, then hyphenate.
export const slugFor = (author) =>
  author
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/ /g, '-');

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
