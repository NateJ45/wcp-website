// =============================================================================
// section-coach — unit tests for the empty-state coaching registry
// =============================================================================
// These pin the two things that can silently break the rule:
//   1. A freshly inserted section of every coached type MUST report a coach.
//      (A section with content must NOT.)
//   2. Every coached type must be a real body section type, and no type may
//      claim a coach it cannot need.
// =============================================================================
import { describe, expect, it } from 'vitest';
import type { SectionData } from '@/components/sections/section-helpers';
import { COACHED_SECTION_TYPES, sectionCoach } from './section-coach';
import { BODY_SECTION_TYPE_NAMES } from '@/sanity/schemaTypes/sections';

/** A section exactly as the Studio inserts it: a type, a key, nothing else. */
const fresh = (type: string): SectionData => ({ _type: type, _key: 'k1' });

describe('sectionCoach', () => {
  it('coaches every registered type right after insert', () => {
    for (const type of COACHED_SECTION_TYPES) {
      const coach = sectionCoach(fresh(type));
      expect(coach, `${type} must coach when empty`).not.toBeNull();
      expect(coach?.name.length).toBeGreaterThan(0);
      expect(coach?.hint.length).toBeGreaterThan(0);
    }
  });

  it('writes hints in house style: one short sentence, no em-dash', () => {
    for (const type of COACHED_SECTION_TYPES) {
      const hint = sectionCoach(fresh(type))?.hint ?? '';
      expect(hint, `${type} hint must not use an em-dash`).not.toMatch(/—/);
      expect(hint.endsWith('.'), `${type} hint must end in a period`).toBe(true);
      expect(hint.split(/\s+/).length, `${type} hint must stay short`).toBeLessThanOrEqual(20);
    }
  });

  it('only registers real body section types', () => {
    for (const type of COACHED_SECTION_TYPES) {
      expect(BODY_SECTION_TYPE_NAMES, `${type} is not a body section`).toContain(type);
    }
  });

  it('stays quiet for an unknown type', () => {
    expect(sectionCoach(fresh('somethingElseSection'))).toBeNull();
  });

  it('stays quiet once a section holds its content', () => {
    expect(sectionCoach({ ...fresh('cardGridSection'), cards: [{ title: 'A' }] })).toBeNull();
    expect(sectionCoach({ ...fresh('pullQuoteSection'), quote: 'We love it here.' })).toBeNull();
    expect(sectionCoach({ ...fresh('videoSection'), videoUrl: 'https://youtu.be/x' })).toBeNull();
    expect(sectionCoach({ ...fresh('albumSection'), album: { _ref: 'abc' } })).toBeNull();
    expect(
      sectionCoach({ ...fresh('proseSection'), body: [{ _type: 'block', children: [] }] }),
    ).toBeNull();
  });

  it('treats blank text as empty', () => {
    expect(sectionCoach({ ...fresh('pullQuoteSection'), quote: '   ' })).not.toBeNull();
    expect(sectionCoach({ ...fresh('noticeBarSection'), text: '' })).not.toBeNull();
  });

  it('leaves the self-filling "pull" sections alone', () => {
    // These fetch their own collection inside the component and hide themselves
    // when it is empty. The registry cannot see that fetch, so it must not
    // claim them.
    for (const type of [
      'latestPostsSection',
      'upcomingEventsSection',
      'programCardsSection',
      'boardMembersSection',
      'logoStripSection',
      'campaignSection',
      'downloadsSection',
      'tuitionCalculatorSection',
      'instagramSection',
      'jobsSection',
      'enrollmentCtaSection',
      'contactDetailsSection',
      'formSection',
      'newsletterSignupSection',
      'reviewFormSection',
    ]) {
      expect(sectionCoach(fresh(type)), `${type} must not coach`).toBeNull();
    }
  });
});
