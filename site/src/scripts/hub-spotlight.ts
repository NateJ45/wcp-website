// ============================================================================
// hub-spotlight — the Board's spotlight pop-up, opened once per visit
// ============================================================================
// HubSpotlightModal.astro server-renders ONE hidden modal holding one PAGE per
// live spotlight, in the Board's drag order. This opens it at the first page
// this browser has not seen, and pages back and forth with the arrows.
//
// ORDERING — a family never meets two modals in one page load:
//   1. The President's note speaks first (hub home, note-modal.ts).
//   2. The first-visit tour follows it (hub home, hub-tour.ts).
//   3. The spotlight opens ONLY when neither of those is due on this page load.
// So on a family's very first visit they get the note and the tour; the
// spotlight greets them on their next hub page load. On every other hub page
// there is no note and no tour, so the spotlight opens straight away.
//
// SEEN, per spotlight, on DISPLAY: a page is marked seen the moment a family
// actually looks at it, not when the modal closes. So closing after reading 2
// of 3 leaves the third to greet them next visit, and a Board that bumps one
// spotlight's version stamp resurfaces exactly that one. The marks live in one
// localStorage key as `{ spotlightId: version }` — device-local, like the whole
// hub app layer.
//
// A11y: focus moves to the close button, Tab is trapped inside, Esc closes,
// focus returns to where it was, body scroll locks while open (a long rich
// body scrolls INSIDE the box). Left/Right arrow keys page. The counter is
// aria-live, and the dialog's label follows the visible page's heading, so a
// screen reader hears which notice it moved to. Focus stays on the arrow the
// family pressed. No swipe: gesture handling is not worth hand-rolling here,
// and the arrows are large touch targets.
// ============================================================================
import { onPageLoad, onBeforeSwap } from './_page-load';
import { SPOTLIGHT_SEEN_KEY } from '@/lib/hub-spotlight';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openTimer: ReturnType<typeof setTimeout> | null = null;
let lastFocused: HTMLElement | null = null;
let index = 0;

const root = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-spotlight-modal]');

const isOpen = (): boolean => {
  const el = root();
  return Boolean(el && !el.hidden);
};

function pages(el: HTMLElement): HTMLElement[] {
  return [...el.querySelectorAll<HTMLElement>('[data-spotlight-page]')];
}

function seenMap(): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(SPOTLIGHT_SEEN_KEY) ?? '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

/** Remember that this family has now looked at this spotlight. */
function markSeen(page: HTMLElement): void {
  try {
    const seen = seenMap();
    seen[page.dataset.spotlightId ?? ''] = page.dataset.spotlightVersion ?? '';
    localStorage.setItem(SPOTLIGHT_SEEN_KEY, JSON.stringify(seen));
  } catch {
    /* private browsing — it shows again next visit, which is fine */
  }
}

/** The first page whose spotlight this browser has not seen, or -1. */
function firstUnseen(el: HTMLElement): number {
  const seen = seenMap();
  return pages(el).findIndex(
    (p) => seen[p.dataset.spotlightId ?? ''] !== (p.dataset.spotlightVersion ?? ''),
  );
}

function show(next: number): void {
  const el = root();
  if (!el) return;
  const all = pages(el);
  if (all.length === 0) return;
  index = Math.max(0, Math.min(next, all.length - 1));

  all.forEach((p, i) => {
    p.hidden = i !== index;
    // The dialog's label must name the notice a family is actually reading.
    const h = p.querySelector<HTMLElement>('[data-spotlight-title]');
    if (!h) return;
    if (i === index) h.id = 'spotlight-heading';
    else h.removeAttribute('id');
  });

  const prev = el.querySelector<HTMLButtonElement>('[data-spotlight-prev]');
  if (prev) prev.disabled = index === 0;
  const nextBtn = el.querySelector<HTMLButtonElement>('[data-spotlight-next]');
  if (nextBtn) nextBtn.disabled = index === all.length - 1;
  const progress = el.querySelector<HTMLElement>('[data-spotlight-progress]');
  if (progress) progress.textContent = `${index + 1} of ${all.length}`;

  // A new notice starts at its own top, not at the scroll position of the
  // one before it.
  el.querySelector<HTMLElement>('[data-spotlight-scroller]')?.scrollTo({ top: 0 });
  markSeen(all[index]);
}

function open(at: number): void {
  const el = root();
  if (!el || !el.hidden) return;
  lastFocused = document.activeElement as HTMLElement | null;
  el.hidden = false;
  document.documentElement.classList.add('overflow-hidden');
  show(at);
  el.querySelector<HTMLElement>('button[data-spotlight-close]')?.focus();
}

function close(): void {
  const el = root();
  if (!el || el.hidden) return;
  el.hidden = true;
  document.documentElement.classList.remove('overflow-hidden');
  lastFocused?.focus();
}

/** Is another pop-up due on this page load? The note and the tour go first. */
function otherPopupDue(): boolean {
  const note = document.querySelector<HTMLElement>('[data-note-modal]');
  const tour = document.querySelector<HTMLElement>('[data-tour-modal]');
  try {
    if (
      note &&
      localStorage.getItem(note.dataset.storageKey ?? 'wcp-note-seen') !==
        (note.dataset.version ?? '')
    ) {
      return true;
    }
    if (tour && localStorage.getItem('wcp-tour-seen') !== (tour.dataset.tourVersion ?? '')) {
      return true;
    }
  } catch {
    // No storage: the note and the tour both decline to auto-open, so a
    // spotlight may go ahead.
    return false;
  }
  return false;
}

function init(): void {
  const el = root();
  if (!el) return;

  el.querySelectorAll<HTMLElement>('[data-spotlight-close]').forEach((btn) =>
    btn.addEventListener('click', close),
  );
  el.querySelector<HTMLElement>('[data-spotlight-prev]')?.addEventListener('click', () =>
    show(index - 1),
  );
  el.querySelector<HTMLElement>('[data-spotlight-next]')?.addEventListener('click', () =>
    show(index + 1),
  );

  // The bell links here (2026-08-29): a #spotlight-<id> hash opens the modal
  // at that notice, SEEN OR NOT - the pop-up greets a family once, the bell is
  // the way back while it runs. The hash is consumed (replaceState) so Back
  // does not re-trigger it, and a hash for a spotlight that has since gone
  // dark simply does nothing. Same-page bell clicks arrive as hashchange.
  const openFromHash = (): boolean => {
    const id = /^#spotlight-(.+)$/.exec(location.hash)?.[1];
    if (!id) return false;
    const at = pages(el).findIndex((pg) => pg.dataset.spotlightId === decodeURIComponent(id));
    history.replaceState(null, '', location.pathname + location.search);
    if (at < 0) return false;
    if (isOpen()) show(at);
    else open(at);
    return true;
  };
  window.addEventListener('hashchange', openFromHash);
  if (openFromHash()) return;

  if (otherPopupDue()) return;
  const at = firstUnseen(el);
  if (at < 0) return;
  // A beat after load, so the page paints first. Later than the note (700ms)
  // and the tour (900ms) on purpose, so a race can never stack two modals.
  openTimer = setTimeout(() => open(at), 1100);
}

let globalsBound = false;
function bindGlobals(): void {
  if (globalsBound) return;
  globalsBound = true;
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const el = root();
      if (!el || pages(el).length < 2) return;
      e.preventDefault();
      show(index + (e.key === 'ArrowRight' ? 1 : -1));
      return;
    }
    if (e.key !== 'Tab') return;
    const dialog = root()?.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (n) => n.offsetParent !== null,
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

onBeforeSwap(() => {
  if (openTimer) clearTimeout(openTimer);
  openTimer = null;
  document.documentElement.classList.remove('overflow-hidden');
});

onPageLoad(() => {
  init();
  bindGlobals();
});
