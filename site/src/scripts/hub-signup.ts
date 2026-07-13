// =============================================================================
// Sign-up sheet forms — background submit for /family-hub/sign-ups
// =============================================================================
// Each [data-signup-form] posts to /family-hub/api/signup. With JS the submit
// happens in the background: the button disables, then either the inline
// thank-you replaces the fields or the error line appears (409 = the slot
// filled while the page was open). Without JS the native POST redirects back
// with ?thanks=1 — the page handles that server-side. View-Transitions safe
// via onPageLoad (forms are swapped in fresh each navigation).
// =============================================================================
import { onPageLoad } from '@/scripts/_page-load';

onPageLoad(() => {
  for (const form of document.querySelectorAll<HTMLFormElement>('[data-signup-form]')) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const done = form.querySelector<HTMLElement>('[data-signup-done]');
      const error = form.querySelector<HTMLElement>('[data-signup-error]');
      error?.classList.add('hidden');
      if (button) button.disabled = true;
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { accept: 'application/json' },
        });
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        if (!res.ok) throw new Error(data?.error || 'failed');
        // Success: hide the inputs, show the thank-you where the form was.
        for (const el of form.querySelectorAll<HTMLElement>('div, button')) {
          el.classList.add('hidden');
        }
        done?.classList.remove('hidden');
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
  }
});
