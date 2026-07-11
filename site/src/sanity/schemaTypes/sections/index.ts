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
  gallerySection,
  splitMediaSection,
  latestPostsSection,
  upcomingEventsSection,
  noticeBarSection,
  contactDetailsSection,
];

/** All section object types to register in the schema. */
export const SECTION_OBJECT_TYPES = [heroObject, ...BODY_SECTIONS];

/** Type names the page `sections` array accepts (excludes the hero). */
export const BODY_SECTION_TYPE_NAMES = BODY_SECTIONS.map((s) => s.name);
