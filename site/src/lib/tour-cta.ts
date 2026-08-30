// =============================================================================
// tour-cta — ONE home for the site's primary call to action (W3, 2026-08-31)
// =============================================================================
// "Schedule a Tour → the tour form" was typed in NINE files, every copy aimed
// at `#sec-pp-tour-form` — an anchor derived from a hand-written Sanity
// section `_key`. If a volunteer ever deleted and re-added that form section,
// every tour button on the site would still scroll… to nothing, silently.
//
// Now: every code call site imports TOUR_HREF from here, and it points at the
// STABLE `#tour-form` anchor that SectionRenderer guarantees — it marks the
// first formSection on any page with that id, independent of the section's
// key. (The Menus doc's own stored header-CTA URL is Board data and still
// wins where it applies; this constant is the code-side default.)
// =============================================================================

/** The stable anchor id SectionRenderer stamps on the first form section. */
export const TOUR_FORM_ANCHOR = 'tour-form';

export const TOUR_HREF = `/virtual-tour#${TOUR_FORM_ANCHOR}`;
export const TOUR_LABEL = 'Schedule a Tour';
