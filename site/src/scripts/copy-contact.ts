// ============================================================================
// Copy-to-clipboard for contact buttons
// ============================================================================
// mailto:/tel: links silently do nothing on a desktop with no mail/phone app
// configured. So clicking an [data-copy] button ALSO copies its value and shows
// a toast — a reliable action everywhere. The native href is left intact (not
// prevented), so on a phone the tap still opens the mail app or dialer.
//
// Delegated + guarded, registered via onPageLoad so it survives View
// Transitions without stacking listeners.
// ============================================================================
import { onPageLoad } from './_page-load';

let hideTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(msg: string): void {
  const toast = document.getElementById('wcp-toast');
  const label = document.getElementById('wcp-toast-msg');
  if (!toast || !label) return;
  label.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = '';
  }, 2400);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / non-secure contexts.
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

let bound = false;
onPageLoad(() => {
  if (bound) return;
  bound = true;
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-copy]');
    if (!el) return;
    const text = el.dataset.copy;
    if (!text) return;
    // On a desktop (fine pointer) the mailto:/tel: link usually opens nothing,
    // so intercept it and copy instead. On touch devices, let the tap open the
    // mail app / dialer as usual (and copy as a bonus).
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (!touch) e.preventDefault();
    const label = el.dataset.copyLabel || text;
    copyText(text).then((ok) => showToast(ok ? `Copied ${label}` : `${label}: ${text}`));
  });
});
