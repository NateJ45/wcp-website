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

/**
 * Escape a display heading and glue its hyphenated compounds so they can
 * never break at the hyphen. Returns HTML for set:html.
 */
export function displayTitleHtml(title: string): string {
  return title
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part) || part === '') return part;
      const glue = isHyphenCompound(part) && part.length <= MAX_NOWRAP;
      const escaped = escapeHtml(part);
      return glue ? `<span class="whitespace-nowrap">${escaped}</span>` : escaped;
    })
    .join('');
}
