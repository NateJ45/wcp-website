import { describe, expect, it } from 'vitest';
import { readableWordCount, estimateReadMinutes } from './hub-reading-time';

// A tiny Portable Text block factory for the tests.
const block = (text: string) => ({
  _type: 'block',
  children: [{ _type: 'span', text }],
});

describe('readableWordCount', () => {
  it('is 0 for no sections', () => {
    expect(readableWordCount(undefined)).toBe(0);
    expect(readableWordCount([])).toBe(0);
  });

  it('counts heading title + lead', () => {
    expect(readableWordCount([{ header: { title: 'Two words', lead: 'three more words' } }])).toBe(
      5,
    );
  });

  it('counts prose body from Portable Text', () => {
    expect(
      readableWordCount([{ _type: 'proseSection', body: [block('one two three four')] }]),
    ).toBe(4);
  });

  it('counts FAQ question + Portable Text answer', () => {
    const words = readableWordCount([
      {
        _type: 'faqSection',
        items: [{ question: 'How many', answer: [block('exactly four words here')] }],
      },
    ]);
    expect(words).toBe(6); // "How many" (2) + "exactly four words here" (4)
  });

  it('ignores scannable blocks with no readable text fields', () => {
    expect(readableWordCount([{ _type: 'scheduleSection', rows: [{ time: '9:15' }] }])).toBe(0);
  });
});

describe('estimateReadMinutes', () => {
  it('is 0 when there is no text', () => {
    expect(estimateReadMinutes([])).toBe(0);
    expect(estimateReadMinutes([{ _type: 'gallerySection' }])).toBe(0);
  });

  it('rounds up to at least 1 minute for a little text', () => {
    expect(estimateReadMinutes([{ header: { title: 'a few words only here' } }])).toBe(1);
  });

  it('scales with word count (~200 wpm)', () => {
    const words = Array.from({ length: 600 }, (_, i) => `w${i}`).join(' ');
    expect(estimateReadMinutes([{ _type: 'proseSection', body: [block(words)] }])).toBe(3);
  });
});
