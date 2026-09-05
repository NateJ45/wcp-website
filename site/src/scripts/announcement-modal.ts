// ============================================================================
// Announcement popup — open once per chosen frequency, accessible dialog
// ============================================================================
// The single top-priority popup is server-rendered hidden (AnnouncementModal
// .astro, tagged data-ann-modal with id/version/frequency). This opens it based
// on `frequency`:
//   - once    : per visitor (localStorage), until the version stamp changes.
//   - session : once per browser session (sessionStorage).
//   - always  : every page load.
// Close (X, backdrop, Esc, or clicking the CTA) records it as seen. Focus moves
// in on open, is trapped, and returns on close; body scroll locks. Mirrors the
// note-modal a11y behavior.
// ============================================================================
import { onPageLoad, onBeforeSwap } from './_page-load';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openTimer: ReturnType<typeof setTimeout> | null = null;
let lastFocused: HTMLElement | null = null;

function root(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-ann-modal]');
}
function isOpen(): boolean {
  const el = root();
  return Boolean(el && !el.hidden);
}

function store(el: HTMLElement): Storage | null {
  const freq = el.dataset.annFrequency ?? 'once';
  try {
    if (freq === 'once') return window.localStorage;
    if (freq === 'session') return window.sessionStorage;
  } catch {
    return null;
  }
  return null; // 'always' — never records
}
function seenKey(el: HTMLElement): string {
  return `wcp-annpopup-${el.dataset.annId ?? 'x'}`;
}

function open() {
  const el = root();
  if (!el || !el.hidden) return;
  lastFocused = document.activeElement as HTMLElement | null;
  el.hidden = false;
  document.documentElement.classList.add('overflow-hidden');
  el.querySelector<HTMLElement>('[data-ann-modal-close]:not(div)')?.focus();
}

function close() {
  const el = root();
  if (!el || el.hidden) return;
  el.hidden = true;
  document.documentElement.classList.remove('overflow-hidden');
  const s = store(el);
  try {
    s?.setItem(seenKey(el), el.dataset.annVersion ?? 'v1');
  } catch {
    /* private mode — show again next time, fine */
  }
  lastFocused?.focus();
}

function init() {
  const el = root();
  if (!el) return;

  el.querySelectorAll<HTMLElement>('[data-ann-modal-close]').forEach((btn) =>
    btn.addEventListener('click', close),
  );
  // Clicking the call-to-action also counts as "seen" so it won't nag again.
  el.querySelector<HTMLElement>('[data-ann-modal-cta]')?.addEventListener('click', () => {
    const s = store(el);
    try {
      s?.setItem(seenKey(el), el.dataset.annVersion ?? 'v1');
    } catch {
      /* ignore */
    }
  });

  const s = store(el);
  let seen: string | null = null;
  try {
    seen = s ? s.getItem(seenKey(el)) : null;
  } catch {
    seen = null;
  }
  const alreadySeen = s !== null && seen === (el.dataset.annVersion ?? 'v1');
  if (!alreadySeen) openTimer = setTimeout(open, 800);
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

