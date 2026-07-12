// Accessible tabs behaviour (ARIA tab pattern). Each [data-tabs] block: click or
// arrow-key to switch; only the active panel is shown. Runs on each page-load
// (View Transitions); without it the <noscript> style keeps every panel visible,
// so nothing is ever hidden.
import { onPageLoad } from './_page-load';

function initTabs(root: Element) {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  if (tabs.length === 0) return;

  function select(index: number, focus = false) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (panels[i]) panels[i].hidden = !active;
    });
    if (focus) tabs[index]?.focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      let next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
        next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next >= 0) {
        e.preventDefault();
        select(next, true);
      }
    });
  });

  // Normalise to the first tab on load (idempotent with the server markup).
  select(0);
}

onPageLoad(() => document.querySelectorAll('[data-tabs]').forEach(initTabs));
