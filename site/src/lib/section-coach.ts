// =============================================================================
// section-coach — the empty-state coaching registry (PREVIEW ONLY)
// =============================================================================
// A volunteer adds a section from the visual picker and lands back on the
// preview. Before this file, most sections rendered as a band of padding with
// nothing in it: an invisible stripe that reads as "the site is broken", not as
// "your turn to type". This registry answers one question per section type —
// "is this section still empty, and what should the editor add?" — so the
// preview can show a friendly dashed placeholder instead.
//
// PREVIEW ONLY, and provably so: the ONLY caller is SectionRenderer, and it
// calls this file only when `editDoc` is set. `editDoc` is passed by the
// preview routes in draft mode and by nothing else, so the live public site and
// the Family Hub never reach this code and their markup is byte-identical to
// what it was before. Do NOT wire this into a section component: an empty
// section's LIVE behavior (usually nothing at all, occasionally a hollow band)
// is deliberately left exactly as it was.
//
// Only section types whose emptiness is visible in the section's OWN data live
// here. The "pull" sections that fetch a collection inside their component
// (Latest news, Upcoming events, Programs, Board, Logo strip, Fundraising,
// Downloads, Tuition calculator, Instagram) hide themselves when the collection
// is empty, and this file cannot see that fetch — they are left alone.
//
// Hint style: plain, short, imperative, one thing per sentence (ASD-STE100-ish),
// and no em-dashes (house style).
// =============================================================================
import type { SectionData } from '@/components/sections/section-helpers';

export interface SectionCoachInfo {
  /** The section's plain-language name, the same words the Studio picker uses. */
  name: string;
  /** One sentence: what the editor should add. */
  hint: string;
}

interface CoachEntry extends SectionCoachInfo {
  /** True when the section holds none of the content it exists to show. */
  isEmpty: (section: SectionData) => boolean;
}

/** True for undefined / not-an-array / an empty array. */
const noItems = (v: unknown): boolean => !Array.isArray(v) || v.length === 0;

/** True for undefined / a blank string. */
const noText = (v: unknown): boolean => typeof v !== 'string' || v.trim() === '';

const COACH: Record<string, CoachEntry> = {
  proseSection: {
    name: 'Text section',
    hint: 'Write your paragraphs in the Text box.',
    isEmpty: (s) => noItems(s.body) && noItems((s.callout as { body?: unknown } | undefined)?.body),
  },
  cardGridSection: {
    name: 'Card grid',
    hint: 'Add one card for each point. Give each card a title and a short line of text.',
    isEmpty: (s) => noItems(s.cards),
  },
  statBandSection: {
    name: 'Stats band',
    hint: 'Add one number for each fact. Give each number a label.',
    isEmpty: (s) => noItems(s.stats),
  },
  ctaSection: {
    name: 'Call-to-action banner',
    hint: 'Add a heading and a button that tells people what to do next.',
    isEmpty: (s) => noText(s.title) && noText(s.lead) && noItems(s.actions),
  },
  testimonialSection: {
    name: 'Testimonials',
    hint: 'Choose where the quotes come from, or pick the reviews you want to show.',
    isEmpty: (s) => noItems(s.items),
  },
  teacherSection: {
    name: 'Teachers',
    hint: 'Choose the staff members you want to show here.',
    isEmpty: (s) => noItems(s.people),
  },
  classCardsSection: {
    name: 'Class cards',
    hint: 'Choose the classes you want to show as cards.',
    isEmpty: (s) => noItems(s.classItems),
  },
  faqSection: {
    name: 'FAQ',
    hint: 'Choose an FAQ category, or type the questions and answers here.',
    isEmpty: (s) => noItems(s.items),
  },
  schoolYearSection: {
    name: 'School-year moments',
    hint: 'Add the moments to the School-year list. They then show here on their own.',
    isEmpty: (s) => noItems(s.events),
  },
  tuitionTableSection: {
    name: 'Tuition table',
    hint: 'Add your classes and their prices to the Classes list. They then show here on their own.',
    isEmpty: (s) => noItems(s.classItems),
  },
  scheduleSection: {
    name: 'Daily schedule',
    hint: 'Add one row for each part of the day. Give each row a time and a title.',
    isEmpty: (s) => noItems(s.entries),
  },
  stepListSection: {
    name: 'Numbered steps',
    hint: 'Add one step for each thing a family must do, in the order they do it.',
    isEmpty: (s) => noItems(s.steps),
  },
  compareSection: {
    name: 'Comparison table',
    hint: 'Add one row for each thing you compare.',
    isEmpty: (s) => noItems(s.rows),
  },
  tabsSection: {
    name: 'Tabs',
    hint: 'Add one tab for each topic. Give each tab a label and its text.',
    isEmpty: (s) => noItems(s.tabs),
  },
  accordionSection: {
    name: 'Accordion',
    hint: 'Add one row for each topic. Give each row a label and its text.',
    isEmpty: (s) => noItems(s.items),
  },
  quickFactsSection: {
    name: 'Quick facts',
    hint: 'Add one fact for each item. Give each fact a value and a label.',
    isEmpty: (s) => noItems(s.facts),
  },
  pullQuoteSection: {
    name: 'Big statement',
    hint: 'Type the one sentence you want to show in large letters.',
    isEmpty: (s) => noText(s.quote),
  },
  videoSection: {
    name: 'Video',
    hint: 'Paste a YouTube or Vimeo link.',
    isEmpty: (s) => noText(s.videoUrl),
  },
  mapSection: {
    name: 'Map and directions',
    hint: 'Type the address you want to show on the map.',
    isEmpty: (s) => noText(s.address),
  },
  countdownSection: {
    name: 'Countdown',
    hint: 'Choose the date and time to count down to.',
    isEmpty: (s) => noText(s.targetDate),
  },
  gallerySection: {
    name: 'Photo gallery',
    hint: 'Add your photos. Give each photo a short description of what it shows.',
    isEmpty: (s) => noItems(s.photos),
  },
  storyTimelineSection: {
    name: 'Story timeline',
    hint: 'Add one moment for each part of the story. Give each moment a title and its photos.',
    isEmpty: (s) => noItems(s.moments),
  },
  splitMediaSection: {
    name: 'Image and text rows',
    hint: 'Add one row for each photo. Give each row a photo, a title, and a short paragraph.',
    isEmpty: (s) => noItems(s.rows),
  },
  noticeBarSection: {
    name: 'Announcement strip',
    hint: 'Type the short message you want to show in the strip.',
    isEmpty: (s) => noText(s.text),
  },
  albumSection: {
    name: 'Photo album',
    hint: 'Choose the photo album you want to show.',
    isEmpty: (s) => !(s.album as { _ref?: string } | undefined)?._ref,
  },
};

/**
 * The coaching note for a section that has no content yet, or `null` when the
 * section has something to show (or has no coaching entry at all).
 *
 * PREVIEW ONLY. Call this only behind the preview signal — see the header note.
 */
export function sectionCoach(section: SectionData): SectionCoachInfo | null {
  const entry = COACH[section._type];
  if (!entry || !entry.isEmpty(section)) return null;
  return { name: entry.name, hint: entry.hint };
}

/** The section types that can show a coaching note. Exported for the tests. */
export const COACHED_SECTION_TYPES = Object.keys(COACH);
