// ============================================================================
// hub-event-dialog — the event / day details modal (Calendar page + hub home)
// ============================================================================
// One native <dialog> (HubEventDialog.astro) reused by every trigger:
//   - [data-event-id]  (agenda card, grid pill, home-widget row) → one event
//   - [data-day-key]   (grid day cell)          → every event on that day
// Data comes from pre-formatted JSON blobs ([data-hub-events]), so the client
// never touches timezones and there's no per-event markup to duplicate. Blobs
// are collected LAZILY at click time, not at page load: the home dashboard's
// Upcoming Events widget is a server:defer island whose blob streams in after
// the initial scan would have run (the classic island one-shot-scan trap).
// By the time a trigger inside it can be clicked, its blob is in the DOM.
// User strings go in via textContent (never innerHTML), so a title/description
// can't inject markup; icons are cloned from <template>s the component rendered.
// No-JS visitors keep the agenda + grid as static info, and link-based
// triggers (the home widget rows) navigate to their href instead — the
// preventDefault below only fires when the dialog can actually serve the
// click.
// ============================================================================
import { onPageLoad } from '@/scripts/_page-load';
import type { EventDetail } from '@/lib/hub-calendar';

function cloneIcon(name: string): Node | null {
  const tpl = document.querySelector<HTMLTemplateElement>(`template[data-icon="${name}"]`);
  const svg = tpl?.content.firstElementChild;
  return svg ? svg.cloneNode(true) : null;
}

function metaRow(iconName: string, text: string): HTMLElement {
  const p = document.createElement('p');
  p.className = 'flex items-center gap-2 text-sm text-ink-muted';
  const ic = cloneIcon(iconName);
  if (ic) p.append(ic);
  const span = document.createElement('span');
  span.textContent = text;
  p.append(span);
  return p;
}

function detailBlock(d: EventDetail, withDivider: boolean): HTMLElement {
  const article = document.createElement('article');
  article.className = withDivider ? 'border-t border-border pt-5' : '';

  const badge = document.createElement('p');
  badge.className = 'flex items-center gap-1.5 text-xs font-bold text-ink-muted';
  const dot = document.createElement('span');
  dot.className = 'h-2 w-2 rounded-full';
  dot.style.background = d.typeAccent;
  const badgeText = document.createElement('span');
  badgeText.textContent = d.typeLabel;
  badge.append(dot, badgeText);
  article.append(badge);

  const h3 = document.createElement('h3');
  h3.className = 'mt-1 text-lg font-extrabold text-heading';
  h3.textContent = d.title;
  article.append(h3);

  const meta = document.createElement('div');
  meta.className = 'mt-2 flex flex-col gap-1.5';
  meta.append(metaRow('clock', d.timeLabel));
  if (d.location) meta.append(metaRow('map-pin', d.location));
  article.append(meta);

  if (d.description) {
    const desc = document.createElement('p');
    desc.className = 'mt-3 text-sm leading-relaxed whitespace-pre-line text-ink';
    desc.textContent = d.description;
    article.append(desc);
  }

  const add = document.createElement('a');
  add.href = d.addUrl;
  add.target = '_blank';
  add.rel = 'noopener';
  add.className =
    'mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-ink hover:underline';
  const plus = cloneIcon('plus');
  if (plus) add.append(plus);
  const addText = document.createElement('span');
  addText.textContent = 'Add to my calendar';
  add.append(addText);
  article.append(add);

  return article;
}

function wire(): void {
  const dialog = document.getElementById('hub-event-dialog') as HTMLDialogElement | null;
  if (!dialog || typeof dialog.showModal !== 'function') return;

  // Event data, merged from every [data-hub-events] blob seen so far. Parsed
  // lazily and re-scanned on a lookup miss, so blobs that stream in later
  // (server islands) are picked up the first time one of their triggers is
  // clicked.
  const byId = new Map<string, EventDetail>();
  const byDay = new Map<string, EventDetail[]>();
  const parsedBlobs = new WeakSet<Element>();
  const scanBlobs = () => {
    for (const blob of document.querySelectorAll('script[data-hub-events]')) {
      if (parsedBlobs.has(blob)) continue;
      parsedBlobs.add(blob);
      let details: EventDetail[] = [];
      try {
        details = JSON.parse(blob.textContent ?? '') as EventDetail[];
      } catch {
        continue;
      }
      for (const d of details) {
        if (byId.has(d.id)) continue; // calendar + widget can carry the same event
        byId.set(d.id, d);
        (byDay.get(d.dayKey) ?? byDay.set(d.dayKey, []).get(d.dayKey)!).push(d);
      }
    }
  };
  const lookupId = (id: string) => {
    if (!byId.has(id)) scanBlobs();
    return byId.get(id);
  };
  const lookupDay = (key: string) => {
    if (!byDay.has(key)) scanBlobs();
    return byDay.get(key);
  };

  const titleEl = dialog.querySelector('[data-dialog-title]') as HTMLElement | null;
  const body = dialog.querySelector('[data-dialog-body]') as HTMLElement | null;

  const open = (list: EventDetail[]) => {
    if (!list.length || !body) return;
    if (titleEl) titleEl.textContent = list[0].dateLabel;
    body.replaceChildren(...list.map((d, i) => detailBlock(d, i > 0)));
    dialog.showModal();
  };

  document.addEventListener('click', (e) => {
    const t = e.target as Element | null;
    const evEl = t?.closest?.('[data-event-id]') as HTMLElement | null;
    if (evEl) {
      // Modified clicks on link triggers (new tab, etc.) keep native behavior.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const d = lookupId(evEl.dataset.eventId ?? '');
      if (d) {
        e.preventDefault();
        open([d]);
      }
      return;
    }
    const dayEl = t?.closest?.('[data-day-key]') as HTMLElement | null;
    if (dayEl) {
      const list = lookupDay(dayEl.dataset.dayKey ?? '');
      if (list?.length) open(list);
    }
  });

  dialog.querySelector('[data-dialog-close]')?.addEventListener('click', () => dialog.close());
  // A click on the ::backdrop registers with the dialog itself as the target.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}

onPageLoad(() => {
  if (document.getElementById('hub-event-dialog')) wire();
});

