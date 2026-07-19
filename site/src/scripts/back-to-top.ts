// =============================================================================
// Back-to-top button behavior (public site + Family Hub)
// =============================================================================
// Shows [data-back-to-top] once the visitor has scrolled ~1.75 viewports, and
// scrolls home on click (smooth only under no-preference). Passive listener +
// rAF flag so scrolling never blocks on this; listener state lives with the
// document, so bfcache restores keep working without a pageshow re-init.
// =============================================================================
import { onPageLoad } from '@/scripts/_page-load';

onPageLoad(() => {
  const btn = document.querySelector<HTMLElement>('[data-back-to-top]');
  if (!btn) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    btn.hidden = window.scrollY < window.innerHeight * 1.75;
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  update();

  btn.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    // Keyboard users would otherwise be left focused on a button that is about
    // to hide; #main exists on both surfaces with tabindex="-1".
    document.getElementById('main')?.focus({ preventScroll: true });
  });
});
