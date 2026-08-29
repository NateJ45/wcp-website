// =============================================================================
// sanity-path — reading the `path` a visual-editing node carries (2026-08-28)
// =============================================================================
// Every element the Presentation overlay knows about arrives with a STUDIO PATH
// string: `sections[_key=="a1b2"].header.title`, or `hero.lead`, or
// `sections[_key=="x"].steps[_key=="y"].bodyRich[_key=="b"].children[_key=="c"].text`.
// To patch the document the mutation API wants that path as an ARRAY of
// segments. It addresses an array member by key object, not by position:
//
//   ['sections', {_key: 'a1b2'}, 'header', 'title']
//
// The Studio has a parser for this (`@sanity/util/paths`). It lives inside the
// `sanity` package, and the in-canvas controls ship in the PREVIEW ISLAND, a
// browser bundle that must not grow a Studio dependency. So: a small parser,
// here, pure, and covered by src/lib/sanity-path.test.ts.
//
// The grammar is deliberately narrow. It reads exactly what the overlay hands
// us: dotted property names, `[_key=="..."]` members, and numeric indices. It
// returns an empty path for anything else. A shape we have never seen makes a
// control DISAPPEAR. It never makes a control write to a guessed location.
//
// Ported from the presacademy repo, then cut down: this schema has ONE
// page-builder array (`sections`), not two.
// =============================================================================

/** One step along a document path. */
export type PathSegment = string | number | { _key: string };

const PROPERTY = /^[A-Za-z_][A-Za-z0-9_]*$/;
const KEY_MEMBER = /^_key\s*==\s*"([^"]*)"$/;

/**
 * Parse a studio path string into segments. Returns `[]` when the string is
 * empty, or when it holds anything this grammar does not cover.
 */
export function parseSanityPath(path?: string | null): PathSegment[] {
  if (typeof path !== 'string' || path.trim() === '') return [];
  const out: PathSegment[] = [];
  let i = 0;
  const source = path.trim();

  while (i < source.length) {
    if (source[i] === '.') {
      i += 1;
      continue;
    }
    if (source[i] === '[') {
      const close = source.indexOf(']', i);
      if (close < 0) return [];
      const inner = source.slice(i + 1, close).trim();
      const keyed = KEY_MEMBER.exec(inner);
      if (keyed) {
        out.push({ _key: keyed[1] });
      } else if (/^\d+$/.test(inner)) {
        out.push(Number(inner));
      } else {
        return [];
      }
      i = close + 1;
      continue;
    }
    let j = i;
    while (j < source.length && source[j] !== '.' && source[j] !== '[') j += 1;
    const word = source.slice(i, j);
    if (!PROPERTY.test(word)) return [];
    out.push(word);
    i = j;
  }

  return out;
}

/** The last property name in a path, or '' when the path ends in a member. */
export function lastProperty(segments: PathSegment[]): string {
  const last = segments[segments.length - 1];
  return typeof last === 'string' ? last : '';
}

/** The path with its final segment removed. */
export function parentOf(segments: PathSegment[]): PathSegment[] {
  return segments.slice(0, -1);
}

/**
 * Walk a document snapshot to the value at `segments`. Returns undefined when
 * any step is missing. An array member is found by `_key`, never by position,
 * so a section that moved while a control was open still resolves to itself.
 */
export function valueAtPath(root: unknown, segments: PathSegment[]): unknown {
  let current: unknown = root;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    if (typeof segment === 'string') {
      if (typeof current !== 'object' || Array.isArray(current)) return undefined;
      current = (current as Record<string, unknown>)[segment];
    } else if (typeof segment === 'number') {
      if (!Array.isArray(current)) return undefined;
      current = current[segment];
    } else {
      if (!Array.isArray(current)) return undefined;
      current = current.find(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          (item as { _key?: string })._key === segment._key,
      );
    }
  }
  return current;
}

/**
 * The page-builder array field in this schema. A section is an item in it. Both
 * the `page` document and the `hubPage` document name it the same way, so one
 * literal covers every surface the preview renders.
 */
export const SECTION_ARRAY_FIELD = 'sections';

/** What a path tells us about the section it points into. */
export interface SectionPathInfo {
  /** The section item's `_key`. */
  key: string;
  /** Path to the section item itself. */
  itemPath: PathSegment[];
  /** Everything below the item, e.g. `['header', 'title']`. */
  rest: PathSegment[];
}

/**
 * Read a path that points at a section item, or at anything inside one.
 * Returns null for a path that is not inside the page-builder array — a
 * document field like `hero.title`, or a node on some other document.
 */
export function readSectionPath(path?: string | null): SectionPathInfo | null {
  const segments = parseSanityPath(path);
  if (segments.length < 2) return null;
  const [array, member, ...rest] = segments;
  if (array !== SECTION_ARRAY_FIELD) return null;
  if (typeof member !== 'object' || member === null || !('_key' in member)) return null;
  return { key: member._key, itemPath: [SECTION_ARRAY_FIELD, { _key: member._key }], rest };
}

/**
 * Find one section item in a document snapshot, by `_key`.
 *
 * Every in-canvas control starts here: the path names the section, and only the
 * document says what `_type` it is. That answer decides which control the
 * editor may have, so it is read once and shared.
 */
export function sectionByKey(
  doc: Record<string, unknown> | null | undefined,
  key: string,
): Record<string, unknown> | null {
  const list = doc?.[SECTION_ARRAY_FIELD];
  if (!Array.isArray(list)) return null;
  const found = list.find((item) => (item as { _key?: string } | null)?._key === key);
  return (found as Record<string, unknown> | undefined) ?? null;
}
