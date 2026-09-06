// ============================================================================
// Scroll-reveal observer
// ============================================================================
// Adds .is-visible to [data-reveal] elements. Anything already on-screen is
// revealed immediately (a geometry check, so it works even in a backgrounded
// tab where IntersectionObserver never fires); everything below the fold is
// observed and revealed as the visitor scrolls to it. Under reduced-motion
// (or no IntersectionObserver) everything is shown immediately, so nothing
// ever depends on motion to appear.
//
// LATE CONTENT: server islands (the hub home's Google-backed widgets) stream
// their HTML in AFTER this module's initial scan — without the MutationObserver
// below, their [data-reveal] cards would never be geometry-checked or observed
// and would sit at opacity 0 forever (found live 2026-07: the hub dashboard
// "lost" its events/fundraising/budget widgets except on a hard refresh,
// where the race happened to flip). Any future streamed/injected content is
// covered by the same path.
// ============================================================================
import { onPageLoad, onBeforeSwap } from './_page-load';

let io: IntersectionObserver | null = null;
let mo: MutationObserver | null = null;

function inViewport(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return r.bottom > 0 && r.top < vh;
}

/** Reveal-or-observe a batch (initial scan and every late insertion alike). */
function process(els: HTMLElement[]) {
  if (!els.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  io ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io?.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );

  els.forEach((el) => {
    if (inViewport(el)) el.classList.add('is-visible');
    else io!.observe(el);
  });
}

const pending = (root: ParentNode | HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)'));

function setup() {
  process(pending(document));

  // Catch [data-reveal] elements inserted after the initial scan.
  mo?.disconnect();
  mo = new MutationObserver((mutations) => {
    const fresh: HTMLElement[] = [];
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches('[data-reveal]:not(.is-visible)')) fresh.push(node);
        fresh.push(...pending(node));
      }
    }
    process(fresh);
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

onPageLoad(setup);

onBeforeSwap(() => {
  io?.disconnect();
  io = null;
  mo?.disconnect();
  mo = null;
});

// BFCACHE: onBeforeSwap (pagehide) tears the observers down, but a Back/Forward
// restore fires `pageshow` with persisted=true and does NOT re-fire
// DOMContentLoaded — so onPageLoad's setup never re-runs, and every below-fold
// [data-reveal] element stays stuck at opacity:0 with no observer to reveal it
// (the Updates list "went blank" after opening an entry and hitting Back —
// only the already-revealed cards survived, 2026-07-17). Re-run setup on a
// persisted restore to rebuild the observers and reveal/observe what's pending.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) setup();
});
