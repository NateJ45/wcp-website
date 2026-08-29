// ============================================================================
// My classes — device-level personalization, no accounts
// ============================================================================
// One localStorage key ('wcp-my-classes': a JSON array of class slugs) picked
// on the hub home. MULTI-select on purpose — plenty of families have kids in
// more than one class. Effects, all progressive enhancement (nothing breaks or
// changes without JS):
//   - the home picker chips toggle (aria-pressed); Done shows the
//     "Your classes: X, Y · Change" strip
//   - each of your classes' helper tiles moves to the front (order kept)
//     and unhides its "Your class" tag
//   - each of your classes' photo-album buttons gets an amber ring
//   - your classes' rail/drawer links get a small amber dot (two classes that
//     share one classroom page get one dot, not two)
//
// THE CLASS LIST IS DATA, NOT CODE. It used to be a hardcoded map of the four
// 2026-27 slugs here, which is exactly why a class the Board added was invisible
// to the hub. BaseLayout's hub branch now prints the list — slug, label, and the
// classroom page each class lives on — into a `data-hub-classes` JSON tag on
// every hub page, straight from the `class` documents.
// ============================================================================
import { onPageLoad } from '@/scripts/_page-load';

const KEY = 'wcp-my-classes';

interface HubClassEntry {
  slug: string;
  label: string;
  page: string;
}

/** The classes this hub knows, in the Board's order. Empty is a valid answer. */
function classList(): HubClassEntry[] {
  const tag = document.querySelector('[data-hub-classes]');
  if (!tag?.textContent) return [];
  try {
    const rows = JSON.parse(tag.textContent);
    return Array.isArray(rows) ? rows.filter((r) => r?.slug && r?.page) : [];
  } catch {
    return [];
  }
}

let CLASSES: Record<string, HubClassEntry> = {};
let ORDER: string[] = [];

function getPicks(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return ORDER.filter((slug) => raw.includes(slug)); // valid slugs, stable order
  } catch {
    return [];
  }
}

function setPicks(picks: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(picks));
  } catch {
    /* storage unavailable — the picks still apply for this page view */
  }
}

function apply(picks: string[]): void {
  // Reset all personalization marks, then re-apply for the current set.
  for (const tag of document.querySelectorAll<HTMLElement>('[data-my-class-tag]')) {
    tag.classList.add('hidden');
  }
  for (const album of document.querySelectorAll<HTMLElement>('[data-class-album]')) {
    album.classList.remove('ring-2', 'ring-amber');
  }
  for (const dot of document.querySelectorAll<HTMLElement>('[data-my-class-dot]')) {
    dot.remove();
  }
  if (picks.length === 0) return;

  // Helper tiles: yours first, keeping their own relative order (prepend in
  // reverse so the first pick ends up first).
  for (const slug of [...picks].reverse()) {
    const tile = document.querySelector<HTMLElement>(`[data-class-tile="${slug}"]`);
    if (tile?.parentElement) {
      tile.parentElement.prepend(tile);
      tile.querySelector('[data-my-class-tag]')?.classList.remove('hidden');
    }
  }

  // Photo album buttons: amber ring on each of yours.
  for (const slug of picks) {
    document
      .querySelector<HTMLElement>(`[data-class-album="${slug}"]`)
      ?.classList.add('ring-2', 'ring-amber');
  }

  // Rail + drawer links: one amber dot per unique CLASSROOM page (two classes
  // that share one page — Pre-K AM + PM — never double-dot it).
  const pages = [...new Set(picks.map((slug) => CLASSES[slug]?.page).filter(Boolean))];
  for (const page of pages) {
    for (const link of document.querySelectorAll<HTMLElement>(`aside a[href="${page}"]`)) {
      const dot = document.createElement('span');
      dot.setAttribute('data-my-class-dot', '');
      dot.setAttribute('aria-hidden', 'true');
      dot.className = 'ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber align-middle';
      link.appendChild(dot);
    }
  }
}

function syncStrips(picks: string[], editing: boolean): void {
  const picker = document.querySelector<HTMLElement>('[data-my-class-picker]');
  const current = document.querySelector<HTMLElement>('[data-my-class-current]');
  if (!picker || !current) return;

  picker.hidden = !editing && picks.length > 0;
  current.hidden = editing || picks.length === 0;

  for (const chip of picker.querySelectorAll<HTMLButtonElement>('[data-my-class-pick]')) {
    chip.setAttribute('aria-pressed', String(picks.includes(chip.dataset.myClassPick ?? '')));
  }
  const done = picker.querySelector<HTMLElement>('[data-my-class-done]');
  if (done) done.hidden = picks.length === 0;

  if (picks.length > 0) {
    const label = current.querySelector<HTMLElement>('[data-my-class-label]');
    if (label) label.textContent = picks.map((slug) => CLASSES[slug]?.label ?? slug).join(', ');
    const plural = current.querySelector<HTMLElement>('[data-my-class-plural]');
    if (plural) plural.hidden = picks.length === 1;
  }
}

onPageLoad(() => {
  const rows = classList();
  CLASSES = Object.fromEntries(rows.map((r) => [r.slug, r]));
  ORDER = rows.map((r) => r.slug);

  let picks = getPicks();
  syncStrips(picks, false);
  apply(picks);

  for (const chip of document.querySelectorAll<HTMLButtonElement>('[data-my-class-pick]')) {
    chip.addEventListener('click', () => {
      const slug = chip.dataset.myClassPick;
      if (!slug) return;
      picks = picks.includes(slug)
        ? picks.filter((s) => s !== slug)
        : ORDER.filter((s) => picks.includes(s) || s === slug);
      setPicks(picks);
      syncStrips(picks, true); // stay in edit mode while toggling
      apply(picks);
      // Notify the topbar quick links (hub-quicklinks.ts) so the Helper
      // schedule / Pay tuition links repersonalize without a reload.
      document.dispatchEvent(new CustomEvent('wcp:my-classes', { detail: picks }));
    });
  }
  document
    .querySelector<HTMLButtonElement>('[data-my-class-done]')
    ?.addEventListener('click', () => syncStrips(picks, false));
  document
    .querySelector<HTMLButtonElement>('[data-my-class-change]')
    ?.addEventListener('click', () => syncStrips(picks, true));

  // The first-visit tour writes the same key through its own chips. Re-read
  // and re-apply on its event so the page behind the modal follows along.
  // The handler is idempotent, so this script's own dispatches are harmless.
  document.addEventListener('wcp:my-classes', () => {
    picks = getPicks();
    syncStrips(picks, false);
    apply(picks);
  });
});

export {};
