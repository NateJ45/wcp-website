// =============================================================================
// Class-availability badges — progressive enhancement over /api/availability
// =============================================================================
// ClassCard renders a hidden `[data-availability="<slug>"]` line; this fills
// in the status ("Spots open" / "Waitlist" / ...) and reveals it. One fetch
// per page load, cached at module scope, and every failure path simply leaves
// the badges hidden — the cards are complete without them. View-Transitions
// safe via onPageLoad (elements are swapped in fresh on each navigation).
// =============================================================================
import { onPageLoad } from '@/scripts/_page-load';

interface Availability {
  slug: string;
  status: 'open' | 'few' | 'waitlist' | 'full';
}

// Neutral label text + a bright dot (decorative). Never colored text on tint.
const BADGES: Record<Availability['status'], { label: string; dot: string }> = {
  open: { label: 'Spots open', dot: 'bg-green' },
  few: { label: 'A few spots left', dot: 'bg-amber' },
  waitlist: { label: 'Waitlist open', dot: 'bg-sky' },
  full: { label: 'Class is full', dot: 'bg-navy dark:bg-white/70' },
};

let fetchOnce: Promise<Availability[]> | null = null;
function getAvailability(): Promise<Availability[]> {
  if (!fetchOnce) {
    fetchOnce = fetch('/api/availability')
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
  }
  return fetchOnce;
}

onPageLoad(() => {
  const badges = document.querySelectorAll<HTMLElement>('[data-availability]');
  if (badges.length === 0) return;
  void getAvailability().then((items) => {
    const bySlug = new Map(items.map((i) => [i.slug, i.status]));
    for (const el of badges) {
      const status = bySlug.get(el.dataset.availability ?? '');
      const badge = status && BADGES[status];
      if (!badge) continue;
      const label = el.querySelector('[data-availability-label]');
      const dot = el.querySelector('[data-availability-dot]');
      if (!label || !dot) continue;
      label.textContent = badge.label;
      dot.className = `h-2.5 w-2.5 rounded-full ${badge.dot}`;
      el.classList.remove('hidden');
      el.classList.add('flex');
    }
  });
});
