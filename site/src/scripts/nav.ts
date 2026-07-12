// ============================================================================
// Header navigation behavior
// ============================================================================
// Progressive enhancement for the header:
//   - Mobile menu: hamburger toggles a full panel (aria-expanded, scroll lock,
//     Escape closes and restores focus, focus moves into the panel on open).
//   - Desktop dropdowns: click toggles aria-expanded (CSS shows/hides the menu
//     off it); Escape and outside-click close them.
// With no JS, the dropdown menus are visible (CSS default) and every link is
// reachable — nothing depends on JS to navigate.
//
// View Transitions: the header is swapped in fresh on each navigation, so the
// element-level listeners (toggle, close button, dropdown triggers) are
// re-bound on `astro:page-load`. The document-level listeners (outside-click,
// Escape) are bound ONCE and re-query live elements at event time, so they
// never stack up.
// ============================================================================
import { onPageLoad } from './_page-load';

function closeMobile() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const panel = document.getElementById('mobile-nav');
  if (!toggle || !panel) return;
  toggle.setAttribute('aria-expanded', 'false');
  panel.hidden = true;
  document.documentElement.classList.remove('overflow-hidden');
}

function initMobile() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const panel = document.getElementById('mobile-nav');
  if (!toggle || !panel) return;

  const close = () => {
    toggle.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    document.documentElement.classList.remove('overflow-hidden');
  };
  const open = () => {
    toggle.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    document.documentElement.classList.add('overflow-hidden');
    panel.querySelector<HTMLElement>('a, button')?.focus();
  };

  toggle.addEventListener('click', () => {
    if (toggle.getAttribute('aria-expanded') === 'true') close();
    else open();
  });
  panel.querySelector('[data-nav-close]')?.addEventListener('click', () => {
    close();
    toggle.focus();
  });
}

function closeAllDropdowns(except?: HTMLButtonElement) {
  document.querySelectorAll<HTMLButtonElement>('[data-dropdown-trigger]').forEach((t) => {
    if (t === except) return;
    t.setAttribute('aria-expanded', 'false');
    document.getElementById(t.getAttribute('aria-controls') ?? '')?.removeAttribute('data-open');
  });
}

function initDropdowns() {
  document.querySelectorAll<HTMLButtonElement>('[data-dropdown-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      closeAllDropdowns(trigger);
      trigger.setAttribute('aria-expanded', String(!isOpen));
      // Drive styling off the menu's OWN attribute (a same-element selector is
      // more robust than the scoped sibling selector across Astro/Tailwind).
      document
        .getElementById(trigger.getAttribute('aria-controls') ?? '')
        ?.toggleAttribute('data-open', !isOpen);
    });
  });
}

// Document-level listeners — bound ONCE for the app lifetime; they re-query
// live elements so they survive header swaps.
let globalsBound = false;
function bindGlobals() {
  if (globalsBound) return;
  globalsBound = true;

  document.addEventListener('click', () => closeAllDropdowns());
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
    if (toggle?.getAttribute('aria-expanded') === 'true') {
      closeMobile();
      toggle.focus();
    }
    closeAllDropdowns();
  });
}

function init() {
  initMobile();
  initDropdowns();
  bindGlobals();
}

onPageLoad(init);

export {};
