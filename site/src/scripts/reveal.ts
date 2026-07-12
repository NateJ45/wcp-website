// ============================================================================
// Scroll-reveal observer
// ============================================================================
// Adds .is-visible to [data-reveal] elements. Anything already on-screen is
// revealed immediately (a geometry check, so it works even in a backgrounded
// tab where IntersectionObserver never fires); everything below the fold is
// observed and revealed as the visitor scrolls to it. Runs on every ClientRouter
// navigation (onPageLoad) so swapped-in content reveals too, and the observer is
// disconnected before each swap so none pile up. Under reduced-motion (or no
// IntersectionObserver) everything is shown immediately, so nothing ever depends
// on motion to appear.
// ============================================================================
import { onPageLoad, onBeforeSwap } from './_page-load';

let io: IntersectionObserver | null = null;

function inViewport(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return r.bottom > 0 && r.top < vh;
}

function setup() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)'));
  if (!els.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  io?.disconnect();
  io = new IntersectionObserver(
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

onPageLoad(setup);

onBeforeSwap(() => {
  io?.disconnect();
  io = null;
});

export {};
