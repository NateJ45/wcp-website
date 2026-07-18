import { describe, expect, it } from 'vitest';
import {
  HUB_PAGE_ROUTES,
  extractStrings,
  pageEntries,
  sectionText,
  highlightParts,
  matchesWords,
  snippet,
} from './hub-search-index';

const proseSection = () => ({
  _type: 'proseSection',
  _key: 'k12',
  background: 'white',
  header: { _type: 'sectionHeader', title: 'What to pack', align: 'center' },
  body: [
    {
      _type: 'block',
      _key: 'b1',
      style: 'normal',
      markDefs: [],
      children: [
        { _type: 'span', _key: 's1', text: 'Send a water bottle and sunscreen.', marks: [] },
      ],
    },
  ],
});

describe('extractStrings', () => {
  it('pulls prose out of portable text', () => {
    expect(extractStrings(proseSection()).join(' ')).toContain('water bottle and sunscreen');
  });

  it('includes image ALT text — that is content, not machinery', () => {
    const withImage = {
      _type: 'splitMediaSection',
      _key: 'k9',
      rows: [{ _type: 'row', alt: 'A plush cat on the playground', title: 'Our class pet' }],
    };
    const out = extractStrings(withImage);
    expect(out).toContain('A plush cat on the playground');
    expect(out).toContain('Our class pet');
  });

  it('skips machinery so searching a token cannot match half the hub', () => {
    const noisy = {
      _type: 'cardGridSection',
      _key: 'k3',
      background: 'navy',
      cards: [{ icon: 'sun', style: 'bold', title: 'Sunny day plan' }],
    };
    const out = extractStrings(noisy);
    expect(out).toContain('Sunny day plan');
    // "navy" / "sun" / "bold" are enum + icon tokens, never prose.
    expect(out).not.toContain('navy');
    expect(out).not.toContain('sun');
    expect(out).not.toContain('bold');
  });

  it('drops URLs and single characters', () => {
    const withLinks = {
      _key: 'k4',
      label: 'Pay tuition',
      cta: 'https://example.com/pay',
      mail: 'mailto:a@b.com',
      initial: 'A',
    };
    const out = extractStrings(withLinks);
    expect(out).toEqual(['Pay tuition']);
  });
});

describe('sectionText', () => {
  it('de-duplicates repeated labels', () => {
    const repeated = { _key: 'k1', a: 'Snack', b: 'Snack', c: 'snack', d: 'Nap' };
    expect(sectionText(repeated)).toBe('Snack Nap');
  });

  it('caps runaway sections so the index stays shippable', () => {
    const long = { _key: 'k1', body: Array.from({ length: 400 }, (_, i) => `word${i}`) };
    const out = sectionText(long, 200);
    expect(out.length).toBeLessThanOrEqual(201); // 200 + the ellipsis
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('pageEntries', () => {
  it('deep-links to the section anchor when it has a heading', () => {
    const [entry] = pageEntries('twos', 'Twos & Threes Classroom', [proseSection()]);
    expect(entry.href).toBe('/family-hub/twos-threes#sec-k12');
    expect(entry.title).toBe('What to pack');
    expect(entry.sub).toBe('Twos & Threes Classroom');
    expect(entry.text).toContain('sunscreen');
  });

  it('does NOT invent an anchor for a section with no heading', () => {
    // HubSectionedBody only emits id="sec-…" when a header title exists, so a
    // deep link here would scroll to nothing.
    const headless = { _type: 'proseSection', _key: 'k7', body: 'Just some words here' };
    const [entry] = pageEntries('health', 'Health & Safety', [headless]);
    expect(entry.href).toBe('/family-hub/health');
    expect(entry.title).toBe('Health & Safety');
  });

  it('drops sections with no words', () => {
    const decorative = { _type: 'spacerSection', _key: 'k8', background: 'grey' };
    expect(pageEntries('health', 'Health & Safety', [decorative])).toEqual([]);
  });

  it('returns nothing for a hubKey with no rendered route', () => {
    // `threes` is a real doc that NO page renders (twos-threes reads the twos
    // doc), and `directory` is PII. Both must stay out of the index.
    expect(pageEntries('threes', 'Threes Classroom', [proseSection()])).toEqual([]);
    expect(pageEntries('directory', 'Family Directory', [proseSection()])).toEqual([]);
    expect(HUB_PAGE_ROUTES.threes).toBeUndefined();
    expect(HUB_PAGE_ROUTES.directory).toBeUndefined();
  });
});

describe('snippet', () => {
  it('windows around the matched word', () => {
    const text = `${'x'.repeat(300)} sunscreen and hats ${'y'.repeat(300)}`;
    const out = snippet(text, ['sunscreen']);
    expect(out).toContain('sunscreen');
    expect(out.length).toBeLessThan(160);
    expect(out.startsWith('…')).toBe(true);
  });

  it('falls back to the opening words when nothing matches', () => {
    expect(snippet('Short text', ['absent'])).toBe('Short text');
  });

  it('handles empty text', () => {
    expect(snippet('', ['x'])).toBe('');
  });
});

// Matching precision. Plain includes() made body search noisy the moment
// section text was indexed — these pin the fixes with the real collisions.
describe('matchesWords', () => {
  it('does NOT match mid-word — the collisions that made "erin" useless', () => {
    expect(matchesWords('a gathering and an offering', ['erin'])).toBe(false);
    expect(matchesWords('paper plates for snack', ['late'])).toBe(false);
    expect(matchesWords('a translated note', ['late'])).toBe(false);
  });

  it('still matches at a word start, so prefix search survives', () => {
    expect(matchesWords('Ms. Erin teaches the Twos', ['erin'])).toBe(true);
    expect(matchesWords('Tuition is due the first', ['tuit'])).toBe(true);
    expect(matchesWords('Nap time is after lunch', ['nap'])).toBe(true);
  });

  it('accepts PREFIX collisions as the price of prefix search', () => {
    // "nap" matches "napkins" because both start the word. That is the same
    // rule that lets a parent type "tuit" and find Tuition, so it stays — the
    // fix was for MID-word noise, not for prefixes.
    expect(matchesWords('set out napkins', ['nap'])).toBe(true);
  });

  it('requires EVERY word to match', () => {
    expect(matchesWords('snow day closing policy', ['snow', 'day'])).toBe(true);
    expect(matchesWords('snow day closing policy', ['snow', 'tuition'])).toBe(false);
  });

  it('folds curly apostrophes — nobody types U+2019', () => {
    // The handbooks say "Mother’s Day"; a parent types "mother's day".
    expect(matchesWords('Mother’s Day, shells', ["mother's"])).toBe(true);
    expect(matchesWords('St. Patrick’s Day, fire safety', ["patrick's"])).toBe(true);
    expect(matchesWords('Valentine’s Day', ["valentine's", 'day'])).toBe(true);
  });

  it('treats regex metacharacters as literal text', () => {
    // A parent pasting "(513)" must not blow up the RegExp constructor.
    expect(() => matchesWords('call (513) 202-6187', ['(513)'])).not.toThrow();
    expect(matchesWords('what happens next?', ['next?'])).toBe(true);
  });
});

describe('highlightParts', () => {
  it('splits into plain and matched runs', () => {
    const parts = highlightParts('Snow day closing policy', ['snow']);
    expect(parts).toEqual([
      { text: 'Snow', hit: true },
      { text: ' day closing policy', hit: false },
    ]);
  });

  it('preserves the original casing of the matched run', () => {
    const [first] = highlightParts('Tuition is due', ['tuition']);
    expect(first).toEqual({ text: 'Tuition', hit: true });
  });

  it('merges overlapping matches instead of splitting them', () => {
    const parts = highlightParts('tuition', ['tui', 'tuition']);
    expect(parts).toEqual([{ text: 'tuition', hit: true }]);
  });

  it('never highlights mid-word', () => {
    expect(highlightParts('paper plates', ['late'])).toEqual([
      { text: 'paper plates', hit: false },
    ]);
  });

  it('rejoins to exactly the original text', () => {
    const text = 'Send a water bottle and a snack every day';
    for (const words of [['water'], ['snack', 'day'], ['absent']]) {
      expect(
        highlightParts(text, words)
          .map((p) => p.text)
          .join(''),
      ).toBe(text);
    }
  });
});
