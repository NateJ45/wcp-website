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
