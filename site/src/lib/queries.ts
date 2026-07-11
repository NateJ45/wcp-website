// =============================================================================
// Shared GROQ queries — one source of truth for both read paths
// =============================================================================
// `src/lib/cms.ts` (build-time, published-only) and `src/lib/cms-preview.ts`
// (request-time, draft-aware) fetch the exact same shapes of data, differing
// only in *how* they fetch it, not *what*. Keeping the query strings here means
// a schema/projection change only has to happen in one place.
// =============================================================================

// -----------------------------------------------------------------------------
// Page builder
// -----------------------------------------------------------------------------

/** Every page's slug — drives getStaticPaths for the dynamic route. */
export const ALL_PAGE_SLUGS_QUERY = `*[_type == "page" && defined(slug)].slug`;

/** Every navigable page (excludes drafts implicitly via perspective). */
export const NAVIGATION_QUERY = `*[_type == "navigation"][0]{
  mainNav[]{
    _type, label,
    _type == "navLink" => { linkType, "pageSlug": page->slug, url },
    _type == "navGroup" => { children[]{ label, linkType, "pageSlug": page->slug, url } }
  },
  footerColumns[]{ label, links[]{ label, linkType, "pageSlug": page->slug, url } },
  legalNav[]{ label, linkType, "pageSlug": page->slug, url }
}`;

// One round-trip fetches a page, its hero, and every section with references
// (testimonials / staff / classes / FAQs / school-year / fees) dereferenced
// inline. Image fields stay as raw objects so urlForImage() can build URLs;
// video file assets are dereferenced to their CDN url. `^` inside a subquery
// refers up to the section being projected.
export const PAGE_BY_SLUG_QUERY = `*[_type == "page" && slug == $slug][0]{
  title, slug, seoTitle, seoDescription, ogImage,
  hero{
    ...,
    videoFile{ "url": asset->url },
    videoWebm{ "url": asset->url }
  },
  sections[]{
    ...,
    actions[]{ label, style, linkType, "pageSlug": page->slug, url },
    _type == "noticeBarSection" => { "pageSlug": page->slug },
    _type == "testimonialSection" => {
      "items": select(
        source == "featured" => *[_type == "testimonial" && featured == true] | order(order asc){ quote, author, role },
        source == "all" => *[_type == "testimonial"] | order(order asc){ quote, author, role },
        source == "tag" => *[_type == "testimonial" && ^.tag in tags] | order(order asc){ quote, author, role },
        source == "manual" => manualItems[]->{ quote, author, role }
      )
    },
    _type == "teacherSection" => {
      "people": staff[]->{ name, honorific, role, email, photo, bio }
    },
    _type == "classCardsSection" => {
      "classItems": classes[]->{ name, color, monthly, days, time, age, studentFee, "slug": slug.current }
    },
    _type == "faqSection" => {
      "items": select(
        source == "category" => *[_type == "faqItem" && category == ^.category] | order(order asc){ question, answer },
        source == "inline" => inlineItems[]{ question, answer }
      )
    },
    _type == "schoolYearSection" => {
      "events": *[_type == "schoolYearEvent"] | order(order asc){ month, title, body, icon, accent }
    },
    _type == "tuitionTableSection" => {
      "classItems": *[_type == "class"] | order(order asc){ name, days, time, age, monthly, annual, studentFee },
      "fees": *[_type == "feeSchedule"][0]{ registrationFee, participationFee }
    }
  }
}`;

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
