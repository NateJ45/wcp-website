// =============================================================================
// HeadingAccentPicker — pick the underlined word by clicking it (2026-08-28)
// =============================================================================
// The guide's own steps for the underlined word are: write the heading, copy one
// word out of it into a box, and "if nothing changes, the word is not in the
// heading, so check the spelling". Three steps, one of which is a warning about
// a typo. Clicking the word removes all three: the stored value is a slice of
// the heading by construction, so it cannot miss.
//
// THE PAGE DOM IS NEVER TOUCHED. The words are redrawn INSIDE the card as
// buttons, from the heading as the document stores it. Splitting the real
// heading element into spans would mean editing the rendered page from an
// overlay, and the rendered page is the thing being previewed.
//
// Clicking the word that is already underlined clears it, which is the same
// gesture as un-bolding: press the thing that is on to turn it off.
//
// The word splitting, and the rule that a word too long for the crayon
// underline is not offered at all, live in src/lib/emphasis.ts beside the
// matcher they have to agree with.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import type { OverlayComponentProps } from '@sanity/visual-editing';
import { isAccentedWord, splitHeadingWords } from '@/lib/emphasis';
import { resolveAccentTarget, type AccentTarget } from '@/lib/section-fields';
import { valueAtPath } from '@/lib/sanity-path';
import { setAt, setInside, unsetAt, useDraftDocument } from './useDraftDocument.ts';
import { usePopover } from './usePopover.ts';
import { TOOL, bar, button, card, caption } from './styles.ts';
import { TOOL_ACCENT, dialogReset } from './tool-theme.ts';

interface Loaded {
  target: AccentTarget;
  heading: string;
  accent: string;
}

export default function HeadingAccentPicker(props: OverlayComponentProps): React.ReactNode {
  const { node, PointerEvents, element, focused } = props;
  const { read, write } = useDraftDocument(node.id);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { onKeyDown } = usePopover(open, cardRef, () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  });

  useEffect(() => {
    let alive = true;
    void read().then((doc) => {
      if (!alive || !doc) return;
      const target = resolveAccentTarget(doc, node.path);
      if (!target) {
        setLoaded(null);
        return;
      }
      const stored = valueAtPath(doc, target.headingPath);
      const accent = valueAtPath(doc, target.accentPath);
      setLoaded({
        target,
        // The STORED heading, not the rendered one: no stega, and no underline
        // markup already applied. The element's own text is the fallback for a
        // heading rendering something the document does not hold.
        heading: typeof stored === 'string' && stored !== '' ? stored : (element.textContent ?? ''),
        accent: typeof accent === 'string' ? accent : '',
      });
    });
    return () => {
      alive = false;
    };
  }, [read, node.path, element]);

  // Selected, not merely on screen: `activated` in this host means "in the
  // viewport", so an ungated control would appear on every heading at once.
  if (!focused || !loaded) return null;

  const tokens = splitHeadingWords(loaded.heading);
  if (!tokens.some((t) => t.word)) return null;

  const choose = (value: string, clearing: boolean) => {
    setLoaded((current) => (current ? { ...current, accent: clearing ? '' : value } : current));
    const path = loaded.target.accentPath;
    if (clearing) {
      void write(unsetAt(path));
    } else if (path.length > 1 && path[path.length - 2] === 'header') {
      // The accent lives INSIDE the shared header object, which a section that
      // has never had a heading typed into it does not have yet. Create it on
      // the way in, exactly as the form would.
      void write(setInside(path.slice(0, -1), String(path[path.length - 1]), value));
    } else {
      void write(setAt(path, value));
    }
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <PointerEvents style={bar}>
        <button
          ref={triggerRef}
          type="button"
          style={button}
          aria-expanded={open}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((was) => !was);
          }}
        >
          {loaded.accent ? 'Change the underlined word' : 'Underline a word'}
        </button>
      </PointerEvents>

      {open && (
        <PointerEvents style={{ position: 'absolute', right: '8px', top: '100%', zIndex: 2 }}>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <dialog
            open
            ref={cardRef}
            aria-label="Choose a word to underline"
            tabIndex={-1}
            style={{ ...card, ...dialogReset }}
            onKeyDown={onKeyDown}
            onClick={(event) => event.stopPropagation()}
          >
            <p style={{ ...caption, margin: '0 0 8px' }}>Click a word</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', alignItems: 'baseline' }}>
              {tokens.map((token, i) =>
                token.word ? (
                  <button
                    key={i}
                    type="button"
                    style={{
                      ...button,
                      padding: '2px 6px',
                      font: `700 14px/1.4 ${TOOL.font}`,
                      background: isAccentedWord(token, loaded.accent) ? TOOL_ACCENT : TOOL.paper,
                      color: isAccentedWord(token, loaded.accent) ? TOOL.paper : TOOL.ink,
                      borderColor: isAccentedWord(token, loaded.accent) ? TOOL_ACCENT : TOOL.line,
                    }}
                    aria-pressed={isAccentedWord(token, loaded.accent)}
                    onClick={(event) => {
                      event.stopPropagation();
                      choose(token.value, isAccentedWord(token, loaded.accent));
                    }}
                  >
                    {token.text}
                  </button>
                ) : (
                  <span key={i} aria-hidden="true" style={{ width: '2px' }} />
                ),
              )}
            </div>
            <p style={{ margin: '10px 0 0', color: TOOL.muted, fontSize: '12px' }}>
              {loaded.accent
                ? 'Click the underlined word again to make the heading plain.'
                : 'One word per heading. It gets the amber crayon underline.'}
            </p>
          </dialog>
        </PointerEvents>
      )}
    </>
  );
}
