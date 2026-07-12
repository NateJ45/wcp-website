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
} from './library';
import {
  scheduleSection,
  stepListSection,
  compareSection,
  gallerySection,
  splitMediaSection,
} from './structured';
import { latestPostsSection, upcomingEventsSection } from './blog';
import { formSection, newsletterSignupSection } from './form';
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
  splitMediaSection,
  latestPostsSection,
  upcomingEventsSection,
  formSection,
  newsletterSignupSection,
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
  'splitMediaSection',
  'formSection',
]);
export const HUB_SECTION_TYPE_NAMES = BODY_SECTIONS.filter((s) => HUB_SAFE.has(s.name)).map(
  (s) => s.name,
);
