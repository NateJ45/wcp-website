// =============================================================================
// student-fees — deriving the student-fee bands from the class documents
// =============================================================================
// The student fee is a PER-CLASS fact ($45 for the Twos and Threes, $50 for the
// two Pre-Ks), but it is SHOWN as bands — one button per group of classes that
// share an amount. Those bands used to be typed by hand into the feeSchedule
// singleton, which meant the same amount and the same PayPal link existed in two
// Sanity documents at once. They drifted: the retired button code
// (GQZ67ZRZ4W9UN) sat on the class docs for weeks after the bands had moved to
// the new-style link, and nothing on the site read the class field to reveal it.
//
// So the class document is now the single owner and the bands are DERIVED:
// classes that share an amount AND a pay link collapse into one band, labelled
// from the class names. Change the fee on a class and every surface follows —
// the class page's fact grid, the tuition page's button, the enrollment packet.
//
// Pure and unit-tested: no Sanity client, no Astro.
// =============================================================================

export interface FeeClass {
  name?: string | null;
  /** Class order matters — bands come out in the order classes are given. */
  slug?: string | null;
  studentFee?: string | null;
  studentFeePayId?: string | null;
}

export interface StudentFeeBand {
  /** e.g. "Twos & Threes" — built from the class names in the band. */
  label: string;
  amount: string;
  /** A bare PayPal button code or a full payment link; payUrl() handles both. */
  payId: string;
}

/**
 * Join class names the way the school writes them: "Twos & Threes",
 * "Pre-K AM & PM", "Twos, Threes & Pre-K AM".
 *
 * The Pre-K pair gets a special case because "Pre-K AM & Pre-K PM" repeats the
 * program name, and that is not how anyone says it out loud.
 */
export function bandLabel(names: string[]): string {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];

  // Collapse a shared leading word ("Pre-K AM", "Pre-K PM" → "Pre-K AM & PM").
  const prefix = clean[0].split(' ')[0];
  if (clean.every((n) => n.startsWith(prefix + ' '))) {
    const tails = clean.map((n) => n.slice(prefix.length + 1));
    return `${prefix} ${tails.slice(0, -1).join(', ')} & ${tails[tails.length - 1]}`;
  }
  return `${clean.slice(0, -1).join(', ')} & ${clean[clean.length - 1]}`;
}

/**
 * Group classes into fee bands, preserving the order they arrive in.
 *
 * A class with no fee amount is skipped rather than shown as a $0 band — a
 * missing value means "not set yet", not "free". Classes are grouped by amount
 * AND pay link together, so two classes that happen to cost the same but bill
 * through different buttons stay as separate bands rather than silently
 * collapsing onto one link.
 */
export function deriveStudentFeeBands(classes?: FeeClass[] | null): StudentFeeBand[] {
  const order: string[] = [];
  const groups = new Map<string, { names: string[]; amount: string; payId: string }>();

  for (const c of classes ?? []) {
    const amount = c?.studentFee?.trim();
    if (!amount) continue;
    const payId = c.studentFeePayId?.trim() ?? '';
    const key = `${amount}|${payId}`;
    if (!groups.has(key)) {
      groups.set(key, { names: [], amount, payId });
      order.push(key);
    }
    const name = c.name?.trim();
    if (name) groups.get(key)!.names.push(name);
  }

  return order.map((key) => {
    const g = groups.get(key)!;
    return { label: bandLabel(g.names), amount: g.amount, payId: g.payId };
  });
}
