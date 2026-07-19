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

// Class display names for the hero spots line. The two Pre-K sessions
// collapse to one "Pre-K" mention when both share a status.
const NAMES: Record<string, string> = {
  twos: 'Twos',
  threes: 'Threes',
  'pre-k-am': 'Pre-K AM',
  'pre-k-pm': 'Pre-K PM',
};

function listNames(slugs: string[]): string {
  let names = slugs.map((s) => NAMES[s] ?? s);
  if (names.includes('Pre-K AM') && names.includes('Pre-K PM')) {
    names = [...names.filter((n) => !n.startsWith('Pre-K')), 'Pre-K'];
  }
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

/** The hero line: open classes lead; "few" is the honest scarcity wording.
 *  All-waitlist/full/empty → null (the line stays hidden — no fake urgency). */
export function spotsLineFor(items: Availability[]): { text: string; tone: string } | null {
  const open = items.filter((i) => i.status === 'open').map((i) => i.slug);
  const few = items.filter((i) => i.status === 'few').map((i) => i.slug);
  if (open.length > 0) {
    const extra = few.length > 0 ? ` A few spots left in ${listNames(few)}.` : '';
    return { text: `Spots open in ${listNames(open)} for fall.${extra}`, tone: 'bg-green' };
  }
  if (few.length > 0) {
    return { text: `A few spots left in ${listNames(few)} for fall.`, tone: 'bg-amber' };
  }
  return null;
}

onPageLoad(() => {
  const badges = document.querySelectorAll<HTMLElement>('[data-availability]');
  const line = document.querySelector<HTMLElement>('[data-spots-line]');
  if (badges.length === 0 && !line) return;
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
    // The hero spots line (SpotsLine.astro) — only ever REVEALS honest news.
    if (line) {
      const spots = spotsLineFor(items);
      if (spots) {
        const label = line.querySelector('[data-spots-label]');
        const dot = line.querySelector<HTMLElement>('[data-spots-dot]');
        if (label && dot) {
          label.textContent = spots.text;
          dot.className = `mr-1.5 inline-block h-2 w-2 rounded-full align-middle ${spots.tone}`;
          line.hidden = false;
        }
      }
    }
  });
});
