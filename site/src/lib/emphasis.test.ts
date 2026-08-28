// =============================================================================
// emphasis — unit tests for the inline emphasis layer
// =============================================================================
// Two rules these pin, because both fail SILENTLY in production:
//   1. A rich twin that holds no real text must render nothing, so the legacy
//      plain string still renders and page parity holds.
//   2. The heading-accent matcher must work on a STEGA-ENCODED heading. In the
//      Studio preview every display string carries invisible marker
//      characters; a matcher that forgets to clean them finds nothing and the
//      accent quietly disappears in preview only.
// =============================================================================
import { describe, expect, it } from 'vitest';
import { cleanHeadingText, emphasisHtml, hasEmphasis, splitHeadingAccent } from './emphasis';

/** A single emphasisText block with the given spans. */
const block = (children: { text: string; marks?: string[] }[]) => ({
  _type: 'block',
  _key: 'b1',
  style: 'normal',
  children: children.map((c, i) => ({
    _type: 'span',
    _key: `s${i}`,
    text: c.text,
    marks: c.marks ?? [],
  })),
});

// Sanity's stega payload is a run of invisible characters appended to the
// string. The exact bytes do not matter; that they are zero-width does.
const STEGA_TAIL = '​‌‍﻿​‌';
const encoded = (text: string) => text + STEGA_TAIL;

describe('hasEmphasis', () => {
  it('is false for the states a stored page actually has', () => {
    expect(hasEmphasis(undefined)).toBe(false);
    expect(hasEmphasis(null)).toBe(false);
    expect(hasEmphasis([])).toBe(false);
    expect(hasEmphasis('a string')).toBe(false);
  });

  it('is false for a block the editor opened and left blank', () => {
    expect(hasEmphasis([block([{ text: '' }])])).toBe(false);
    expect(hasEmphasis([block([{ text: '   ' }])])).toBe(false);
  });

  it('is true once there is real text', () => {
    expect(hasEmphasis([block([{ text: 'Hello' }])])).toBe(true);
  });
});

describe('emphasisHtml', () => {
  it('renders nothing for an empty value, which is the fallback signal', () => {
    expect(emphasisHtml(undefined)).toBe('');
    expect(emphasisHtml([])).toBe('');
    expect(emphasisHtml([block([{ text: ' ' }])])).toBe('');
  });

  it('renders bold and italic, and nothing else', () => {
    const html = emphasisHtml([
      block([
        { text: 'Tours are ' },
        { text: 'every Friday', marks: ['strong'] },
        { text: ' at ' },
        { text: '9am', marks: ['em'] },
        { text: '.' },
      ]),
    ]);
    expect(html).toBe(
      '<span class="wcp-emphasis">Tours are <strong>every Friday</strong> at <em>9am</em>.</span>',
    );
  });

  it('nests em inside strong so both marks always render the same way', () => {
    expect(emphasisHtml([block([{ text: 'now', marks: ['em', 'strong'] }])])).toContain(
      '<strong><em>now</em></strong>',
    );
    expect(emphasisHtml([block([{ text: 'now', marks: ['strong', 'em'] }])])).toContain(
      '<strong><em>now</em></strong>',
    );
  });

  it('ignores marks the schema does not allow', () => {
    const html = emphasisHtml([block([{ text: 'link', marks: ['link', 'underline'] }])]);
    expect(html).toBe('<span class="wcp-emphasis">link</span>');
  });

  it('escapes text, so Studio content can never inject markup', () => {
    const html = emphasisHtml([block([{ text: '<img src=x> & "quotes"' }])]);
    expect(html).toContain('&lt;img src=x&gt; &amp; &quot;quotes&quot;');
    expect(html).not.toContain('<img');
  });

  it('separates blocks with a line break, never a nested paragraph', () => {
    const html = emphasisHtml([block([{ text: 'One' }]), block([{ text: 'Two' }])]);
    expect(html).toBe('<span class="wcp-emphasis">One<br />Two</span>');
    expect(html).not.toContain('<p');
  });
});

describe('cleanHeadingText', () => {
  it('removes the invisible stega markers', () => {
    expect(cleanHeadingText(encoded('Where kids belong'))).toBe('Where kids belong');
  });

  it('leaves a live (unencoded) string alone', () => {
    expect(cleanHeadingText('Where kids belong')).toBe('Where kids belong');
  });
});

describe('splitHeadingAccent', () => {
  it('splits around the accent', () => {
    expect(splitHeadingAccent('Where kids belong.', 'belong')).toEqual({
      before: 'Where kids ',
      accent: 'belong',
      after: '.',
    });
  });

  it('matches a STEGA-ENCODED heading (the preview-only failure mode)', () => {
    expect(splitHeadingAccent(encoded('Where kids belong.'), 'belong')).toEqual({
      before: 'Where kids ',
      accent: 'belong',
      after: '.',
    });
  });

  it('tolerates an encoded accent too', () => {
    const parts = splitHeadingAccent(encoded('Where kids belong.'), encoded('belong'));
    expect(parts?.accent).toBe('belong');
  });

  it('ignores capitalization but keeps the headline’s own', () => {
    expect(splitHeadingAccent('COME AND SEE US', 'see')?.accent).toBe('SEE');
  });

  it('takes the first occurrence only', () => {
    expect(splitHeadingAccent('Play, then play again', 'play')).toEqual({
      before: '',
      accent: 'Play',
      after: ', then play again',
    });
  });

  it('accepts a short phrase', () => {
    expect(splitHeadingAccent('A front-row seat, every day', 'front-row seat')?.accent).toBe(
      'front-row seat',
    );
  });

  it('returns null when there is nothing to do', () => {
    expect(splitHeadingAccent('Where kids belong.', undefined)).toBeNull();
    expect(splitHeadingAccent('Where kids belong.', '')).toBeNull();
    expect(splitHeadingAccent('Where kids belong.', '   ')).toBeNull();
    expect(splitHeadingAccent(undefined, 'belong')).toBeNull();
    expect(splitHeadingAccent('', 'belong')).toBeNull();
  });

  it('returns null when the word is not in the heading', () => {
    expect(splitHeadingAccent('Where kids belong.', 'tuition')).toBeNull();
  });

  it('refuses an accent long enough to overflow a 320px column', () => {
    const long = 'a phrase that is far too long to underline';
    expect(splitHeadingAccent(`Say ${long} here`, long)).toBeNull();
  });
});
