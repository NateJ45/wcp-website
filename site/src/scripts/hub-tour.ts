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
// Esc closes; focus returns to the opener.
//
// SPOTLIGHT: a step with `data-target-lg`/`data-target-sm` highlights the real
// element. The step's selector list is tried in order and the first VISIBLE
// match wins; a `[data-class-tile]` match widens to its parent list so the
// whole tile row glows, not one tile. The cutout and pointer are fixed
// elements repositioned on scroll and resize while the tour is open. Body
// scroll stays UNLOCKED so the page can scroll targets into view.
// ============================================================================
import { onPageLoad, onBeforeSwap } from '@/scripts/_page-load';
import { celebrate } from '@/scripts/confetti';

const SEEN_KEY = 'wcp-tour-seen';
const PICKS_KEY = 'wcp-my-classes';
const CLASS_ORDER = ['twos', 'threes', 'pre-k-am', 'pre-k-pm'];
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openTimer: ReturnType<typeof setTimeout> | null = null;
let lastFocused: HTMLElement | null = null;
let step = 0;

const root = (): HTMLElement | null => document.querySelector<HTMLElement>('[data-tour-modal]');
const isDesktop = (): boolean => window.matchMedia('(min-width: 1024px)').matches;
const motionOK = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
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

  const current = all.find((s) => !s.hidden);
  spotlight(current ? targetFor(current) : null);
}

function onViewportChange(): void {
  if (isOpen()) positionSpot();
}

function open(): void {
  const el = root();
  if (!el || !el.hidden) return;
  lastFocused = document.activeElement as HTMLElement | null;
  el.hidden = false;
  // No body scroll lock: spotlight steps scroll their targets into view.
  window.addEventListener('scroll', onViewportChange, { passive: true, capture: true });
  window.addEventListener('resize', onViewportChange, { passive: true });
  showStep(0);
  syncChips();
  el.querySelector<HTMLElement>('[data-tour-next]')?.focus();
}

function close(): void {
  const el = root();
  if (!el || el.hidden) return;
  el.hidden = true;
  spotlight(null);
  window.removeEventListener('scroll', onViewportChange, { capture: true });
  window.removeEventListener('resize', onViewportChange);
  try {
    localStorage.setItem(SEEN_KEY, el.dataset.tourVersion ?? '');
  } catch {
    /* private browsing — the tour shows again next visit, fine */
  }
  lastFocused?.focus();
}

// --- The spotlight -----------------------------------------------------------

/** The element a step points at, or null for a centered-card step. */
function targetFor(stepEl: HTMLElement): HTMLElement | null {
  const list = (isDesktop() ? stepEl.dataset.targetLg : stepEl.dataset.targetSm) ?? '';
  for (const sel of list
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)) {
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      if (el.closest('[data-tour-modal]')) continue; // never spotlight the tour itself
      const grown = el.dataset.classTile !== undefined ? (el.parentElement ?? el) : el;
      const r = grown.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && grown.offsetParent !== null) return grown;
    }
  }
  return null;
}

let spotTarget: HTMLElement | null = null;

function positionSpot(): void {
  const el = root();
  const spot = el?.querySelector<HTMLElement>('[data-tour-spot]');
  const pointer = el?.querySelector<HTMLElement>('[data-tour-pointer]');
  if (!el || !spot || !pointer || !spotTarget) return;
  const r = spotTarget.getBoundingClientRect();
  const pad = 8;
  spot.style.top = `${r.top - pad}px`;
  spot.style.left = `${r.left - pad}px`;
  spot.style.width = `${r.width + pad * 2}px`;
  spot.style.height = `${r.height + pad * 2}px`;
  // The pointer sits under the target's centre, arrow up — between the target
  // and the docked card.
  pointer.style.top = `${r.bottom + 10}px`;
  pointer.style.left = `${r.left + r.width / 2 - 16}px`;
}

function spotlight(target: HTMLElement | null): void {
  const el = root();
  const spot = el?.querySelector<HTMLElement>('[data-tour-spot]');
  const pointer = el?.querySelector<HTMLElement>('[data-tour-pointer]');
  if (!el || !spot || !pointer) return;
  spotTarget = target;
  if (!target) {
    el.classList.remove('is-spot');
    spot.hidden = true;
    pointer.hidden = true;
    return;
  }
  el.classList.add('is-spot');
  spot.hidden = false;
  pointer.hidden = false;
  target.scrollIntoView({ block: 'center', behavior: motionOK() ? 'smooth' : 'auto' });
  positionSpot();
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
  el.querySelector<HTMLElement>('[data-tour-next]')?.addEventListener('click', (e) => {
    if (step >= steps(el).length - 1) {
      // Finishing the tour earns a small burst — user-initiated, once.
      celebrate(e.currentTarget as HTMLElement);
      close();
    } else {
      showStep(step + 1);
    }
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
  window.removeEventListener('scroll', onViewportChange, { capture: true });
  window.removeEventListener('resize', onViewportChange);
});

onPageLoad(() => {
  init();
  bindGlobals();
});

export {};
