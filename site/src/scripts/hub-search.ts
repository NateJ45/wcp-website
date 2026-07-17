// ============================================================================
// Hub search (Cmd/Ctrl+K) — filter + jump, all client-side after one fetch
// ============================================================================
// The index comes from /family-hub/api/search-index once per page (module
// promise cache). Matching is humble on purpose: case-insensitive, every
// typed word must appear, title-starts-with ranks first — for a corpus of a
// few hundred titles that beats a fuzzy library nobody has to ship. Results
// are real links (keyboard: ArrowDown/Up move through them, Enter follows,
// Esc closes via the native <dialog>). All result DOM is built with
// createElement/textContent — no HTML strings, nothing injectable.
// ============================================================================
import { onPageLoad } from '@/scripts/_page-load';

interface Entry {
  title: string;
  href: string;
  kind: string;
  sub?: string;
}

const KIND_ICON: Record<string, string> = {
  page: '📄',
  update: '📣',
  document: '📎',
  'sign-up': '📝',
};

let indexPromise: Promise<Entry[]> | null = null;
const loadIndex = (): Promise<Entry[]> => {
  indexPromise ??= fetch('/family-hub/api/search-index')
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  return indexPromise;
};

function matches(entry: Entry, words: string[]): boolean {
  const hay = `${entry.title} ${entry.sub ?? ''}`.toLowerCase();
  return words.every((w) => hay.includes(w));
}

function resultLink(hit: Entry): HTMLLIElement {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = hit.href;
  a.className =
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-ink no-underline hover:bg-grey focus:bg-grey focus:outline-none dark:hover:bg-white/10 dark:focus:bg-white/10';
  if (/^https?:\/\//.test(hit.href)) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = KIND_ICON[hit.kind] ?? '📄';
  const text = document.createElement('span');
  text.className = 'min-w-0 flex-1';
  const title = document.createElement('span');
  title.className = 'block truncate font-semibold text-heading';
  title.textContent = hit.title;
  text.appendChild(title);
  if (hit.sub) {
    const sub = document.createElement('span');
    sub.className = 'block text-xs text-ink-muted';
    sub.textContent = hit.sub;
    text.appendChild(sub);
  }
  a.append(icon, text);
  li.appendChild(a);
  return li;
}

onPageLoad(() => {
  const dialog = document.getElementById('hub-search') as HTMLDialogElement | null;
  if (!dialog) return;
  // No <dialog> support (iOS <=15.3): opening would throw a TypeError on a
  // visible, always-rendered affordance. Hide the triggers instead — same
  // guard hub-event-dialog.ts and social-lightbox.ts already carry.
  if (typeof dialog.showModal !== 'function') {
    for (const trigger of document.querySelectorAll<HTMLElement>('[data-hub-search-open]')) {
      trigger.hidden = true;
    }
    return;
  }
  const input = dialog.querySelector<HTMLInputElement>('#hub-search-input')!;
  const list = dialog.querySelector<HTMLUListElement>('#hub-search-results')!;
  const emptyNote = dialog.querySelector<HTMLElement>('#hub-search-empty')!;

  const render = async () => {
    const q = input.value.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const index = await loadIndex();
    const hits = (
      words.length === 0
        ? index.filter((e) => e.kind === 'page')
        : index.filter((e) => matches(e, words))
    )
      .sort((a, b) => {
        const aStarts = a.title.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.title.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts;
      })
      .slice(0, 8);

    list.replaceChildren(...hits.map(resultLink));
    emptyNote.classList.toggle('hidden', hits.length > 0);
  };

  const open = () => {
    if (dialog.open) return;
    dialog.showModal();
    input.value = '';
    void render();
    input.focus();
  };

  for (const trigger of document.querySelectorAll<HTMLElement>('[data-hub-search-open]')) {
    trigger.addEventListener('click', open);
  }
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open();
    }
  });

  input.addEventListener('input', () => void render());

  // Arrow keys: input ↔ results (results are real links; Enter just follows).
  dialog.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const links = [...list.querySelectorAll<HTMLAnchorElement>('a')];
    if (links.length === 0) return;
    e.preventDefault();
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === 'ArrowDown') (links[at + 1] ?? links[0]).focus();
    else if (at <= 0) input.focus();
    else links[at - 1].focus();
  });

  // Click on the backdrop closes (native Esc already works).
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
});

export {};
