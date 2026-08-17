// ============================================================================
// hub-tour — opens the first-visit tour and runs its steps
// ============================================================================
// The modal markup is server-rendered hidden (HubTourModal.astro, hub home
// only). This script opens it once per version stamp:
//   - The President's note is due: wait for its close event (note-modal.ts
//     dispatches `wcp:note-closed`), then open.
//   - No note on the page, or the note was seen before: open after a beat.
// Any close (Skip, Done, X, backdrop, Esc) stores the version under
// `wcp-tour-seen`. The greeting hero's "[data-tour-open]" chip reopens it.
//
// Step 3 has class-picker chips. They write the same `wcp-my-classes` key as
// the home picker and dispatch the same `wcp:my-classes` event, so the home
// tiles personalize the moment the tour closes. Focus is trapped while open;
// Esc closes; focus returns to the opener. Body scroll locks while open.
// ============================================================================
import { onPageLoad, onBeforeSwap } from '@/scripts/_page-load';

const SEEN_KEY = 'wcp-tour-seen';
const PICKS_KEY = 'wcp-my-classes';
const CLASS_ORDER = ['twos', 'threes', 'pre-k-am', 'pre-k-pm'];
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openTimer: ReturnType<typeof setTimeout> | null = null;
let lastFocused: HTMLElement | null = null;
let step = 0;

const root = (): HTMLElement | null => document.querySelector<HTMLElement>('[data-tour-modal]');
const isOpen = (): boolean => {
  const el = root();
  return Boolean(el && !el.hidden);
};

function steps(el: HTMLElement): HTMLElement[] {
  return [...el.querySelectorAll<HTMLElement>('[data-tour-step]')];
}

function showStep(index: number): void {
  const el = root();
  if (!el) return;
  const all = steps(el);
  step = Math.max(0, Math.min(index, all.length - 1));

  for (const s of all) s.hidden = Number(s.dataset.tourStep) !== step;
  // The dialog label follows the visible step's heading.
  for (const s of all) {
    const h = s.querySelector('h2');
    if (h) {
      if (s.hidden) h.removeAttribute('id');
      else h.id = 'tour-title';
    }
  }
  for (const dot of el.querySelectorAll<HTMLElement>('[data-tour-dot]')) {
    if (Number(dot.dataset.tourDot) === step) dot.setAttribute('data-active', '');
    else dot.removeAttribute('data-active');
  }
  const back = el.querySelector<HTMLElement>('[data-tour-back]');
  if (back) back.hidden = step === 0;
  const next = el.querySelector<HTMLElement>('[data-tour-next]');
  if (next) next.textContent = step === all.length - 1 ? 'Done' : 'Next';
  const skip = el.querySelector<HTMLElement>('[data-tour-skip]');
  if (skip) skip.hidden = step === all.length - 1;
  const live = el.querySelector<HTMLElement>('[data-tour-progress]');
  if (live) live.textContent = `Step ${step + 1} of ${all.length}`;
}

function open(): void {
  const el = root();
  if (!el || !el.hidden) return;
  lastFocused = document.activeElement as HTMLElement | null;
  el.hidden = false;
  document.documentElement.classList.add('overflow-hidden');
  showStep(0);
  syncChips();
  el.querySelector<HTMLElement>('[data-tour-next]')?.focus();
}

function close(): void {
  const el = root();
  if (!el || el.hidden) return;
  el.hidden = true;
  document.documentElement.classList.remove('overflow-hidden');
  try {
    localStorage.setItem(SEEN_KEY, el.dataset.tourVersion ?? '');
  } catch {
    /* private browsing — the tour shows again next visit, fine */
  }
  lastFocused?.focus();
}

// --- The class-picker step ---------------------------------------------------

function getPicks(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PICKS_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return CLASS_ORDER.filter((slug) => raw.includes(slug));
  } catch {
    return [];
  }
}

function syncChips(): void {
  const picks = getPicks();
  for (const chip of document.querySelectorAll<HTMLButtonElement>('[data-tour-class-pick]')) {
    chip.setAttribute('aria-pressed', String(picks.includes(chip.dataset.tourClassPick ?? '')));
  }
}

function toggleClass(slug: string): void {
  const picks = getPicks();
  const next = picks.includes(slug)
    ? picks.filter((s) => s !== slug)
    : CLASS_ORDER.filter((s) => picks.includes(s) || s === slug);
  try {
    localStorage.setItem(PICKS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the toggle still shows for this view */
  }
  syncChips();
  // The same event the home picker sends. my-class.ts and hub-quicklinks.ts
  // listen and repersonalize the page behind the modal.
  document.dispatchEvent(new CustomEvent('wcp:my-classes', { detail: next }));
}

// --- Wiring ------------------------------------------------------------------

function seen(el: HTMLElement): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === (el.dataset.tourVersion ?? '');
  } catch {
    return true; // no storage — never auto-open on every visit
  }
}

function noteIsDue(): boolean {
  const note = document.querySelector<HTMLElement>('[data-note-modal]');
  if (!note) return false;
  try {
    return (
      localStorage.getItem(note.dataset.storageKey ?? 'wcp-note-seen') !==
      (note.dataset.version ?? '')
    );
  } catch {
    return false;
  }
}

function init(): void {
  const el = root();
  if (!el) return;

  el.querySelectorAll<HTMLElement>('[data-tour-close]').forEach((b) =>
    b.addEventListener('click', close),
  );
  el.querySelector<HTMLElement>('[data-tour-skip]')?.addEventListener('click', close);
  el.querySelector<HTMLElement>('[data-tour-back]')?.addEventListener('click', () =>
    showStep(step - 1),
  );
  el.querySelector<HTMLElement>('[data-tour-next]')?.addEventListener('click', () => {
    if (step >= steps(el).length - 1) close();
    else showStep(step + 1);
  });
  el.querySelectorAll<HTMLButtonElement>('[data-tour-class-pick]').forEach((chip) =>
    chip.addEventListener('click', () => toggleClass(chip.dataset.tourClassPick ?? '')),
  );

  // The reopen chip in the greeting hero. Hidden without JS, like the note's.
  document.querySelectorAll<HTMLElement>('[data-tour-open]').forEach((btn) => {
    btn.hidden = false;
    btn.closest<HTMLElement>('[data-tour-open-wrap]')?.removeAttribute('hidden');
    btn.addEventListener('click', open);
  });

  if (seen(el)) return;

  if (noteIsDue()) {
    // The President speaks first. One listener; the note closes once.
    document.addEventListener('wcp:note-closed', () => {
      openTimer = setTimeout(open, 400);
    });
  } else {
    openTimer = setTimeout(open, 900);
  }
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

export {};
