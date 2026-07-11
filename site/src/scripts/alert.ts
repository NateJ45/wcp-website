// Alert-banner dismiss. Remembers a dismissal per-message (the key encodes the
// message text), so closing one notice doesn't hide the NEXT, different notice.
document.querySelectorAll<HTMLElement>('[data-alert]').forEach((banner) => {
  const key = banner.dataset.alertKey;
  if (key && localStorage.getItem(key) === '1') {
    banner.hidden = true;
    return;
  }
  banner.querySelector<HTMLButtonElement>('[data-alert-dismiss]')?.addEventListener('click', () => {
    if (key) {
      try {
        localStorage.setItem(key, '1');
      } catch {
        /* private mode — dismiss for this view only */
      }
    }
    banner.hidden = true;
  });
});
