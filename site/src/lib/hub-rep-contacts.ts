// =============================================================================
// Class rep contacts — joining the code-owned rep list to the gated Directory
// =============================================================================
// WHO the reps are is code-owned (`classReps` in src/data/hub/org-holders.ts,
// names only). HOW to reach them is PII and lives solely in the Directory, read
// per request behind the gate — it is never committed, because this repo is
// public. This module is the pure seam between the two: the GROQ lives in
// queries.ts (DIRECTORY_REP_CONTACTS_QUERY), the caller does the fetch, and
// these helpers shape and format the result so they stay unit-testable without
// pulling in the Sanity client (and with it `cloudflare:workers`).
//
// The join key is the rep's full name, which is why the name in org-holders.ts
// must match the adult's name on their Directory entry exactly. No match just
// means no links — the card still renders with the name, by design.
// =============================================================================

/** One adult's contact row as the Directory stores it. */
export interface RepContactRow {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

/** What a rep card needs to draw its contact links. */
export interface RepContact {
  email?: string;
  phone?: string;
}

/**
 * A `tel:` href from a human-typed phone number: keep a leading `+` (an
 * international number), drop every other symbol so "(513) 338-3053" dials.
 * Returns null for anything with no digits in it, so callers can omit the link
 * rather than render a dead `tel:`.
 */
export function telHref(phone?: string | null): string | null {
  const raw = phone?.trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  return `tel:${raw.startsWith('+') ? '+' : ''}${digits}`;
}

/**
 * Shape the flat parent rows the query returns into a name → contact lookup.
 *
 * Blank strings are dropped rather than stored, so a card asking "is there an
 * email?" never gets a truthy empty value and renders an empty `mailto:`. A
 * name that appears twice keeps the first row with usable details, since the
 * query can return the same adult from two family entries (siblings split
 * across classes are one entry, but a re-added family may not be).
 */
export function toContactMap(rows?: RepContactRow[] | null): Map<string, RepContact> {
  const map = new Map<string, RepContact>();
  for (const row of rows ?? []) {
    const name = row?.name?.trim();
    if (!name) continue;
    const email = row.email?.trim() || undefined;
    const phone = row.phone?.trim() || undefined;
    if (!email && !phone) continue;
    const existing = map.get(name);
    // Fill each field independently: two partial rows for one adult should
    // combine into a complete card rather than the first one winning outright.
    map.set(name, {
      email: existing?.email ?? email,
      phone: existing?.phone ?? phone,
    });
  }
  return map;
}
