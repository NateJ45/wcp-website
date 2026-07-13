import { onPageLoad } from './_page-load';
import { waitlistMessage } from '@/lib/announcements';
import type { ClassAvailability } from '@/lib/gsheets';

// =============================================================================
// Announcement bars — client behavior (progressive enhancement)
// =============================================================================
// Server-side each page ships the bars whose placement matches it. Here we:
//   1. hide bars the visitor already dismissed (localStorage, keyed by id +
//      start date so a re-scheduled window shows again),
//   2. re-check each bar's show-from / show-until against the current time, so
//      a bar crosses its boundary between rebuilds,
//   3. wire the dismiss button,
//   4. fill the "waitlist" bar's text from the live /api/availability feed so
//      it's current without a rebuild.
// No-JS visitors keep whatever was in-window at build time.
// =============================================================================
onPageLoad(() => {
  const bars = document.querySelectorAll<HTMLElement>('[data-ann]');
  if (!bars.length) return;
  const now = Date.now();

  bars.forEach((bar) => {
    const id = bar.dataset.ann ?? '';
    const from = bar.dataset.annFrom ? new Date(bar.dataset.annFrom).getTime() : -Infinity;
    const until = bar.dataset.annUntil ? new Date(bar.dataset.annUntil).getTime() : Infinity;
    const key = `wcp-ann-${id}-${Number.isFinite(from) ? from : '0'}`;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(key) === '1';
    } catch {
      /* private mode */
    }

    const inWindow = now >= from && now <= until;
    bar.hidden = dismissed || !inWindow;

    bar.querySelector<HTMLButtonElement>('[data-ann-dismiss]')?.addEventListener('click', () => {
      try {
        localStorage.setItem(key, '1');
      } catch {
        /* private mode — dismiss for this view only */
      }
      bar.hidden = true;
    });

    if (!bar.hidden && bar.dataset.annWaitlist === 'true') void hydrateWaitlist(bar);
  });
});

async function hydrateWaitlist(bar: HTMLElement): Promise<void> {
  try {
    const res = await fetch('/api/availability');
    if (!res.ok) return;
    const items = (await res.json()) as ClassAvailability[];
    const msg = waitlistMessage(items);
    const el = bar.querySelector<HTMLElement>('[data-ann-message]');
    if (msg && el) el.textContent = msg;
  } catch {
    /* keep the build-time / fallback text */
  }
}
