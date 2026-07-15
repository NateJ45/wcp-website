// =============================================================================
// hub-quicklinks.ts — personalize the topbar "Helper schedule" + "Pay tuition"
// quick links to the device's class(es)
// =============================================================================
// Each quick link ships a direct <a> (data-quick-multi) carrying a class→URL
// map, plus a hidden <details> dropdown (data-quick-multi-menu) with one link
// per class. Based on the classes this device picked on the home page
// (wcp-my-classes):
//   0 classes → keep the default fallback link (co-op page / tuition page)
//   1 class   → point the direct <a> straight at that class's sheet / pay link
//   2+ classes→ hide the <a>, reveal the dropdown, and show a link per class so
//               a family with kids in two classes can reach both.
// Re-applies on load AND whenever the my-class picker changes (it dispatches
// `wcp:my-classes`), so picking classes on the home page updates the topbar
// immediately instead of only after the next navigation. Idempotent: every run
// resets each link to its default first, so going 2→1→0 works too. Progressive
// enhancement: no pick / no JS just keeps the fallback link.
// =============================================================================
import { onPageLoad } from '@/scripts/_page-load';

function readPicks(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem('wcp-my-classes') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function applyQuickLinks(): void {
  const picks = readPicks();

  document.querySelectorAll<HTMLAnchorElement>('[data-quick-multi]').forEach((link) => {
    const kind = link.getAttribute('data-quick-multi');
    const menu = document.querySelector<HTMLDetailsElement>(`[data-quick-multi-menu="${kind}"]`);

    let map: Record<string, string> = {};
    try {
      map = JSON.parse(link.getAttribute('data-map') || '{}');
    } catch {
      map = {};
    }
    const mine = picks.filter((slug) => map[slug]);

    // Capture the markup default once, then reset to it every run so switching
    // DOWN (2 classes → 1 → 0) restores the plain fallback link cleanly.
    if (link.dataset.defaultHref === undefined) {
      link.dataset.defaultHref = link.getAttribute('href') ?? '';
    }
    link.hidden = false;
    link.href = link.dataset.defaultHref;
    link.removeAttribute('target');
    link.removeAttribute('rel');
    if (menu) {
      menu.hidden = true;
      menu.open = false;
    }

    if (mine.length >= 2 && menu) {
      // Two+ classes: swap the direct link for the dropdown, show each one.
      link.hidden = true;
      menu.hidden = false;
      menu.querySelectorAll<HTMLAnchorElement>('a[data-multi-class]').forEach((a) => {
        a.hidden = !mine.includes(a.getAttribute('data-multi-class') ?? '');
      });
    } else if (mine.length === 1) {
      // One class: point the direct link straight at that class's URL.
      link.href = map[mine[0]];
      link.target = '_blank';
      link.rel = 'noopener';
    }
    // Zero classes: the default fallback (reset above) stands.
  });
}

onPageLoad(() => {
  applyQuickLinks();
  // The home picker (my-class.ts) fires this when the selection changes.
  document.addEventListener('wcp:my-classes', applyQuickLinks);
});
