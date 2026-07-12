// ============================================================================
// FAQ accordion behavior
// ============================================================================
// The markup is a real <button aria-expanded> controlling a region (see
// FaqItem.astro). JS does two things on click: flip aria-expanded (the CSS
// grid-rows open/close animation keys off it) and toggle `inert` on the panel
// so a COLLAPSED answer's links aren't reachable by keyboard/AT. With no JS,
// every answer is simply visible and reachable — progressive enhancement.
// Re-binds on each View Transition navigation via onPageLoad.
// ============================================================================
import { onPageLoad } from './_page-load';

function init() {
  const triggers = document.querySelectorAll<HTMLButtonElement>('[data-faq-trigger]');
  triggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const wasOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!wasOpen));
      const panel = document.getElementById(btn.getAttribute('aria-controls') ?? '');
      if (panel) panel.inert = wasOpen; // now-closing -> inert; now-opening -> active
    });
  });
}

onPageLoad(init);

export {};
