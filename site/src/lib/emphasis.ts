// =============================================================================
// emphasis — the inline emphasis layer for Board-typed text
// =============================================================================
// Two small, pure capabilities the page builder needed, kept together because
// they answer the same editor question ("how do I make one bit stand out?"):
//
//   1. RICH TWINS. Most body copy in the section schemas is a plain string, so
//      an editor cannot bold a word in it. Each curated body field now has a
//      sibling "rich twin" (schema type `emphasisText`): portable text limited
//      to ONE block style with ONLY the bold + italic marks. `emphasisHtml()`
//      renders that to an inline HTML fragment. A renderer prefers the twin
//      when it holds text, and otherwise renders the legacy string exactly as
//      before, so a dataset with no twins produces byte-identical HTML.
//
//   2. HEADING ACCENTS. `headingAccent` names a word or phrase inside a
//      section heading. `splitHeadingAccent()` finds the first
//      case-insensitive match and returns the three parts, so the renderer can
//      wrap the middle one in the site's existing crayon <Underline>.
//
// STEGA WARNING: in the Studio preview every display string carries ~1KB of
// invisible marker characters (click-to-edit). Comparing or searching such a
// string fails silently (see the gotcha in CLAUDE.md), so `splitHeadingAccent`
// matches on a CLEANED copy of the heading and returns cleaned parts. That
// costs click-to-edit on that one heading in the preview when an accent is
// set; the live site never encodes, so it is unaffected. `headingAccent`
// itself is in NON_STEGA_FIELDS (src/lib/cms-preview.ts) so the needle is
// clean already.
// =============================================================================
// This module stays dependency-light on purpose: the Sanity schema imports
// `hasEmphasis` from here to drive a field's `hidden` callback, so it must not
// drag the site's portable-text renderer into the Studio bundle. Em-dash
// scrubbing is therefore NOT done here; SectionRenderer's deEmDashDeep pass
// already walks every string in a section, portable-text children included.
import { stegaClean } from '@sanity/client/stega';
import type { PortableTextBlock } from '@portabletext/types';
import { escapeHtml } from '@/lib/typography';

/** An accent longer than this is a sentence, not a word. The crayon underline
 *  is an inline-block, so a very long phrase can overflow a 320px column
 *  (the same cap CtaBanner already applies to its last-word accent). */
const MAX_ACCENT_LENGTH = 24;

// -----------------------------------------------------------------------------
// Rich twins
// -----------------------------------------------------------------------------

interface EmphasisSpan {
  _type?: string;
  text?: string;
  marks?: string[];
}

/** The children of a block, when it is a text block we can render. */
function spansOf(block: PortableTextBlock | undefined): EmphasisSpan[] {
  if (!block || !Array.isArray(block.children)) return [];
  return block.children as EmphasisSpan[];
}

/**
 * True when a rich twin actually holds text. This is what decides BOTH the
 * Studio's "hide the plain field" callback and the renderer's preference, so
 * the two can never disagree.
 */
export function hasEmphasis(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return (value as PortableTextBlock[]).some((block) =>
    spansOf(block).some((span) => typeof span.text === 'string' && span.text.trim() !== ''),
  );
}

/**
 * One run of text and the two marks it may carry.
 *
 * A run whose text is exactly '\n' is a HARD BREAK, not text: it stands for the
 * `<br />` that `emphasisHtml` puts between two stored blocks. Keeping the break
 * inside the run list lets the in-canvas editor (src/lib/emphasis-write.ts) read
 * a two-block twin, show it, and store it back with both blocks intact.
 */
export interface InlineRun {
  text: string;
  strong: boolean;
  em: boolean;
}

/** The hard-break run. Compare with `run.text === RUN_BREAK`. */
export const RUN_BREAK = '\n';

/**
 * Flatten an `emphasisText` value to runs, in order, with a RUN_BREAK between
 * blocks. This is the READ half of the in-canvas text popover; `emphasisHtml`
 * above is the read half of the rendered page. They walk the same shape, so the
 * popover and the page can never disagree about what a twin says.
 *
 * Marks other than `strong` and `em` cannot occur (the schema allows no others)
 * and are ignored if they somehow do, so a stray annotation degrades to plain
 * text instead of throwing.
 */
export function emphasisRuns(value: unknown): InlineRun[] {
  if (!Array.isArray(value)) return [];
  const runs: InlineRun[] = [];
  (value as PortableTextBlock[]).forEach((block, i) => {
    if (i > 0 && runs.length) runs.push({ text: RUN_BREAK, strong: false, em: false });
    for (const span of spansOf(block)) {
      if (typeof span.text !== 'string' || span.text === '') continue;
      const marks = Array.isArray(span.marks) ? span.marks : [];
      runs.push({
        text: span.text,
        strong: marks.includes('strong'),
        em: marks.includes('em'),
      });
    }
  });
  return runs;
}

/**
 * Render an `emphasisText` value to an INLINE HTML fragment: text, <strong>,
 * <em>, and <br /> between blocks. No <p> wrapper, because every call site
 * already has one (a <p> inside a <p> is invalid HTML and would reflow).
 *
 * Text is escaped here, so Studio content can never inject markup. Returns ''
 * for an empty value, which is the signal to fall back to the legacy plain
 * string.
 */
export function emphasisHtml(value: unknown): string {
  if (!hasEmphasis(value)) return '';
  const blocks = value as PortableTextBlock[];
  const rendered = blocks
    .map((block) =>
      spansOf(block)
        .map((span) => {
          if (typeof span.text !== 'string' || span.text === '') return '';
          const marks = Array.isArray(span.marks) ? span.marks : [];
          let html = escapeHtml(span.text);
          // Order is fixed (em inside strong) so identical content always
          // produces identical markup.
          if (marks.includes('em')) html = `<em>${html}</em>`;
          if (marks.includes('strong')) html = `<strong>${html}</strong>`;
          return html;
        })
        .join(''),
    )
    .filter((line) => line !== '');
  if (rendered.length === 0) return '';
  // `wcp-emphasis` is the styling hook (globals.css). It carries WEIGHT and
  // SLANT only, never a colour: these fields render on navy bands as well as
  // light ones, and the prose `text-heading` bold colour would be unreadable
  // on navy.
  return `<span class="wcp-emphasis">${rendered.join('<br />')}</span>`;
}

// -----------------------------------------------------------------------------
// Heading accents
// -----------------------------------------------------------------------------

/**
 * Remove Sanity's invisible stega markers from a string. Preview-encoded
 * strings must be cleaned before any search or comparison.
 */
export function cleanHeadingText(value: string): string {
  const cleaned: unknown = stegaClean(value);
  return typeof cleaned === 'string' ? cleaned : '';
}

export interface HeadingAccentParts {
  /** Heading text before the accent (may be empty). */
  before: string;
  /** The matched accent text, in the heading's own capitalization. */
  accent: string;
  /** Heading text after the accent (may be empty). */
  after: string;
}

/**
 * Split a heading around the first case-insensitive occurrence of `accent`.
 *
 * Returns null (render the heading unchanged) when there is no accent, the
 * accent is blank, the accent is longer than MAX_ACCENT_LENGTH, or the accent
 * does not appear in the heading. The returned parts come from the CLEANED
 * heading, so they are safe to search, measure, and escape.
 */
export function splitHeadingAccent(
  title: string | undefined,
  accent: string | undefined,
): HeadingAccentParts | null {
  if (typeof title !== 'string' || title === '') return null;
  if (typeof accent !== 'string') return null;

  const needle = cleanHeadingText(accent).trim();
  if (needle === '' || needle.length > MAX_ACCENT_LENGTH) return null;

  const haystack = cleanHeadingText(title);
  const at = haystack.toLowerCase().indexOf(needle.toLowerCase());
  if (at === -1) return null;

  return {
    before: haystack.slice(0, at),
    // Keep the heading's own capitalization, not the editor's typing.
    accent: haystack.slice(at, at + needle.length),
    after: haystack.slice(at + needle.length),
  };
}

// -----------------------------------------------------------------------------
// Picking the word by clicking it (in-canvas controls, 2026-08-28)
// -----------------------------------------------------------------------------
// The guide's steps for the underlined word are: read the heading, choose a
// word, copy it into a box, and "if nothing changes, check the spelling".
// Clicking the word removes all three steps. The overlay draws the heading a
// second time, as a row of buttons, one button per word. The value it stores is
// then a slice of the heading, so `splitHeadingAccent` above cannot miss it.
//
// Two rules keep the buttons honest:
//  1. The heading is CLEANED first. A preview heading carries invisible stega
//     markers, and a value cut out of an encoded string would never match.
//  2. Punctuation stays in the LABEL and leaves the VALUE. A button reading
//     "belong," beside its comma looks like the heading, but storing the comma
//     would make the underline swallow it.

/** One clickable piece of a heading. Whitespace comes through as `word: false`. */
export interface HeadingToken {
  /** Exactly as it appears in the cleaned heading, punctuation and all. */
  text: string;
  /** What to store when an editor picks this token. Empty for whitespace. */
  value: string;
  /** True when this token is a word an editor may pick. */
  word: boolean;
}

/** Characters that belong to the sentence rather than to the word. */
const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

/**
 * Split a heading into clickable word tokens and the whitespace between them.
 * Order is preserved, so joining every `text` returns the cleaned heading.
 *
 * A word longer than MAX_ACCENT_LENGTH is NOT offered: `splitHeadingAccent`
 * refuses that needle, so a button for it would store a value the renderer then
 * ignores. A control must never promise what the renderer will not honour.
 */
export function splitHeadingWords(heading?: string | null): HeadingToken[] {
  const clean = typeof heading === 'string' ? cleanHeadingText(heading) : '';
  if (clean === '') return [];
  return clean
    .split(/(\s+)/)
    .filter((piece) => piece !== '')
    .map((piece) => {
      if (/^\s+$/.test(piece)) return { text: piece, value: '', word: false };
      const value = piece.replace(EDGE_PUNCTUATION, '');
      return { text: piece, value, word: value !== '' && value.length <= MAX_ACCENT_LENGTH };
    });
}

/**
 * True when `token` is the word the stored accent points at, so the overlay can
 * ring it and a second click can clear it. Case-insensitive, like the match.
 */
export function isAccentedWord(token: HeadingToken, accent?: string | null): boolean {
  if (!token.word || typeof accent !== 'string') return false;
  const needle = cleanHeadingText(accent).trim();
  if (needle === '') return false;
  return token.value.toLowerCase() === needle.toLowerCase();
}
