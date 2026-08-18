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

describe('renderPostBody — inline images and attachments', () => {
  const textBlock = (text: string) => ({
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    children: [{ _type: 'span', _key: 's1', text, marks: [] }],
    markDefs: [],
  });

  test('renders an attachment as a download card from the asset ref alone', () => {
    const html = renderPostBody([
      textBlock('See the form below.'),
      {
        _type: 'fileAttachment',
        _key: 'f1',
        title: 'Field trip permission form (PDF)',
        file: { asset: { _ref: 'file-abc123DEF456-pdf' } },
      },
    ] as never);
    expect(html).toContain('https://cdn.sanity.io/files/');
    expect(html).toContain('/abc123DEF456.pdf');
    expect(html).toContain('Field trip permission form (PDF)');
    expect(html).toContain('download');
    expect(html).toContain('>PDF<');
  });

  test('renders nothing for an attachment with no file or no title', () => {
    const html = renderPostBody([
      { _type: 'fileAttachment', _key: 'f1', title: 'No file behind me' },
      { _type: 'fileAttachment', _key: 'f2', file: { asset: { _ref: 'file-abc-pdf' } } },
      textBlock('Still here.'),
    ] as never);
    expect(html).not.toContain('cdn.sanity.io/files');
    expect(html).toContain('Still here.');
  });

  test('renders an inline image with alt and caption', () => {
    const html = renderPostBody([
      {
        _type: 'image',
        _key: 'i1',
        asset: { _ref: 'image-deadbeef-800x600-jpg', _type: 'reference' },
        alt: 'Kids painting at the art table',
        caption: 'Art morning',
      },
    ] as never);
    expect(html).toContain('<figure>');
    expect(html).toContain('alt="Kids painting at the art table"');
    expect(html).toContain('<figcaption>Art morning</figcaption>');
  });
});

describe('renderPostBody — video and gallery blocks', () => {
  test('renders a YouTube link as the click-to-load facade, never an iframe', () => {
    const html = renderPostBody([
      {
        _type: 'videoEmbed',
        _key: 'v1',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Morning circle',
      },
    ] as never);
    expect(html).toContain('data-embed-video=');
    expect(html).toContain('youtube-nocookie.com');
    expect(html).toContain('Play video: Morning circle');
    expect(html).not.toContain('<iframe');
  });

  test('renders nothing for a link that is not a video', () => {
    const html = renderPostBody([
      { _type: 'videoEmbed', _key: 'v1', url: 'https://example.com/not-a-video' },
    ] as never);
    expect(html).toBe('');
  });

  test('renders a gallery as a grid of figures with alt text', () => {
    const html = renderPostBody([
      {
        _type: 'postGallery',
        _key: 'g1',
        images: [
          { asset: { _ref: 'image-a1-800x600-jpg' }, alt: 'Painting', caption: 'Art' },
          { asset: { _ref: 'image-b2-800x600-jpg' }, alt: 'Blocks' },
        ],
      },
    ] as never);
    expect(html).toContain('grid-cols-2');
    expect(html).toContain('alt="Painting"');
    expect(html).toContain('alt="Blocks"');
    expect(html).toContain('<figcaption');
  });

  test('skips gallery rows with no uploaded asset', () => {
    const html = renderPostBody([
      { _type: 'postGallery', _key: 'g1', images: [{ alt: 'ghost' }] },
    ] as never);
    expect(html).toBe('');
  });
});

// A custom (non-block) body item for the six 2026-08 post blocks.
const custom = (obj: Record<string, unknown>): PortableTextBlock =>
  ({ _key: `c${k++}`, ...obj }) as unknown as PortableTextBlock;

describe('renderPostBody — callout / button / table / columns', () => {
  test('callout mirrors the Callout.astro tones and keeps line breaks', () => {
    const sky = renderPostBody([
      custom({ _type: 'calloutBlock', tone: 'sky', text: 'Line one\nLine two' }),
    ]);
    expect(sky).toContain('bg-sky-soft');
    expect(sky).toContain('Line one<br />Line two');
    const warm = renderPostBody([custom({ _type: 'calloutBlock', tone: 'warm', text: 'Note' })]);
    expect(warm).toContain('bg-cream');
    expect(renderPostBody([custom({ _type: 'calloutBlock', text: '  ' })])).toBe('');
  });

  test('button renders the amber pill; external links open a new tab', () => {
    const ext = renderPostBody([
      custom({ _type: 'buttonBlock', label: 'RSVP', url: 'https://example.com' }),
    ]);
    expect(ext).toContain('bg-amber');
    expect(ext).toContain('target="_blank"');
    const local = renderPostBody([
      custom({ _type: 'buttonBlock', label: 'Sign up', url: '/family-hub/sign-ups' }),
    ]);
    expect(local).not.toContain('target="_blank"');
    expect(local).toContain('href="/family-hub/sign-ups"');
    expect(renderPostBody([custom({ _type: 'buttonBlock', label: 'No link' })])).toBe('');
  });

  test('button link passes through withBase for the preview surface', () => {
    const html = renderPostBody(
      [custom({ _type: 'buttonBlock', label: 'Go', url: '/events' })],
      '/preview',
    );
    expect(html).toContain('href="/preview/events"');
  });

  test('table wraps in its own horizontal scroller with an optional header row', () => {
    const rows = [{ cells: ['Class', 'Day'] }, { cells: ['Twos', 'Tuesday'] }];
    const html = renderPostBody([custom({ _type: 'tableBlock', headerRow: true, rows })]);
    expect(html).toContain('overflow-x-auto');
    expect(html).toContain('<th scope="col"');
    expect(html).toContain('Tuesday');
    const flat = renderPostBody([custom({ _type: 'tableBlock', headerRow: false, rows })]);
    expect(flat).not.toContain('<th');
    // An all-empty table renders nothing.
    expect(renderPostBody([custom({ _type: 'tableBlock', rows: [{ cells: ['', ''] }] })])).toBe('');
  });

  test('two columns render side-by-side blocks that keep prose styling', () => {
    const html = renderPostBody([
      custom({
        _type: 'twoColumns',
        left: [block('normal', 'Left text')],
        right: [block('normal', 'Right text')],
      }),
    ]);
    expect(html).toContain('md:grid-cols-2');
    expect(html).toContain('Left text');
    expect(html).toContain('Right text');
    expect(renderPostBody([custom({ _type: 'twoColumns' })])).toBe('');
  });
});

describe('renderPostBody — sign-up and event cards (dereferenced)', () => {
  test('sign-up card links to the hub sign-ups page and shows the open state', () => {
    const open = renderPostBody([
      custom({
        _type: 'signupCard',
        sheet: { _id: 's1', title: 'Fall Festival helpers', open: true },
      }),
    ]);
    expect(open).toContain('href="/family-hub/sign-ups"');
    expect(open).toContain('Fall Festival helpers');
    expect(open).toContain('>Open<');
    const closed = renderPostBody([
      custom({ _type: 'signupCard', sheet: { _id: 's1', title: 'Old sheet', open: false } }),
    ]);
    expect(closed).toContain('>Closed<');
    // A dangling reference (deleted sheet) renders nothing.
    expect(renderPostBody([custom({ _type: 'signupCard', sheet: null })])).toBe('');
  });

  test('event card shows when/where and both add-to-calendar links', () => {
    const html = renderPostBody([
      custom({
        _type: 'eventCard',
        event: {
          _id: 'evt1',
          title: 'Open House',
          startDate: '2026-10-03T22:00:00Z',
          endDate: '2026-10-04T00:00:00Z',
          location: 'The preschool',
        },
      }),
    ]);
    expect(html).toContain('Open House');
    expect(html).toContain('The preschool');
    expect(html).toContain('calendar.google.com');
    expect(html).toContain('/api/event-ics?id=evt1');
    // A dangling reference renders nothing.
    expect(renderPostBody([custom({ _type: 'eventCard', event: null })])).toBe('');
  });
});
