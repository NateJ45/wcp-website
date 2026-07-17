// Alert-banner dismiss. Remembers a dismissal per-message (the key encodes the
// message text), so closing one notice doesn't hide the NEXT, different notice.
// Re-runs on each View Transition navigation via onPageLoad.
import { onPageLoad } from './_page-load';

onPageLoad(() => {
  document.querySelectorAll<HTMLElement>('[data-alert]').forEach((banner) => {
    const key = banner.dataset.alertKey;
    // Guarded read: under Safari "Block All Cookies" / Firefox cookie blocking
    // localStorage ACCESS throws, and an unguarded throw here aborted the whole
    // loop before the dismiss button below was ever wired — the banner became
    // permanently un-dismissable for those users.
    let dismissed = false;
    try {
      dismissed = !!key && localStorage.getItem(key) === '1';
    } catch {
      /* storage blocked — treat as not dismissed */
    }
    if (dismissed) {
      banner.hidden = true;
      return;
    }
    banner
      .querySelector<HTMLButtonElement>('[data-alert-dismiss]')
      ?.addEventListener('click', () => {
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
});
