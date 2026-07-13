// ============================================================================
// "New since your last visit" — lightweight, device-level freshness marks
// ============================================================================
// localStorage 'wcp-updates-seen' holds the last time this device opened the
// Updates page. On every hub page: items carrying data-published (the home
// dashboard's announcement + minutes lists) newer than that get a "New" pill,
// and the Updates links in the rail, drawer, and bottom tab bar get a count
// badge. Opening /family-hub/updates marks everything seen. First-ever visit
// seeds the timestamp silently (nothing on the page is "new to you" when all
// of it is). Progressive enhancement — without JS nothing changes.
// ============================================================================
import { onPageLoad } from '@/scripts/_page-load';

const KEY = 'wcp-updates-seen';

onPageLoad(() => {
  if (!location.pathname.startsWith('/family-hub')) return;

  let seen: string | null = null;
  try {
    seen = localStorage.getItem(KEY);
  } catch {
    return; // no storage → no freshness marks
  }

  // Opening Updates marks everything read (badges clear on the next page).
  if (location.pathname.startsWith('/family-hub/updates')) {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    return;
  }

  // First visit: seed silently — everything is new, so nothing is.
  if (!seen) {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    return;
  }

  const seenTime = Date.parse(seen);
  if (!Number.isFinite(seenTime)) return;

  let fresh = 0;
  for (const item of document.querySelectorAll<HTMLElement>('[data-published]')) {
    const at = Date.parse(item.dataset.published ?? '');
    if (!Number.isFinite(at) || at <= seenTime) continue;
    fresh++;
    if (!item.querySelector('[data-fresh-pill]')) {
      const pill = document.createElement('span');
      pill.setAttribute('data-fresh-pill', '');
      pill.className =
        'ml-2 inline-block rounded-full bg-amber px-1.5 py-0.5 align-middle text-[0.6rem] font-bold tracking-wide text-navy uppercase';
      pill.textContent = 'New';
      (item.querySelector('a, p') ?? item).appendChild(pill);
    }
  }
  if (fresh === 0) return;

  // Count badge on every Updates link: rail + drawer (aside) and the bottom
  // tab bar ([data-tab-updates]). Amber-on-navy: 4.6:1, AA for bold 10px.
  const targets = document.querySelectorAll<HTMLElement>(
    'aside a[href="/family-hub/updates"], [data-tab-updates]',
  );
  for (const link of targets) {
    if (link.querySelector('[data-fresh-badge]')) continue;
    const badge = document.createElement('span');
    badge.setAttribute('data-fresh-badge', '');
    badge.className =
      'ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 text-[0.6rem] font-bold text-navy';
    badge.textContent = String(fresh);
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = ` (${fresh} new)`;
    badge.appendChild(sr);
    link.appendChild(badge);
  }
});

export {};
