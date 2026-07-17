// ============================================================================
// phone-list — turn a run-on "Label (555) 123-4567 · Label2 ..." card body
// into a scannable, tap-to-call list
// ============================================================================
// The Board types emergency/contact numbers into a single card body as one
// middot-separated string ("Emergency 911 · Police (513) 777-2231 · Fire ...").
// Rendered as a plain paragraph that wraps mid-number, it's a wall of text —
// the worst possible format for the one card a parent reaches for mid-incident
// (2026-07-17 feedback). This parser detects that specific shape and hands back
// discrete {label, number} rows so the card can render a phone-directory list
// with real `tel:` links. It is deliberately conservative: it only fires when a
// body genuinely reads as a list of phone numbers, so ordinary prose cards
// (which might mention one number in passing) render unchanged.
// ============================================================================

export interface PhoneEntry {
  /** The text before the number, e.g. "Police", "Poison Control". May be "". */
  label: string;
  /** The number exactly as typed, e.g. "(513) 777-2231" or "911". */
  display: string;
  /** Digits only, for the `tel:` href, e.g. "5137772231" or "911". */
  tel: string;
}

// A US phone number as the Board types them: (555) 123-4567, 555-123-4567,
// 555.123.4567, or the short emergency code 911 / 9-1-1.
const PHONE_RE = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|9-?1-?1(?!\d)/;

/** Board separators between entries: middot, bullet, or a pipe. */
const SEPARATOR_RE = /\s*[·•|]\s*/;

/**
 * Parse a card body into phone-directory rows, or return `null` when the body
 * isn't a phone list (in which case callers render the plain string as before).
 *
 * Requires at least two entries and that (nearly) every segment carries a
 * number, so a paragraph with one incidental phone number is left alone.
 */
export function parsePhoneList(body?: string): PhoneEntry[] | null {
  if (!body) return null;
  const segments = body
    .split(SEPARATOR_RE)
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length < 2) return null;

  const entries: PhoneEntry[] = [];
  for (const segment of segments) {
    const match = PHONE_RE.exec(segment);
    if (!match) continue;
    const display = match[0].replace(/[.\s]+$/, '');
    const tel = display.replace(/\D/g, '');
    // Everything before the number is the label; drop trailing punctuation and
    // any stray leading separators the split left behind.
    const label = segment
      .slice(0, match.index)
      .replace(/[\s:–-]+$/, '')
      .trim();
    entries.push({ label, display, tel });
  }

  // Only treat it as a directory when it really is one: 2+ numbers, and at most
  // one segment without a number (a trailing note like "call any time" is ok).
  if (entries.length < 2 || segments.length - entries.length > 1) return null;
  return entries;
}
