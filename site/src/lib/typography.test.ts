import { describe, expect, it } from 'vitest';
import { displayTitleHtml, escapeHtml } from './typography';

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
    expect(displayTitleHtml('two-year-old')).toContain(
      '<span class="whitespace-nowrap">two-year-old</span>',
    );
    expect(displayTitleHtml('co-op')).toContain('<span class="whitespace-nowrap">co-op</span>');
  });

  it('keeps trailing punctuation inside the glue', () => {
    expect(displayTitleHtml('Ready for Pre-K?')).toContain(
      '<span class="whitespace-nowrap">Pre-K?</span>',
    );
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
