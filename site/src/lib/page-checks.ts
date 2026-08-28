// =============================================================================
// page-checks — the courtesy "Check this page" pass, as pure functions
// =============================================================================
// WHAT THIS IS. A board member finishes a page and wants a second pair of eyes
// before publishing. This walks the DRAFT document and reports three kinds of
// "worth a look": a photo with no alt text, a section with nothing typed in it,
// and a link to an address no page seems to own.
//
// WHAT THIS IS NOT. It never blocks a publish and it never edits anything. Every
// finding is a suggestion, and every check is a HEURISTIC: it walks unknown
// shapes generically rather than knowing all forty section types, so it can miss
// things and it can be wrong. The wording in the Studio says so out loud.
//
// It lives in src/lib (not src/sanity) and imports nothing, so it is unit
// tested without a Studio, a browser, or a dataset. The Studio side of it is a
// thin shell: src/sanity/actions/checkPage.tsx.
// =============================================================================

/** The three things we look for. */
export type CheckId = 'alt' | 'empty' | 'links';

/** One thing worth a look, tied to the part of the page it was found in. */
export interface Finding {
  /** Human location, e.g. "Hero" or "Section 3: Photo gallery". */
  where: string;
  /** What we noticed, in plain words. */
  detail: string;
}

/** One check's results. Empty `findings` is the good case. */
export interface CheckGroup {
  id: CheckId;
  title: string;
  /** Honest one-liner about what this check can and cannot see. */
  note: string;
  findings: Finding[];
}

/** One walkable piece of a page: the hero, then each section in order. */
export interface PageUnit {
  where: string;
  /** Schema type name, e.g. `gallerySection`. Empty for a shapeless value. */
  type: string;
  value: unknown;
}

// ---------------------------------------------------------------------------
// Shared walking helpers
// ---------------------------------------------------------------------------

/** Sanity's own bookkeeping keys — never content, never a link. */
const META_KEYS = new Set([
  '_type',
  '_key',
  '_ref',
  '_id',
  '_rev',
  '_createdAt',
  '_updatedAt',
  '_weak',
  '_strengthenOnPublish',
  '_originalId',
  '_system',
  '_dataset',
  '_projectId',
]);

/**
 * Keys that hold a SETTING rather than words: "variant", "tone", "layout" and
 * friends are enum values with an initialValue, so a completely empty section
 * still has several of them. Counting those as content would make the
 * "nothing typed here" check permanently silent.
 */
const SETTING_KEYS = new Set([
  'align',
  'alignment',
  'appearance',
  'aspect',
  'background',
  'color',
  'columns',
  'density',
  'direction',
  'icon',
  'kind',
  'layout',
  'level',
  'mediaType',
  'mode',
  'ratio',
  'size',
  'style',
  'theme',
  'tone',
  'variant',
  'width',
]);

/**
 * Section types that fill THEMSELVES from a list elsewhere in the Studio (the
 * "From your lists (auto-updating)" band of the insert menu, plus the money
 * and contact sections that read a singleton). A teachers section with no
 * heading is not an empty section: it is a section that gets its words from the
 * Staff list. Keep roughly in sync with src/sanity/schemaTypes/sections/index.ts
 * — a name that drifts off this list only costs a false "worth a look".
 */
const SELF_FILLING_SECTIONS = new Set([
  'albumSection',
  'boardMembersSection',
  'campaignSection',
  'classCardsSection',
  'contactDetailsSection',
  'downloadsSection',
  'enrollmentCtaSection',
  'faqSection',
  'instagramSection',
  'jobsSection',
  'latestPostsSection',
  'logoStripSection',
  'mapSection',
  'newsletterSignupSection',
  'programCardsSection',
  'reviewFormSection',
  'schoolYearSection',
  'teacherSection',
  'testimonialSection',
  'tuitionCalculatorSection',
  'tuitionTableSection',
  'upcomingEventsSection',
]);

/**
 * First path segments the SITE CODE owns, not the page builder: a link to
 * /events or /news is fine even though no `page` document has that slug.
 * Mirrors RESERVED_PAGE_SLUGS in src/sanity/schemaTypes/documents/page.ts (kept
 * separate so this file imports nothing) plus the built asset folders.
 */
export const CODE_OWNED_PATHS: readonly string[] = [
  '404',
  'api',
  'colophon',
  'curriculum',
  'enrollment-packet',
  'events',
  'family-hub',
  'hero',
  'ig',
  'news',
  'newsletter',
  'og',
  'pagefind',
  'preview',
  'search',
  'studio',
  'supplies',
  'thank-you',
];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Visit every (key, value) pair in a nested value, arrays included. */
function walk(value: unknown, visit: (key: string, value: unknown) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    visit(key, child);
    walk(child, visit);
  }
}

/** `splitMediaSection` → "Split media". No lookup table to fall out of date. */
export function sectionLabel(type: string): string {
  const bare = type.replace(/Section$|Object$/, '');
  const words = bare.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The hero and every section, in page order, each with the label a finding
 * points at. Sections keep their 1-based position because that is how the
 * Sections list in the Studio counts them.
 */
export function pageUnits(doc: unknown): PageUnit[] {
  const page = isRecord(doc) ? doc : {};
  const units: PageUnit[] = [];
  if (isRecord(page.hero)) {
    units.push({ where: 'Hero (top banner)', type: 'heroObject', value: page.hero });
  }
  const sections = Array.isArray(page.sections) ? page.sections : [];
  sections.forEach((section, i) => {
    const type = isRecord(section) && typeof section._type === 'string' ? section._type : '';
    units.push({
      where: `Section ${i + 1}${type ? `: ${sectionLabel(type)}` : ''}`,
      type,
      value: section,
    });
  });
  return units;
}

// ---------------------------------------------------------------------------
// Check 1 — photos with no alt text
// ---------------------------------------------------------------------------

const nonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** An uploaded image value: anything carrying `asset._ref`. */
function isImageValue(v: unknown): v is Record<string, unknown> {
  if (!isRecord(v)) return false;
  const asset = v.asset;
  return isRecord(asset) && typeof asset._ref === 'string';
}

/**
 * Does this image have a description somewhere a renderer would find it?
 *
 * The repo models alt text three ways and this covers all of them:
 *  - `figureImage`: `{ image: <img>, alt }`      → the parent's `alt`
 *  - the hero:      `{ image: <img>, imageAlt }` → the parent's `<key>Alt`
 *  - inline:        `{ ..., alt }` on the image  → the image's own `alt`
 * A parent holding two images and one alt reads as "described", which is the
 * kind of miss this check is allowed to make.
 */
function imageHasAlt(
  image: Record<string, unknown>,
  parent: Record<string, unknown> | null,
  key: string | null,
): boolean {
  const candidates: unknown[] = [image.alt, image.altText];
  if (parent) {
    candidates.push(parent.alt, parent.altText);
    if (key) candidates.push(parent[`${key}Alt`], parent[`${key}AltText`]);
  }
  return candidates.some(nonEmptyString);
}

/** Every image in a value, with the object and key it hangs off. */
function eachImage(
  value: unknown,
  visit: (
    image: Record<string, unknown>,
    parent: Record<string, unknown> | null,
    key: string | null,
  ) => void,
  parent: Record<string, unknown> | null = null,
  key: string | null = null,
): void {
  if (Array.isArray(value)) {
    for (const item of value) eachImage(item, visit, parent, key);
    return;
  }
  if (!isRecord(value)) return;
  if (isImageValue(value)) visit(value, parent, key);
  for (const [childKey, child] of Object.entries(value)) {
    if (META_KEYS.has(childKey)) continue;
    eachImage(child, visit, value, childKey);
  }
}

function checkAltText(units: PageUnit[]): CheckGroup {
  const findings: Finding[] = [];
  for (const unit of units) {
    let missing = 0;
    eachImage(unit.value, (image, parent, key) => {
      if (!imageHasAlt(image, parent, key)) missing += 1;
    });
    if (missing > 0) {
      findings.push({
        where: unit.where,
        detail:
          missing === 1
            ? 'A photo here has no description (alt text).'
            : `${missing} photos here have no description (alt text).`,
      });
    }
  }
  return {
    id: 'alt',
    title: 'Photos without a description',
    note: 'Alt text is the sentence a screen reader says, and what shows if the photo fails to load. Some photos are decoration and genuinely need none, so use your judgement.',
    findings,
  };
}

// ---------------------------------------------------------------------------
// Check 2 — sections with nothing typed in them
// ---------------------------------------------------------------------------

/** Any real words anywhere in this value (settings and ids do not count). */
export function hasTypedContent(value: unknown): boolean {
  let found = false;
  walk(value, (key, child) => {
    if (found) return;
    if (META_KEYS.has(key) || SETTING_KEYS.has(key)) return;
    if (nonEmptyString(child)) found = true;
  });
  return found;
}

function checkEmptySections(units: PageUnit[]): CheckGroup {
  const findings: Finding[] = [];
  for (const unit of units) {
    if (SELF_FILLING_SECTIONS.has(unit.type)) continue;
    if (hasTypedContent(unit.value)) continue;
    findings.push({
      where: unit.where,
      detail: 'Nothing is typed in this one yet, so it may show up blank.',
    });
  }
  return {
    id: 'empty',
    title: 'Sections with nothing in them',
    note: 'Sections that fill themselves from a list (Teachers, FAQs, News, Tuition and so on) are skipped, because their words live elsewhere.',
    findings,
  };
}

// ---------------------------------------------------------------------------
// Check 3 — links to addresses no page owns
// ---------------------------------------------------------------------------

/** Trim a written link down to the path we can compare: `/about?x=1#top` → `/about`. */
export function normalizePath(href: string): string | null {
  const raw = href.trim();
  // Only same-site paths. Full URLs, mailto:, tel:, and bare anchors are
  // somebody else's problem (the weekly link check covers external links).
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  const path = raw.split(/[?#]/)[0];
  if (path === '/') return '/';
  return path.replace(/\/+$/, '') || '/';
}

/** Every same-site path written anywhere in a value. */
export function internalPaths(value: unknown): string[] {
  const found: string[] = [];
  walk(value, (key, child) => {
    if (META_KEYS.has(key)) return;
    if (typeof child !== 'string') return;
    const path = normalizePath(child);
    if (path) found.push(path);
  });
  return found;
}

/**
 * Compare by FIRST SEGMENT, on purpose. `/events/fall-fair` and
 * `/curriculum/twos.pdf` are real addresses built by code from a list, and no
 * `page` document owns them, so matching the whole path would flag half the
 * site. First-segment matching under-reports and never cries wolf.
 */
function knownFirstSegments(knownSlugs: readonly string[]): Set<string> {
  const set = new Set<string>(CODE_OWNED_PATHS);
  for (const slug of knownSlugs) {
    const first = slug.split('/')[0];
    if (first) set.add(first);
  }
  return set;
}

function checkLinks(units: PageUnit[], knownSlugs: readonly string[]): CheckGroup {
  const known = knownFirstSegments(knownSlugs);
  const findings: Finding[] = [];
  for (const unit of units) {
    const unknown = new Set<string>();
    for (const path of internalPaths(unit.value)) {
      if (path === '/') continue; // the home page always exists
      const first = path.slice(1).split('/')[0];
      if (!known.has(first)) unknown.add(path);
    }
    for (const path of [...unknown].sort()) {
      findings.push({
        where: unit.where,
        detail: `Links to ${path}, and no page seems to live there.`,
      });
    }
  }
  return {
    id: 'links',
    title: 'Links worth a look',
    note: 'Only links to our own site are checked, and only by their first part, so a link listed here is a question, not a verdict.',
    findings,
  };
}

// ---------------------------------------------------------------------------
// The whole pass
// ---------------------------------------------------------------------------

/**
 * Run all three checks over a page document (the draft, when there is one).
 *
 * `knownSlugs` is every `page` slug in the dataset, e.g. `['home', 'about',
 * 'classes/twos']`. Always returns all three groups, in a fixed order, so the
 * dialog can show an all-clear line for the ones that found nothing.
 */
export function checkPage(doc: unknown, knownSlugs: readonly string[] = []): CheckGroup[] {
  const units = pageUnits(doc);
  return [checkAltText(units), checkEmptySections(units), checkLinks(units, knownSlugs)];
}

/** How many things the whole pass turned up. Zero is the celebrated case. */
export const countFindings = (groups: CheckGroup[]): number =>
  groups.reduce((n, g) => n + g.findings.length, 0);
