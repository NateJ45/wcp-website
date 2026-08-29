// =============================================================================
// SectionStyleCard — the band card that opens off the handle (2026-08-28)
// =============================================================================
// "Change how this band looks" already exists as a form: open the section, find
// Background, click a radio. This is the same four bands offered in the corner
// of the band itself, so the gesture is look-at-the-band then click-the-colour,
// instead of look-at-the-band, find its row in the list, open it, click the
// radio, look back.
//
// It is the SAME registry either way (src/lib/section-fields.ts, whose drift
// gate reads the schema), so there is no second list of colours to go stale.
//
// GATING, TWICE. Not every section has a band: `ctaSection` calls its band
// `tone` and offers only two colours, `noticeBarSection` is a thin strip, and
// `statBandSection` has no band FIELD at all. The overlay cannot ask the Studio
// which fields a type has, so the section's `_type` is read from the document
// snapshot and checked against the registry. Then, PER INSTANCE: a section that
// holds no content of its own renders in preview as the dashed coaching note,
// which is a plain <div> with no band to recolour, so the card refuses that too.
//
// -----------------------------------------------------------------------------
// WHY THE CARD KEEPS ITS OWN OPEN STATE
// -----------------------------------------------------------------------------
// A card drawn only while the host says `focused` vanishes while the editor
// moves the mouse toward it. `focused` is not ours to lean on: the host clears
// it on `overlay/blur` (any click that is not on overlay chrome, and any
// Escape) and RECOMPUTES it on every `presentation/focus` the Studio sends
// back, keeping it only for the element whose path matches the Studio's focus
// path exactly. So the moment the Studio's form focus settles anywhere other
// than this exact band field, which it does on its own a beat after the click,
// the card would disappear mid-gesture.
//
// What the host does NOT do is unmount us for that: it renders an element's
// overlay for `activated || focused`, and `activated` means "in the viewport".
// The handle is pinned to the top-right of the band the editor is looking at, so
// it stays activated and this component stays MOUNTED with its state intact.
//
// Hence: `focused` turning truthy OPENS the card, and only our own three
// gestures close it (the close button, Escape, or a pointer press outside). The
// card is also anchored flush to the handle, so the pointer never crosses
// unowned pixels on the way to a row.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import type { OverlayComponentProps } from '@sanity/visual-editing';
import {
  BAND_BY_VALUE,
  SECTION_ARRAY_FIELDS,
  bandApplies,
  bandChoicesFor,
  bandFieldFor,
  storedBand,
} from '@/lib/section-fields';
import { readSectionPath, sectionByKey } from '@/lib/sanity-path';
import { setAt, useDraftDocument } from './useDraftDocument.ts';
import { usePopover } from './usePopover.ts';
import {
  TOOL,
  closeButton,
  handleAnchor,
  optionDot,
  optionRow,
  panel,
  panelHead,
} from './styles.ts';
import { TOOL_ACCENT, dialogReset } from './tool-theme.ts';

/**
 * A band's swatch, split-filled: light value over dark value, so a band that
 * changes with the site theme LOOKS like it does.
 *
 * The canonical `optionDot` takes a finished CSS background string, which is
 * what lets one shared style carry a repo whose swatches are two-toned and a
 * repo whose swatches are flat. This is the half that is ours.
 */
function dotFill(band: { dot: string; dotDark: string }): string {
  return band.dot === band.dotDark
    ? band.dot
    : `linear-gradient(135deg, ${band.dot} 0 50%, ${band.dotDark} 50% 100%)`;
}

interface Chosen {
  type: string;
  /** The raw section item, for the per-instance gate. */
  raw: Record<string, unknown> | null;
  /** The band it currently wears, or '' when it has never been set. */
  band: string;
}

/** Class tokens, deduped, from a registry entry's `className`. */
function tokensOf(className: string | null | undefined): string[] {
  return (className ?? '').split(/\s+/).filter(Boolean);
}

/**
 * The <section> the handle belongs to. SectionRenderer renders the handle as the
 * last child of the preview-only wrapper whose other child is the band itself,
 * so the band is the wrapper's first <section>. Null when the shape is anything
 * else, which simply turns the optimistic recolour off.
 */
function bandFor(handle: Element): HTMLElement | null {
  return handle.parentElement?.querySelector('section') ?? null;
}

/**
 * Swap one band's class list for another on the band, so it recolours on click
 * rather than on the soft refresh a second later. Returns an undo, or null when
 * the band is NOT wearing the classes we expected — a section painting something
 * we did not predict must be left alone rather than half-rewritten.
 */
function applyClasses(
  band: HTMLElement | null,
  from: string | null | undefined,
  to: string | null | undefined,
): (() => void) | null {
  if (!band) return null;
  const remove = tokensOf(from);
  const add = tokensOf(to);
  if (remove.some((cls) => !band.classList.contains(cls))) return null;
  band.classList.remove(...remove);
  band.classList.add(...add);
  return () => {
    band.classList.remove(...add);
    band.classList.add(...remove);
  };
}

export default function SectionStyleCard(props: OverlayComponentProps): React.ReactNode {
  const { node, PointerEvents, focused, element } = props;
  const section = readSectionPath(node.path, SECTION_ARRAY_FIELDS);
  const key = section?.key;
  const array = section?.array;
  const { read, write } = useDraftDocument(node.id);
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const cardRef = useRef<HTMLDialogElement>(null);
  // The card only exists once the document read has told us this section HAS a
  // band, so the autofocus that makes Escape reachable has to wait for it.
  const showing = open && !!section && !!chosen && bandApplies(chosen.type, chosen.raw);
  const { onKeyDown } = usePopover(showing, cardRef, () => setOpen(false));

  // One read on open. Every later value is the one this card just set, so the
  // tick moves the instant it is clicked rather than after a round trip.
  useEffect(() => {
    if (!key || !array) return undefined;
    let alive = true;
    void read().then((doc) => {
      if (!alive || !doc) return;
      const found = sectionByKey(doc, array, key);
      const type = typeof found?._type === 'string' ? found._type : '';
      setChosen({ type, raw: found, band: storedBand(type, found) });
    });
    return () => {
      alive = false;
    };
  }, [read, key, array]);

  // Clicking the handle is what selects this node, so the host telling us we
  // just became focused IS the open gesture. Only the TRANSITION opens: a later
  // `presentation/focus` for some other path drops `focused` again and must not
  // take the card with it.
  const wasFocused = useRef(false);
  useEffect(() => {
    if (focused && !wasFocused.current) setOpen(true);
    wasFocused.current = !!focused;
  }, [focused]);

  // Our own outside-press close, so the host's blur cannot do it for us. A press
  // on the handle re-opens rather than closes: `focused` is already true by
  // then, so the effect above would never fire a second time.
  useEffect(() => {
    if (!open) return undefined;
    const doc = element.ownerDocument;
    const onPointerDown = (event: Event) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (element.contains(target)) {
        setOpen(true);
        return;
      }
      if (cardRef.current?.contains(target)) return;
      setOpen(false);
    };
    doc.addEventListener('pointerdown', onPointerDown, true);
    return () => doc.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, element]);

  if (!showing || !section || !chosen) return null;

  const field = bandFieldFor(chosen.type);
  const choices = bandChoicesFor(chosen.type);
  if (!field || choices.length === 0) return null;

  const choose = (value: string) => {
    if (chosen.band === value) return;
    // Recolour the band NOW, reconcile behind. The soft refresh that follows the
    // patch re-renders the section from the draft and replaces these classes
    // with the real ones. If the patch never lands, the undo puts them back.
    const undo = applyClasses(
      bandFor(element),
      BAND_BY_VALUE[chosen.band]?.className,
      BAND_BY_VALUE[value]?.className,
    );
    const previous = chosen.band;
    setChosen((current) => (current ? { ...current, band: value } : current));
    void write(setAt([...section.itemPath, field], value)).then((ok) => {
      if (ok) return;
      undo?.();
      setChosen((current) => (current ? { ...current, band: previous } : current));
    });
  };

  return (
    <PointerEvents style={handleAnchor}>
      {/* A real <dialog>, so Escape and the focus trap live on the element they
          belong to. The rule below cannot see that a dialog is where a keydown
          handler goes; styles.ts resets its user-agent layout. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        open
        ref={cardRef}
        aria-label="Band colour"
        tabIndex={-1}
        style={{ ...panel, ...dialogReset }}
        onKeyDown={onKeyDown}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={panelHead}>
          <span style={{ font: `700 12px/1.2 ${TOOL.font}` }}>Band colour</span>
          <button
            type="button"
            style={closeButton}
            aria-label="Close"
            title="Close"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
            }}
          >
            ✕
          </button>
        </div>

        {choices.map((band) => {
          const selected = chosen.band === band.value;
          return (
            <button
              key={band.value}
              type="button"
              title={band.hint}
              aria-pressed={selected}
              style={{
                ...optionRow(selected, hovered === band.value),
                borderLeftColor: selected ? TOOL_ACCENT : 'transparent',
              }}
              onMouseEnter={() => setHovered(band.value)}
              onMouseLeave={() => setHovered((was) => (was === band.value ? null : was))}
              onFocus={() => setHovered(band.value)}
              onBlur={() => setHovered((was) => (was === band.value ? null : was))}
              onClick={(event) => {
                event.stopPropagation();
                choose(band.value);
              }}
            >
              <span aria-hidden="true" style={optionDot(dotFill(band))} />
              <span style={{ flex: 1, minWidth: 0 }}>{band.title}</span>
              <span aria-hidden="true" style={{ color: TOOL_ACCENT, width: '10px' }}>
                {selected ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </dialog>
    </PointerEvents>
  );
}
