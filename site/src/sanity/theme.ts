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

const brandFonts = {
  ...defaults.fonts,
  text: brandFont(defaults.fonts.text),
  label: brandFont(defaults.fonts.label),
  heading: brandFont(defaults.fonts.heading),
};

export const wcpStudioTheme: RootTheme = buildTheme({ font: brandFonts });

// The Family Hub workspace gets a WARM twin of the same theme, so a volunteer
// always knows which door they are in — the same trick the site plays (navy
// hub island vs paper-white public pages). Only HUES change: buildTheme still
// derives every tint from the tested @sanity/color scales, so both schemes
// stay accessible and the dark-mode toggle keeps working.
//  - base default/transparent → yellow: a faint warm cast on the chrome.
//  - primary + selection → orange: buttons, tabs and the selected row read
//    orange here instead of the default blue.
export const wcpHubStudioTheme: RootTheme = buildTheme({
  font: brandFonts,
  color: {
    base: {
      default: { _hue: 'yellow' },
      transparent: { _hue: 'yellow' },
      primary: { _hue: 'orange' },
    },
    selectable: {
      default: { _hue: 'yellow' },
      primary: { _hue: 'orange' },
    },
  },
});
