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
// ============================================================================

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
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      close();
      toggle.focus();
    }
  });
}

function initDropdowns() {
  const triggers = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-dropdown-trigger]'),
  );
  if (!triggers.length) return;

  const menuOf = (t: HTMLButtonElement) =>
    document.getElementById(t.getAttribute('aria-controls') ?? '');

  const closeAll = (except?: HTMLButtonElement) => {
    triggers.forEach((t) => {
      if (t !== except) {
        t.setAttribute('aria-expanded', 'false');
        menuOf(t)?.removeAttribute('data-open');
      }
    });
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      closeAll(trigger);
      trigger.setAttribute('aria-expanded', String(!isOpen));
      // Drive styling off the menu's OWN attribute (a same-element selector is
      // more robust than the scoped sibling selector across Astro/Tailwind).
      menuOf(trigger)?.toggleAttribute('data-open', !isOpen);
    });
  });

  document.addEventListener('click', () => closeAll());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}

initMobile();
initDropdowns();

export {};
