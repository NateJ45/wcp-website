// =============================================================================
// hub-teacher-note — finding the right teacher's welcome note for a classroom
// =============================================================================
// A `teacherNote` document is filed under a plain string in its "Class" field.
// The shipped notes use two shapes, because the hub's class pages cover more
// than one class each: the Twos & Threes note is filed under "twos" (a class
// slug) and the Pre-K note under "pre-k" (the PAGE's address, which is not a
// class slug at all). A classroom therefore has to look under several keys.
//
// `teacherNoteKeys()` (src/lib/hub-classrooms.ts) builds that list, classroom
// address first, then each class on the page. `pickNote` honours that order, so
// a note filed against the whole page beats one left on a single class.
//
// Pure — unit-tested directly, and importing it never drags in the Sanity
// client.
// =============================================================================

/** The fields the teacher CARD and the sign-off both need. */
export const TEACHER_NOTE_CARD_QUERY = `*[_type == "teacherNote" && class in $keys]{
  _id, "key": class, signName, signRole, email, photo
}`;

/** The whole letter, for the first-visit modal. */
export const TEACHER_NOTE_LETTER_QUERY = `*[_type == "teacherNote" && class in $keys]{
  "key": class, active, version, heading, dateLabel, salutation, body, signName, signoff,
  signRole, email, photo
}`;

/** Pick the row whose key comes first in `keys`. Null when none matches. */
export function pickNote<T extends { key?: string | null }>(
  rows: T[] | null | undefined,
  keys: string[],
): T | null {
  if (!rows || rows.length === 0) return null;
  for (const key of keys) {
    const hit = rows.find((r) => r?.key === key);
    if (hit) return hit;
  }
  return null;
}

/**
 * A `tel:` href from a human-typed phone number.
 *
 * Keeps a leading "+" and drops every other symbol, so "513-543-4824" and
 * "+1 (513) 543 4824" both dial. Returns null for an empty number.
 */
export function telHref(phone?: string | null): string | null {
  const value = phone?.trim();
  if (!value) return null;
  return `tel:${value.startsWith('+') ? '+' : ''}${value.replace(/[^\d]/g, '')}`;
}
