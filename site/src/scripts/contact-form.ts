// Progressive enhancement for ContactForm. Without this the form does a normal
// POST and the server redirects to /thank-you; with it, the form submits in the
// background and swaps in the inline thank-you message instead of navigating.
// Re-binds on each View Transition navigation via onPageLoad.
import { onPageLoad } from './_page-load';

function enhance(root: Element) {
  const form = root.querySelector<HTMLFormElement>('[data-contact-form]');
  const success = root.querySelector<HTMLElement>('[data-contact-success]');
  const errorEl = root.querySelector<HTMLElement>('[data-form-error]');
  if (!form || !success) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (button) button.disabled = true;
    errorEl?.classList.add('hidden');

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(String(res.status));
      form.classList.add('hidden');
      success.classList.remove('hidden');
      success.focus?.();
    } catch {
      errorEl?.classList.remove('hidden');
      if (button) button.disabled = false;
    }
  });
}

onPageLoad(() => document.querySelectorAll('[data-contact-root]').forEach(enhance));
