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
// keeping its shape — data-prefix ("$"), data-suffix ("%"), data-decimals,
// data-group (thousands separators), and data-duration (ms, to sync with a
// paired animation like HubRing's fill). All optional: with none set
// (StatBlock), the behavior is the plain 1600ms integer/one-decimal count-up it
// always was.
// ============================================================================
import { onPageLoad, onBeforeSwap } from './_page-load';
import { formatCount, type CountFormat } from '@/lib/count-format';

function animateTo(el: HTMLElement, target: number, fmt: CountFormat, duration: number) {
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
let mo: MutationObserver | null = null;

function observe(el: HTMLElement) {
  // Guard against double-observing the same node (the initial scan + a
  // MutationObserver hit for the same element).
  if (el.dataset.countupBound) return;
  el.dataset.countupBound = '1';
  io?.observe(el);
}

function scan(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-countup]').forEach(observe);
}

function init() {
  io?.disconnect();
  io = null;
  mo?.disconnect();
  mo = null;

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
          const duration = el.dataset.duration !== undefined ? Number(el.dataset.duration) : 1600;
          el.textContent = formatCount(0, fmt);
          animateTo(el, target, fmt, duration > 0 ? duration : 1600);
        }
        io?.unobserve(el);
      }
    },
    { threshold: 0.6 },
  );

  scan(document);

  // The home's KPI widgets are `server:defer` islands that stream in AFTER this
  // one-shot scan runs, so a plain scan never sees their [data-countup]. Watch
  // for late-inserted nodes and observe them too — same fix reveal.ts uses (see
  // the "Server islands render hub content" gotcha in CLAUDE.md).
  mo = new MutationObserver((records) => {
    for (const rec of records) {
      rec.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        const el = node as HTMLElement;
        if (el.matches?.('[data-countup]')) observe(el);
        scan(el);
      });
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

onPageLoad(init);
onBeforeSwap(() => {
  io?.disconnect();
  io = null;
  mo?.disconnect();
  mo = null;
});

export {};
