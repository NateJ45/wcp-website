import { buildLegacyTheme } from 'sanity';

// =============================================================================
// WCP Studio theme — makes the Studio feel like the website
// =============================================================================
// buildLegacyTheme derives a full light/dark palette from a handful of CSS
// custom properties that mirror the site's brand tokens (see globals.css):
// navy as the brand/nav color, orange/amber warmth, and the accessible "ink"
// shades for anything that reads as text or state. Colors only here; the
// friendly body font is injected by StudioLayout.
//
// The props object is a plain `const` first (not inlined) so TypeScript skips
// excess-property checks on the legacy `--*--inverted` keys — a known gotcha.
// =============================================================================

const navy = '#01457E';
const orangeInk = '#A85300'; // AA-safe orange for text/state
const skyInk = '#166FA8'; // AA-safe sky, used for focus
const greenInk = '#0E7B2E'; // AA-safe green for success

const props = {
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

export const wcpStudioTheme = buildLegacyTheme(props);
