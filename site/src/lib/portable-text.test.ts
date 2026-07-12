import { describe, expect, test } from 'vitest';
import { renderPortableText, renderPostBody } from './portable-text';
import type { PortableTextBlock } from '@portabletext/types';

// =============================================================================
// Unit tests for the Portable Text renderer's heading-level normalization.
// =============================================================================
// Pure, hermetic (no browser, no build, no Sanity) — runs under Vitest
// (`npm run test:unit`). Guards the a11y invariant that a board-authored
// body rendered directly under the page <h1> can never skip a heading level
// (h1 -> h3 is a WCAG "heading-order" violation). See src/lib/portable-text.ts.
// =============================================================================

let k = 0;
// Build a block from a compact (style, text) pair. `style` is one of
// normal/h2/h3/h4/blockquote — the styles our blockContent/postBody schemas allow.
const block = (style: string, text: string): PortableTextBlock =>
  ({
    _type: 'block',
    _key: `b${k++}`,
    style,
    markDefs: [],
    children: [{ _type: 'span', _key: `s${k++}`, text, marks: [] }],
  }) as unknown as PortableTextBlock;

// The sequence of heading tags in document order, e.g. ['h2','h3','h2'].
const headingSeq = (html: string): string[] => [...html.matchAll(/<(h[1-6])\b/g)].map((m) => m[1]);

// A meeting-minutes-shaped body as the Squarespace migration produces it: the
// blockContent schema's "Heading" is h3 and "Subheading" is h4, so the top body
// heading is h3 — a skip under the page h1.
const migratedBody: PortableTextBlock[] = [
  block('h3', 'Old business'),
  block('normal', 'We discussed the fundraiser.'),
  block('h4', 'Bake sale'),
  block('normal', 'Volunteers needed.'),
  block('h3', 'New business'),
];

describe('renderPortableText — heading normalization is opt-in', () => {
  test('leaves heading levels untouched by default (embedded section fragments)', () => {
    // Most callers embed a fragment under an existing section <h2>; promoting its
    // headings to h2 would corrupt the page outline. Default must be a no-op.
    expect(headingSeq(renderPortableText(migratedBody))).toEqual(['h3', 'h4', 'h3']);
  });

  test('shifts the top body heading to h2 when normalizeHeadings is set', () => {
    const html = renderPortableText(migratedBody, '', { normalizeHeadings: true });
    // h3 -> h2, h4 -> h3: a clean h1 -> h2 -> h3 chain, no skip.
    expect(headingSeq(html)).toEqual(['h2', 'h3', 'h2']);
  });
});

describe('renderPostBody — always normalizes (full article directly under h1)', () => {
  test('shifts a migrated h3/h4 body up to h2/h3', () => {
    expect(headingSeq(renderPostBody(migratedBody))).toEqual(['h2', 'h3', 'h2']);
  });

  test('is a no-op for a correctly-authored h2/h3 body', () => {
    const body = [block('h2', 'Intro'), block('normal', 'Text'), block('h3', 'Details')];
    expect(headingSeq(renderPostBody(body))).toEqual(['h2', 'h3']);
  });

  test('promotes a single-level body (only h3) to h2', () => {
    expect(headingSeq(renderPostBody([block('h3', 'Sole heading')]))).toEqual(['h2']);
  });

  test('leaves a body with no headings unchanged', () => {
    const html = renderPostBody([block('normal', 'Just a paragraph.')]);
    expect(headingSeq(html)).toEqual([]);
    expect(html).toContain('Just a paragraph.');
  });

  test('collapses a gapped hierarchy so it never skips a level', () => {
    // Not schema-authorable today (only two heading styles exist), but the
    // normalizer guarantees no skip for ANY input: distinct {h3,h5} -> {h2,h3}.
    const body = [block('h3', 'A'), block('h5', 'B')];
    expect(headingSeq(renderPostBody(body))).toEqual(['h2', 'h3']);
  });
});
