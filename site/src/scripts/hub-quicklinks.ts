// =============================================================================
// hub-quicklinks.ts — personalize the topbar "Helper schedule" quick link
// =============================================================================
// The topbar's helper-schedule chip carries a class→URL map (data-helper-map)
// and defaults to the co-op page. If this device has picked a class
// (wcp-my-classes, set by the home picker), point the chip straight at that
// class's helper-schedule Sheet. Progressive enhancement: no pick / no JS just
// keeps the co-op fallback. Runs once per document (onPageLoad).
// =============================================================================
import { onPageLoad } from '@/scripts/_page-load';

onPageLoad(() => {
  const el = document.querySelector<HTMLAnchorElement>('[data-quick-helper]');
  if (!el) return;

  let map: Record<string, string> = {};
  try {
    map = JSON.parse(el.getAttribute('data-helper-map') || '{}');
  } catch {
    map = {};
  }

  let picks: string[] = [];
  try {
    const raw = JSON.parse(localStorage.getItem('wcp-my-classes') || '[]');
    if (Array.isArray(raw)) picks = raw;
  } catch {
    picks = [];
  }

  const primary = picks.find((slug) => map[slug]);
  if (primary && map[primary]) {
    el.href = map[primary];
    el.target = '_blank';
    el.rel = 'noopener';
    el.title = 'Your helper schedule';
  }
});
