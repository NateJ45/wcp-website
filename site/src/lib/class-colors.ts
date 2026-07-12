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
};

/** The brand color for a class slug (defaults to sky if unknown). */
export const classColor = (slug?: string): ClassColor => COLOR_BY_SLUG[slug ?? ''] ?? 'sky';

export interface ClassStyles {
  /** Solid pill on any background (photo overlays, emphasis badges). AA: white on -ink. */
  badge: string;
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

const STYLES: Record<ClassColor, ClassStyles> = {
  amber: {
    badge: 'bg-amber-ink text-white',
    chip: 'bg-amber/15 text-amber-ink',
    border: 'border-amber',
    dot: 'bg-amber',
    text: 'text-amber-ink',
    iconChip: 'bg-amber/15 text-amber-ink',
    softBg: 'bg-amber/10',
  },
  green: {
    badge: 'bg-green-ink text-white',
    chip: 'bg-green/15 text-green-ink',
    border: 'border-green',
    dot: 'bg-green',
    text: 'text-green-ink',
    iconChip: 'bg-green/15 text-green-ink',
    softBg: 'bg-green/10',
  },
  orange: {
    badge: 'bg-orange-ink text-white',
    chip: 'bg-cream text-orange-ink',
    border: 'border-orange',
    dot: 'bg-orange',
    text: 'text-orange-ink',
    iconChip: 'bg-orange/15 text-orange-ink',
    softBg: 'bg-orange/10',
  },
  sky: {
    badge: 'bg-sky-ink text-white',
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
