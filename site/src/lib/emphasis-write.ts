// =============================================================================
// emphasis-write — the WRITE half of the rich twins (2026-08-28)
// =============================================================================
// src/lib/emphasis.ts READS a rich twin: `emphasisText`, which is portable text
// with one block style and exactly two marks, bold and italic. This is its
// mirror, and it exists for the in-canvas text popover: the small card that
// opens over an intro line in the Presentation preview, so a volunteer types
// the line where the line is instead of hunting for its box in the form.
//
// The popover's rich field is a `contenteditable` div, not a portable-text
// editor. @portabletext/editor is a Studio-weight dependency and this code ships
// in the site's preview island, so the browser's own editing surface does the
// typing and these functions do the translation:
//
//   blocks -> HTML   emphasisToHtml()   seeds the box with what is stored
//   HTML   -> blocks htmlToEmphasis()   turns what was typed back into data
//
// THE HTML SIDE IS UNTRUSTED. A contenteditable hands back whatever the browser
// felt like emitting, plus whatever the editor pasted out of a Word document:
// nested spans, inline styles, tables, stray script tags. So the parser here is
// an ALLOW-LIST, not a sanitiser. It understands bold, italic and line breaks.
// Every other tag contributes its text and nothing else. No tag name can reach
// the stored document, because the output is built from scratch out of plain
// strings and two booleans.
//
// LINE BREAKS SURVIVE, and that is this file's one difference from the
// presacademy original it is ported from. There, a twin is always ONE block. On
// this site `emphasisHtml()` joins stored blocks with `<br />`, so a volunteer
// who typed two lines in the Studio form has two blocks. Collapsing them here
// would delete a line break the moment somebody opened the in-canvas card. A
// hard break therefore travels through the run list as `RUN_BREAK`, and
// `runsToEmphasis` splits the runs back into one block per line.
// =============================================================================

import { RUN_BREAK, emphasisRuns, type InlineRun } from '@/lib/emphasis';
import type { PortableTextBlock } from '@portabletext/types';

// -----------------------------------------------------------------------------
// HTML -> runs
// -----------------------------------------------------------------------------

/** Tags that turn bold on for their contents. */
const STRONG_TAGS = new Set(['b', 'strong']);
/** Tags that turn italic on for their contents. */
const EM_TAGS = new Set(['i', 'em']);
/** Tags whose boundaries are a line break in the text. */
const BREAK_TAGS = new Set(['br', 'div', 'p', 'li', 'tr', 'blockquote', 'h1', 'h2', 'h3', 'h4']);
/** Tags whose CONTENTS are not text at all and must be dropped whole. */
const DROP_CONTENT_TAGS = new Set(['script', 'style', 'head', 'title']);

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Decode the handful of entities a contenteditable actually produces. */
function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 1 || code > 0x10ffff) return whole;
      // 160 is a non-breaking space. It is a space as far as stored text goes.
      return code === 160 ? ' ' : String.fromCodePoint(code);
    }
    const named = ENTITIES[body.toLowerCase()];
    return named === undefined ? whole : named;
  });
}

/** A `<span style="...">` can still carry emphasis when a browser felt fancy. */
function styleMarks(attrs: string): { strong: boolean; em: boolean } {
  const style = attrs.match(/style\s*=\s*("([^"]*)"|'([^']*)')/i);
  const value = (style?.[2] ?? style?.[3] ?? '').toLowerCase();
  return {
    strong: /font-weight\s*:\s*(bold|[6-9]\d\d)/.test(value),
    em: /font-style\s*:\s*italic/.test(value),
  };
}

/**
 * Flatten an HTML fragment to runs. An unknown tag keeps its text and loses
 * itself; a script tag loses both.
 */
export function htmlToRuns(html?: string | null): InlineRun[] {
  if (typeof html !== 'string' || html === '') return [];

  const raw: InlineRun[] = [];
  // One entry per open element that changes the marks, innermost last.
  const stack: Array<{ tag: string; strong: boolean; em: boolean }> = [];
  let dropUntil: string | null = null;
  let strong = 0;
  let em = 0;
  let i = 0;

  const pushText = (text: string) => {
    if (text === '') return;
    raw.push({ text, strong: strong > 0, em: em > 0 });
  };

  while (i < html.length) {
    const open = html.indexOf('<', i);
    if (open < 0) {
      if (!dropUntil) pushText(decodeEntities(html.slice(i)));
      break;
    }
    if (open > i && !dropUntil) pushText(decodeEntities(html.slice(i, open)));

    const close = html.indexOf('>', open);
    if (close < 0) {
      // A lone '<' with no '>' is literal text, not a tag.
      if (!dropUntil) pushText(decodeEntities(html.slice(open)));
      break;
    }

    const inner = html.slice(open + 1, close);
    const closing = inner.startsWith('/');
    const body = closing ? inner.slice(1) : inner;
    const tag = (body.trim().match(/^[A-Za-z][A-Za-z0-9]*/)?.[0] ?? '').toLowerCase();
    const attrs = tag ? body.slice(body.indexOf(tag) + tag.length) : '';
    i = close + 1;

    if (dropUntil) {
      if (closing && tag === dropUntil) dropUntil = null;
      continue;
    }
    if (!tag) continue;
    if (!closing && DROP_CONTENT_TAGS.has(tag)) {
      dropUntil = tag;
      continue;
    }
    if (BREAK_TAGS.has(tag)) {
      raw.push({ text: RUN_BREAK, strong: false, em: false });
      if (tag === 'br') continue;
    }

    if (closing) {
      // Unwind to the matching open tag. An unbalanced close is ignored.
      for (let s = stack.length - 1; s >= 0; s -= 1) {
        if (stack[s].tag !== tag) continue;
        for (let k = stack.length - 1; k >= s; k -= 1) {
          if (stack[k].strong) strong -= 1;
          if (stack[k].em) em -= 1;
        }
        stack.length = s;
        break;
      }
      continue;
    }
    if (attrs.trimEnd().endsWith('/')) continue; // self-closing, nothing to open

    const marks =
      tag === 'span' ? styleMarks(attrs) : { strong: STRONG_TAGS.has(tag), em: EM_TAGS.has(tag) };
    stack.push({ tag, ...marks });
    if (marks.strong) strong += 1;
    if (marks.em) em += 1;
  }

  return normalizeRuns(raw);
}

/**
 * Collapse runs into what should actually be stored: every stretch of
 * whitespace squeezed to one space, neighbours with identical marks merged,
 * each line trimmed at both ends, and blank lines dropped.
 *
 * RUN_BREAK is a boundary, never text. Two runs on opposite sides of one never
 * merge, so `bold\nitalic` keeps its two lines and its two marks.
 */
export function normalizeRuns(runs: InlineRun[]): InlineRun[] {
  // 1. Split every run's text on RUN_BREAK, so a break is always its own run.
  const flat: InlineRun[] = [];
  for (const run of runs) {
    if (run.text === RUN_BREAK) {
      flat.push({ text: RUN_BREAK, strong: false, em: false });
      continue;
    }
    const pieces = run.text.split(RUN_BREAK);
    pieces.forEach((piece, i) => {
      if (i > 0) flat.push({ text: RUN_BREAK, strong: false, em: false });
      if (piece !== '') flat.push({ ...run, text: piece.replace(/\s+/g, ' ') });
    });
  }

  // 2. Group into lines, merging same-mark neighbours inside each line.
  const lines: InlineRun[][] = [[]];
  for (const run of flat) {
    if (run.text === RUN_BREAK) {
      lines.push([]);
      continue;
    }
    const line = lines[lines.length - 1];
    const last = line[line.length - 1];
    if (last && last.strong === run.strong && last.em === run.em) {
      // Two spaces meeting across a tag boundary are still one space.
      last.text = (last.text + run.text).replace(/ {2,}/g, ' ');
      continue;
    }
    if (!last && run.text === ' ') continue;
    line.push({ ...run });
  }

  // 3. Trim each line at both ends, then drop the lines that hold nothing.
  const trimmed = lines
    .map((line) => {
      if (line.length) {
        line[0].text = line[0].text.replace(/^ +/, '');
        line[line.length - 1].text = line[line.length - 1].text.replace(/ +$/, '');
      }
      return line.filter((run) => run.text !== '');
    })
    .filter((line) => line.length > 0);

  // 4. Re-join the surviving lines with a single break between them.
  const out: InlineRun[] = [];
  trimmed.forEach((line, i) => {
    if (i > 0) out.push({ text: RUN_BREAK, strong: false, em: false });
    out.push(...line);
  });
  return out;
}

// -----------------------------------------------------------------------------
// runs -> portable text
// -----------------------------------------------------------------------------

/** A fresh array `_key`. Injectable so the tests can read the output. */
export type KeyFactory = () => string;

const randomKey: KeyFactory = () => Math.random().toString(36).slice(2, 12);

/**
 * Build the `emphasisText` value the twin stores: ONE BLOCK PER LINE, so the
 * `<br />` joins that `emphasisHtml` renders come back out unchanged.
 *
 * Returns `[]` when there is nothing to store. That is what an editor who
 * cleared the box meant, and it is what makes the plain string underneath the
 * twin render again.
 */
export function runsToEmphasis(
  runs: InlineRun[],
  nextKey: KeyFactory = randomKey,
): PortableTextBlock[] {
  const lines: InlineRun[][] = [[]];
  for (const run of runs) {
    if (run.text === RUN_BREAK) lines.push([]);
    else if (run.text !== '') lines[lines.length - 1].push(run);
  }

  const blocks = lines
    .filter((line) => line.some((run) => run.text.trim() !== ''))
    .map(
      (line) =>
        ({
          _type: 'block',
          _key: nextKey(),
          style: 'normal',
          markDefs: [],
          children: line.map((run) => ({
            _type: 'span',
            _key: nextKey(),
            text: run.text,
            marks: [...(run.strong ? ['strong'] : []), ...(run.em ? ['em'] : [])],
          })),
        }) as unknown as PortableTextBlock,
    );

  return blocks;
}

/** The whole write direction: what the contenteditable holds -> what is stored. */
export function htmlToEmphasis(
  html?: string | null,
  nextKey: KeyFactory = randomKey,
): PortableTextBlock[] {
  return runsToEmphasis(htmlToRuns(html), nextKey);
}

// -----------------------------------------------------------------------------
// portable text -> HTML
// -----------------------------------------------------------------------------

/** Escape the three characters that would otherwise be read as markup. */
export function escapeRunHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Runs as the markup the contenteditable should be seeded with. */
export function runsToHtml(runs: InlineRun[]): string {
  return runs
    .map((run) => {
      if (run.text === RUN_BREAK) return '<br>';
      let html = escapeRunHtml(run.text);
      if (run.em) html = `<em>${html}</em>`;
      if (run.strong) html = `<strong>${html}</strong>`;
      return html;
    })
    .join('');
}

/**
 * The whole read direction, reusing `emphasisRuns` from src/lib/emphasis.ts so
 * the popover and the rendered page can never disagree about what a twin says.
 */
export function emphasisToHtml(value?: unknown): string {
  return runsToHtml(emphasisRuns(value));
}
