// ============================================================================
// Page-load lifecycle helpers
// ============================================================================
// HISTORY: these once bridged Astro's <ClientRouter /> (astro:page-load /
// astro:before-swap), where navigations swapped the <body> without a reload.
// The 2026-07 performance pass replaced the router with NATIVE cross-document
// View Transitions (the `@view-transition` rule in globals.css) + Speculation
// Rules prerendering (see BaseLayout) — every navigation is a real document
// again, which is what lets Chrome/Edge fully prerender the next page.
//
// The exported API is unchanged so no caller had to move:
//   - onPageLoad(fn): per-document DOM wiring. Runs once per page — on
//     DOMContentLoaded if the document is still parsing, immediately if the
//     module loaded later (deferred bundles land in 'interactive', dynamic
//     imports in 'complete'; both mean the DOM is queryable).
//   - onBeforeSwap(fn): cleanup before the page goes away — now `pagehide`.
//     Mostly belt-and-suspenders in MPA land (the document's timers and
//     observers die with it), but it keeps semantics for anything that talks
//     to the outside world.
//
// NOTE for prerendered documents (Speculation Rules): scripts run while the
// page is still hidden. That's fine for DOM wiring; anything that must wait
// for the user to actually arrive (autoplay, analytics pings) should check
// `document.prerendering` and defer to the `prerenderingchange` event.
// ============================================================================

/** Run `fn` once this document's DOM is ready (immediately if it already is). */
export function onPageLoad(fn: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

/** Run `fn` when the page is being left (cleanup hook). */
export function onBeforeSwap(fn: () => void): void {
  window.addEventListener('pagehide', fn);
}
