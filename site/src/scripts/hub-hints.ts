// ============================================================================
// hub-hints — one-shot feature pointers (see HubHint.astro)
// ============================================================================
// Turns the page's hidden [data-hub-hint] seed into a small bubble anchored
// under its target: an amber ring around the control, one short line, and a
// dismiss button. Shows once per device (`wcp-hint-<id>`), a beat after load,
// and never while a dialog is open. Repositions on scroll and resize; tears
// down cleanly before a page swap.
// ============================================================================
import { onPageLoad, onBeforeSwap } from '@/scripts/_page-load';

let timer: ReturnType<typeof setTimeout> | null = null;
let ring: HTMLElement | null = null;
let bubble: HTMLElement | null = null;
let targetEl: HTMLElement | null = null;

const seen = (id: string): boolean => {
  try {
    return localStorage.getItem(`wcp-hint-${id}`) === '1';
  } catch {
    return true; // no storage: never nag on every visit
  }
};

function position(): void {
  if (!ring || !bubble || !targetEl) return;
  const r = targetEl.getBoundingClientRect();
  const pad = 6;
  ring.style.top = `${r.top - pad}px`;
  ring.style.left = `${r.left - pad}px`;
  ring.style.width = `${r.width + pad * 2}px`;
  ring.style.height = `${r.height + pad * 2}px`;
  // The bubble sits under the target, clamped inside the viewport.
  const width = Math.min(320, window.innerWidth - 24);
  bubble.style.width = `${width}px`;
  const left = Math.max(
    12,
    Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - 12),
  );
  bubble.style.left = `${left}px`;
  bubble.style.top = `${Math.min(r.bottom + 10, window.innerHeight - 24)}px`;
}

function dismiss(id: string): void {
  try {
    localStorage.setItem(`wcp-hint-${id}`, '1');
  } catch {
    /* fine */
  }
  teardown();
}

function teardown(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  ring?.remove();
  bubble?.remove();
  ring = null;
  bubble = null;
  targetEl = null;
  window.removeEventListener('scroll', position, { capture: true });
  window.removeEventListener('resize', position);
}

function show(seed: HTMLElement): void {
  const id = seed.dataset.hubHint ?? '';
  // The target attr is a selector LIST; the first VISIBLE match wins. That
  // lets a hint prefer one control and fall back to another (the Directory
  // map hides behind a Board switch; the class chips always render).
  let target: HTMLElement | null = null;
  for (const sel of (seed.dataset.hintTarget ?? '').split(',').map((x) => x.trim())) {
    if (!sel) continue;
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      if (el.offsetParent !== null) {
        target = el;
        break;
      }
    }
    if (target) break;
  }
  if (!target) return;
  // A dialog on screen outranks a hint.
  if (document.querySelector('[data-tour-modal]:not([hidden]), [data-note-modal]:not([hidden])'))
    return;

  targetEl = target;
  ring = document.createElement('div');
  ring.className = 'wcp-hint-ring';
  ring.setAttribute('aria-hidden', 'true');

  bubble = document.createElement('div');
  bubble.className = 'wcp-hint-bubble';
  bubble.setAttribute('role', 'status');
  const text = document.createElement('span');
  text.textContent = seed.dataset.hintText ?? '';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'wcp-hint-close';
  btn.setAttribute('aria-label', 'Dismiss this hint');
  btn.textContent = 'Got it';
  btn.addEventListener('click', () => dismiss(id));
  bubble.append(text, btn);

  document.body.append(ring, bubble);
  position();
  window.addEventListener('scroll', position, { passive: true, capture: true });
  window.addEventListener('resize', position, { passive: true });
}

onPageLoad(() => {
  const seed = document.querySelector<HTMLElement>('[data-hub-hint]');
  if (!seed) return;
  const id = seed.dataset.hubHint ?? '';
  if (!id || seen(id)) return;
  // A beat after load, so the page paints first (same rhythm as the notes).
  timer = setTimeout(() => show(seed), 1400);
});

onBeforeSwap(teardown);
