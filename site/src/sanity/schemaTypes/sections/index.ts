// =============================================================================
// Section palette — every body section type + the hero object
// =============================================================================
// SECTION_OBJECT_TYPES registers them all in the Studio; BODY_SECTION_TYPES is
// the list the page's `sections` array accepts (everything except the hero,
// which is a dedicated page-level field).
// =============================================================================
import { heroObject } from './hero';
import { proseSection, ctaSection, noticeBarSection, contactDetailsSection } from './basic';
import { cardGridSection, statBandSection } from './cards';
import {
  testimonialSection,
  teacherSection,
  classCardsSection,
  faqSection,
  schoolYearSection,
  tuitionTableSection,
  tuitionCalculatorSection,
  enrollmentCtaSection,
} from './library';
import {
  scheduleSection,
  stepListSection,
  compareSection,
  gallerySection,
  storyTimelineSection,
  splitMediaSection,
} from './structured';
import { latestPostsSection, upcomingEventsSection } from './blog';
import { formSection, newsletterSignupSection, reviewFormSection } from './form';
import { tabsSection } from './tabs';
import {
  videoSection,
  mapSection,
  accordionSection,
  quickFactsSection,
  pullQuoteSection,
  countdownSection,
} from './extras';
import {
  programCardsSection,
  boardMembersSection,
  logoStripSection,
  campaignSection,
  jobsSection,
  downloadsSection,
  albumSection,
  instagramSection,
} from './community';

// Body sections, in the order they appear in the "add section" menu.
const BODY_SECTIONS = [
  proseSection,
  cardGridSection,
  statBandSection,
  ctaSection,
  testimonialSection,
  teacherSection,
  classCardsSection,
  faqSection,
  schoolYearSection,
  tuitionTableSection,
  tuitionCalculatorSection,
  enrollmentCtaSection,
  scheduleSection,
  stepListSection,
  compareSection,
  tabsSection,
  accordionSection,
  quickFactsSection,
  pullQuoteSection,
  videoSection,
  mapSection,
  countdownSection,
  gallerySection,
  storyTimelineSection,
  splitMediaSection,
  latestPostsSection,
  upcomingEventsSection,
  formSection,
  newsletterSignupSection,
  reviewFormSection,
  noticeBarSection,
  contactDetailsSection,
  programCardsSection,
  boardMembersSection,
  logoStripSection,
  campaignSection,
  jobsSection,
  downloadsSection,
  albumSection,
  instagramSection,
];

/** All section object types to register in the schema. */
export const SECTION_OBJECT_TYPES = [heroObject, ...BODY_SECTIONS];

/** Type names the page `sections` array accepts (excludes the hero). */
export const BODY_SECTION_TYPE_NAMES = BODY_SECTIONS.map((s) => s.name);

// The "+ Add section" picker, grouped so a volunteer scans five named bands
// instead of one 40-item list. Groups use volunteer language, not type names.
// Every BODY section must appear in exactly one group — the dev-time check
// below throws at Studio load if a new section is added without a group.
const INSERT_MENU_GROUPS: { name: string; title: string; of: string[] }[] = [
  {
    name: 'words',
    title: 'Words, photos & video',
    of: [
      'proseSection',
      'pullQuoteSection',
      'splitMediaSection',
      'gallerySection',
      'storyTimelineSection',
      'videoSection',
    ],
  },
  {
    name: 'facts',
    title: 'Cards, facts & tables',
    of: [
      'cardGridSection',
      'statBandSection',
      'quickFactsSection',
      'scheduleSection',
      'stepListSection',
      'compareSection',
      'tabsSection',
      'accordionSection',
      'countdownSection',
    ],
  },
  {
    name: 'lists',
    title: 'From your lists (auto-updating)',
    of: [
      'testimonialSection',
      'teacherSection',
      'classCardsSection',
      'faqSection',
      'schoolYearSection',
      'latestPostsSection',
      'upcomingEventsSection',
      'programCardsSection',
      'boardMembersSection',
      'logoStripSection',
      'campaignSection',
      'jobsSection',
      'downloadsSection',
      'albumSection',
      'instagramSection',
    ],
  },
  {
    name: 'money',
    title: 'Money & enrolling',
    of: ['tuitionTableSection', 'tuitionCalculatorSection', 'enrollmentCtaSection'],
  },
  {
    name: 'contact',
    title: 'Banners, forms & contact',
    of: [
      'ctaSection',
      'noticeBarSection',
      'formSection',
      'newsletterSignupSection',
      'reviewFormSection',
      'contactDetailsSection',
      'mapSection',
    ],
  },
];

// Fail loudly at Studio load when the groups and the palette drift apart.
{
  const grouped = new Set(INSERT_MENU_GROUPS.flatMap((g) => g.of));
  const missing = BODY_SECTIONS.map((s) => s.name).filter((n) => !grouped.has(n));
  if (missing.length > 0) {
    throw new Error(`Section(s) missing from the insert-menu groups: ${missing.join(', ')}`);
  }
}

/**
 * Grouped "+ Add" menu options for a sections array. Pass the type names the
 * array accepts; groups trim to them, so the hub's smaller palette keeps the
 * same bands with the unavailable types gone.
 */
export function sectionInsertMenu(available: string[]) {
  const allowed = new Set(available);
  return {
    insertMenu: {
      filter: true,
      groups: INSERT_MENU_GROUPS.map((g) => ({
        ...g,
        of: g.of.filter((n) => allowed.has(n)),
      })).filter((g) => g.of.length > 0),
    },
  };
}

// Sections safe on the GATED hub pages: content / data-driven only. The
// "pull" sections fetch at BUILD time (cmsFetch), which doesn't run at request
// time behind the family gate, so they're excluded from the hub palette.
const HUB_SAFE = new Set([
  'proseSection',
  'cardGridSection',
  'statBandSection',
  'ctaSection',
  'faqSection',
  'scheduleSection',
  'stepListSection',
  'compareSection',
  'tabsSection',
  'accordionSection',
  'quickFactsSection',
  'pullQuoteSection',
  'videoSection',
  'mapSection',
  'countdownSection',
  'gallerySection',
  'storyTimelineSection',
  'splitMediaSection',
  'formSection',
]);
export const HUB_SECTION_TYPE_NAMES = BODY_SECTIONS.filter((s) => HUB_SAFE.has(s.name)).map(
  (s) => s.name,
);
