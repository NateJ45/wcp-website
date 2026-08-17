// =============================================================================
// hub-org — merging the Studio's "Who's who" over the code-owned chart
// =============================================================================
// The org chart is deliberately split in two:
//
//   SHAPE  (code, src/data/hub/org-holders.ts) — tiers, branches, icons,
//          committee labels and sizes. This is layout, and the brand-lock rule
//          keeps layout out of volunteer hands.
//   PEOPLE (Sanity, `roleHolder` docs)         — who holds each seat, their
//          photo, and how families reach them. This is what changes every
//          spring, so it must be editable without a developer.
//
// This module is the seam. It is PURE — no Sanity client, no Astro — so the
// merge rules below are unit-tested directly, and so importing it never drags
// in `cloudflare:workers`. Callers fetch ROLE_HOLDERS_QUERY and hand the rows in.
//
// The join key is the role LABEL. A roleHolder whose role matches nothing in
// the chart is ignored rather than rendered somewhere unexpected, which is what
// makes a typo in the Studio harmless.
// =============================================================================

/**
 * A `tel:` href from a human-typed phone number: keep a leading `+` (an
 * international number), drop every other symbol so "(513) 338-3053" dials.
 * Returns null for anything with no digits in it, so callers omit the link
 * rather than render a dead `tel:`.
 */
export function telHref(phone?: string | null): string | null {
  const raw = phone?.trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  return `tel:${raw.startsWith('+') ? '+' : ''}${digits}`;
}

/** One row of ROLE_HOLDERS_QUERY. */
export interface RoleHolderRow {
  role?: string | null;
  person?: string | null;
  email?: string | null;
  photo?: { asset?: unknown; alt?: string } | null;
  contact?: {
    optedIn?: boolean | null;
    parents?: { name?: string | null; email?: string | null; phone?: string | null }[] | null;
  } | null;
}

/** What the chart and the rep cards need for one seat. */
export interface Holder {
  /** Display name. Undefined means the seat is open — render it as such. */
  name?: string;
  email?: string;
  phone?: string;
  /** Sanity image, when the Board uploaded one. */
  photo?: { asset?: unknown; alt?: string } | null;
}

/**
 * Pull the contact details a seat should use.
 *
 * An explicit role mailbox on the document always wins: president@… is more
 * durable than whoever currently holds the role, and it is the address the
 * school wants families using. Otherwise fall back to the linked Directory
 * entry, matching the adult by name so a two-parent family resolves to the
 * right one (and falling back to the entry's first adult when nothing matches,
 * which covers a rep listed under a slightly different form of her name).
 *
 * A Directory entry that is NOT opted in yields nothing. Opting out is a
 * deliberate privacy choice, and holding a co-op job does not revoke it.
 */
function contactFor(row: RoleHolderRow): { email?: string; phone?: string } {
  const explicit = row.email?.trim() || undefined;
  const entry = row.contact;
  if (!entry || entry.optedIn !== true) return { email: explicit };

  const parents = (entry.parents ?? []).filter((p) => p && (p.email || p.phone));
  const person = row.person?.trim().toLowerCase();
  const matched =
    parents.find((p) => p.name?.trim().toLowerCase() === person) ?? parents[0] ?? undefined;

  return {
    email: explicit || matched?.email?.trim() || undefined,
    phone: matched?.phone?.trim() || undefined,
  };
}

/**
 * Shape the query rows into a role → holder lookup.
 *
 * A row with no role is dropped (nothing to join on). A row with a role but no
 * person is KEPT with an undefined name on purpose: that is how the Board marks
 * a seat as vacant, and the chart draws it as an open role.
 */
export function toHolderMap(rows?: RoleHolderRow[] | null): Map<string, Holder> {
  const map = new Map<string, Holder>();
  for (const row of rows ?? []) {
    const role = row?.role?.trim();
    if (!role) continue;
    const { email, phone } = contactFor(row);
    map.set(role, {
      name: row.person?.trim() || undefined,
      email,
      phone,
      photo: row.photo?.asset ? row.photo : undefined,
    });
  }
  return map;
}

/**
 * Overlay the Studio's holder for one seat onto its code-owned defaults.
 *
 * Sanity wins whenever it has an opinion, INCLUDING an empty one: a role the
 * Board has cleared must go back to reading "open role", so an absent name
 * clears the code default rather than letting a departed volunteer linger on
 * the chart. A role with no document at all keeps the code values, which is
 * what makes the committed list a working fallback if Sanity is unreachable.
 */
export function applyHolder<
  T extends { role: string; key?: string; name?: string; email?: string },
>(
  entry: T,
  holders?: Map<string, Holder> | null,
): T & { sanityPhoto?: { asset?: unknown; alt?: string } | null; phone?: string } {
  // `key` exists because two seats can share a DISPLAYED label — the chart shows
  // both teachers as "Teacher" — while still needing distinct documents in the
  // Studio. Where there's no ambiguity the label is the key.
  const holder = holders?.get(entry.key ?? entry.role);
  if (!holder) return entry;
  return {
    ...entry,
    name: holder.name,
    email: holder.email,
    phone: holder.phone,
    sanityPhoto: holder.photo,
  };
}

/** `applyHolder` across a list, preserving order. */
export function applyHolders<
  T extends { role: string; key?: string; name?: string; email?: string },
>(entries: T[], holders?: Map<string, Holder> | null) {
  return entries.map((e) => applyHolder(e, holders));
}
