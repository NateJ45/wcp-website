// =============================================================================
// hub-search-index — turning hub page sections into searchable entries
// =============================================================================
// The ⌘K palette used to index TITLES only (nav labels, update/document/sheet
// names), so a parent who remembered a phrase but not which handbook it was in
// got nothing. This walks the page-builder sections and pulls out their words —
// prose, card bodies, FAQ questions and answers, schedule rows, step lists, and
// image ALT text — so the palette can find content, not just page names.
//
// Pure functions on purpose: the endpoint does the Sanity reads, this does the
// shaping, and hub-search-index.test.ts covers the extraction rules.
//
// TWO RULES THAT KEEP RESULTS HONEST:
//   1. Only sections with a header title get a #sec- deep link, because
//      HubSectionedBody's titleIdFor() only emits that id when a title exists.
//      Linking to an anchor that isn't in the DOM would scroll nowhere.
//   2. Structural/URL-ish fields are skipped (see SKIP_KEYS). Indexing an icon
//      name or a background token means searching "navy" matches half the hub.
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
type Section = Record<string, any>;

export interface SearchEntry {
  title: string;
  href: string;
  kind: 'page' | 'update' | 'document' | 'sign-up' | 'section' | 'event';
  sub?: string;
  /** Body words for matching. Absent on title-only entries (nav, documents). */
  text?: string;
}

// =============================================================================
// hubKey → the route that actually RENDERS that doc
// =============================================================================
// Resolved by CONVENTION with two escape hatches, rather than a hardcoded
// allow-list. The allow-list version failed silently: add a hub page, forget to
// register it, and search omits it forever with nothing to catch the omission.
// Now a page that follows the convention indexes itself.

/** Never indexed, whatever the nav says. */
export const HUB_PAGE_DENY = new Set([
  // Family names, emails, phones. This response is cached; PII is not.
  'directory',
]);

/** The routes that don't match `/family-hub/<hubKey>`. */
export const HUB_PAGE_OVERRIDES: Record<string, string> = {
  // The dashboard renders the `home` doc's sections through SectionRenderer.
  home: '/family-hub',
};

/** Hub routes that exist, taken from the nav the rail is already built from. */
export function hubRoutesFromNav(
  nav: { links: { href: string; external?: boolean }[] }[],
): Set<string> {
  const out = new Set<string>();
  for (const group of nav) {
    for (const link of group.links) {
      if (!link.external) out.add(link.href);
    }
  }
  return out;
}

/**
 * The route for a hub doc, or null when it should not be indexed.
 *
 * Order: deny wins, then an explicit override, then `/family-hub/<hubKey>` if
 * the nav says that page exists. The nav check is what stops a doc whose page
 * was deleted (or never built) from producing hits that lead nowhere.
 */
export function hubPageRoute(hubKey: string, knownRoutes: Set<string>): string | null {
  if (!hubKey || HUB_PAGE_DENY.has(hubKey)) return null;
  const override = HUB_PAGE_OVERRIDES[hubKey];
  if (override) return knownRoutes.has(override) ? override : null;
  const convention = `/family-hub/${hubKey}`;
  return knownRoutes.has(convention) ? convention : null;
}

// Keys whose values are machinery, not prose: ids, refs, icon/enum tokens, and
// anything URL-shaped. `alt` is deliberately NOT here — alt text is content.
const SKIP_KEYS = new Set([
  '_type',
  '_key',
  '_ref',
  '_id',
  '_rev',
  'icon',
  'background',
  'style',
  'linkType',
  'url',
  'href',
  'link',
  'pageSlug',
  'slug',
  'tone',
  'align',
  'color',
  'variant',
  'size',
  'id',
  'orderRank',
  'source',
  'category',
  'marks',
  'listItem',
  'level',
]);

const looksLikeUrl = (s: string): boolean => /^(https?:\/\/|\/|mailto:|tel:|#)/.test(s);

/** Every human-readable string inside a section, in document order. */
export function extractStrings(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const v of node) extractStrings(v, out);
    return out;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node as Section)) {
      if (SKIP_KEYS.has(key)) continue;
      extractStrings(value, out);
    }
    return out;
  }
  if (typeof node === 'string') {
    const s = node.trim();
    // Single characters and bare tokens carry no search value; URLs are noise.
    if (s.length > 1 && !looksLikeUrl(s)) out.push(s);
  }
  return out;
}

/**
 * Collapse a section's strings into one searchable blob, de-duplicated so a
 * repeated label doesn't inflate the payload. `cap` bounds a runaway section
 * (a long FAQ) — the whole index ships to the browser on first ⌘K.
 */
export function sectionText(section: Section, cap = 1200): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const s of extractStrings(section)) {
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    parts.push(s);
  }
  const joined = parts.join(' ').replace(/\s+/g, ' ').trim();
  return joined.length > cap ? `${joined.slice(0, cap)}…` : joined;
}

/** The heading a result shows — the section's own title, else the page's. */
const sectionTitle = (section: Section, pageHeading: string): string =>
  (typeof section?.header?.title === 'string' && section.header.title.trim()) || pageHeading;

/**
 * One entry per section of one hub page. Sections with no words at all are
 * dropped — a decorative band is not a search result.
 */
export function pageEntries(
  href: string,
  pageHeading: string,
  sections: Section[] | undefined,
): SearchEntry[] {
  if (!href) return [];
  const entries: SearchEntry[] = [];
  for (const section of sections ?? []) {
    if (!section) continue;
    const text = sectionText(section);
    if (!text) continue;
    const hasAnchor = Boolean(section?.header?.title) && Boolean(section?._key);
    entries.push({
      title: sectionTitle(section, pageHeading),
      href: hasAnchor ? `${href}#sec-${section._key}` : href,
      kind: 'section',
      sub: pageHeading,
      text,
    });
  }
  return entries;
}

// =============================================================================
// Matching
// =============================================================================

/**
 * Lowercase, and flatten the typographic quotes our copy actually uses.
 *
 * The handbooks are full of curly apostrophes — "Mother’s Day", "St. Patrick’s
 * Day", "Valentine’s Day" — and no parent types U+2019. Before this, searching
 * "mother's day" returned ZERO results for content that plainly says it.
 */
export const fold = (s: string): string =>
  s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A word matches at a WORD BOUNDARY, not anywhere in the string.
 *
 * Plain `includes()` made body search noisy the moment section text was
 * indexed: "erin" matched "gathering" and "offering" (24 hits, 9 of them
 * junk), "late" matched "plates", "nap" matched "napkins". Anchoring to \b
 * keeps prefix search working ("tuit" still finds "tuition") while dropping
 * mid-word collisions.
 */
export const wordRe = (word: string, flags = ''): RegExp =>
  new RegExp(`\\b${escapeRe(fold(word))}`, flags);

/** True when EVERY word matches the haystack at a word boundary. */
export function matchesWords(haystack: string, words: string[]): boolean {
  const hay = fold(haystack);
  return words.every((w) => wordRe(w).test(hay));
}

/**
 * A ~140-char window around the first matched word, so a body hit shows WHY it
 * matched instead of an opaque page name. Falls back to the opening words.
 */
export function snippet(text: string, words: string[], width = 140): string {
  if (!text) return '';
  const hay = fold(text);
  let at = -1;
  for (const w of words) {
    const i = hay.search(wordRe(w));
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) return text.length > width ? `${text.slice(0, width).trimEnd()}…` : text;
  const start = Math.max(0, at - Math.floor(width / 3));
  const end = Math.min(text.length, start + width);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

/**
 * Split text into plain / matched runs so the client can build the highlight
 * with createElement + textContent. Returning DATA rather than an HTML string
 * is the point: hub-search.ts never interpolates markup, so an update titled
 * `<img onerror=…>` stays inert text.
 */
export function highlightParts(text: string, words: string[]): { text: string; hit: boolean }[] {
  if (!text || words.length === 0) return [{ text, hit: false }];
  const hay = fold(text);
  // Collect every match span, then merge overlaps so nested hits don't split.
  const spans: [number, number][] = [];
  for (const w of words) {
    for (const m of hay.matchAll(wordRe(w, 'g'))) {
      if (m.index === undefined || m[0].length === 0) continue;
      spans.push([m.index, m.index + m[0].length]);
    }
  }
  if (spans.length === 0) return [{ text, hit: false }];
  spans.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of spans) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  const parts: { text: string; hit: boolean }[] = [];
  let cursor = 0;
  for (const [s, e] of merged) {
    if (s > cursor) parts.push({ text: text.slice(cursor, s), hit: false });
    parts.push({ text: text.slice(s, e), hit: true });
    cursor = e;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false });
  return parts;
}
