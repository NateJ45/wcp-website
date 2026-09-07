// =============================================================================
// hub-org — the org chart, DERIVED from the documents a volunteer edits
// =============================================================================
// The chart used to be split in two: the SHAPE (tiers, branches, icons,
// committee sizes) lived in code, and only the PEOPLE were editable. That made
// the co-op's own structure the last developer-only corner of the hub — a
// school that renames a role, adds one, or shrinks its board could not do it.
//
// Now both halves are documents, and this module is the rule that turns them
// into a chart:
//
//   SEATS  (`coopRole`)   — one per job. Its name, its icon, which SECTION of
//                           the chart it sits in, which seat it reports to, its
//                           team size, its stipend, and what it does.
//   PEOPLE (`roleHolder`) — who holds a seat this year, their photo, and how
//                           families reach them. This is what changes each
//                           spring, so it stays a separate, shorter list.
//
// THE SHAPE IS DERIVED, not stored. A seat reports to another seat, and the
// columns of the chart are simply the board seats that have somebody reporting
// to them. Rename a seat and its holder follows, because the holder points at
// the seat by REFERENCE. Add a seat and it draws itself in its section.
//
// CLASS REPS STAY AUTOMATIC. One seat is marked "one of these per class"
// (`perClass`), and it expands into one rep seat per live class. A new class
// gets its rep seat with no document and no code change, exactly as before.
//
// Pure on purpose — no Sanity client, no Astro — so every rule below is
// unit-tested directly, and importing it never drags in `cloudflare:workers`.
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

// -----------------------------------------------------------------------------
// Seats
// -----------------------------------------------------------------------------

/**
 * The five sections of the chart. This list is fixed in code, and it is the ONE
 * thing about the chart that stays that way: it is the grammar the drawing
 * follows (a top row, a paid-staff row, columns of chairs, rep cards, committee
 * pills). Volunteers rename the sections and move seats between them; they do
 * not invent a sixth kind of box, which is the brand-lock rule.
 */
export type OrgTier = 'board' | 'staff' | 'chairs' | 'reps' | 'committee';

export const ORG_TIERS: OrgTier[] = ['board', 'staff', 'chairs', 'reps', 'committee'];

const isTier = (v: unknown): v is OrgTier => ORG_TIERS.includes(v as OrgTier);

/** One `coopRole` document: a seat on the chart, and its job description. */
export interface OrgSeat {
  /** Stable id — the Sanity `_id`, or the committed key in the fallback. */
  id: string;
  /** The label on the card, e.g. "President". */
  name: string;
  tier: OrgTier;
  /** Lucide icon for the role chip. */
  icon: string;
  /** The id of the seat this one reports to, when any. */
  reportsTo?: string;
  /** Team-size blurb for a committee, e.g. "4 members". */
  team?: string;
  /** Annual tuition stipend, for the Board officer roles. */
  stipend?: string;
  /** What the job is — the description list on the Co-op Jobs page. */
  body?: string;
  /** One of these seats per live class (the Class Rep). */
  perClass?: boolean;
}

/** One row of ORG_SEATS_QUERY, before it is cleaned up. */
export interface OrgSeatRow {
  _id?: string | null;
  name?: string | null;
  tier?: string | null;
  icon?: string | null;
  reportsTo?: string | null;
  team?: string | null;
  stipend?: string | null;
  body?: string | null;
  perClass?: boolean | null;
}

/**
 * Clean the query rows into seats.
 *
 * A row with no id, no name, or an unknown section is dropped: it cannot be
 * drawn anywhere, and dropping it is safer than guessing a place for it. A
 * `reportsTo` that names no seat in the list is cleared, so a deleted officer
 * leaves her chairs loose (they render under "Other roles") rather than
 * pointing at nothing.
 */
export function toSeats(rows?: OrgSeatRow[] | null): OrgSeat[] {
  const seats: OrgSeat[] = [];
  for (const row of rows ?? []) {
    const id = row?._id?.trim();
    const name = row?.name?.trim();
    if (!id || !name || !isTier(row.tier)) continue;
    seats.push({
      id,
      name,
      tier: row.tier,
      icon: row.icon?.trim() || 'users',
      reportsTo: row.reportsTo?.trim() || undefined,
      team: row.team?.trim() || undefined,
      stipend: row.stipend?.trim() || undefined,
      body: row.body?.trim() || undefined,
      perClass: row.perClass === true,
    });
  }
  const known = new Set(seats.map((s) => s.id));
  return seats.map((s) =>
    s.reportsTo && known.has(s.reportsTo) ? s : { ...s, reportsTo: undefined },
  );
}

// -----------------------------------------------------------------------------
// People
// -----------------------------------------------------------------------------

/** One row of ROLE_HOLDERS_QUERY. */
export interface RoleHolderRow {
  /** The document's own _id — carried into Holder.docId for click-to-edit. */
  _id?: string | null;
  /** The seat this person holds, by reference. */
  seat?: string | null;
  /** Which class, for a holder of the per-class rep seat. */
  forClass?: string | null;
  /**
   * The role LABEL this document used to store. Kept as a second join key so a
   * holder written before the seats became documents still finds its seat.
   */
  role?: string | null;
  person?: string | null;
  email?: string | null;
  photo?: { asset?: unknown; alt?: string } | null;
  /** The linked family's document id — all the query returns now. The personal
   *  half is filled in server-side from KV by `attachDirectoryContacts`
   *  (src/lib/hub-directory.ts): the Sanity dataset is public, and the inline
   *  join this replaced was publishing parents' emails and phone numbers. */
  contactFamilyId?: string | null;
  /** Populated by `attachDirectoryContacts`, never by the query. Same shape the
   *  old `contactFrom->` join produced, so `contactFor` did not have to change. */
  contact?: {
    optedIn?: boolean | null;
    parents?: { name?: string | null; email?: string | null; phone?: string | null }[] | null;
  } | null;
}

/** What the chart and the rep cards need for one seat. */
export interface Holder {
  /** The roleHolder document's _id — the preview's click-to-edit target. */
  docId?: string;
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

/** The lookup key for a per-class rep seat. */
export const repSeatKey = (seatId: string, classSlug: string) => `${seatId}:${classSlug}`;

/**
 * Shape the query rows into a holder lookup.
 *
 * Each holder is filed under EVERY key that could ask for it:
 *   - its seat id (`coop-3`), the durable join;
 *   - `<seat id>:<class slug>` when it names a class, for a rep seat;
 *   - its legacy role LABEL ("Secretary", "Twos Rep").
 *
 * The label is kept because it is what the documents stored before the seats
 * became documents, and because the committed fallback chart has no Sanity ids
 * to join on. A seat asks for its id first and its name second, so the modern
 * join wins and the old one still works.
 *
 * A row with no key at all is dropped. A row with a key but no person is KEPT
 * with an undefined name on purpose: that is how the Board marks a seat vacant,
 * and the chart draws it as an open role.
 */
export function toHolderMap(rows?: RoleHolderRow[] | null): Map<string, Holder> {
  const map = new Map<string, Holder>();
  for (const row of rows ?? []) {
    if (!row) continue;
    const seat = row.seat?.trim();
    const cls = row.forClass?.trim();
    const label = row.role?.trim();
    const keys: string[] = [];
    if (seat && cls) keys.push(repSeatKey(seat, cls));
    else if (seat) keys.push(seat);
    if (label) keys.push(label);
    if (keys.length === 0) continue;

    const { email, phone } = contactFor(row);
    const holder: Holder = {
      docId: row._id?.trim() || undefined,
      name: row.person?.trim() || undefined,
      email,
      phone,
      photo: row.photo?.asset ? row.photo : undefined,
    };
    // First writer wins per key: a holder that names its seat outright must not
    // be overwritten by a later one that only matches on a shared label.
    for (const key of keys) if (!map.has(key)) map.set(key, holder);
  }
  return map;
}

// -----------------------------------------------------------------------------
// The chart
// -----------------------------------------------------------------------------

/** One card on the chart: a seat with whoever holds it merged in. */
export interface OrgPerson {
  /** The roleHolder document's _id, when a holder is merged in — the
      preview's click-to-edit target. */
  docId?: string;
  /** Role label shown on the card, e.g. "President". */
  role: string;
  /** Lucide icon for the role chip. */
  icon: string;
  /** Holder's name. Undefined while the seat is open. */
  name?: string;
  /** Role mailbox, or the holder's own address from the Directory. */
  email?: string;
  phone?: string;
  /** Headshot the Board uploaded to the holder's document. */
  sanityPhoto?: { asset?: unknown; alt?: string } | null;
}

/** A committee pill under a chair or an officer. */
export interface OrgTeam {
  /** Committee/team label, e.g. "Publicity Assistants". */
  label: string;
  /** Member-count blurb, e.g. "4 members". */
  size?: string;
}

export interface ChairStack {
  chair: OrgPerson;
  teams: OrgTeam[];
}

/** One column of the chart: an officer and everything reporting to her. */
export interface OrgBranch {
  /** Column heading, e.g. "Reports to Secretary". */
  title: string;
  /** Class-rep cards under this officer. */
  reps: OrgPerson[];
  /** Chairs under this officer, each with its committees. */
  chairs: ChairStack[];
  /** Committees reporting straight to the officer, with no chair between. */
  teams: OrgTeam[];
}

export interface OrgChartModel {
  /** The top of the chart — the board seat nobody reports to. */
  president: OrgPerson | null;
  /** The other board seats. */
  officers: OrgPerson[];
  /** The paid staff row. */
  staff: OrgPerson[];
  /** One column per officer who has somebody reporting to her. */
  branches: OrgBranch[];
}

/** The classes a per-class rep seat expands over. */
export interface OrgClass {
  slug: string;
  name: string;
  icon?: string;
}

/** Merge a seat with its holder into a card. */
function personFor(seat: OrgSeat, key: string, holders?: Map<string, Holder> | null): OrgPerson {
  // A seat asks for its id first, then its name: the reference join is durable
  // across a rename, and the label join is what the older documents have.
  const holder = holders?.get(key) ?? holders?.get(seat.name);
  return {
    docId: holder?.docId,
    role: seat.name,
    icon: seat.icon,
    name: holder?.name,
    email: holder?.email,
    phone: holder?.phone,
    sanityPhoto: holder?.photo,
  };
}

const teamFor = (seat: OrgSeat): OrgTeam => ({ label: seat.name, size: seat.team });

/**
 * Expand the rep seats.
 *
 * A seat marked "one per class" becomes one seat per LIVE class, named
 * "<Class name> Rep" and wearing that class's icon. This is what keeps a new
 * class's rep card fillable the day the class is published, with no document
 * for anybody to remember to create. A rep seat NOT marked per-class is an
 * ordinary named seat and passes through untouched.
 */
function expandReps(seat: OrgSeat, classes: OrgClass[]): { seat: OrgSeat; key: string }[] {
  if (!seat.perClass) return [{ seat, key: seat.id }];
  return classes
    .filter((c) => c?.slug && c?.name)
    .map((c) => ({
      seat: { ...seat, name: `${c.name} Rep`, icon: c.icon?.trim() || seat.icon },
      key: repSeatKey(seat.id, c.slug),
    }));
}

/**
 * Build the whole chart from seats, holders, and the live classes.
 *
 * The columns are derived, not configured: a board seat becomes a column the
 * moment something reports to it. That is why removing an officer, adding one,
 * or moving a chair between two of them all "just work" — the drawing follows
 * the reporting lines rather than a list somebody has to keep in step.
 *
 * Nothing is ever silently dropped. A chair or committee whose officer was
 * deleted lands in a final "Other roles" column, which is how a volunteer sees
 * that it needs re-pointing instead of wondering where it went.
 */
export function buildOrgChart(
  seats: OrgSeat[],
  holders?: Map<string, Holder> | null,
  classes: OrgClass[] = [],
): OrgChartModel {
  const board = seats.filter((s) => s.tier === 'board');
  const president = board.find((s) => !s.reportsTo) ?? null;
  const officers = board.filter((s) => s !== president);

  const committees = seats.filter((s) => s.tier === 'committee');
  const chairs = seats.filter((s) => s.tier === 'chairs');
  const reps = seats.filter((s) => s.tier === 'reps').flatMap((s) => expandReps(s, classes));

  const claimed = new Set<string>();
  const chairStack = (chair: OrgSeat): ChairStack => {
    const teams = committees.filter((c) => c.reportsTo === chair.id);
    for (const t of teams) claimed.add(t.id);
    return { chair: personFor(chair, chair.id, holders), teams: teams.map(teamFor) };
  };

  const branchFor = (officer: OrgSeat): OrgBranch => {
    const mine = chairs.filter((c) => c.reportsTo === officer.id);
    for (const c of mine) claimed.add(c.id);
    const myReps = reps.filter((r) => r.seat.reportsTo === officer.id);
    for (const r of myReps) claimed.add(r.seat.id);
    const myTeams = committees.filter((c) => c.reportsTo === officer.id);
    for (const t of myTeams) claimed.add(t.id);
    return {
      title: `Reports to ${officer.name}`,
      reps: myReps.map((r) => personFor(r.seat, r.key, holders)),
      chairs: mine.map(chairStack),
      teams: myTeams.map(teamFor),
    };
  };

  // Officers first, then the president: the president heads the whole chart, so
  // a column under her only appears when something genuinely reports to her.
  const branches = [...officers, ...(president ? [president] : [])]
    .map(branchFor)
    .filter((b) => b.reps.length + b.chairs.length + b.teams.length > 0);

  // Whatever no column claimed. A chair here keeps its own committees, so an
  // orphaned branch arrives intact rather than in pieces.
  const looseChairs = chairs.filter((c) => !claimed.has(c.id));
  for (const c of looseChairs) claimed.add(c.id);
  const looseStacks = looseChairs.map(chairStack);
  const looseReps = reps.filter((r) => !claimed.has(r.seat.id));
  const looseTeams = committees.filter((c) => !claimed.has(c.id));
  if (looseStacks.length + looseReps.length + looseTeams.length > 0) {
    branches.push({
      title: 'Other roles',
      reps: looseReps.map((r) => personFor(r.seat, r.key, holders)),
      chairs: looseStacks,
      teams: looseTeams.map(teamFor),
    });
  }

  return {
    president: president ? personFor(president, president.id, holders) : null,
    officers: officers.map((s) => personFor(s, s.id, holders)),
    staff: seats.filter((s) => s.tier === 'staff').map((s) => personFor(s, s.id, holders)),
    branches,
  };
}

/**
 * The rep card for ONE class, for the class pages.
 *
 * The class page shows a rep card whether or not anybody holds the seat, so
 * this always answers: an unfilled seat is a card reading "To be announced",
 * which is what reserves it. It looks the holder up by the per-class key first
 * and by the label ("Twos Rep") second, so it works before and after the
 * migration — and, unlike the list it replaced, it needs no committed entry for
 * the class, which is what made a NEW class's rep card unfillable.
 */
export function classRepPerson(
  seats: OrgSeat[],
  cls: OrgClass,
  holders?: Map<string, Holder> | null,
): OrgPerson {
  const seat = seats.find((s) => s.tier === 'reps' && s.perClass);
  const label = `${cls.name} Rep`;
  if (!seat) {
    const holder = holders?.get(label);
    return {
      docId: holder?.docId,
      role: label,
      icon: cls.icon?.trim() || 'hand-heart',
      name: holder?.name,
      email: holder?.email,
      phone: holder?.phone,
      sanityPhoto: holder?.photo,
    };
  }
  const [expanded] = expandReps(seat, [cls]);
  return personFor(expanded.seat, expanded.key, holders);
}
