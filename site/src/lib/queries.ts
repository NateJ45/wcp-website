// =============================================================================
// Shared GROQ queries — one source of truth for both read paths
// =============================================================================
// `src/lib/cms.ts` (build-time, published-only) and `src/lib/cms-preview.ts`
// (request-time, draft-aware) fetch the exact same shapes of data, differing
// only in *how* they fetch it, not *what*. Keeping the query strings here means
// a schema/projection change only has to happen in one place.
// =============================================================================

export const STAFF_QUERY = `*[_id == $id][0]{ name, honorific, role, years, email, pullQuote, bio }`;

export const CLASS_FACTS_QUERY = `*[_id == $id][0]{ name, days, daysCount, time, age, classSizeCap, monthly, annual, studentFee }`;

export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{ name, shortName, founded, tagline, url, phone, emailGeneral, emailAdmin, emailTreasurer, street, city, state, zip, parkingNote, schoolYearLabel, enrolling, closureStatement, facebook, instagram, storeUrl, license, licenseAuthority }`;

export const SITE_SETTINGS_PARKING_NOTE_QUERY = `*[_type == "siteSettings"][0].parkingNote`;

export const PAGE_HERO_QUERY = `*[_type == "page" && slug == $slug][0]{ eyebrow, heroTitle, lead, seoTitle, seoDescription }`;

export const SCHOOL_YEAR_EVENTS_QUERY = `*[_type == "schoolYearEvent"] | order(order asc){ month, title, body, icon, accent }`;

export const CLASS_ROWS_QUERY = `*[_type == "class"] | order(order asc){ name, days, time, age, monthly, annual, studentFee }`;

export const FEE_SCHEDULE_QUERY = `*[_type == "feeSchedule"][0]{ registrationFee, participationFee }`;

export const FAQ_ITEMS_QUERY = `*[_type == "faqItem"] | order(category asc, order asc){ question, answer, category, order }`;

export const LEGAL_PAGE_LAST_UPDATED_QUERY = `*[_type == "legalPage" && slug == $slug][0].lastUpdated`;

/** Testimonials query is shaped by which optional filters are in play. */
export function testimonialsQuery(
  opts: { tag?: string; featuredOnly?: boolean; limit?: number } = {},
): string {
  const { tag, featuredOnly, limit } = opts;
  const filters = [
    '_type == "testimonial"',
    tag ? `$tag in tags` : null,
    featuredOnly ? 'featured == true' : null,
  ].filter(Boolean);
  const range = limit ? `[0...${limit}]` : '';
  return `*[${filters.join(' && ')}] | order(order asc)${range}{ quote, author, role, tags, featured }`;
}
