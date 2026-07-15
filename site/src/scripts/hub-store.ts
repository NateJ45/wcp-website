// =============================================================================
// hub-store.ts — prev/next arrows for the hub store card's product carousels
// =============================================================================
// The store card (StoreCard.astro) is a server:defer ISLAND, so its markup
// streams in AFTER the per-document scripts have scanned the DOM. We therefore
// scan once on load and, if the card isn't there yet, watch for it with a
// MutationObserver (then disconnect). For each category rail we hide the native
// scrollbar (add `wcp-rail-js`) and wire the two arrow buttons, toggling them
// [hidden] at each end. Category switching is CSS-only (radio + :has), which
// fires no JS event, so we also refresh on the radios' `change`. Runs once per
// document (onPageLoad); the hub disables view transitions, so each hub page is
// a fresh document and this re-inits cleanly.
// =============================================================================
import { onPageLoad } from './_page-load';

function init(): boolean {
  const rails = Array.from(document.querySelectorAll<HTMLElement>('.wcp-store-rail'));
  if (!rails.length) return false;

  const updaters: Array<() => void> = [];
  for (const rail of rails) {
    if (rail.dataset.arrowsWired) continue;
    rail.dataset.arrowsWired = '1';
    rail.classList.add('wcp-rail-js'); // hide the native scrollbar; arrows take over

    const panel = rail.closest('.wcp-store-panel');
    const prev = panel?.querySelector<HTMLButtonElement>('[data-store-arrow="-1"]') ?? null;
    const next = panel?.querySelector<HTMLButtonElement>('[data-store-arrow="1"]') ?? null;
    if (!prev && !next) continue;

    const step = () => Math.max(rail.clientWidth * 0.85, 180);
    // Epsilon absorbs the rail's px-1 padding + scroll-snap resting offset, so
    // "at the start" isn't scrollLeft 0 but ~4px, and the end snaps a hair short.
    const EPS = 16;
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      if (prev) prev.hidden = rail.scrollLeft <= EPS;
      if (next) next.hidden = rail.scrollLeft >= max - EPS;
    };
    prev?.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    next?.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
    rail.addEventListener('scroll', update, { passive: true });
    updaters.push(update);
  }

  const refresh = () => updaters.forEach((u) => u());
  window.addEventListener('resize', refresh, { passive: true });
  // Switching category (CSS radio) fires no scroll event — recompute after the
  // panel's display flips so the newly-visible rail's arrows are correct.
  document
    .querySelectorAll<HTMLInputElement>('.wcp-store-radio')
    .forEach((r) => r.addEventListener('change', () => requestAnimationFrame(refresh)));
  refresh();
  return true;
}

onPageLoad(() => {
  if (init()) return;
  // Island not streamed in yet — watch for it, wire it, then stop watching.
  const obs = new MutationObserver(() => {
    if (init()) obs.disconnect();
  });
  obs.observe(document.body, { childList: true, subtree: true });
});
