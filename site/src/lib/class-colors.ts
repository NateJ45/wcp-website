// =============================================================================
// Class colors — one style set per BRAND COLOR, resolved from the class doc
// =============================================================================
// Each WCP class owns a brand color. The color is a volunteer choice: the
// Sanity `class` doc has a "Class color" dropdown (amber / green / orange /
// sky / navy), so a class the Board adds in 2030 gets a real color with no code
// change. The style sets below are therefore keyed by COLOR, and callers pass
// the color from the class doc.
//
// `classStyles(slug)` still exists for the few places that only hold a slug
// (the directory's stored child-class values, committed fallbacks). It maps the
// four ORIGINAL slugs to their colors and defaults to sky for anything else —
// a fallback, not the source of truth. Prefer `colorStyles(class.color)`.
//
// The class strings below are FULL literals (not built with `bg-${x}`) so the
// Tailwind JIT actually generates them. Text is always AA-safe: badges put
// white on the darkened `-ink` fills; chips/labels use the `-ink` tones on a
// soft tint (or `text-heading` for navy, which has no `-ink` twin).
// =============================================================================
export type ClassColor = 'amber' | 'green' | 'orange' | 'sky' | 'navy';

/** The colors the Sanity `class.color` dropdown offers, in its order. */
export const CLASS_COLORS: readonly ClassColor[] = ['amber', 'green', 'orange', 'sky', 'navy'];

/** True when a stored value is one of the five brand colors. */
export const isClassColor = (value?: string | null): value is ClassColor =>
  CLASS_COLORS.includes(value as ClassColor);

/** A stored color value, or sky when it is missing or unknown. */
export const toClassColor = (value?: string | null): ClassColor =>
  isClassColor(value) ? value : 'sky';

// FALLBACK ONLY. The four classes the site shipped with, so a call site holding
// nothing but a slug (a directory entry's stored class, a committed fallback
// list) still tints correctly when the class doc is not to hand. A class added
// later is not here on purpose — it resolves through its doc's `color`.
const COLOR_BY_SLUG: Record<string, ClassColor> = {
  twos: 'amber',
  threes: 'green',
  'pre-k-am': 'orange',
  'pre-k-pm': 'sky',
  // The merged Pre-K classroom page (both AM + PM); orange = the shared accent.
  'pre-k': 'orange',
};

/** The brand color for one of the original class slugs (defaults to sky). */
export const classColor = (slug?: string): ClassColor => COLOR_BY_SLUG[slug ?? ''] ?? 'sky';

// Friendly display names for the known class slugs, with a titleized fallback
// so a NEW class (e.g. a "summer" class) shows a reasonable label everywhere
// (update audience chips, the directory) instead of its raw slug — no code
// change needed when a class is added.
const LABEL_BY_SLUG: Record<string, string> = {
  twos: 'Twos',
  threes: 'Threes',
  'pre-k-am': 'Pre-K AM',
  'pre-k-pm': 'Pre-K PM',
  'pre-k': 'Pre-K',
};

/** A human label for a class slug ("summer" -> "Summer"). */
export const classLabel = (slug?: string): string => {
  if (!slug) return '';
  if (LABEL_BY_SLUG[slug]) return LABEL_BY_SLUG[slug];
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export interface ClassStyles {
  /** Solid pill on any background (photo overlays, emphasis badges). AA: white on -ink. */
  badge: string;
  /** Solid button fill (white text on the class ink + a darker hover). Theme-stable. */
  button: string;
  /** Soft chip on a white/surface card. */
  chip: string;
  /** Accent border (e.g. a card's top rule). */
  border: string;
  /** Plain decorative fill (dots, bars) — no text on it. */
  dot: string;
  /** AA-safe colored text/icon. */
  text: string;
  /** Round icon chip: soft tint bg + ink icon. */
  iconChip: string;
  /** Very soft tint background (section wash, photo placeholder). */
  softBg: string;
  /** The decorative `wcp-glow-*` wash class for this color. */
  glow: string;
  /** Bright-tint hex, AA-safe as small bold label text on the rail's navy. */
  railAccent: string;
}

// NOTE: `badge` (white text on the class fill, for PHOTO overlays) pins the
// light-mode `-ink` hex directly instead of the `bg-{color}-ink` token. The
// token flips to the BRIGHT tier in dark mode (globals.css), and white text on
// a bright fill fails AA (2.3:1). A photo overlay is theme-independent (the
// photo doesn't change with the page theme), so the fill must stay the dark
// AA-safe shade in both modes — same reasoning as the hardcoded hub-rail fill.
const STYLES: Record<ClassColor, ClassStyles> = {
  amber: {
    badge: 'bg-[#9e5c0a] text-white',
    button: 'bg-[#9e5c0a] text-white hover:bg-[#8a5009]',
    chip: 'bg-amber/15 text-amber-ink',
    border: 'border-amber',
    dot: 'bg-amber',
    text: 'text-amber-ink',
    iconChip: 'bg-amber/15 text-amber-ink',
    softBg: 'bg-amber/10',
    glow: 'wcp-glow-amber',
    railAccent: '#ffa334',
  },
  green: {
    badge: 'bg-[#0e7b2e] text-white',
    button: 'bg-[#0e7b2e] text-white hover:bg-[#0c6b28]',
    chip: 'bg-green/15 text-green-ink',
    border: 'border-green',
    dot: 'bg-green',
    text: 'text-green-ink',
    iconChip: 'bg-green/15 text-green-ink',
    softBg: 'bg-green/10',
    glow: 'wcp-glow-green',
    railAccent: '#4ade80',
  },
  orange: {
    badge: 'bg-[#a85300] text-white',
    button: 'bg-[#a85300] text-white hover:bg-[#934900]',
    chip: 'bg-cream text-orange-ink',
    border: 'border-orange',
    dot: 'bg-orange',
    text: 'text-orange-ink',
    iconChip: 'bg-orange/15 text-orange-ink',
    softBg: 'bg-orange/10',
    glow: 'wcp-glow-orange',
    railAccent: '#fdba74',
  },
  sky: {
    badge: 'bg-[#166fa8] text-white',
    button: 'bg-[#166fa8] text-white hover:bg-[#135f90]',
    chip: 'bg-sky/15 text-sky-ink',
    border: 'border-sky',
    dot: 'bg-sky',
    text: 'text-sky-ink',
    iconChip: 'bg-sky/15 text-sky-ink',
    softBg: 'bg-sky/10',
    glow: 'wcp-glow-sky',
    railAccent: '#7dd3fc',
  },
  // Navy has no `-ink` twin: it is deliberately never redeclared in `.dark`,
  // because it drives the theme-stable navy bands. Colored TEXT therefore uses
  // `text-heading`, the token that IS navy in light and lifts to #a9c6e8 in
  // dark — the one safe way to write navy-colored words in both themes.
  navy: {
    badge: 'bg-[#01457e] text-white',
    button: 'bg-[#01457e] text-white hover:bg-[#013a6a]',
    chip: 'bg-navy/10 text-heading',
    border: 'border-navy',
    dot: 'bg-navy',
    text: 'text-heading',
    iconChip: 'bg-navy/10 text-heading',
    softBg: 'bg-navy/5',
    glow: 'wcp-glow-navy',
    // The rail is a theme-stable navy island, so a navy accent would vanish on
    // it. Navy classes borrow the sky tint for their rail icon.
    railAccent: '#7dd3fc',
  },
};

/** Tailwind class sets for one of the original class slugs (fallback path). */
export const classStyles = (slug?: string): ClassStyles => STYLES[classColor(slug)];

/** Tailwind class sets for a color name — the preferred path (class.color). */
export const colorStyles = (color?: string | null): ClassStyles => STYLES[toClassColor(color)];
