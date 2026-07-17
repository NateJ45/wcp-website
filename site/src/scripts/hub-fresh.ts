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

function init() {
  if (!location.pathname.startsWith('/family-hub')) return;

  // Re-runnable (bfcache restores re-enter here): drop everything a previous
  // pass rendered, then recompute against the CURRENT seen-time — otherwise a
  // Back-restored page keeps showing "New" pills for items the family just
  // read on the Updates page.
  document
    .querySelectorAll<HTMLElement>('[data-fresh-pill], [data-fresh-badge]')
    .forEach((el) => el.remove());
  document.querySelectorAll<HTMLElement>('[data-bell-badge]').forEach((slot) => {
    slot.replaceChildren();
  });

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

  // PAGE items drive the rail/tab "Updates" badge as before; rows inside a
  // bell panel ([data-bell-panel], added 2026-07-14) are excluded here — they
  // duplicate page content on purpose and get their own per-bell count below.
  let fresh = 0;
  for (const item of document.querySelectorAll<HTMLElement>('[data-published]')) {
    const at = Date.parse(item.dataset.published ?? '');
    if (!Number.isFinite(at) || at <= seenTime) continue;
    if (!item.closest('[data-bell-panel]')) fresh++;
    if (!item.querySelector('[data-fresh-pill]')) {
      const pill = document.createElement('span');
      pill.setAttribute('data-fresh-pill', '');
      pill.className =
        'ml-2 inline-block rounded-full bg-amber px-1.5 py-0.5 align-middle text-[0.6rem] font-bold tracking-wide text-navy uppercase';
      pill.textContent = 'New';
      (item.querySelector('a, p') ?? item).appendChild(pill);
    }
  }

  // Bell badge: each bell (desktop bar + phone strip both render one) is
  // badged with its OWN panel's unseen count, so the duplicate panels never
  // inflate each other.
  for (const bell of document.querySelectorAll<HTMLElement>('[data-hub-bell]')) {
    const count = [
      ...bell.querySelectorAll<HTMLElement>('[data-bell-panel] [data-published]'),
    ].filter((el) => {
      const at = Date.parse(el.dataset.published ?? '');
      return Number.isFinite(at) && at > seenTime;
    }).length;
    const slot = bell.querySelector<HTMLElement>('[data-bell-badge]');
    if (!slot || count === 0 || slot.childElementCount > 0) continue;
    const badge = document.createElement('span');
    badge.className =
      'inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 text-[0.6rem] font-bold text-navy';
    badge.textContent = String(count);
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = ` (${count} new)`;
    badge.appendChild(sr);
    slot.appendChild(badge);
  }

  // Opening a bell marks everything seen: badges and pills clear on the next
  // page rather than mid-look (yanking rows a reader is scanning is worse).
  for (const bell of document.querySelectorAll<HTMLDetailsElement>('details[data-hub-bell]')) {
    if (bell.dataset.freshBound) continue; // init re-runs on bfcache restore
    bell.dataset.freshBound = '1';
    bell.addEventListener('toggle', () => {
      if (!bell.open) return;
      try {
        localStorage.setItem(KEY, new Date().toISOString());
      } catch {
        /* ignore */
      }
    });
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
}

onPageLoad(init);

// BFCACHE: a Back/Forward restore skips onPageLoad, so the restored page kept
// its pre-visit pills and badge counts. Recompute (init cleans up first).
window.addEventListener('pageshow', (e) => {
  if (e.persisted) init();
});

export {};
