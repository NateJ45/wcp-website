// ============================================================================
// wcp-email-copy — email + phone links that never end in silent nothing
// ============================================================================
// Three jobs, site-wide (loaded from BaseLayout, so public + hub):
//   1. LINKIFY: turn plain-text email addresses in the page content into real
//      `mailto:` links (most were flat text you had to hand-copy). Existing
//      links / inputs / code are skipped, so nothing is double-wrapped.
//   2. COPY: on DESKTOP, clicking a link whose visible text IS an address copies
//      it to the clipboard and pops a "Copied!" token by the cursor (instead of
//      firing a mailto the machine may have no handler for).
//   3. FALLBACK for everything else (labeled buttons like "Email the
//      Treasurer", and touch devices): the mailto fires as usual, but the
//      address is copied EAGERLY inside the click (Safari's clipboard rules
//      require the user gesture), and if the page still has focus once the
//      mailto has had its chance — meaning no mail app took over — the
//      "Copied!" token appears so the click never ends in silent nothing.
//      If a mail app did open, the page blurs and the token never shows; the
//      eager copy is invisible. If the clipboard write itself failed, the
//      token shows the ADDRESS instead, so the visitor can still act on it.
//   4. PHONE NUMBERS get the same treatment as emails: a desktop click on a
//      tel: link has no handler on most machines (or pops a "pick an app"
//      dialog), so a visible number copies with the token, and a labeled
//      button ("Call or text") uses the same eager-copy + focus fallback.
// Skipped in Sanity's /preview so stega click-to-edit text nodes stay intact.
// ============================================================================
import { onPageLoad } from '@/scripts/_page-load';

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
// A visible phone number: 7+ digits with the usual punctuation between them.
const PHONE = /\d[\d\s().+-]{6,}\d/;
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
function showToast(x: number, y: number, text = 'Copied!'): void {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'wcp-copy-toast';
    toastEl.setAttribute('role', 'status');
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = text;
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
    const a = target?.closest?.('a[href^="mailto:"], a[href^="tel:"]') as HTMLAnchorElement | null;
    if (!a) return;
    const href = a.getAttribute('href') as string;
    const isTel = href.startsWith('tel:');
    // What lands on the clipboard: the address, or the number as displayed
    // (falling back to the href digits when the label hides it).
    const email = isTel
      ? (a.textContent || '').match(PHONE)?.[0]?.trim() || href.replace(/^tel:/, '')
      : a.dataset.email || href.replace(/^mailto:/, '').split('?')[0];
    // Only intercept links whose visible text IS the address/number; labeled
    // buttons ("Email the Administrator", "Call or text") keep firing.
    const showsEmail = isTel
      ? PHONE.test((a.textContent || '').trim())
      : Boolean(a.dataset.email) || EMAIL.test((a.textContent || '').trim());

    // Keyboard activation reports (0,0) — anchor the token to the link itself.
    let x = e.clientX;
    let y = e.clientY;
    if (x === 0 && y === 0) {
      const r = a.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top;
    }

    if (showsEmail && desktop) {
      // The visible-address case: don't even fire the mailto, just copy.
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(email);
        showToast(x, y);
      } catch {
        window.location.href = href; // clipboard blocked: fall back to the mailto
      }
      return;
    }

    // Labeled buttons + touch: the mailto proceeds. Copy NOW (inside the
    // gesture), then wait for the handoff. A mail app opening blurs the page
    // or hides the tab; if neither happened, nothing handled the click.
    let copied = false;
    try {
      await navigator.clipboard.writeText(email);
      copied = true;
    } catch {
      copied = false;
    }
    window.setTimeout(() => {
      if (!document.hasFocus() || document.visibilityState !== 'visible') return;
      showToast(x, y, copied ? 'Copied!' : email);
    }, 1200);
  });
}

onPageLoad(() => {
  if (location.pathname.startsWith('/preview')) return;
  linkifyEmails(document.body);
  wireCopyOnce();
});

export {};
