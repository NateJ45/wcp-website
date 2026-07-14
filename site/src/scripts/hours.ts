// =============================================================================
// My Co-op Hours — remember the family name + background-submit new hours
// =============================================================================
// The hub has no per-family login, so a family identifies itself by the name it
// types. We stash that in localStorage (wcp-family-name, shared with any future
// name-scoped hub feature) so the family doesn't retype it every visit:
//   - On load, if the URL has no ?family and we have a stored name, jump to it
//     so the family's hours load automatically.
//   - Saving the lookup or logging hours updates the stored name.
// The log form submits in the background (like hub-signup); on success we return
// to the family's own view with ?thanks=1 so the fresh ledger + banner render
// server-side. Without JS the native GET/POST still work. onPageLoad = View-
// Transitions safe (the forms are swapped in fresh each navigation).
// =============================================================================
import { onPageLoad } from '@/scripts/_page-load';

const KEY = 'wcp-family-name';

const read = (): string => {
  try {
    return (localStorage.getItem(KEY) ?? '').trim();
  } catch {
    return '';
  }
};
const save = (name: string) => {
  try {
    if (name.trim()) localStorage.setItem(KEY, name.trim());
  } catch {
    /* private mode — ignore */
  }
};

onPageLoad(() => {
  const input = document.querySelector<HTMLInputElement>('[data-family-input]');
  if (!input) return; // tracker off, or not this page

  const url = new URL(window.location.href);
  const stored = read();

  // Auto-load the stored family when the page was opened without a name.
  if (!url.searchParams.get('family') && stored) {
    url.searchParams.set('family', stored);
    window.location.replace(url.toString());
    return;
  }

  // Prefill + remember on lookup.
  if (!input.value && stored) input.value = stored;
  input.form?.addEventListener('submit', () => save(input.value));

  // Background-submit the log-hours form.
  const form = document.querySelector<HTMLFormElement>('[data-hours-form]');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const done = form.querySelector<HTMLElement>('[data-hours-done]');
    const error = form.querySelector<HTMLElement>('[data-hours-error]');
    error?.classList.add('hidden');
    if (button) button.disabled = true;
    const family = (
      form.querySelector<HTMLInputElement>('[name="familyName"]')?.value ?? ''
    ).trim();
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { accept: 'application/json' },
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || 'failed');
      save(family);
      done?.classList.remove('hidden');
      // Reload the family's view so the new row + progress render fresh.
      const next = new URL('/family-hub/hours', window.location.origin);
      next.searchParams.set('family', family);
      next.searchParams.set('thanks', '1');
      window.location.assign(next.toString());
    } catch (err) {
      if (button) button.disabled = false;
      if (error) {
        error.textContent =
          err instanceof Error && err.message !== 'failed'
            ? err.message
            : 'Something went wrong — try again?';
        error.classList.remove('hidden');
      }
    }
  });
});
