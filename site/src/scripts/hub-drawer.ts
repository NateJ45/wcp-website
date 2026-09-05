// ============================================================================
// Family Hub drawer — mobile off-canvas nav (progressive enhancement)
// ============================================================================
// The drawer + backdrop are always in the DOM (see BaseLayout hub branch),
// hidden via transform + aria-hidden. This toggles them: focus moves into the
// drawer on open and returns to the toggle on close, Esc and a backdrop tap
// close it, body scroll is locked while open, and Tab is trapped inside.
// View-Transitions safe: element listeners re-bind on astro:page-load; the
// document Esc/Tab handler binds once and re-queries live nodes.
// ============================================================================
import { onPageLoad, onBeforeSwap } from './_page-load';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// TWO toggles open the same drawer: the top bar's menu button (md–lg) and the
// bottom tab bar's More button (< md). Every state change touches ALL of them
// so their aria-expanded never disagrees; focus returns to whichever one
// actually opened the drawer.
function els() {
  return {
    toggles: [...document.querySelectorAll<HTMLButtonElement>('[data-hub-drawer-toggle]')],
    drawer: document.getElementById('hub-drawer'),
    backdrop: document.getElementById('hub-drawer-backdrop'),
  };
}

let lastTrigger: HTMLButtonElement | null = null;

function isOpen() {
  return els().toggles[0]?.getAttribute('aria-expanded') === 'true';
}

function open(trigger?: HTMLButtonElement) {
  const { toggles, drawer, backdrop } = els();
  if (toggles.length === 0 || !drawer || !backdrop) return;
  lastTrigger = trigger ?? toggles[0];
  for (const t of toggles) t.setAttribute('aria-expanded', 'true');
  drawer.setAttribute('aria-hidden', 'false');
  drawer.removeAttribute('inert');
  drawer.classList.remove('-translate-x-full');
  backdrop.classList.remove('hidden');
  document.documentElement.classList.add('overflow-hidden');
  drawer.querySelector<HTMLElement>(FOCUSABLE)?.focus();
}

function close(restoreFocus = true) {
  const { toggles, drawer, backdrop } = els();
  if (toggles.length === 0 || !drawer || !backdrop) return;
  for (const t of toggles) t.setAttribute('aria-expanded', 'false');
  drawer.setAttribute('aria-hidden', 'true');
  // inert with aria-hidden: the closed drawer is still rendered (translated
  // offscreen), and aria-hidden alone leaves its links in the Tab order —
  // an axe aria-hidden-focus violation at mobile widths.
  drawer.setAttribute('inert', '');
  drawer.classList.add('-translate-x-full');
  backdrop.classList.add('hidden');
  document.documentElement.classList.remove('overflow-hidden');
  if (restoreFocus) (lastTrigger ?? toggles[0]).focus();
}

function initDrawer() {
  const { toggles, backdrop } = els();
  for (const toggle of toggles) {
    toggle.addEventListener('click', () => (isOpen() ? close() : open(toggle)));
  }
  backdrop?.addEventListener('click', () => close());
}

let globalsBound = false;
function bindGlobals() {
  if (globalsBound) return;
  globalsBound = true;

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    // Focus trap: keep Tab inside the open drawer.
    const drawer = document.getElementById('hub-drawer');
    if (!drawer) return;
    const focusable = [...drawer.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null,
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

// Close on navigation (the drawer's own links) so it never lingers after a swap.
onBeforeSwap(() => close(false));

onPageLoad(() => {
  initDrawer();
  bindGlobals();
});

