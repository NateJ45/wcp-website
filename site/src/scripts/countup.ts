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
//
// Formatting rides optional data- attributes so a value can count up while
// keeping its shape — data-prefix ("$"), data-suffix ("%"), data-decimals, and
// data-group (thousands separators). All optional: with none set (StatBlock),
// the behavior is the plain integer/one-decimal count-up it always was.
// ============================================================================
import { onPageLoad, onBeforeSwap } from './_page-load';
import { formatCount, type CountFormat } from '@/lib/count-format';

function animateTo(el: HTMLElement, target: number, fmt: CountFormat) {
  const duration = 1600;
  let startTime: number | null = null;

  function step(now: number) {
    if (startTime === null) startTime = now;
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = formatCount(target * eased, fmt);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = formatCount(target, fmt);
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
          // Integer target → no decimals mid-frame (unless data-decimals says
          // otherwise); the presence of data-group turns on 1,000s separators.
          const decimals =
            el.dataset.decimals !== undefined
              ? Number(el.dataset.decimals)
              : Number.isInteger(target)
                ? 0
                : 1;
          const fmt: CountFormat = {
            prefix: el.dataset.prefix ?? '',
            suffix: el.dataset.suffix ?? '',
            decimals,
            group: el.dataset.group !== undefined,
          };
          el.textContent = formatCount(0, fmt);
          animateTo(el, target, fmt);
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
