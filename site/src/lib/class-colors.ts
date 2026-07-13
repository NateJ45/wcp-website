// =============================================================================
// Class colors — one source of truth for the four classes' brand colors
// =============================================================================
// Each WCP class owns a brand color, used consistently everywhere the class is
// shown (class pages, class cards, tuition, the directory class overlay, nav
// chips). The mapping matches the Sanity `class.color` field and the seed data:
//
//   Twos      -> amber      Pre-K AM -> orange
//   Threes    -> green      Pre-K PM -> sky
//
// The class strings below are FULL literals (not built with `bg-${x}`) so the
// Tailwind JIT actually generates them. Text is always AA-safe: badges put white
// on the darkened `-ink` fills; chips/labels use the `-ink` tones on a soft tint.
// =============================================================================
export type ClassColor = 'amber' | 'green' | 'orange' | 'sky';

const COLOR_BY_SLUG: Record<string, ClassColor> = {
  twos: 'amber',
  threes: 'green',
  'pre-k-am': 'orange',
  'pre-k-pm': 'sky',
  // The merged Pre-K hub page (both AM + PM); orange = the shared Pre-K accent.
  'pre-k': 'orange',
};

/** The brand color for a class slug (defaults to sky if unknown). */
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
  },
};

/** Tailwind class sets for a class slug. */
export const classStyles = (slug?: string): ClassStyles => STYLES[classColor(slug)];

/** Tailwind class sets for a color name (when you already have the color). */
export const colorStyles = (color: ClassColor): ClassStyles => STYLES[color];
