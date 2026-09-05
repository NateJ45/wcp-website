// ============================================================================
// FAQ accordion behavior
// ============================================================================
// The markup is a real <button aria-expanded> controlling a region (see
// FaqItem.astro). JS flips aria-expanded on click (the CSS grid-rows open/close
// animation keys off it) and toggles `inert` on the panel so a COLLAPSED
// answer's links aren't reachable by keyboard/AT. inert is applied here at
// init, not server-rendered, and ONLY when :has() is supported — the CSS
// collapse in Faq.astro is gated on the same @supports, so in a :has()-less
// browser (Firefox ESR 115) the visible-anyway answers stay interactive
// instead of becoming visible-but-inert. With no JS, every answer is simply
// visible and reachable — progressive enhancement.
// Re-binds on each View Transition navigation via onPageLoad.
// ============================================================================
import { onPageLoad } from './_page-load';

function init() {
  // Mirrors the @supports gate on the CSS collapse: inert only makes sense
  // when the panel can actually be hidden.
  const collapsible =
    typeof CSS !== 'undefined' && !!CSS.supports && CSS.supports('selector(:has(*))');

  const triggers = document.querySelectorAll<HTMLButtonElement>('[data-faq-trigger]');
  triggers.forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls') ?? '');
    if (collapsible && panel) {
      panel.inert = btn.getAttribute('aria-expanded') !== 'true';
    }
    btn.addEventListener('click', () => {
      const wasOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!wasOpen));
      if (collapsible && panel) panel.inert = wasOpen; // now-closing -> inert; now-opening -> active
    });
  });
}

onPageLoad(init);

