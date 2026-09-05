// ============================================================================
// Header navigation behavior
// ============================================================================
// Progressive enhancement for the header:
//   - Mobile menu: hamburger toggles a full panel (aria-expanded, scroll lock,
//     Escape closes and restores focus, focus moves into the panel on open).
//   - Desktop dropdowns: click toggles aria-expanded (CSS shows/hides the menu
//     off it); Escape and an outside press close them.
// With no JS, the dropdown menus are visible (CSS default) and every link is
// reachable — nothing depends on JS to navigate.
//
// Navigations are real document loads (no ClientRouter), so onPageLoad wires
// each fresh document once. The document-level listeners (outside-press,
// Escape) are still bound ONCE per document and re-query live elements at
// event time, so they never stack up. BFCACHE: there is no pagehide teardown
// here and no state computed at load — everything is read from the live DOM at
// event time — so a Back/Forward restore needs no `pageshow persisted` re-init
// (the restored document keeps its listeners).
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
    // No stopPropagation needed: the outside-dismiss below is a pointerdown
    // listener with a containment check, so a press on the trigger itself is
    // already exempt — the click here owns the toggle.
    trigger.addEventListener('click', () => {
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

// Document-level listeners — bound ONCE for the document lifetime; they
// re-query live elements so they survive header swaps.
let globalsBound = false;
function bindGlobals() {
  if (globalsBound) return;
  globalsBound = true;

  // pointerdown, not click: iOS Safari only synthesizes a bubbling click for
  // taps on "clickable" targets (interactive elements or cursor:pointer), so a
  // document-level click listener never fires when a parent taps plain text or
  // blank background to dismiss — the dropdown stayed open (the same bug class
  // fixed in the hub's hub-menus.ts, 2026-07-17). pointerdown fires for every
  // touch on every element (iOS 13+), and closing on press-down feels snappier
  // anyway. The containment check exempts presses on a trigger (its click
  // handler owns the toggle — closing here first would make that click reopen
  // it) and inside an open menu (closing on press-down would hide the menu
  // before pointerup, and the menu link's click would land on a hidden
  // element — a lost navigation).
  document.addEventListener('pointerdown', (e) => {
    const target = e.target as Node;
    document.querySelectorAll<HTMLButtonElement>('[data-dropdown-trigger]').forEach((trigger) => {
      if (trigger.getAttribute('aria-expanded') !== 'true') return;
      const menu = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
      if (trigger.contains(target) || menu?.contains(target)) return;
      trigger.setAttribute('aria-expanded', 'false');
      menu?.removeAttribute('data-open');
    });
  });
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
