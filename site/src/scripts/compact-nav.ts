// ============================================================================
// Compact nav bar — shows once the visitor scrolls past the big overlay header
// ============================================================================
// The big header (logo + nav, transparent over the hero) is only present at
// the very top of the page. Once scrolled past it, this slim fixed bar slides
// in so navigation is always reachable. Desktop/tablet only — on mobile the
// header is already a normal in-flow sticky bar (see Header.astro), so this
// script simply finds nothing to do there and exits quietly.
//
// View Transitions: update() re-queries the header/bar each call, so the
// scroll/resize listeners are bound ONCE (guarded) and keep working across
// navigations without stacking. init() re-runs update() on each page-load to
// set the correct state for the freshly swapped-in page.
// ============================================================================
import { onPageLoad } from './_page-load';

function update() {
  const bigHeader = document.querySelector<HTMLElement>('[data-big-header]');
  const compact = document.getElementById('compact-nav');
  if (!bigHeader || !compact) return;
  // Trigger a little before the header is fully scrolled past so the handoff
  // feels seamless rather than leaving a gap with no visible nav.
  const show = window.scrollY > bigHeader.offsetHeight - 40;
  compact.toggleAttribute('data-visible', show);
}

let bound = false;
let ticking = false;

function init() {
  // Correct state for the page we just landed on (top of a fresh page = hidden).
  update();
  if (bound) return;
  bound = true;
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );
  // The big header's height can change on resize (fluid type/spacing).
  window.addEventListener('resize', update);
}

onPageLoad(init);
