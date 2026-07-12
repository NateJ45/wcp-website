// =============================================================================
// Theme toggle — click handling
// =============================================================================
// The INITIAL state (light by default, or dark if a visitor previously chose
// it) is already applied before paint by the inline anti-flash script in
// BaseLayout.astro's <head> — that's the only place that reads localStorage
// on load. This script only handles clicks on any [data-theme-toggle] button
// and keeps every toggle instance (mobile/desktop/hub headers) in sync.
//
// The header is swapped in fresh on every View Transition navigation, so the
// click handlers are re-bound on `astro:page-load`. The <html> element (and its
// .dark class) persists across navigations, so the theme choice itself carries
// over untouched.
// =============================================================================
import { onPageLoad } from './_page-load';

const STORAGE_KEY = 'wcp-theme';

function setThemeClass(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

function init() {
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dark = !document.documentElement.classList.contains('dark');
      setThemeClass(dark);
      // Only an explicit click persists a preference — a visitor who never
      // toggles stays on the light default on every future visit.
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    });
  });

  // Sync every toggle button's aria-pressed/label with whatever state the
  // anti-flash script (or a prior toggle) already applied.
  setThemeClass(document.documentElement.classList.contains('dark'));
}

onPageLoad(init);

export {};
