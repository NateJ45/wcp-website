// ============================================================================
// Page-load lifecycle helpers (for Astro View Transitions / ClientRouter)
// ============================================================================
// With the ClientRouter in BaseLayout, navigations swap the <body> WITHOUT a
// full reload, so a module script's top-level code runs only once. Per-page DOM
// wiring must therefore re-run on `astro:page-load`, which fires on the initial
// load AND after every client-side navigation.
//
// Rules for callers:
//   - Element-level listeners bound inside the callback are safe to re-bind:
//     the elements are freshly swapped in each navigation, so the previous ones
//     (and their listeners) are already gone — no duplicates, no leak.
//   - window/document/global listeners must be bound ONCE (guard with a
//     module-level flag) and should re-query the DOM at event time rather than
//     closing over elements that get swapped away.
//   - Intervals and IntersectionObservers must be cleaned up in onBeforeSwap
//     (and/or disconnected at the top of the page-load callback) so they don't
//     accumulate across navigations.
// ============================================================================

/** Run `fn` on the initial load and after every client-side navigation. */
export function onPageLoad(fn: () => void): void {
  document.addEventListener('astro:page-load', fn);
  // Bundled module scripts are deferred, so this listener can register AFTER the
  // router already dispatched `astro:page-load` for the CURRENT view. An early
  // inline tracker in <head> (see BaseLayout) flags that: it sets `.loaded` on
  // each astro:page-load and clears it on astro:before-swap. If the current
  // view's page-load already fired, run `fn` once now to catch up. During a
  // navigation the flag is cleared before new scripts run, so a freshly loaded
  // module waits for that navigation's page-load instead of double-running.
  const vt = (window as unknown as { __wcpVT?: { loaded?: boolean } }).__wcpVT;
  if (vt?.loaded) fn();
}

/** Run `fn` just before the current page is swapped away (cleanup hook). */
export function onBeforeSwap(fn: () => void): void {
  document.addEventListener('astro:before-swap', fn);
}
