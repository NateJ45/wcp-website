// =============================================================================
// typography.ts — display-type line-break discipline (Act II)
// =============================================================================
// CSS can stop mid-word hyphenation (`hyphens: none`, globals.css public
// layer) but it cannot stop a line break AT a real hyphen — which is how
// "PRE-K" became "PRE- / K" and "TWO-YEAR-OLD" became "TWO-YEAR- / OLD" in
// display headings at 390px (Phase 0 audit, 10+ instances). Board-typed
// titles are plain strings, so the fix is render-time: escape the text, then
// wrap each hyphenated compound in a nowrap span. Compounds longer than
// MAX_NOWRAP characters stay breakable — gluing a very long token would trade
// an ugly break for a 320px overflow, and the reflow gate outranks the rag.
//
// Use with set:html on HEADING text only (never body copy): the output is
// HTML-escaped here, so CMS text cannot inject markup.

const MAX_NOWRAP = 14;

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** True for tokens like "PRE-K", "front-row", "TWO-YEAR-OLD": letters joined
 *  by single hyphens (an em-dash or a trailing hyphen is not a compound). */
function isHyphenCompound(token: string): boolean {
  return /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+[?!.,:;）)]*$/u.test(token);
}

// -----------------------------------------------------------------------------
// One mischievous letter (2026-09-01, from the Aardvark study)
// -----------------------------------------------------------------------------
// An occasional display heading gets ONE letter tilted a few degrees — the
// deliberate imperfection that reads as a human hand. Deterministic from the
// title text (same build, same letter, no jitter between renders), gated so
// only about a third of long-enough headings carry it (every heading tilted
// is a pattern, not mischief). Only real letters count when picking, so the
// preview's invisible stega characters can never be the "letter" chosen.
// The class is styled only in the public paper layer (globals.css), so the
// same shared component renders it inert on the hub.
const MISCHIEF_MIN_LENGTH = 12;
const MISCHIEF_ANGLES = [-4, -3, 3, 4];

function titleHash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return h;
}

/**
 * The 0-based ordinal (among the title's LETTERS, first letter excluded) of
 * the character to tilt, or null when this title stays straight. Exported for
 * the unit tests; render callers just use displayTitleHtml.
 */
export function mischiefLetter(title: string): { ordinal: number; angle: number } | null {
  const letters = [...title].filter((ch) => /\p{L}/u.test(ch)).length;
  if (title.length < MISCHIEF_MIN_LENGTH || letters < 4) return null;
  const h = titleHash(title);
  if (h % 3 !== 0) return null;
  // Never the first letter: a tilted opener reads as an error, not a wink.
  return { ordinal: 1 + (h % (letters - 1)), angle: MISCHIEF_ANGLES[h % MISCHIEF_ANGLES.length] };
}

/**
 * Escape a display heading and glue its hyphenated compounds so they can
 * never break at the hyphen. Occasionally tilts one letter (see
 * mischiefLetter). Returns HTML for set:html.
 */
export function displayTitleHtml(title: string): string {
  const mischief = mischiefLetter(title);
  let letterIndex = -1; // counts letters across the whole title
  return title
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part) || part === '') return part;
      const glue = isHyphenCompound(part) && part.length <= MAX_NOWRAP;
      // Escape character by character so the mischief span can wrap exactly
      // one letter without ever slicing an HTML entity.
      const escaped = [...part]
        .map((ch) => {
          const isLetter = /\p{L}/u.test(ch);
          if (isLetter) letterIndex += 1;
          if (mischief && isLetter && letterIndex === mischief.ordinal) {
            return `<span class="wcp-tilt-letter" style="--tilt-letter:${mischief.angle}deg">${escapeHtml(ch)}</span>`;
          }
          return escapeHtml(ch);
        })
        .join('');
      return glue ? `<span class="whitespace-nowrap">${escaped}</span>` : escaped;
    })
    .join('');
}
