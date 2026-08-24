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
    videoWebm{ "url": asset->url },
    actions[]{ label, style, linkType, "pageSlug": page->slug, url }
  },
  sections[]{
    ...,
    actions[]{ label, style, linkType, "pageSlug": page->slug, url },
    _type == "noticeBarSection" => { "pageSlug": page->slug },
    _type == "enrollmentCtaSection" => { "pageSlug": page->slug },
    _type == "testimonialSection" => {
      "items": select(
        source == "featured" => *[_type == "testimonial" && featured == true] | order(orderRank){ quote, author, role, photo },
        source == "all" => *[_type == "testimonial"] | order(orderRank){ quote, author, role, photo },
        source == "tag" => *[_type == "testimonial" && ^.tag in tags] | order(orderRank){ quote, author, role, photo },
        source == "manual" => manualItems[]->{ quote, author, role, photo }
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
        source == "category" => *[_type == "faqItem" && category == ^.category] | order(coalesce(orderRank, "~") asc, order asc){ question, answer },
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
  heading, intro, _updatedAt,
  "handbookUrl": handbookFile.asset->url,
  sections[]{
    ...,
    actions[]{ label, style, linkType, "pageSlug": page->slug, url },
    _type == "faqSection" => {
      "items": select(
        source == "category" => *[_type == "faqItem" && category == ^.category] | order(coalesce(orderRank, "~") asc, order asc){ question, answer },
        source == "inline" => inlineItems[]{ question, answer }
      )
    }
  }
}`;

/**
 * A Board-CREATED hub page, by its web address (the gated catch-all route).
 *
 * `!defined(hubKey)` is load-bearing: a built-in page has its own route and its
 * own widgets, so if someone ever set both a hubKey and a slug on one document,
 * serving it here would render the content WITHOUT those widgets and quietly
 * shadow the real page. Only genuinely free-standing pages match.
 */
export const HUB_PAGE_BY_SLUG_QUERY = `*[_type == "hubPage" && slug == $slug && !defined(hubKey)][0]{
  title, heading, intro, navIcon, _updatedAt,
  sections[]{
    ...,
    actions[]{ label, style, linkType, "pageSlug": page->slug, url },
    _type == "faqSection" => {
      "items": select(
        source == "category" => *[_type == "faqItem" && category == ^.category] | order(coalesce(orderRank, "~") asc, order asc){ question, answer },
        source == "inline" => inlineItems[]{ question, answer }
      )
    }
  }
}`;

/**
 * A hub page for the Studio's Presentation preview — matched by built-in key
 * OR board-created slug, one query for both kinds. Draft-aware via the
 * preview client; the /preview/family-hub route requires the Studio's
 * preview cookie before running it (gated content must never leak through
 * the preview side door).
 */
export const HUB_PAGE_PREVIEW_QUERY = `*[_type == "hubPage" && (hubKey == $key || slug == $key)][0]{
  _id, title, heading, intro,
  sections[]{
    ...,
    actions[]{ label, style, linkType, "pageSlug": page->slug, url },
    _type == "faqSection" => {
      "items": select(
        source == "category" => *[_type == "faqItem" && category == ^.category] | order(coalesce(orderRank, "~") asc, order asc){ question, answer },
        source == "inline" => inlineItems[]{ question, answer }
      )
    }
  }
}`;

/**
 * The first-visit tour (Studio → Family Hub → First-visit tour): the on/off
 * switch, the version stamp, and the step wording overrides. Structure and
 * fallback wording live in HubTourModal.astro.
 */
export const HUB_TOUR_QUERY = `*[_type == "hubTour"][0]{
  enabled, version,
  welcomeTitle, welcomeBody, navigateTitle, navigateBody, classesTitle, classesBody,
  helperTitle, helperBody, updatesTitle, updatesBody, moneyTitle, moneyBody,
  searchTitle, searchBody, helpTitle, helpBody
}`;

/**
 * The Board-editable hub menu (Studio → Family Hub → Family Hub menu).
 * Page links dereference inline so the rail needs exactly one read; the
 * resolver (src/lib/hub-nav-doc.ts) drops anything that dereferences to
 * nothing and falls back to the committed menu when the doc yields nothing.
 */
export const HUB_NAV_MENU_QUERY = `*[_type == "hubNavMenu"][0]{
  groups[]{
    label, accent,
    links[]{
      _type, target, label, hidden, url, icon,
      "page": page->{ title, heading, slug, navIcon }
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

// A post/newsletter/update `body` needs two references expanded: the sign-up
// card's sheet and the event card's event. Every body fetch interpolates this
// fragment so the renderer gets plain objects, not refs.
export const POST_BODY_PROJECTION = `body[]{
  ...,
  _type == "signupCard" => { "sheet": sheet->{ _id, title, open } },
  _type == "eventCard" => { "event": event->{ _id, title, startDate, endDate, allDay, location, "venue": venue->{ name, address, note } } }
}`;

/** One full post by slug (News article page + preview). */
export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  title, "slug": slug.current, publishedAt, _updatedAt, category, excerpt, "body": ${POST_BODY_PROJECTION}, coverImage,
  ogImage, seoTitle, seoDescription,
  "author": author->{ "name": name, honorific, role }
}`;

// -----------------------------------------------------------------------------
// Newsletter issues (public web archive at /newsletter/*)
// -----------------------------------------------------------------------------

/** Every issue slug — drives getStaticPaths for /newsletter/[slug]. */
export const ALL_NEWSLETTER_SLUGS_QUERY = `*[_type == "newsletterIssue" && defined(slug.current)].slug.current`;

/** Published issues, newest first (the /newsletter/archive list). */
export const NEWSLETTER_LIST_QUERY = `*[_type == "newsletterIssue" && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc){
  title, "slug": slug.current, publishedAt, preheader, coverImage
}`;

/** One full issue by slug (the /newsletter/[slug] page). */
export const NEWSLETTER_BY_SLUG_QUERY = `*[_type == "newsletterIssue" && slug.current == $slug][0]{
  title, "slug": slug.current, publishedAt, preheader, "body": ${POST_BODY_PROJECTION}, coverImage, ogImage, seoDescription
}`;

/** The single most recent published issue — the /api/newsletter send feed. */
export const NEWSLETTER_LATEST_QUERY = `*[_type == "newsletterIssue" && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc)[0]{
  title, "slug": slug.current, publishedAt, preheader, coverImage
}`;

// -----------------------------------------------------------------------------
// Events
// -----------------------------------------------------------------------------

const EVENT_FIELDS = `_id, title, startDate, endDate, allDay, location, category, description, ctaLabel, ctaUrl, recurrence, recurrenceEnd, venue->{name, address, note}`;

// A recurring event stays "active" while its repeat window is open, even after
// its first date has passed (expandRecurring then surfaces the next dates).
const RECURRING_STILL_ACTIVE = `recurrence in ["weekly","monthly"] && (coalesce(recurrenceEnd, "9999-12-31") + "T23:59:59Z") >= now()`;

/** Upcoming events (not yet ended, OR still repeating), soonest first. */
export const UPCOMING_EVENTS_QUERY = `*[_type == "event" && (coalesce(endDate, startDate) >= now() || (${RECURRING_STILL_ACTIVE}))] | order(startDate asc){${EVENT_FIELDS}}`;

/** Past events (ended and NOT still repeating), most recent first — the Events
 *  page archive. Capped so the archive can't grow without bound. */
export const PAST_EVENTS_QUERY = `*[_type == "event" && coalesce(endDate, startDate) < now() && !(${RECURRING_STILL_ACTIVE})] | order(startDate desc)[0...24]{${EVENT_FIELDS}}`;

// -----------------------------------------------------------------------------
// Future-proofing collections (programs, board, partners, campaigns, jobs, …)
// -----------------------------------------------------------------------------

export const PROGRAMS_QUERY = `*[_type == "program"] | order(orderRank){ name, icon, ageRange, schedule, summary, image }`;
export const BOARD_MEMBERS_QUERY = `*[_type == "boardMember"] | order(orderRank){ name, role, bio, photo, email }`;
export const PARTNERS_QUERY = `*[_type == "partner"] | order(orderRank){ name, logo, url }`;
export const CREDENTIALS_QUERY = `*[_type == "credential"] | order(orderRank){ name, logo, url }`;
export const ACTIVE_CAMPAIGN_QUERY = `*[_type == "campaign" && active == true] | order(_createdAt desc)[0]{ title, summary, goalAmount, raisedAmount, deadline, linkLabel, linkUrl }`;
// All active campaigns (newest first) — the section shows one bar each, so two
// concurrent drives (e.g. a spring auction + a scholarship fund) both appear.
export const ACTIVE_CAMPAIGNS_QUERY = `*[_type == "campaign" && active == true] | order(_createdAt desc){ title, summary, goalAmount, raisedAmount, deadline, linkLabel, linkUrl }`;
export const OPEN_JOBS_QUERY = `*[_type == "jobPosting" && active == true] | order(orderRank){ title, type, summary, body, applyUrl }`;
export const RESOURCES_QUERY = `*[_type == "resource"] | order(orderRank){ title, category, description, url, "fileUrl": file.asset->url }`;
export const PHOTO_ALBUM_QUERY = `*[_id == $id][0]{ title, description, photos }`;

export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{ name, founded, tagline, url, phone, emailGeneral, emailAdmin, emailTreasurer, street, city, state, zip, parkingNote, schoolYearLabel, enrollmentMode, enrollmentDeadline, closureStatement, yearStart, yearEnd, firstDay, facebook, instagram, googleRating, googleReviews, googleUrl, license, openingHours[]{ days, opens, closes } }`;

// The Family Hub home's store card (its own singleton so it lives in the
// Family Hub workspace; moved out of Site Settings 2026-08-23).
// Each product's picture prefers the uploaded photo; the legacy hotlinked
// URL is the fallback for anything unconverted (field audit 2026-08-23).
export const HUB_STORE_QUERY = `*[_type == "hubStore"][0]{ storeUrl, storeHeadline, storeTagline, storeProducts[]{ title, price, url, "image": coalesce(photo.asset->url, image) } }`;

/**
 * The handful of strings on code-owned utility pages (thank-you, 404, the
 * footer sign-off). Every field is optional — a blank one falls back to the
 * wording committed in the page.
 */
export const SITE_MICROCOPY_QUERY = `*[_type == "siteMicrocopy"][0]{
  thanksEyebrow, thanksTitle, thanksLead, thanksNote,
  tourThanksEyebrow, tourThanksLead, tourThanksNote,
  notFoundChip, notFoundHeading, notFoundBody,
  footerSignOff
}`;

/** The Board's extra fun days + giggles (Family Hub → Little delights). */
export const HUB_DELIGHTS_QUERY = `*[_type == "hubDelights"][0]{
  funDays[]{ date, label },
  giggles[]{ setup, punchline }
}`;

/** The current Family Handbook PDF (Hub settings → Each year). */
export const FAMILY_HANDBOOK_URL_QUERY = `*[_type == "hubSettings"][0].familyHandbook.asset->url`;

/** The hub home's numbers from Hub settings (family-count override). */
export const HUB_SETTINGS_HOME_QUERY = `*[_type == "hubSettings"][0]{ familyCount }`;

/** The "Seasonal touches" dropdown (auto / fall / winter / spring / summer / off). */
export const SITE_SETTINGS_SEASON_QUERY = `*[_type == "siteSettings"][0].season`;

/** The enrollment chair's availability Sheet ID (public class-card badges). */
export const SITE_SETTINGS_AVAILABILITY_SHEET_QUERY = `*[_type == "siteSettings"][0].availabilitySheetId`;

/**
 * Live count of FAMILIES visible in the gated Directory (opted-in only).
 *
 * `count(children) > 0` is what makes this a family count rather than an entry
 * count: the Directory also holds the teachers and the administrator (the
 * schema's parent `role` field takes a staff title on purpose), and they have
 * no children entries. Without the filter they were counted as families and the
 * org chart read "37 enrolled families" against a real roster of 34.
 *
 * It still measures the DIRECTORY, not enrollment — a family who opts out is
 * enrolled but uncounted. Anywhere that needs the true enrolled number should
 * use the `familyCount` override on hubSettings instead.
 */
export const DIRECTORY_FAMILY_COUNT_QUERY = `count(*[_type == "directoryEntry" && optedIn == true && count(children) > 0])`;

/**
 * The member-approved operating budget (Studio → Money & payments → Operating
 * budget). Totals are NOT stored — src/lib/budget.ts derives them from the
 * lines, so the summary can never disagree with the table.
 */
export const OPERATING_BUDGET_QUERY = `*[_type == "operatingBudget"][0]{
  year, enrollment, netNote, source,
  groups[]{ label, kind, icon, lines[]{ label, now, was, note } }
}`;

/**
 * The two co-op explainer blocks (Studio → Family Hub → How the co-op works):
 * the four commitment cards on Co-op Jobs, and the teacher-vs-rep "who to ask"
 * lists on the class pages. Layout stays in code; only the words are here.
 */
export const COOP_GUIDANCE_QUERY = `*[_type == "coopGuidance"][0]{
  principles[]{ icon, title, body },
  teacherAsks,
  repAsks
}`;

/**
 * WHO holds each co-op role this year (Studio → Family Hub → Who's who), for
 * the org chart and the class-rep cards. The chart's SHAPE stays in code
 * (src/data/hub/org-holders.ts); these documents supply only the people, so the
 * Board can do the post-election update without a deploy.
 *
 * `contactFrom` resolves the linked Directory entry inline, so a class rep's
 * email and phone are typed once (in the Directory) and reused here. The
 * `optedIn` guard is applied to the JOINED entry: a family who opted out of the
 * Directory resolves to null and the card shows no contact links.
 *
 * CONTAINS PII once a rep is linked — never cache this result.
 */
export const ROLE_HOLDERS_QUERY = `*[_type == "roleHolder" && defined(role)]{
  role,
  person,
  email,
  photo,
  "contact": contactFrom->{ optedIn, "parents": parents[]{ name, email, phone } }
}`;

/** The site-wide alert banner (only meaningful when active). */
export const CLOSURE_ALERT_QUERY = `*[_type == "closureAlert"][0]{ active, message, tone, linkLabel, linkUrl }`;

// Enabled announcements (bars + popups), priority-ordered. Time-window and
// per-page placement are applied at render time (see AnnouncementBars). Page
// slugs are plain strings on the page doc, so `->slug` gives them directly.
export const ANNOUNCEMENTS_QUERY = `*[_type == "announcement" && enabled == true] | order(priority asc, _createdAt asc){
  _id, title, format, template, message, tone, icon, heading,
  linkLabel, linkType, "pageSlug": page->slug, url,
  showFrom, showUntil, priority, placement, "pageSlugs": pages[]->slug,
  frequency, version, image
}`;

export const SCHOOL_YEAR_EVENTS_QUERY = `*[_type == "schoolYearEvent"] | order(orderRank){ month, title, body, icon, accent }`;

export const CLASS_ROWS_QUERY = `*[_type == "class"] | order(orderRank){ name, days, time, age, monthly, annual, studentFee }`;

// Enrollment mode + deadline (drives the self-adapting enrollment CTA).
export const SITE_ENROLLMENT_QUERY = `*[_type == "siteSettings"][0]{ enrollmentMode, enrollmentDeadline }`;

// Co-op hours page: the per-family annual goal + the school-wide total logged.
export const COOP_HOURS_META_QUERY = `{
  "goal": *[_type == "hubSettings"][0].coopHoursGoal,
  "communityHours": math::sum(*[_type == "hoursLog"].hours)
}`;

// One family's ledger, newest first (matched on the name they type in the hub).
export const COOP_HOURS_FOR_FAMILY_QUERY = `*[_type == "hoursLog" && lower(familyName) == lower($family)] | order(date desc, _createdAt desc){
  _id, familyName, hours, category, activity, date, verified, source
}`;

// Tuition calculator: class prices + the one-time enrollment fees.
export const TUITION_CALC_QUERY = `{
  "classes": *[_type == "class"] | order(orderRank){ name, "slug": slug.current, color, monthly, studentFee },
  "fees": *[_type == "feeSchedule"][0]{ registrationFee, participationFee }
}`;

export const FEE_SCHEDULE_QUERY = `*[_type == "feeSchedule"][0]{ registrationFee, participationFee }`;

// Everything the printable enrollment packet assembles: school facts + key
// dates, the classes with ages/schedule/tuition, the fee schedule, and the
// school-year-at-a-glance list. One build-time read; the packet is a static,
// print-optimized page (Save as PDF from the browser).
export const ENROLLMENT_PACKET_QUERY = `{
  "settings": *[_type == "siteSettings"][0]{
    name, shortName, tagline, phone, emailGeneral, emailAdmin, emailTreasurer,
    street, city, state, zip, url, schoolYearLabel, enrollmentDeadline, firstDay, yearStart, yearEnd
  },
  "classes": *[_type == "class"] | order(orderRank){
    name, age, days, time, monthly, annual, studentFee, "teacher": teacher->name
  },
  "fees": *[_type == "feeSchedule"][0]{
    registrationFee, registrationNote, participationFee, participationNote,
    annualAdjustmentNote, studentFeeBands[]{ label, amount }, paymentTerms[]{ question, answer }
  },
  "calendar": *[_type == "schoolYearEvent"] | order(orderRank){ month, title }
}`;

/** Everything the gated hub tuition page needs: fee amounts, notes, PayPal button
 *  ids, student-fee bands, and the payment FAQ. Falls back to hardcoded values. */
export const FEE_SCHEDULE_HUB_QUERY = `*[_type == "feeSchedule"][0]{
  registrationFee, registrationNote, registrationPayId,
  participationFee, participationNote, participationPayId,
  studentFeeBands[]{ label, amount, payId },
  paymentTerms[]{ icon, question, answer }
}`;

// Drag order (orderRank) decides order within each category; the coalesce("~")
// fallback keeps not-yet-ranked docs at the end of their category, tie-broken
// by the legacy `order` number so pre-drag content keeps today's order.
export const FAQ_ITEMS_QUERY = `*[_type == "faqItem"] | order(category asc, coalesce(orderRank, "~") asc, order asc){ question, answer, category, order }`;

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
  return `*[${filters.join(' && ')}] | order(orderRank)${range}{ quote, author, role, tags, featured, photo }`;
}
