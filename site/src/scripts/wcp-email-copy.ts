// ============================================================================
// wcp-email-copy — clickable email addresses + desktop copy-to-clipboard
// ============================================================================
// Two jobs, site-wide (loaded from BaseLayout, so public + hub):
//   1. LINKIFY: turn plain-text email addresses in the page content into real
//      `mailto:` links (most were flat text you had to hand-copy). Existing
//      links / inputs / code are skipped, so nothing is double-wrapped.
//   2. COPY: on DESKTOP, clicking a link whose visible text IS an address copies
//      it to the clipboard and pops a "Copied!" token by the cursor (instead of
//      firing a mailto the machine may have no handler for). On touch devices,
//      and for labeled buttons like "Email the Administrator", the mailto opens
//      the mail app as usual.
// Skipped in Sanity's /preview so stega click-to-edit text nodes stay intact.
// ============================================================================
import { onPageLoad } from '@/scripts/_page-load';

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const EMAIL_G = new RegExp(EMAIL.source, 'g');
const SKIP = new Set([
  'A',
  'BUTTON',
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'CODE',
  'PRE',
  'KBD',
]);

function linkifyEmails(root: ParentNode): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const v = node.nodeValue;
      if (!v || v.indexOf('@') === -1 || !EMAIL.test(v)) return NodeFilter.FILTER_REJECT;
      for (let p = (node as Text).parentElement; p; p = p.parentElement) {
        if (SKIP.has(p.tagName) || p.isContentEditable) return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const targets: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) targets.push(n as Text);
  for (const node of targets) {
    const text = node.nodeValue as string;
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of text.matchAll(EMAIL_G)) {
      const idx = m.index ?? 0;
      if (idx > last) frag.append(text.slice(last, idx));
      const a = document.createElement('a');
      a.href = `mailto:${m[0]}`;
      a.textContent = m[0];
      a.className = 'wcp-email-link';
      a.dataset.email = m[0];
      frag.append(a);
      last = idx + m[0].length;
    }
    if (last < text.length) frag.append(text.slice(last));
    node.replaceWith(frag);
  }
}

let toastEl: HTMLElement | null = null;
let toastTimer: number | undefined;
function showToast(x: number, y: number): void {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'wcp-copy-toast';
    toastEl.setAttribute('role', 'status');
    toastEl.textContent = 'Copied!';
    document.body.appendChild(toastEl);
  }
  toastEl.style.left = `${x}px`;
  toastEl.style.top = `${y - 14}px`;
  toastEl.classList.remove('is-shown');
  void toastEl.offsetWidth; // restart the show transition
  toastEl.classList.add('is-shown');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl?.classList.remove('is-shown'), 1300);
}

let wired = false;
function wireCopyOnce(): void {
  if (wired) return;
  wired = true;
  const desktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.addEventListener('click', async (e) => {
    const target = e.target as Element | null;
    const a = target?.closest?.('a[href^="mailto:"]') as HTMLAnchorElement | null;
    if (!a) return;
    const href = a.getAttribute('href') as string;
    const email = a.dataset.email || href.replace(/^mailto:/, '').split('?')[0];
    // Only intercept links whose visible text IS the address; labeled buttons
    // ("Email the Administrator") keep firing the mailto.
    const showsEmail = Boolean(a.dataset.email) || EMAIL.test((a.textContent || '').trim());
    if (!showsEmail || !desktop) return; // touch, or labeled: open the mail app
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(email);
      showToast(e.clientX, e.clientY);
    } catch {
      window.location.href = href; // clipboard blocked: fall back to the mailto
    }
  });
}

onPageLoad(() => {
  if (location.pathname.startsWith('/preview')) return;
  linkifyEmails(document.body);
  wireCopyOnce();
});

export {};
