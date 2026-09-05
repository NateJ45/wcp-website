// ============================================================================
// Note modal — first-visit welcome letters (President's note, teacher notes)
// ============================================================================
// The modal markup is server-rendered hidden (PresidentNoteModal.astro /
// TeacherNoteModal.astro tag it `data-note-modal` with a per-note
// `data-storage-key` + `data-version`); this opens it once per version stamp.
// Closing (X, backdrop, or Esc) remembers the dismissed version in
// localStorage under that key, so the note stays gone until the Board bumps
// `version` in the Studio. Focus moves to the close button on open, is
// trapped inside while open, and returns to the previous element on close.
// Body scroll locks while open. One modal per page (home = president's,
// class pages = that teacher's).
//
// View-Transitions safe: element listeners re-bind on astro:page-load, the
// document Esc/Tab handler binds once and re-queries live nodes, and the
// open-delay timer is cleared before every swap.
// ============================================================================
import { onPageLoad, onBeforeSwap } from './_page-load';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openTimer: ReturnType<typeof setTimeout> | null = null;
let lastFocused: HTMLElement | null = null;

function root(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-note-modal]');
}

function isOpen(): boolean {
  const el = root();
  return Boolean(el && !el.hidden);
}

// The signature script font loads HERE, when a note actually OPENS — never as
// page CSS. A static (or even dynamic) CSS import of @fontsource/great-vibes
// ends up as a render-blocking stylesheet on every hub-home/class visit for a
// font only this modal uses (Lighthouse, 2026-07-14), so we register the face
// through the FontFace API with just the hashed woff2 URL. Browsers without
// FontFace (none we support) simply keep the cursive fallback.
import greatVibesWoff2 from '@fontsource/great-vibes/files/great-vibes-latin-400-normal.woff2?url';
let signatureFontRequested = false;
function ensureSignatureFont() {
  if (signatureFontRequested || typeof FontFace === 'undefined') return;
  signatureFontRequested = true;
  const face = new FontFace('Great Vibes', `url(${greatVibesWoff2}) format('woff2')`, {
    style: 'normal',
    weight: '400',
    display: 'swap',
  });
  face
    .load()
    .then((loaded) => document.fonts.add(loaded))
    .catch(() => {
      /* fallback font stays — the note is still fully readable */
    });
}

function open() {
  const el = root();
  if (!el || !el.hidden) return;
  ensureSignatureFont();
  lastFocused = document.activeElement as HTMLElement | null;
  el.hidden = false;
  document.documentElement.classList.add('overflow-hidden');
  el.querySelector<HTMLElement>('[data-note-close]:not(div)')?.focus();
}

function close() {
  const el = root();
  if (!el || el.hidden) return;
  el.hidden = true;
  document.documentElement.classList.remove('overflow-hidden');
  try {
    localStorage.setItem(el.dataset.storageKey ?? 'wcp-note-seen', el.dataset.version ?? '');
  } catch {
    /* private browsing — show again next visit, fine */
  }
  lastFocused?.focus();
  // The first-visit tour (hub-tour.ts) waits for this before it opens: the
  // President speaks first, the tour guide second.
  document.dispatchEvent(new CustomEvent('wcp:note-closed'));
}

function init() {
  const el = root();
  if (!el) return;

  el.querySelectorAll<HTMLElement>('[data-note-close]').forEach((btn) => {
    btn.addEventListener('click', close);
  });

  // Reopen affordances: pages with a note render a HIDDEN "[data-note-open]"
  // pill (hero chip on home, teacher-card action on class pages) so a family
  // can re-read a dismissed letter any time. Unhidden only when the modal is
  // actually on the page and JS is running — without JS the modal can't open,
  // so the pill stays hidden (consistent, not broken).
  document.querySelectorAll<HTMLElement>('[data-note-open]').forEach((btn) => {
    btn.hidden = false;
    btn.closest<HTMLElement>('[data-note-open-wrap]')?.removeAttribute('hidden');
    btn.addEventListener('click', open);
  });

  let seen: string | null = null;
  try {
    seen = localStorage.getItem(el.dataset.storageKey ?? 'wcp-note-seen');
  } catch {
    seen = null;
  }
  if (seen !== (el.dataset.version ?? '')) {
    // A beat after load, so the page paints first.
    openTimer = setTimeout(open, 700);
  }
}

let globalsBound = false;
function bindGlobals() {
  if (globalsBound) return;
  globalsBound = true;
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    // Trap Tab inside the open dialog.
    const dialog = root()?.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null,
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
