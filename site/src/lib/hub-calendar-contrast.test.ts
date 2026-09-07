import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

// Same stubs as hub-calendar.test.ts: the module pulls in the Sanity client for
// its fetch helpers, which cannot initialise under vitest. The chip metadata
// this file measures is a plain object that never touches them.
vi.mock('@/lib/sanity', () => ({ sanityFetch: vi.fn(), BOARD_CONTENT_CACHE: {} }));
vi.mock('@/lib/hub-cache', () => ({ cached: vi.fn() }));

import { AA_BODY_TEXT, contrastRatio, flatten, hexToRgb, rgbToHex } from './contrast';
import { DARK_SCOPE, LIGHT_SCOPE, scopeReader, tokensIn } from './css-tokens';
import { CHIP_LABEL_TEXT, EVENT_TYPE_META } from './hub-calendar';

// =============================================================================
// Calendar event chips — text on a translucent brand tint
// =============================================================================
// The 2026-09-07 failure this file exists to stop: on /family-hub/calendar in
// DARK mode, the mobile schedule's month label (`text-ink-muted`, 9.6px bold)
// sat on the milestone chip's `bg-amber/20`. The tint composites over
// `--color-surface` (#1b2531) into #493e32 and the pair measured 4.08:1.
//
// It is the trap in site/CLAUDE.md, one step further on: the doctrine said a
// tinted chip is safe as long as the LABEL stays neutral, and listed
// `text-ink-muted` among the neutrals. It is not one. `--color-ink-muted` is
// tuned to ~7:1 on the BARE dark surface, and the tint spends most of that
// margin — every one of the five chips lands between 4.08 and 4.89. Only
// `--color-heading` and `--color-ink` keep real headroom (5.9-10.6).
//
// Why a unit test and not the axe sweep: `npm run test:hub` only sees the chip
// types that happen to be in the live Apps Script feed on the day it runs, and
// CI blocks that feed entirely (`.github/workflows/ci.yml`), falling back to
// Sanity `event` docs — currently all of type "event", whose green tint passes.
// So the axe gate can never see the amber chip. This measures all five types,
// in both themes, from the real token values, in milliseconds.
// =============================================================================

const css = readFileSync(new URL('../styles/globals.css', import.meta.url), 'utf8');
const light = tokensIn(css, LIGHT_SCOPE);
const dark = tokensIn(css, DARK_SCOPE);
const value = { light: scopeReader(light), dark: scopeReader(dark, light) } as const;
type Theme = keyof typeof value;

/** `bg-amber/20` / `dark:bg-sky/15` -> the token name and alpha for one theme. */
function tintFor(chipBg: string, theme: Theme): { token: string; alpha: number } {
  let hit: RegExpMatchArray | null = null;
  for (const cls of chipBg.split(/\s+/)) {
    const m = cls.match(/^(dark:)?bg-([a-z-]+)\/(\d+)$/);
    if (!m) throw new Error(`Unparsed chipBg class: "${cls}"`);
    // A `dark:` class wins in dark and is ignored in light; a bare class is the
    // base in both. Later matches win, exactly as the cascade resolves them.
    if (theme === 'dark' ? true : !m[1]) hit = m;
  }
  if (!hit) throw new Error(`No tint for "${chipBg}" in ${theme}`);
  return { token: `--color-${hit[2]}`, alpha: Number(hit[3]) / 100 };
}

/** The colour a chip actually paints: its tint flattened over the card surface. */
function chipSurface(chipBg: string, theme: Theme): string {
  const { token, alpha } = tintFor(chipBg, theme);
  const read = value[theme];
  return rgbToHex(flatten(hexToRgb(read(token)), alpha, hexToRgb(read('--color-surface'))));
}

const TYPES = Object.entries(EVENT_TYPE_META);

describe('the chip label token', () => {
  it('is the one Tailwind class every chip call site uses', () => {
    // Bound to a token this test can resolve. If someone re-colours the label,
    // they change it here and the assertions below re-measure the new value.
    expect(CHIP_LABEL_TEXT).toBe('text-heading');
  });

  for (const theme of ['light', 'dark'] as const) {
    for (const [type, meta] of TYPES) {
      it(`clears AA on the ${type} chip in ${theme} mode`, () => {
        const ratio = contrastRatio(
          value[theme]('--color-heading'),
          chipSurface(meta.chipBg, theme),
        );
        expect(ratio, `${type} chip, ${theme}`).toBeGreaterThanOrEqual(AA_BODY_TEXT);
      });
    }
  }
});

describe('why the label is neither muted nor coloured (documents the 2026-09-07 bug)', () => {
  const amber = () => chipSurface(EVENT_TYPE_META.milestone.chipBg, 'dark');

  it('reproduces the exact composite axe reported', () => {
    expect(amber()).toBe('#493e32');
  });

  it('would FAIL with muted neutral text, which is what shipped', () => {
    expect(contrastRatio(value.dark('--color-ink-muted'), amber())).toBeLessThan(AA_BODY_TEXT);
  });

  it('would FAIL with the per-type coloured -ink text it replaced', () => {
    expect(contrastRatio(value.dark('--color-orange-ink'), amber())).toBeLessThan(AA_BODY_TEXT);
  });
});
