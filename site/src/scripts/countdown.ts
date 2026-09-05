// Live countdown. Fills the aria-hidden display with days/hours/minutes/seconds
// and updates each second; when the target passes, swaps in the "done" message.
// The accessible name (the date) is server-rendered, so nothing here is needed
// for screen readers — this is purely the visual ticker. Built with DOM methods
// + textContent (no innerHTML) so nothing untrusted is ever parsed as HTML.
//
// View Transitions: each [data-countdown] runs its own setInterval, so the
// timers are tracked and cleared before every navigation (and at the top of
// each page-load) — otherwise they would tick on for detached pages forever.
import { onPageLoad, onBeforeSwap } from './_page-load';

function makeUnit(value: number, label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'flex flex-col items-center';
  const num = document.createElement('span');
  num.className = 'font-display text-3xl tabular-nums md:text-4xl';
  num.textContent = String(value).padStart(2, '0');
  const lab = document.createElement('span');
  lab.className = 'text-xs tracking-wide text-white/70 uppercase';
  lab.textContent = label;
  wrap.append(num, lab);
  return wrap;
}

let timers: ReturnType<typeof setInterval>[] = [];
function clearTimers() {
  timers.forEach((t) => clearInterval(t));
  timers = [];
}

function init() {
  clearTimers();
  document.querySelectorAll<HTMLElement>('[data-countdown]').forEach((root) => {
    const target = root.dataset.target ? new Date(root.dataset.target).getTime() : NaN;
    const display = root.querySelector<HTMLElement>('[data-countdown-display]');
    const caption = root.querySelector<HTMLElement>('[data-countdown-caption]');
    if (!display || Number.isNaN(target)) return;

    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        const done = document.createElement('span');
        done.className = 'font-display text-3xl md:text-4xl';
        done.textContent = root.dataset.done || "It's here!";
        display!.replaceChildren(done);
        if (caption) caption.hidden = true;
        clearInterval(timer);
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      display!.replaceChildren(
        makeUnit(days, 'days'),
        makeUnit(hours, 'hrs'),
        makeUnit(mins, 'min'),
        makeUnit(secs, 'sec'),
      );
    }

    tick();
    const timer = setInterval(tick, 1000);
    timers.push(timer);
  });
}

onPageLoad(init);
onBeforeSwap(clearTimers);

// BFCACHE: onBeforeSwap (pagehide) cleared the timers, and a Back/Forward
// restore does not re-fire onPageLoad — the countdown sat frozen at stale
// numbers forever. Rebuild on a persisted restore (init clears timers first,
// so this is safe to run repeatedly).
window.addEventListener('pageshow', (e) => {
  if (e.persisted) init();
});

