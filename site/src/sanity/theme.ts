import { buildLegacyTheme } from 'sanity';

// =============================================================================
// WCP Studio theme — makes the Studio feel like the website
// =============================================================================
// buildLegacyTheme derives a full light/dark palette from a handful of CSS
// custom properties that mirror the site's brand tokens (see globals.css):
// navy as the brand/nav color, orange/amber warmth, and the accessible "ink"
// shades for anything that reads as text or state. --font-family-base points
// the whole Studio at Quicksand (the site's body font); the font FILES are
// loaded by components/StudioLayout.tsx (studio.components.layout).
//
// The props object is a plain `const` first (not inlined) so TypeScript skips
// excess-property checks on the legacy `--*--inverted` keys — a known gotcha.
// =============================================================================

const navy = '#01457E';
const orangeInk = '#A85300'; // AA-safe orange for text/state
const skyInk = '#166FA8'; // AA-safe sky, used for focus
const greenInk = '#0E7B2E'; // AA-safe green for success

const props = {
  // The site's friendly body font, Studio-wide (headings, labels, text).
  '--font-family-base': "'Quicksand Variable', system-ui, sans-serif",

  '--black': '#0d2740', // deep navy-ink instead of pure black — warmer, on-brand
  '--white': '#ffffff',

  // A gently cool-neutral gray base keeps the chrome clean and legible.
  '--gray-base': '#5b6b7b',

  '--component-bg': '#ffffff',
  '--component-text-color': '#0d2740',

  // Brand + interactive
  '--brand-primary': navy,
  '--brand-primary--inverted': '#ffffff',
  '--focus-color': skyInk,
  '--default-button-primary-color': navy,

  // State colors — use the AA "ink" shades so labels stay readable
  '--state-info-color': skyInk,
  '--state-success-color': greenInk,
  '--state-warning-color': orangeInk,
  '--state-danger-color': '#b3261e',

  // The top navigation bar: solid navy with cream text, like the site header
  '--main-navigation-color': navy,
  '--main-navigation-color--inverted': '#ffffff',
};

const base = buildLegacyTheme(props);
const baseFonts = base.fonts;

// Quicksand's regular (400) is airy and reads thin at Studio UI sizes, so
// shift the whole weight scale up one notch (the variable font covers any
// weight 300-700). The steps stay distinct so hierarchy still reads; code
// keeps its default weights (it's not Quicksand). Typed structurally off the
// built theme so we don't need @sanity/ui's ThemeFont import.
type StudioFont = NonNullable<typeof baseFonts>['text'];

function bumpWeights<T extends StudioFont>(font: T): T {
  return {
    ...font,
    weights: { ...font.weights, regular: 500, medium: 600, semibold: 650, bold: 700 },
  };
}

export const wcpStudioTheme = baseFonts
  ? {
      ...base,
      fonts: {
        ...baseFonts,
        text: bumpWeights(baseFonts.text),
        label: bumpWeights(baseFonts.label),
        heading: bumpWeights(baseFonts.heading),
      },
    }
  : base;
