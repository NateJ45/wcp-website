// Safe to edit by hand
// =============================================================================
// tool-theme - the per-repo half of the in-canvas controls (PORTS.md card 28)
// =============================================================================
// `styles.ts` beside this file is CANONICAL: every repo in the family draws the
// same tool chrome, and the shapes, radii, shadows and spacing are owned by
// ncs-astro-sanity-starter. The six values below are the part that is genuinely
// this site's own, so they live here and a rebrand edits this file alone.
//
// FIXED, AND THEME-INDEPENDENT ON PURPOSE. These controls float over the page,
// so they must read as TOOLS rather than as content: a white card on a navy band
// still reads as a control, a navy card on a navy band reads as part of the
// design. The values are LITERALS, never `var(--color-...)`, for the same
// reason. The site's tokens flip in dark mode and a tool that flipped with them
// would disappear against the band it sits on. See the "-ink trap" note in
// site/CLAUDE.md.
// =============================================================================

/** The palette and type the canonical `styles.ts` draws every control with. */
export interface ToolTheme {
  /** Card and button background. */
  paper: string;
  /** Text, and the filled state of a pressed control. */
  ink: string;
  /** Captions and secondary text. */
  muted: string;
  /** Hairline borders. */
  line: string;
  /** The drop shadow that lifts a floating card off the page. */
  shadow: string;
  /** The font stack, matching the site's body face. */
  font: string;
}

export const TOOL: ToolTheme = {
  paper: '#ffffff',
  ink: '#1a1a1a',
  muted: '#5b6470',
  line: 'rgba(26, 26, 26, 0.14)',
  shadow: '0 6px 20px rgba(1, 69, 126, 0.22), 0 1px 2px rgba(26, 26, 26, 0.16)',
  font: '"Quicksand Variable", ui-sans-serif, system-ui, -apple-system, sans-serif',
};

// -----------------------------------------------------------------------------
// Two things this repo adds, on top of the canonical six
// -----------------------------------------------------------------------------
// Both are used only by THIS repo's card components, which card 28 keeps
// per-repo. They live here rather than in `styles.ts` so that the canonical file
// stays byte-identical across the family. PORTS.md card 28b records both as
// candidates for a fold-back the day a second repo wants them.

/**
 * The brand navy, for a selected word chip and a chosen band row.
 *
 * Theme-stable by design: it is the one colour in this layer that says "this is
 * the one you picked", and it must mean that on a cream band and a navy one.
 */
export const TOOL_ACCENT = '#01457e';

/**
 * The two floating cards here are real `<dialog open>` elements, which is what
 * makes a keydown handler on them honest markup rather than a div pretending.
 *
 * A dialog carries user-agent styles though - absolute position, auto margins,
 * 1em padding, a solid border - so each card spreads this over the canonical
 * style to reset them. Miss it and the card lands somewhere the handle is not.
 */
export const dialogReset = {
  position: 'static',
  inset: 'auto',
  display: 'block',
  margin: 0,
  padding: 0,
  height: 'auto',
  maxHeight: 'none',
} as const;
