import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// =============================================================================
// A background token must never be used as a text colour
// =============================================================================
// The design tokens come in pairs: `--muted` is the BACKGROUND (#eff0f1, a
// near-white) and `--muted-foreground` is the ink for it (#5f6573). Tailwind
// generates a utility for each, so `text-muted` and `text-muted-foreground` are
// both real classes and only one of them is ever right.
//
// On 2026-09-06 the board admin shipped with `text-muted` on its table cells and
// intro copy: white-on-white at 1.14:1. It was found by a human selecting the
// invisible text, not by any gate.
//
// THIS IS THE GATE FOR IT — and it is a static one on purpose. The obvious
// answer was axe, and axe does NOT catch this: its color-contrast rule cannot
// resolve the colour behind these cards, so it reports the element as
// "incomplete" rather than a violation and the page passes. Verified by
// reintroducing the exact bug against the new hub sweep, which stayed green.
//
// A grep is unglamorous and it is deterministic, which is what this class of
// mistake needs: the wrong class name is the whole bug.
// =============================================================================

/** Tokens that name a SURFACE. Each has a `-foreground` partner for its ink. */
const BACKGROUND_ONLY = ['muted', 'card', 'primary', 'secondary', 'accent', 'popover'];

const SEARCH_ROOTS = ['src/components', 'src/pages', 'src/layouts'];
const EXTENSIONS = ['.astro', '.tsx', '.ts'];

function walk(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (EXTENSIONS.some((e) => full.endsWith(e))) out.push(full);
  }
  return out;
}

describe('design tokens', () => {
  it('never uses a background token as a text colour', () => {
    // `text-muted-foreground` is correct and must not match, so the pattern
    // requires the class to END at the token name.
    const pattern = new RegExp(`\\btext-(${BACKGROUND_ONLY.join('|')})(?![\\w-])`, 'g');
    const offences: string[] = [];

    for (const root of SEARCH_ROOTS) {
      for (const file of walk(root)) {
        const source = readFileSync(file, 'utf8');
        source.split('\n').forEach((line, i) => {
          for (const hit of line.matchAll(pattern)) {
            offences.push(`${file}:${i + 1}  ${hit[0]}  → did you mean ${hit[0]}-foreground?`);
          }
        });
      }
    }

    expect(
      offences,
      `A background token is being used as a text colour, which renders near-invisible:\n${offences.join('\n')}`,
    ).toEqual([]);
  });
});
