// ============================================================================
// Count-up numbers
// ============================================================================
// Animates any [data-countup] element from 0 to its number when it scrolls into
// view. Progressive enhancement: the real value is always in the DOM as text,
// so with no JS (or with prefers-reduced-motion) it simply shows the final
// number and never animates. Nothing depends on this to be readable.
//
// View Transitions: the observer is disconnected before each navigation (and at
// the top of each page-load) and rebuilt for the newly swapped-in page.
// ============================================================================
import { onPageLoad, onBeforeSwap } from './_page-load';

function animateTo(el: HTMLElement, target: number) {
  const isFloat = target % 1 !== 0;
  const duration = 1600;
  let startTime: number | null = null;

  function step(now: number) {
    if (startTime === null) startTime = now;
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = target * eased;
    el.textContent = isFloat ? value.toFixed(1) : String(Math.round(value));
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = isFloat ? target.toFixed(1) : String(target);
  }
  requestAnimationFrame(step);
}

let io: IntersectionObserver | null = null;

function init() {
  io?.disconnect();
  io = null;

  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-countup]'));
  if (!els.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Leave the real value untouched for reduced-motion / no-IO environments.
  if (reduce || !('IntersectionObserver' in window)) return;

  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const target = parseFloat(el.dataset.count ?? el.textContent ?? '0');
        if (!Number.isNaN(target)) {
          el.textContent = '0';
          animateTo(el, target);
        }
        io?.unobserve(el);
      }
    },
    { threshold: 0.6 },
  );

  els.forEach((el) => io!.observe(el));
}

onPageLoad(init);
onBeforeSwap(() => {
  io?.disconnect();
  io = null;
});

export {};
