// =============================================================================
// pageBuilderConfig - what this repo's pages are shaped like
// =============================================================================
// The canonical "Check this page" library (src/lib/page-checks.ts) is
// byte-identical in every repo in this family, so the repo-specific answers
// arrive from HERE, at a path every repo shares: where a page keeps its
// sections, which sections fill themselves, and which addresses the site code
// owns.
//
// NOT canonical on purpose. Editing this file is how this repo adapts the
// feature; editing src/lib/page-checks.ts is drift. See card 25 in the starter's
// PORTS.md (ncs-astro-sanity-starter).
//
// It imports nothing from the schema, so the check library stays testable
// without a Studio. The lists below are therefore copies, and each one says
// which file it mirrors.
// =============================================================================

import type { PageCheckConfig } from '../lib/page-checks';

/**
 * Every document type that carries a page-builder array, and the field a new
 * section is appended to. The "Save a section as preset" and "Check this page"
 * actions are offered on these types.
 *
 * Only `page` for now. `hubPage` also holds a `sections` array, but the gated
 * hub does not offer either action, so it is left off deliberately.
 */
export const SECTION_HOST_TYPES: Readonly<Record<string, string>> = {
  page: 'sections',
};

/** The same list as a set, for the document-actions resolver in sanity.config.ts. */
export const PAGE_BUILDER_TYPES = new Set<string>(Object.keys(SECTION_HOST_TYPES));

/**
 * Section types that fill THEMSELVES from a list elsewhere in the Studio (the
 * "From your lists (auto-updating)" band of the insert menu, plus the money
 * and contact sections that read a singleton). A teachers section with no
 * heading is not an empty section: it is a section that gets its words from the
 * Staff list. Keep roughly in sync with src/sanity/schemaTypes/sections/index.ts
 * - a name that drifts off this list only costs a false "worth a look".
 */
const SELF_FILLING_SECTIONS = [
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
];

/**
 * First path segments the SITE CODE owns, not the page builder: a link to
 * /events or /news is fine even though no `page` document has that slug.
 * Mirrors RESERVED_PAGE_SLUGS in src/sanity/schemaTypes/documents/page.ts (kept
 * separate so the check library imports nothing) plus the built asset folders.
 */
const CODE_OWNED_PATHS = [
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

export const PAGE_CHECK_CONFIG: PageCheckConfig = {
  // One builder array. Every page holds its body in `sections`.
  sectionArrays: ['sections'],
  // Every page also has one fixed hero object above the sections. It IS checked
  // for emptiness here: a WCP hero carries the page heading, so a hero with
  // nothing typed in it is a real "worth a look", not a design choice.
  header: { label: 'Hero (top banner)', fields: ['hero'], checkEmpty: true },
  selfFillingSections: SELF_FILLING_SECTIONS,
  codeOwnedPaths: CODE_OWNED_PATHS,
};
