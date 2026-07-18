// ============================================================================
// Hub search (Cmd/Ctrl+K) — filter + jump, all client-side after one fetch
// ============================================================================
// The index comes from /family-hub/api/search-index once per page (module
// promise cache, backed by the endpoint's Cache-Control since every navigation
// is a fresh document here). It carries page/update/document names AND the
// words inside each page-builder section, so "sunscreen" finds the handbook
// paragraph that mentions it, not just pages with it in the title.
//
// Matching stays humble — case-insensitive, every typed word must appear — but
// it now RANKS by where the match landed (title > page label > body). Without
// that, one passing mention in a long handbook would outrank the page actually
// named for the thing. A body hit shows a snippet around the match so the
// result explains itself. Still no fuzzy library shipped.
//
// Results are real links (keyboard: ArrowDown/Up move through them, Enter
// follows, Esc closes via the native <dialog>). All result DOM is built with
// createElement/textContent — no HTML strings, nothing injectable.
// ============================================================================
import { onPageLoad } from '@/scripts/_page-load';
import { snippet } from '@/lib/hub-search-index';

interface Entry {
  title: string;
  href: string;
  kind: string;
  sub?: string;
  /** Body words (page sections, update bodies). Absent on title-only entries. */
  text?: string;
}

const KIND_ICON: Record<string, string> = {
  page: '📄',
  update: '📣',
  document: '📎',
  'sign-up': '📝',
  section: '🔎',
};

let indexPromise: Promise<Entry[]> | null = null;
const loadIndex = (): Promise<Entry[]> => {
  indexPromise ??= fetch('/family-hub/api/search-index')
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  return indexPromise;
};

/** Where a query matched. Lower sorts first, so names beat body prose. */
const TITLE_HIT = 0;
const LABEL_HIT = 1;
const BODY_HIT = 2;
const NO_HIT = 3;

/**
 * Rank rather than a boolean: now that section bodies are indexed, a plain
 * "every word appears somewhere" test would let a passing mention in a long
 * handbook outrank the page actually named that. Title first, then the page
 * label, then body text.
 */
function hitRank(entry: Entry, words: string[]): number {
  const title = entry.title.toLowerCase();
  const label = `${entry.title} ${entry.sub ?? ''}`.toLowerCase();
  const all = `${label} ${entry.text ?? ''}`.toLowerCase();
  if (words.every((w) => title.includes(w))) return TITLE_HIT;
  if (words.every((w) => label.includes(w))) return LABEL_HIT;
  if (words.every((w) => all.includes(w))) return BODY_HIT;
  return NO_HIT;
}

function resultLink(hit: Entry, words: string[], rank: number): HTMLLIElement {
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
  // On a BODY match the page label alone ("Twos & Threes Classroom") doesn't
  // explain the hit, so show the matched words in context instead. Still
  // textContent — no HTML strings anywhere in this file.
  const detail = rank === BODY_HIT && hit.text ? snippet(hit.text, words) : (hit.sub ?? '');
  if (detail) {
    const sub = document.createElement('span');
    sub.className = 'block truncate text-xs text-ink-muted';
    sub.textContent = detail;
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
    const hits =
      words.length === 0
        ? index.filter((e) => e.kind === 'page').map((entry) => ({ entry, rank: TITLE_HIT }))
        : index
            .map((entry) => ({ entry, rank: hitRank(entry, words) }))
            .filter((h) => h.rank !== NO_HIT);

    const ranked = hits
      .sort((a, b) => {
        // Where it matched first, then title-starts-with inside the same tier.
        if (a.rank !== b.rank) return a.rank - b.rank;
        const aStarts = a.entry.title.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.entry.title.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts;
      })
      // A few more than the old 8: body matches mean more genuine candidates,
      // but the list still has to stay glanceable inside the dialog.
      .slice(0, 12);

    list.replaceChildren(...ranked.map((h) => resultLink(h.entry, words, h.rank)));
    emptyNote.classList.toggle('hidden', ranked.length > 0);
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
