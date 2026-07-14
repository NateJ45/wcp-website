// =============================================================================
// Family photo upload — background submit for /family-hub/photos
// =============================================================================
// The [data-photo-form] posts a multipart upload to /family-hub/api/photo-submit.
// With JS the button disables and shows progress, then the page reloads to the
// thank-you (the photo is pending moderation, so there's nothing new to show in
// place). Without JS the native multipart POST redirects back with ?thanks=1.
// onPageLoad = View-Transitions safe (the form is swapped fresh each navigation).
// =============================================================================
import { onPageLoad } from '@/scripts/_page-load';

onPageLoad(() => {
  const form = document.querySelector<HTMLFormElement>('[data-photo-form]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const done = form.querySelector<HTMLElement>('[data-photo-done]');
    const error = form.querySelector<HTMLElement>('[data-photo-error]');
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
      done?.classList.remove('hidden');
      // Reload to the thank-you state (the new photo waits on moderation).
      window.location.assign('/family-hub/photos?thanks=1');
    } catch (err) {
      if (button) {
        button.disabled = false;
        button.textContent = 'Send photo';
      }
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
