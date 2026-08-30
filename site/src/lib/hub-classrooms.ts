// =============================================================================
// hub-classrooms — the rules that give every class a Family Hub page
// =============================================================================
// The public site already derives itself from the `class` documents: make a
// class and the tuition table, the calculator, the card grids, the Classes menu
// and the teacher cards all pick it up. The hub did not. Its class pages were
// hand-written .astro routes over a hardcoded slug union, so a class that
// existed only in Sanity was INVISIBLE to families. This module ends that.
//
// THE ONE IDEA: a CLASSROOM.
// A classroom is one hub page. It covers one class, or several classes that
// share a teacher and a handbook (Twos + Threes share Ms. Erin; Pre-K AM + PM
// share Mrs. Lisa). Every class belongs to exactly one classroom:
//
//   1. A `hubPage` may name the classes it is the classroom page for
//      ("Classes on this page"). That page becomes their shared classroom, at
//      its own address (`hubKey` for the pages that came with the site, else
//      its web address). This is how twos-threes and pre-k keep their URLs.
//   2. Any class no such page names becomes its OWN classroom, at
//      /family-hub/<class slug>. No document needed: a brand-new class has a
//      complete hub page the moment it is published.
//
// A class covered by two pages goes to the FIRST page in the list. The order is
// the caller's (document order), so the answer is stable rather than arbitrary.
//
// Pure on purpose — no Sanity client, no Astro — so every rule below is
// unit-tested directly, and importing it never drags in `cloudflare:workers`.
// =============================================================================

import { classColor, classLabel, toClassColor, type ClassColor } from '@/lib/class-colors';

/** One `class` document, as the hub reads it. */
export interface HubClass {
  /** The class document's Sanity _id — the preview's click-to-edit target. */
  docId?: string;
  slug: string;
  name: string;
  /** Lucide icon for the class tile and the classroom header. */
  icon: string;
  color: ClassColor;
  days?: string;
  time?: string;
  age?: string;
  monthly?: string;
  annual?: string;
  studentFee?: string;
  payId?: string;
  studentFeePayId?: string;
  /** Board-editable Google links (never committed — see live-links.ts). */
  helperScheduleUrl?: string;
  photoAlbumUrl?: string;
  /** Board-added rows on the class fact card, after the fixed four. */
  extraFacts?: { label?: string; value?: string }[];
  /** The public program page for this class, e.g. "classes/pre-k". */
  publicSlug?: string;
}

/** A `hubPage` document that names the classes it belongs to. */
export interface ClassroomPage {
  /** `hubKey` for a page that came with the site, else its web address. */
  key: string;
  title?: string;
  heading?: string;
  intro?: string;
  navIcon?: string;
  handbookUrl?: string;
  updatedAt?: string;
  /** The slugs from "Classes on this page". */
  classSlugs: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sections?: any[];
}

/** One hub classroom page: its address, its classes, and its editable doc. */
export interface Classroom {
  /** The last path piece, e.g. "twos-threes" or "summer". */
  key: string;
  /** The full hub route, e.g. "/family-hub/twos-threes". */
  route: string;
  /** What the rail, the header and the tab title call it. */
  label: string;
  /** Every class on this page, in the order the classes were given. */
  classes: HubClass[];
  /** The accent for the page — the first class's color. */
  color: ClassColor;
  /** The icon for the page — the first class's icon. */
  icon: string;
  /** The editable page, when one exists. Null means "derived, no document". */
  page: ClassroomPage | null;
}

/** Lowercase words joined by single hyphens — the same rule hub pages use. */
const KEY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isUsableKey = (key?: string | null): boolean => Boolean(key && KEY_RE.test(key.trim()));

/**
 * Join class names the way a person would say them: "Twos & Threes",
 * "Pre-K AM & Pre-K PM", "Twos, Threes & Fours".
 */
export function joinClassNames(names: string[]): string {
  if (names.length === 0) return 'Classroom';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

/**
 * Every classroom on the hub, in class order.
 *
 * `classes` arrive in the order the hub wants them shown (Sanity drag order).
 * `pages` are the hubPage docs that name at least one class. A page whose key
 * is unusable, or whose named classes have all been deleted, is ignored — it
 * would otherwise produce a page at no address, or an empty classroom.
 */
export function buildClassrooms(classes: HubClass[], pages: ClassroomPage[] = []): Classroom[] {
  const bySlug = new Map(classes.map((c) => [c.slug, c]));
  // Which page claims each class. First claim wins, so two pages naming the
  // same class give a stable answer instead of whichever query came back last.
  const pageBySlug = new Map<string, ClassroomPage>();
  const usablePages = pages.filter((p) => isUsableKey(p?.key));
  for (const page of usablePages) {
    for (const slug of page.classSlugs ?? []) {
      if (bySlug.has(slug) && !pageBySlug.has(slug)) pageBySlug.set(slug, page);
    }
  }

  const out: Classroom[] = [];
  const done = new Set<string>();

  for (const cls of classes) {
    if (done.has(cls.slug)) continue;
    const page = pageBySlug.get(cls.slug) ?? null;

    if (!page) {
      // Its own classroom, derived entirely from the class document.
      done.add(cls.slug);
      out.push({
        key: cls.slug,
        route: `/family-hub/${cls.slug}`,
        label: cls.name,
        classes: [cls],
        color: cls.color,
        icon: cls.icon,
        page: null,
      });
      continue;
    }

    // A shared classroom: every class this page claims, in class order.
    const members = classes.filter((c) => pageBySlug.get(c.slug) === page);
    for (const m of members) done.add(m.slug);
    const key = page.key.trim();
    out.push({
      key,
      route: `/family-hub/${key}`,
      label:
        page.heading?.trim() || page.title?.trim() || joinClassNames(members.map((m) => m.name)),
      classes: members,
      color: members[0].color,
      icon: page.navIcon?.trim() || members[0].icon,
      page,
    });
  }

  return out;
}

/** What a hub URL under a classroom address should do. */
export type ClassroomMatch =
  { kind: 'render'; classroom: Classroom } | { kind: 'redirect'; to: string };

/**
 * Resolve one hub path piece against the classrooms.
 *
 * Two things can match:
 *   - a classroom's own address, which renders it;
 *   - the slug of a class that lives on a SHARED classroom page, which is an
 *     old bookmark (/family-hub/twos, /family-hub/pre-k-am) and redirects.
 *
 * Returns null when neither matches, so the caller can fall through to the
 * Board-created pages.
 */
export function matchClassroom(
  classrooms: Classroom[],
  slug?: string | null,
): ClassroomMatch | null {
  const s = slug?.trim();
  if (!s) return null;

  const exact = classrooms.find((c) => c.key === s);
  if (exact) return { kind: 'render', classroom: exact };

  const owner = classrooms.find((c) => c.classes.some((cls) => cls.slug === s));
  if (owner) return { kind: 'redirect', to: owner.route };

  return null;
}

/**
 * WHAT /family-hub/<slug> IS — the precedence rule, in one place.
 *
 * Astro serves a real .astro route before the catch-all, so those never reach
 * here (RESERVED_HUB_SLUGS keeps Board pages off them). Below that the order is
 * decided, not accidental:
 *
 *   1. 'classroom' — the address is a class page's own. A class page wins over
 *      a Board page at the same address, because its address is DERIVED from
 *      the class rather than typed by a person, and it is the page a family is
 *      actually looking for. The Studio refuses to save a Board page there for
 *      the same reason, so this is a second line of defence.
 *   2. 'redirect'  — the address is a class that lives on a shared page.
 *   3. 'board'     — a Board-created hubPage has this address.
 *   4. 'none'      — a genuine 404.
 *
 * `hasBoardPage` is the caller's answer to "is there a hubPage at this slug?",
 * so the rule stays a pure function of two facts.
 */
export function hubPathKind(
  classrooms: Classroom[],
  slug: string | null | undefined,
  hasBoardPage: boolean,
): 'classroom' | 'redirect' | 'board' | 'none' {
  const match = matchClassroom(classrooms, slug);
  if (match?.kind === 'render') return 'classroom';
  if (match?.kind === 'redirect') return 'redirect';
  return hasBoardPage ? 'board' : 'none';
}

/**
 * Every address the classrooms answer on — their own, plus the class slugs
 * that redirect into them.
 *
 * This is what keeps a Board-created page from being written at an address a
 * classroom already owns: the route resolves classrooms FIRST, so a colliding
 * page would silently never appear (the same trap RESERVED_HUB_SLUGS closes for
 * the built-in routes). The Studio checks this list before it lets one save.
 */
export function classroomAddresses(classrooms: Classroom[]): string[] {
  const out = new Set<string>();
  for (const room of classrooms) {
    out.add(room.key);
    for (const cls of room.classes) out.add(cls.slug);
  }
  return [...out];
}

/** The classroom a class slug belongs to, or null. */
export const classroomOf = (classrooms: Classroom[], slug?: string | null): Classroom | null =>
  classrooms.find((c) => c.classes.some((cls) => cls.slug === slug)) ?? null;

/**
 * The keys a teacher's welcome note may be filed under for this classroom,
 * most specific first.
 *
 * `teacherNote.class` stores a plain string. The shipped notes use "twos" (the
 * Twos & Threes note) and "pre-k" (the classroom key, not a class slug), so the
 * lookup has to accept both shapes. Trying the classroom key first means a
 * Board that files a note against the PAGE beats one left on a single class.
 */
export function teacherNoteKeys(room: Classroom): string[] {
  return [...new Set([room.key, ...room.classes.map((c) => c.slug)])];
}

/**
 * Flatten classrooms back to a per-class list for the home page's tiles, the
 * my-classes picker, and the tour chips: every class, plus the page it links to.
 */
export interface ClassTile {
  /** The class doc's _id — the preview's click-to-edit target. */
  docId?: string;
  slug: string;
  label: string;
  icon: string;
  color: ClassColor;
  /** The classroom page this class lives on. */
  page: string;
  helperScheduleUrl?: string;
  photoAlbumUrl?: string;
}

/**
 * Look a stored class SLUG up against the live classes.
 *
 * Some hub surfaces hold only a slug — a directory child's class, an update's
 * audience — because that is what the document stores. This gives them the
 * class's real name and colour, so a class the Board adds is labelled and
 * tinted like the rest instead of falling back to a titleized slug and sky.
 */
export function classLookup(classrooms: Classroom[]): {
  label: (slug?: string | null) => string;
  color: (slug?: string | null) => ClassColor;
  slugs: string[];
} {
  const rows = classrooms.flatMap((r) => r.classes);
  const bySlug = new Map(rows.map((c) => [c.slug, c]));
  return {
    label: (slug) => bySlug.get(slug ?? '')?.name || classLabel(slug ?? undefined),
    color: (slug) => bySlug.get(slug ?? '')?.color ?? classColor(slug ?? undefined),
    slugs: rows.map((c) => c.slug),
  };
}

export function classTiles(classrooms: Classroom[]): ClassTile[] {
  const out: ClassTile[] = [];
  for (const room of classrooms) {
    for (const cls of room.classes) {
      out.push({
        docId: cls.docId,
        slug: cls.slug,
        label: cls.name || classLabel(cls.slug),
        icon: cls.icon,
        color: toClassColor(cls.color),
        page: room.route,
        helperScheduleUrl: cls.helperScheduleUrl,
        photoAlbumUrl: cls.photoAlbumUrl,
      });
    }
  }
  return out;
}
