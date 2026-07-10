// ============================================================================
// Compact nav bar — shows once the visitor scrolls past the big overlay header
// ============================================================================
// The big header (logo + nav, transparent over the hero) is only present at
// the very top of the page. Once scrolled past it, this slim fixed bar slides
// in so navigation is always reachable. Desktop/tablet only — on mobile the
// header is already a normal in-flow sticky bar (see Header.astro), so this
// script simply finds nothing to do there and exits quietly.
// ============================================================================

function init() {
  const bigHeader = document.querySelector<HTMLElement>('[data-big-header]');
  const compact = document.getElementById('compact-nav');
  if (!bigHeader || !compact) return;

  let ticking = false;
  const update = () => {
    // Trigger a little before the header is fully scrolled past so the
    // handoff feels seamless rather than leaving a gap with no visible nav.
    const show = window.scrollY > bigHeader.offsetHeight - 40;
    compact.toggleAttribute('data-visible', show);
    ticking = false;
  };

  update();
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true },
  );
  // The big header's height can change on resize (fluid type/spacing).
  window.addEventListener('resize', update);
}

init();

export {};
