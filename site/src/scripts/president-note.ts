// ============================================================================
// President's note — first-visit welcome modal on the Family Hub home
// ============================================================================
// The modal markup is server-rendered hidden (PresidentNoteModal.astro); this
// opens it once per version stamp. Closing (X, backdrop, or Esc) remembers
// the dismissed version in localStorage, so the note stays gone until the
// Board bumps `version` in the Studio. Focus moves to the close button on
// open, is trapped inside while open, and returns to the previous element on
// close. Body scroll locks while open.
//
// View-Transitions safe: element listeners re-bind on astro:page-load, the
// document Esc/Tab handler binds once and re-queries live nodes, and the
// open-delay timer is cleared before every swap.
// ============================================================================
import { onPageLoad, onBeforeSwap } from './_page-load';

const KEY = 'wcp-president-note-seen';
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openTimer: ReturnType<typeof setTimeout> | null = null;
let lastFocused: HTMLElement | null = null;

function root(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-president-note]');
}

function isOpen(): boolean {
  const el = root();
  return Boolean(el && !el.hidden);
}

function open() {
  const el = root();
  if (!el || !el.hidden) return;
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
    localStorage.setItem(KEY, el.dataset.version ?? '');
  } catch {
    /* private browsing — show again next visit, fine */
  }
  lastFocused?.focus();
}

function init() {
  const el = root();
  if (!el) return;

  el.querySelectorAll<HTMLElement>('[data-note-close]').forEach((btn) => {
    btn.addEventListener('click', close);
  });

  let seen: string | null = null;
  try {
    seen = localStorage.getItem(KEY);
  } catch {
    seen = null;
  }
  if (seen !== (el.dataset.version ?? '')) {
    // A beat after load, so the dashboard paints first.
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

export {};
