import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AA_BODY_TEXT, AA_NON_TEXT, contrastRatio, flatten, hexToRgb, rgbToHex } from './contrast';
import { DARK_SCOPE, LIGHT_SCOPE, scopeReader, tokensIn } from './css-tokens';

// =============================================================================
// Theme token contrast — the gate that can actually see this class of bug
// =============================================================================
// The 2026-07-19 dark-mode audit found five accessibility failures that all
// passed CI: axe has no rule for focus-indicator or custom-border contrast, and
// the dark axe suite only ever audits the RESTING DOM, so it never measures a
// focused element. Lighthouse stayed at 100 throughout.
//
// This reads the real token values out of globals.css and checks the pairings
// that matter, in BOTH themes, in milliseconds. It is deliberately a small set
// of load-bearing pairs rather than an exhaustive matrix — the point is to fail
// loudly when someone reaches for a theme-stable token (navy) in a place that
// has to survive the theme flip.
// =============================================================================

const css = readFileSync(new URL('../styles/globals.css', import.meta.url), 'utf8');

// The reader is shared, the pairs below are not. Extraction moved to
// src/lib/css-tokens.ts (canonical in ncs-astro-sanity-starter, 2026-09-06)
// because the same brace-counted, scope-aware, alias-following logic had been
// written three times across the family in three different qualities, and the
// weakest copy was silently measuring the wrong declaration. The lesson this
// file's first draft paid for is now in that module's header: capturing only
// hex made `--color-sky-ink: var(--color-sky)` in `.dark` invisible, so the
// dark focus ring was reported as failing when it passes. A test that measures
// the wrong colour is worse than no test.
//
// This file stays a deliberate fork and stays unmarked: it is Vitest rather
// than node:test, and its pairs, its paper inks and its navy trap are WCP's
// own. Only the reading of globals.css is common property.
//
// This is Tailwind v4 with CSS-first config, so the brand tokens live in
// `@theme` blocks as well as `:root`, and there is more than one of each.
const light = tokensIn(css, LIGHT_SCOPE);
const dark = tokensIn(css, DARK_SCOPE);

/** Dark overrides only some tokens; the rest inherit from the light scope. */
const darkValue = scopeReader(dark, light);
const lightValue = scopeReader(light);

describe('token extraction', () => {
  it('found a meaningful number of tokens in both themes', () => {
    expect(Object.keys(light).length).toBeGreaterThan(10);
    expect(Object.keys(dark).length).toBeGreaterThan(3);
  });

  it('resolves the tokens this suite depends on', () => {
    for (const t of ['--color-sky-ink', '--color-navy', '--color-ink', '--color-bg']) {
      expect(light[t], `${t} missing from :root`).toBeTruthy();
    }
  });
});

describe('body text', () => {
  it('clears AA on the light page', () => {
    expect(
      contrastRatio(lightValue('--color-ink'), lightValue('--color-bg')),
    ).toBeGreaterThanOrEqual(AA_BODY_TEXT);
  });

  it('clears AA on the dark page', () => {
    expect(contrastRatio(darkValue('--color-ink'), darkValue('--color-bg'))).toBeGreaterThanOrEqual(
      AA_BODY_TEXT,
    );
  });
});

describe('the focus indicator', () => {
  // THE regression guard. The global :focus-visible ring is --color-sky-ink.
  // Eight forms had overridden it with --color-navy, which is deliberately NOT
  // re-declared in .dark, so the ring measured 1.13:1 there and keyboard focus
  // was invisible. SC 1.4.11 wants 3:1.
  it('clears 3:1 against the light page', () => {
    expect(
      contrastRatio(lightValue('--color-sky-ink'), lightValue('--color-bg')),
    ).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it('clears 3:1 against the dark page', () => {
    expect(
      contrastRatio(darkValue('--color-sky-ink'), darkValue('--color-bg')),
    ).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it('clears 3:1 against the dark card surface', () => {
    const surface = darkValue('--color-surface');
    if (!surface) return; // token is optional; skip rather than fail spuriously
    expect(contrastRatio(darkValue('--color-sky-ink'), surface)).toBeGreaterThanOrEqual(
      AA_NON_TEXT,
    );
  });

  // The trap, stated as a test so it cannot be re-introduced quietly: navy is
  // theme-stable by design, so it must never be used as a focus indicator.
  it('would FAIL if navy were used as the ring on dark (documents why it is not)', () => {
    const ratio = contrastRatio(darkValue('--color-navy'), darkValue('--color-bg'));
    expect(
      ratio,
      'navy on the dark page is below 3:1 — this is why the focus ring uses sky-ink',
    ).toBeLessThan(AA_NON_TEXT);
  });
});

describe('interactive borders in dark mode', () => {
  // Card and input borders are the ONLY affordance marking those components in
  // dark mode (the fill does not change), so they are UI components under
  // SC 1.4.11 and need 3:1 against the surface they sit on.
  const alphaBorder = /--input:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([\d.]+)\s*\)/;

  it('composites the input border above 3:1 on the dark surface', () => {
    const m = css.slice(css.indexOf('.dark {')).match(alphaBorder);
    if (!m) return; // not an rgba white border any more; nothing to assert
    const alpha = Number(m[1]);
    const surface = darkValue('--color-surface') ?? darkValue('--color-bg');
    const composite = rgbToHex(flatten(hexToRgb('#ffffff'), alpha, hexToRgb(surface)));
    expect(
      contrastRatio(composite, surface),
      `--input at alpha ${alpha} composites to ${composite}, below the 3:1 UI threshold`,
    ).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
});

describe('dark-mode elevation', () => {
  // Dark themes cannot use a black shadow to lift a card off a dark page, so
  // elevation is carried by a lighter SURFACE. These pin that the raised token
  // genuinely raises, and that it did not cost any text contrast.
  const soft = () => darkValue('--color-bg-soft');
  const surface = () => darkValue('--color-surface');
  const raised = () => darkValue('--color-surface-raised');

  it('separates a raised card from the band behind it better than the flat surface did', () => {
    const flat = contrastRatio(surface(), soft());
    const lifted = contrastRatio(raised(), soft());
    expect(lifted).toBeGreaterThan(flat);
    // Light mode's white-card-on-grey-band separation is ~1.14:1; dark should
    // be in that register rather than the 1.07:1 it was.
    expect(lifted).toBeGreaterThanOrEqual(1.12);
  });

  it('keeps body text on a raised card well clear of AA', () => {
    expect(contrastRatio(darkValue('--color-ink'), raised())).toBeGreaterThanOrEqual(AA_BODY_TEXT);
  });

  it('keeps muted text on a raised card clear of AA', () => {
    expect(contrastRatio(darkValue('--color-ink-muted'), raised())).toBeGreaterThanOrEqual(
      AA_BODY_TEXT,
    );
  });

  // THE regression guard for the documented trap. Raising --color-surface was
  // tried before and reverted: `.hub-note--postit` mixes amber INTO it, and the
  // lifted composite pushed muted text under AA. The raised step is a separate
  // token precisely so that mix is untouched — if someone "tidies" this to use
  // the raised token, this fails and points at why.
  it('leaves the postit mixing against the UNRAISED surface', () => {
    const postit = css.slice(
      css.indexOf('.dark .hub-note--postit'),
      css.indexOf('.dark .hub-note--postit') + 240,
    );
    expect(postit).toContain('var(--color-surface)');
    expect(postit).not.toContain('--color-surface-raised');
  });
});

describe('the physical-object paper inks', () => {
  // Paper is light in BOTH themes, so its inks are fixed hexes rather than
  // tokens. These are the measured values the CSS comments cite; if someone
  // edits the paper colour these fail rather than silently dropping below AA.
  it.each([
    ['chooser question', '#01203a', '#fffdf7', AA_BODY_TEXT],
    ['chooser link', '#166fa8', '#fffdf7', AA_BODY_TEXT],
    ['hero note title', '#01203a', '#fff8e1', AA_BODY_TEXT],
    ['hero note body', '#3d4b57', '#fff8e1', AA_BODY_TEXT],
    ['hero note link', '#a34a00', '#fff8e1', AA_BODY_TEXT],
    ['note paper body', '#2f4258', '#fffdf7', AA_BODY_TEXT],
  ])('%s clears AA on its paper', (_label, ink, paper, threshold) => {
    expect(contrastRatio(ink, paper)).toBeGreaterThanOrEqual(threshold);
  });

  // Dark mode dims the LARGE paper surfaces ~6% so they stop glaring against
  // the near-black canvas. Dimming paper reduces contrast for the dark inks
  // printed on it, so every one of them is re-measured here against the dimmed
  // value rather than assumed to still pass.
  const DIMMED_PAPER = '#f0eee8';

  it.each([
    ['note paper body', '#2f4258'],
    ['note paper signature', '#01203a'],
    ['note paper muted', '#52657a'],
  ])('%s still clears AA on dimmed paper', (_label, ink) => {
    expect(contrastRatio(ink, DIMMED_PAPER)).toBeGreaterThanOrEqual(AA_BODY_TEXT);
  });

  it('dimmed paper is still clearly LIGHT paper, not a grey card', () => {
    // Guards the doctrine as well as the contrast: if someone "fixes" the glare
    // by dropping this to a mid grey, the object stops reading as paper.
    expect(contrastRatio(DIMMED_PAPER, '#0d1219')).toBeGreaterThan(12);
  });
});
