import { describe, expect, it } from 'vitest';
import { displayTitleHtml, escapeHtml, mischiefLetter } from './typography';

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml(`<b>&"'`)).toBe('&lt;b&gt;&amp;&quot;&#39;');
  });
});

describe('displayTitleHtml', () => {
  it('glues short hyphenated compounds in a nowrap span', () => {
    expect(displayTitleHtml('Our Pre-K class')).toBe(
      'Our <span class="whitespace-nowrap">Pre-K</span> class',
    );
  });

  it('glues multi-hyphen compounds (the audit cases)', () => {
    // 'two-year-old' also happens to gate a mischief letter, so the glued
    // span CONTAINS a nested tilt span — assert the glue wrapper, not bytes.
    expect(displayTitleHtml('two-year-old')).toMatch(
      /^<span class="whitespace-nowrap">.*<\/span>$/,
    );
    expect(displayTitleHtml('two-year-old').replace(/<[^>]+>/g, '')).toBe('two-year-old');
    expect(displayTitleHtml('co-op')).toContain('<span class="whitespace-nowrap">co-op</span>');
  });

  it('keeps trailing punctuation inside the glue', () => {
    const html = displayTitleHtml('Ready for Pre-K?');
    // The glued token is the LAST wrapper and runs to the end of the string;
    // its visible text keeps the punctuation (tags stripped for the check —
    // this title also gates a mischief letter).
    expect(html).toMatch(/<span class="whitespace-nowrap">.*<\/span>$/s);
    expect(html.replace(/<[^>]+>/g, '')).toBe('Ready for Pre-K?');
  });

  it('leaves long compounds breakable (320px reflow outranks the rag)', () => {
    // 18 chars > the 14-char cap: gluing could overflow a 320px column.
    expect(displayTitleHtml('kindergarten-ready')).toBe('kindergarten-ready');
  });

  it('leaves plain words, spacing, and non-compounds untouched', () => {
    expect(displayTitleHtml('What a  day looks like')).toBe('What a  day looks like');
    expect(displayTitleHtml('well - spaced dash')).toBe('well - spaced dash');
    expect(displayTitleHtml('trailing- hyphen')).toBe('trailing- hyphen');
  });

  it('escapes HTML before wrapping so CMS text cannot inject markup', () => {
    expect(displayTitleHtml('<img> & Pre-K')).toBe(
      '&lt;img&gt; &amp; <span class="whitespace-nowrap">Pre-K</span>',
    );
  });
});

describe('mischiefLetter', () => {
  it('is deterministic: same title, same letter, same angle', () => {
    expect(mischiefLetter('What does a typical day look like?')).toEqual(
      mischiefLetter('What does a typical day look like?'),
    );
  });

  it('never tilts short titles', () => {
    expect(mischiefLetter('Our classes')).toBeNull();
    expect(mischiefLetter('Tuition')).toBeNull();
  });

  it('gates to roughly a third of long titles, never the first letter', () => {
    const titles = [
      'What does a typical day look like?',
      'Find the right fit for your child',
      'A different kind of preschool',
      'Heard directly from our community',
      'Every September since 1969.',
    ];
    for (const t of titles) {
      const m = mischiefLetter(t);
      if (m) {
        expect(m.ordinal).toBeGreaterThan(0);
        expect([-4, -3, 3, 4]).toContain(m.angle);
      }
    }
    // The sample set is chosen so both outcomes are represented.
    expect(titles.some((t) => mischiefLetter(t) !== null)).toBe(true);
    expect(titles.some((t) => mischiefLetter(t) === null)).toBe(true);
  });

  it('renders exactly one tilt span for a gated title, none otherwise', () => {
    const gated = displayTitleHtml('What does a typical day look like?');
    expect(gated.match(/wcp-tilt-letter/g)?.length).toBe(1);
    expect(gated.replace(/<[^>]+>/g, '')).toBe('What does a typical day look like?');
    const straight = displayTitleHtml('A different kind of preschool');
    expect(straight).not.toContain('wcp-tilt-letter');
  });
});
