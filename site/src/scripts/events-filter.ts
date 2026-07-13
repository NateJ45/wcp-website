import { onPageLoad } from './_page-load';

// =============================================================================
// Events category filter — progressive enhancement for /events
// =============================================================================
// Reveals the filter bar (hidden by default so no-JS visitors just see every
// event) and toggles card visibility by category on click. A no-op on any page
// without the events markup, so it's safe to load site-wide via the component.
// Wired through onPageLoad so it re-runs correctly on each navigation.
// =============================================================================
onPageLoad(() => {
  const root = document.querySelector('[data-events-root]');
  if (!root) return;
  const bar = root.querySelector<HTMLElement>('[data-events-filter]');
  if (!bar) return;
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-event-item]'));
  const empty = root.querySelector<HTMLElement>('[data-events-empty]');

  bar.hidden = false;
  bar.addEventListener('click', (event) => {
    const target = event.target;
    const btn = target instanceof Element ? target.closest('[data-filter]') : null;
    if (!btn) return;
    const want = btn.getAttribute('data-filter');
    bar
      .querySelectorAll('[data-filter]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    let shown = 0;
    for (const el of items) {
      const match = want === 'all' || el.getAttribute('data-category') === want;
      el.hidden = !match;
      if (match) shown++;
    }
    if (empty) empty.hidden = shown > 0;
  });
});
