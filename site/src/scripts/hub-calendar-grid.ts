// ============================================================================
// hub-calendar-grid — month navigation for the branded calendar (HubCalendarGrid)
// ============================================================================
// Every month in range is already rendered server-side (one <table> each, only
// the current one visible). This just flips which is shown on prev / next /
// today, updates the header label + prev/next disabled state, and announces the
// month to screen readers. No date math, no templating — the server did all the
// rendering, so the grid always matches the SSR/tested output. No-JS visitors
// keep the current month (the only one not [hidden]).
// ============================================================================
import { onPageLoad } from '@/scripts/_page-load';

function wire(root: HTMLElement): void {
  const months = [...root.querySelectorAll<HTMLElement>('[data-cal-month]')];
  if (months.length <= 1) return; // single month: controls already disabled
  const prev = root.querySelector<HTMLButtonElement>('[data-cal-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-cal-next]');
  const todayBtn = root.querySelector<HTMLButtonElement>('[data-cal-today]');
  const label = root.querySelector<HTMLElement>('[data-cal-label]');
  const live = root.querySelector<HTMLElement>('[data-cal-live]');

  let i = months.findIndex((m) => !m.hidden);
  if (i < 0) i = 0;

  const show = (next2: number, announce: boolean) => {
    i = Math.max(0, Math.min(months.length - 1, next2));
    months.forEach((m, mi) => {
      m.hidden = mi !== i;
    });
    const text = months[i].dataset.calMonthlabel ?? '';
    if (label) label.textContent = text;
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === months.length - 1;
    if (todayBtn) todayBtn.disabled = i === 0;
    if (announce && live) live.textContent = text;
  };

  prev?.addEventListener('click', () => show(i - 1, true));
  next?.addEventListener('click', () => show(i + 1, true));
  todayBtn?.addEventListener('click', () => show(0, true));
  show(i, false); // sync disabled state to the initial month
}

onPageLoad(() => {
  document.querySelectorAll<HTMLElement>('[data-cal-root]').forEach(wire);
});
