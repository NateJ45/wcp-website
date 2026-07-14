import { buildTheme, type RootTheme, type ThemeFont } from '@sanity/ui/theme';

// =============================================================================
// WCP Studio theme — brand font + a real light AND dark mode
// =============================================================================
// @sanity/ui's buildTheme() ships BOTH a light and a dark color scheme (tested
// and accessible), so the Studio's Appearance toggle in the avatar menu
// (System / Light / Dark) works properly. We keep only our brand FONT on top:
// Quicksand — the site's body font — with a one-notch weight bump so it reads
// well at Studio UI sizes (the variable font covers 300-700).
//
// This replaced the old `buildLegacyTheme` approach, which was light-ONLY: it
// hard-coded white component backgrounds and dark text, so flipping the Studio
// to Dark left every panel white (effectively no dark mode). See git history.
//
// The Quicksand font FILES are loaded by components/StudioLayout.tsx
// (studio.components.layout); this only points the theme's font family at them.
// `code` keeps the default monospace — it isn't Quicksand.
// =============================================================================

const QUICKSAND = "'Quicksand Variable', system-ui, sans-serif";

function brandFont(font: ThemeFont): ThemeFont {
  return {
    ...font,
    family: QUICKSAND,
    weights: { ...font.weights, regular: 500, medium: 600, semibold: 650, bold: 700 },
  };
}

// Build the default theme once to inherit its font SIZES, then rebuild with our
// Quicksand family + heavier weights fed back through `buildTheme({ font })` —
// the family has to go INTO the builder (it bakes the CSS at build time); a
// post-hoc `theme.fonts.family` patch is ignored and the Studio stays on Inter.
const defaults = buildTheme();

export const wcpStudioTheme: RootTheme = buildTheme({
  font: {
    ...defaults.fonts,
    text: brandFont(defaults.fonts.text),
    label: brandFont(defaults.fonts.label),
    heading: brandFont(defaults.fonts.heading),
  },
});
