import { onPageLoad } from './_page-load';

// =============================================================================
// Review form — background submit + inline thank-you (progressive enhancement)
// =============================================================================
// No-JS visitors get a native POST that redirects to /thank-you. With JS we
// submit in the background and swap in the inline success/error message, so the
// visitor stays on the page. Guards on the markup, so it's a no-op elsewhere.
// =============================================================================
onPageLoad(() => {
  const form = document.querySelector<HTMLFormElement>('[data-review-form]');
  if (!form) return;
  const success = form.querySelector<HTMLElement>('[data-review-success]');
  const error = form.querySelector<HTMLElement>('[data-review-error]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (error) error.hidden = true;
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        form.reset();
        if (success) success.hidden = false;
      } else {
        if (error) {
          error.textContent = data.error ?? 'Sorry, something went wrong. Please try again.';
          error.hidden = false;
        }
      }
    } catch {
      if (error) {
        error.textContent = 'Sorry, something went wrong. Please try again.';
        error.hidden = false;
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
});
