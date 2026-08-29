// =============================================================================
// styles — the look of the in-canvas controls (2026-08-28)
// =============================================================================
// These controls float OVER the page inside the Presentation preview, so they
// have to read as TOOLS rather than as content. That means a fixed light chrome
// in both themes (a white card on a navy band still reads as a control; a navy
// card on a navy band reads as part of the design), the site's own type, and
// nothing a visitor could ever mistake for the page.
//
// PLAIN OBJECTS, NOT @sanity/ui. The Studio's component kit would drag
// styled-components and its theme into the PREVIEW ISLAND, which is bundled with
// the site. The whole layer is a few dozen inline styles instead, and that is
// the entire cost of keeping the public bundle where it was.
//
// The colours are the site's own tokens, written as literals because this layer
// must NOT react to the page's theme. `--color-ink` and friends flip in dark
// mode; a tool that flipped with them would disappear against the band it sits
// on. See the "-ink trap" note in site/CLAUDE.md.
// =============================================================================
import type { CSSProperties } from 'react';

/** Fixed, theme-independent chrome: the same tool on a cream band or a navy one. */
export const TOOL = {
  paper: '#ffffff',
  ink: '#1a1a1a',
  muted: '#5b6470',
  line: 'rgba(26, 26, 26, 0.14)',
  /** The brand navy, for the one selected state. Theme-stable by design. */
  brand: '#01457e',
  shadow: '0 6px 20px rgba(1, 69, 126, 0.22), 0 1px 2px rgba(26, 26, 26, 0.16)',
  font: '"Quicksand Variable", ui-sans-serif, system-ui, -apple-system, sans-serif',
} as const;

/** Everything a floating strip looks like, minus where it sits. */
const barBase: CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 8px',
  borderRadius: '999px',
  background: TOOL.paper,
  border: `1px solid ${TOOL.line}`,
  boxShadow: TOOL.shadow,
  font: `600 12px/1.2 ${TOOL.font}`,
  color: TOOL.ink,
  flexWrap: 'wrap',
};

/**
 * The strip inside a TEXT element's outline (a heading, an intro line). Those
 * elements are comfortably bigger than the strip, so it sits in their corner.
 */
export const bar: CSSProperties = {
  ...barBase,
  right: '8px',
  bottom: '8px',
  maxWidth: 'calc(100% - 16px)',
};

/**
 * The ANCHOR the band card hangs from. The handle is a 28px square pinned to the
 * section's TOP-RIGHT, so the card drops from its bottom edge and grows
 * leftwards, which keeps it on screen.
 *
 * TOP-RIGHT, not bottom-right: a section is usually taller than the viewport, so
 * its bottom corner is off screen exactly when the editor is looking at it.
 *
 * FLUSH, WITH NO DEAD GAP. The visible card is offset from the handle by
 * `paddingTop` on THIS box rather than by `top: calc(100% + 6px)`, so the six
 * pixels between handle and card belong to the overlay too. Pointer events on
 * this element are `all` (it renders through the host's `PointerEvents`), which
 * is what makes the host treat a pointer crossing that strip as "still on
 * overlay chrome" rather than as a leave.
 */
export const handleAnchor: CSSProperties = {
  position: 'absolute',
  right: 0,
  top: '100%',
  paddingTop: '6px',
  zIndex: 3,
};

/**
 * The two floating cards are real <dialog open> elements, which is what makes a
 * keydown handler on them honest markup rather than a div pretending. A dialog
 * carries user-agent styles though (absolute position, auto margins, 1em
 * padding, a solid border), so every card below resets them explicitly. Miss one
 * and the card lands somewhere the handle is not.
 */
const dialogReset: CSSProperties = {
  position: 'static',
  inset: 'auto',
  display: 'block',
  margin: 0,
  padding: 0,
  height: 'auto',
  maxHeight: 'none',
};

/** The band card itself: a small labelled card, not a bare row of dots. */
export const panel: CSSProperties = {
  ...dialogReset,
  width: '216px',
  maxWidth: 'calc(100vw - 24px)',
  borderRadius: '12px',
  background: TOOL.paper,
  border: `1px solid ${TOOL.line}`,
  boxShadow: TOOL.shadow,
  font: `500 13px/1.4 ${TOOL.font}`,
  color: TOOL.ink,
  textAlign: 'left',
  overflow: 'hidden',
};

/** The card's title bar: what this is, and the way out of it. */
export const panelHead: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '8px 8px 8px 10px',
  borderBottom: `1px solid ${TOOL.line}`,
};

/** The close button. Square, quiet, and big enough to hit. */
export const closeButton: CSSProperties = {
  appearance: 'none',
  border: '1px solid transparent',
  background: 'transparent',
  color: TOOL.muted,
  borderRadius: '6px',
  width: '24px',
  height: '24px',
  lineHeight: 1,
  padding: 0,
  cursor: 'pointer',
  font: `700 13px/1 ${TOOL.font}`,
  flex: '0 0 auto',
};

/** One choice: a colour dot, its name, and a tick when it is the current one. */
export function optionRow(selected: boolean, hovered: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    boxSizing: 'border-box',
    padding: '6px 10px',
    appearance: 'none',
    border: 'none',
    borderLeft: `3px solid ${selected ? TOOL.brand : 'transparent'}`,
    background: hovered ? 'rgba(1, 69, 126, 0.07)' : 'transparent',
    color: TOOL.ink,
    font: `${selected ? 700 : 500} 13px/1.3 ${TOOL.font}`,
    textAlign: 'left',
    cursor: 'pointer',
  };
}

/**
 * The dot inside an option row. Split-filled: light value over dark value, so a
 * band that changes with the site theme LOOKS like it does.
 */
export function optionDot(band: { dot: string; dotDark: string }): CSSProperties {
  return {
    width: '16px',
    height: '16px',
    borderRadius: '999px',
    border: `1px solid ${TOOL.line}`,
    background:
      band.dot === band.dotDark
        ? band.dot
        : `linear-gradient(135deg, ${band.dot} 0 50%, ${band.dotDark} 50% 100%)`,
    flex: '0 0 auto',
  };
}

/** A card that opens from a control: the word picker, the text editor. */
export const card: CSSProperties = {
  ...dialogReset,
  minWidth: '240px',
  maxWidth: 'min(420px, calc(100vw - 32px))',
  padding: '12px',
  borderRadius: '12px',
  background: TOOL.paper,
  border: `1px solid ${TOOL.line}`,
  boxShadow: TOOL.shadow,
  font: `500 13px/1.45 ${TOOL.font}`,
  color: TOOL.ink,
  textAlign: 'left',
};

/** A plain text button, used for every label in the layer. */
export const button: CSSProperties = {
  appearance: 'none',
  border: `1px solid ${TOOL.line}`,
  background: TOOL.paper,
  color: TOOL.ink,
  borderRadius: '999px',
  padding: '4px 10px',
  font: `700 12px/1.2 ${TOOL.font}`,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

/** The same button, filled, for the one primary action on a card. */
export const primaryButton: CSSProperties = {
  ...button,
  background: TOOL.brand,
  color: TOOL.paper,
  borderColor: TOOL.brand,
};

/** Small muted caption text inside a bar or a card. */
export const caption: CSSProperties = {
  font: `700 10px/1.2 ${TOOL.font}`,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: TOOL.muted,
};

/** The editing surface in the text card: textarea and contenteditable alike. */
export const field: CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  minHeight: '64px',
  maxHeight: '40vh',
  overflowY: 'auto',
  padding: '8px 10px',
  borderRadius: '8px',
  border: `1px solid ${TOOL.line}`,
  background: TOOL.paper,
  color: TOOL.ink,
  font: `500 14px/1.5 ${TOOL.font}`,
  resize: 'none',
  outline: 'none',
};
