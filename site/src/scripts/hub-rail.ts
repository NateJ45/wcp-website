// ============================================================================
// Family Hub rail collapse (desktop) — icons-only toggle
// ============================================================================
// The desktop rail can collapse to icons only. State lives as
// `data-rail-collapsed` on <html> (applied pre-paint by the inline script in
// BaseLayout so there's no flash) and persists in localStorage. The collapse
// CSS is in globals.css, scoped to `.hub-rail-aside` so only the desktop rail
// responds (the mobile drawer is always full).
//
// View-Transitions safe: the toggle listener re-binds on astro:page-load; the
// <html> attribute + localStorage persist across navigations untouched.
// ============================================================================
import { onPageLoad } from './_page-load';

const KEY = 'wcp-rail';

function syncButtons(collapsed: boolean) {
  document.querySelectorAll<HTMLButtonElement>('[data-rail-toggle]').forEach((btn) => {
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
  });
}

function init() {
  document.querySelectorAll<HTMLButtonElement>('[data-rail-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const collapsed = !document.documentElement.hasAttribute('data-rail-collapsed');
      document.documentElement.toggleAttribute('data-rail-collapsed', collapsed);
      localStorage.setItem(KEY, collapsed ? 'collapsed' : 'expanded');
      syncButtons(collapsed);
    });
  });
  // Sync each toggle's aria with whatever the pre-paint script already applied.
  syncButtons(document.documentElement.hasAttribute('data-rail-collapsed'));
}

onPageLoad(init);

