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
// Progressive enhancement: no pick / no JS just keeps the fallback link. Runs
// once per document (onPageLoad).
// =============================================================================
import { onPageLoad } from '@/scripts/_page-load';

onPageLoad(() => {
  let picks: string[] = [];
  try {
    const raw = JSON.parse(localStorage.getItem('wcp-my-classes') || '[]');
    if (Array.isArray(raw)) picks = raw;
  } catch {
    picks = [];
  }

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
    // Zero classes: leave the default fallback href untouched.
  });
});
