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
        source == "featured" => *[_type == "testimonial" && featured == true] | order(orderRank){ quote, author, role },
        source == "all" => *[_type == "testimonial"] | order(orderRank){ quote, author, role },
        source == "tag" => *[_type == "testimonial" && ^.tag in tags] | order(orderRank){ quote, author, role },
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
      "events": *[_type == "schoolYearEvent"] | order(orderRank){ month, title, body, icon, accent }
    },
    _type == "tuitionTableSection" => {
      "classItems": *[_type == "class"] | order(orderRank){ name, days, time, age, monthly, annual, studentFee },
      "fees": *[_type == "feeSchedule"][0]{ registrationFee, participationFee }
    }
  }
}`;

// -----------------------------------------------------------------------------
// Family Hub pages (gated, request-time) — the hub page-builder
// -----------------------------------------------------------------------------
// One hubPage per hub, fetched by hubKey behind the gate. Only the hub-safe
// (content) sections are offered, so the projection just needs actions + the
// faqSection dereference — no build-time "pull" sections here.
export const HUB_PAGE_QUERY = `*[_type == "hubPage" && hubKey == $key][0]{
  heading, intro,
  sections[]{
    ...,
    actions[]{ label, style, linkType, "pageSlug": page->slug, url },
    _type == "faqSection" => {
      "items": select(
        source == "category" => *[_type == "faqItem" && category == ^.category] | order(order asc){ question, answer },
        source == "inline" => inlineItems[]{ question, answer }
      )
    }
  }
}`;

// -----------------------------------------------------------------------------
// Blog / News
// -----------------------------------------------------------------------------

const POST_CARD_FIELDS = `
  title, "slug": slug.current, publishedAt, category, excerpt,
  coverImage, "author": author->{ "name": name, honorific }
`;

/** Every post's slug — drives getStaticPaths for /news/[slug]. */
export const ALL_POST_SLUGS_QUERY = `*[_type == "post" && defined(slug.current)].slug.current`;

/** All published posts, newest first (News index + pagination). */
export const POSTS_QUERY = `*[_type == "post" && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc){${POST_CARD_FIELDS}}`;

/** The most recent posts, for the homepage "Latest news" section. */
export const LATEST_POSTS_QUERY = `*[_type == "post" && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc)[0...12]{${POST_CARD_FIELDS}}`;

/** One full post by slug (News article page + preview). */
export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  title, "slug": slug.current, publishedAt, category, excerpt, body, coverImage,
  ogImage, seoTitle, seoDescription,
  "author": author->{ "name": name, honorific, role }
}`;

// -----------------------------------------------------------------------------
// Events
// -----------------------------------------------------------------------------

const EVENT_FIELDS = `_id, title, startDate, endDate, allDay, location, category, description, ctaLabel, ctaUrl`;

/** Upcoming events (not yet ended), soonest first — Events page + section. */
export const UPCOMING_EVENTS_QUERY = `*[_type == "event" && coalesce(endDate, startDate) >= now()] | order(startDate asc){${EVENT_FIELDS}}`;

// -----------------------------------------------------------------------------
// Future-proofing collections (programs, board, partners, campaigns, jobs, …)
// -----------------------------------------------------------------------------

export const PROGRAMS_QUERY = `*[_type == "program"] | order(orderRank){ name, icon, ageRange, schedule, summary, image }`;
export const BOARD_MEMBERS_QUERY = `*[_type == "boardMember"] | order(orderRank){ name, role, bio, photo, email }`;
export const PARTNERS_QUERY = `*[_type == "partner"] | order(orderRank){ name, logo, url }`;
export const CREDENTIALS_QUERY = `*[_type == "credential"] | order(orderRank){ name, logo, url }`;
export const ACTIVE_CAMPAIGN_QUERY = `*[_type == "campaign" && active == true] | order(_createdAt desc)[0]{ title, summary, goalAmount, raisedAmount, deadline, linkLabel, linkUrl }`;
export const OPEN_JOBS_QUERY = `*[_type == "jobPosting" && active == true] | order(orderRank){ title, type, summary, body, applyUrl }`;
export const RESOURCES_QUERY = `*[_type == "resource"] | order(orderRank){ title, category, description, url, "fileUrl": file.asset->url }`;
export const PHOTO_ALBUM_QUERY = `*[_id == $id][0]{ title, description, photos }`;

export const STAFF_QUERY = `*[_id == $id][0]{ name, honorific, role, years, email, pullQuote, bio }`;

export const CLASS_FACTS_QUERY = `*[_id == $id][0]{ name, days, daysCount, time, age, classSizeCap, monthly, annual, studentFee }`;

export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{ name, shortName, founded, tagline, url, phone, emailGeneral, emailAdmin, emailTreasurer, street, city, state, zip, parkingNote, schoolYearLabel, enrolling, closureStatement, yearStart, yearEnd, firstDay, familyCount, budgetSheetId, calendarFeedUrl, facebook, instagram, storeUrl, license, licenseAuthority }`;

export const SITE_SETTINGS_PARKING_NOTE_QUERY = `*[_type == "siteSettings"][0].parkingNote`;

/** The "Seasonal touches" dropdown (auto / fall / winter / spring / summer / off). */
export const SITE_SETTINGS_SEASON_QUERY = `*[_type == "siteSettings"][0].season`;

/** The enrollment chair's availability Sheet ID (public class-card badges). */
export const SITE_SETTINGS_AVAILABILITY_SHEET_QUERY = `*[_type == "siteSettings"][0].availabilitySheetId`;

/** Live count of families visible in the gated Directory (opted-in only). */
export const DIRECTORY_FAMILY_COUNT_QUERY = `count(*[_type == "directoryEntry" && optedIn == true])`;

/** The site-wide alert banner (only meaningful when active). */
export const CLOSURE_ALERT_QUERY = `*[_type == "closureAlert"][0]{ active, message, tone, linkLabel, linkUrl }`;

export const SCHOOL_YEAR_EVENTS_QUERY = `*[_type == "schoolYearEvent"] | order(orderRank){ month, title, body, icon, accent }`;

export const CLASS_ROWS_QUERY = `*[_type == "class"] | order(orderRank){ name, days, time, age, monthly, annual, studentFee }`;

export const FEE_SCHEDULE_QUERY = `*[_type == "feeSchedule"][0]{ registrationFee, participationFee }`;

/** Everything the gated hub tuition page needs: fee amounts, notes, PayPal button
 *  ids, student-fee bands, and the payment FAQ. Falls back to hardcoded values. */
export const FEE_SCHEDULE_HUB_QUERY = `*[_type == "feeSchedule"][0]{
  registrationFee, registrationNote, registrationPayId,
  participationFee, participationNote, participationPayId,
  studentFeeBands[]{ label, amount, payId },
  paymentTerms[]{ icon, question, answer }
}`;

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
  return `*[${filters.join(' && ')}] | order(orderRank)${range}{ quote, author, role, tags, featured }`;
}
