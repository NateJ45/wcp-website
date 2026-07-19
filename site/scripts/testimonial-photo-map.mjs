// =============================================================================
// testimonial-photo-map.mjs — the ONE author -> archive-photo mapping
// =============================================================================
// Shared by scripts/prepare-testimonial-photos.mjs (archive -> committed WebP)
// and scripts/patch-testimonial-photos.mjs (WebP -> Sanity asset + testimonial
// doc patch). Both scripts need to agree on exactly which family goes with
// which quote, so the mapping lives in ONE place, not two.
//
// WHY this must not be duplicated: the mapping below is TRANSCRIBED from the
// live old site's <img alt="..."> attributes, not guessed from the archive's
// filenames (an earlier pass guessed and got three wrong — see the comment in
// testimonial-photos.ts). If a second copy of this table drifted from this
// one, even by a single entry, the wrong family's face would land on a real
// family's quote in Sanity, silently, with no test able to catch it (Sanity
// content isn't type-checked or unit-tested the way src/lib is). One export,
// one source of truth.
//
// Must match normalizeAuthor() in src/lib/testimonial-photos.ts (see slugFor
// below) — a `.mjs` script can't import a `.ts` module, so that rule is
// duplicated deliberately in patch-testimonial-photos.mjs with a comment
// pointing back here, not reimplemented differently.
// =============================================================================

// author -> archive filename (verified present on disk, 24/24)
export const MAP = {
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
