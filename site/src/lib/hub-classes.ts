// =============================================================================
// Hub class facts — SANITY IS THE SOURCE, the data file is only a fallback
// =============================================================================
// This used to read src/data/classes.ts and overlay Sanity onto it, field by
// field, "data-file order preserved". That inversion made the hub blind: a
// class that existed only in Sanity had no row, no tile, and no page, so adding
// a class needed a developer. Now the LIST comes from Sanity in the Board's own
// drag order, and src/data/classes.ts is consulted only for the four classes
// the site shipped with, per field, so an outage or a half-filled document
// still renders the numbers families expect.
//
// The icon is the one field with a special rule: it is a small design choice,
// so a class doc that names one wins, and the committed icon is the fallback
// for the original four. A class with neither gets the generic school icon.
// =============================================================================
import { sanityFetch, BOARD_CONTENT_CACHE } from '@/lib/sanity';
import { classes as committedClasses, classBySlug } from '@/data/classes';
import { HUB_CLASSROOMS_QUERY } from '@/lib/queries';
import { toClassColor } from '@/lib/class-colors';
import {
  buildClassrooms,
  type Classroom,
  type ClassroomPage,
  type HubClass,
} from '@/lib/hub-classrooms';
import { helperScheduleFallback, photoAlbumFallback } from '@/data/hub/live-links';

/** The generic icon for a class that names none and is not one of the four. */
const DEFAULT_CLASS_ICON = 'graduation-cap';

interface ClassRow {
  slug?: string;
  name?: string;
  icon?: string;
  color?: string;
  days?: string;
  time?: string;
  age?: string;
  monthly?: string;
  annual?: string;
  studentFee?: string;
  payId?: string;
  studentFeePayId?: string;
  helperScheduleUrl?: string;
  photoAlbumUrl?: string;
  publicSlug?: string;
}

interface ClassroomPageRow {
  hubKey?: string;
  slug?: string;
  title?: string;
  heading?: string;
  navIcon?: string;
  classSlugs?: (string | null)[];
}

interface ClassroomsResult {
  classes?: ClassRow[];
  pages?: ClassroomPageRow[];
  guides?: (string | null)[];
}

/** The classrooms, plus which classes have a curriculum PDF. */
export interface HubClassData {
  classrooms: Classroom[];
  /** `curriculumGuide` keys — a class slug, or a whole classroom's address. */
  guides: string[];
}

/** One Sanity row + the committed fallback for that slug, field by field. */
function toHubClass(row: ClassRow): HubClass | null {
  const slug = row.slug?.trim();
  if (!slug) return null;
  const base = classBySlug[slug];
  return {
    slug,
    name: row.name || base?.name || slug,
    icon: row.icon || base?.icon || DEFAULT_CLASS_ICON,
    color: toClassColor(row.color),
    days: row.days || base?.days,
    time: row.time || base?.time,
    age: row.age || base?.age,
    monthly: row.monthly || base?.monthly,
    annual: row.annual || base?.annual,
    studentFee: row.studentFee || base?.studentFee,
    payId: row.payId || base?.payId,
    studentFeePayId: row.studentFeePayId || base?.studentFeePayId,
    // The Google links are share-by-link resources and are never committed, so
    // these fallbacks are empty strings until the Studio fields are filled in.
    helperScheduleUrl: row.helperScheduleUrl || helperScheduleFallback[slug] || undefined,
    photoAlbumUrl: row.photoAlbumUrl || photoAlbumFallback[slug] || undefined,
    publicSlug: row.publicSlug || undefined,
  };
}

/** The shipped public program pages, for the same outage fallback. */
const FALLBACK_PUBLIC_SLUGS: Record<string, string> = {
  twos: 'classes/twos',
  threes: 'classes/threes',
  'pre-k-am': 'classes/pre-k',
  'pre-k-pm': 'classes/pre-k',
};

/** The shipped colors, matching what the four `class` docs hold. */
const FALLBACK_COLORS: Record<string, string> = {
  twos: 'amber',
  threes: 'green',
  'pre-k-am': 'orange',
  'pre-k-pm': 'sky',
};

/** The four committed classes, for when the gated Sanity read fails. */
function fallbackClasses(): HubClass[] {
  return committedClasses.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    color: toClassColor(FALLBACK_COLORS[c.slug]),
    days: c.days,
    time: c.time,
    age: c.age,
    monthly: c.monthly,
    annual: c.annual,
    studentFee: c.studentFee,
    payId: c.payId,
    studentFeePayId: c.studentFeePayId,
    helperScheduleUrl: helperScheduleFallback[c.slug] || undefined,
    photoAlbumUrl: photoAlbumFallback[c.slug] || undefined,
    publicSlug: FALLBACK_PUBLIC_SLUGS[c.slug],
  }));
}

/**
 * The two classroom pages the site shipped with, so /family-hub/twos-threes and
 * /family-hub/pre-k still answer (and /twos, /pre-k-am still redirect) when the
 * gated Sanity read fails. Families have these addresses bookmarked; an outage
 * must not turn them into 404s.
 */
const FALLBACK_CLASSROOM_PAGES: ClassroomPage[] = [
  {
    key: 'twos-threes',
    title: 'Twos & Threes classroom',
    heading: 'Twos & Threes Classroom',
    classSlugs: ['twos', 'threes'],
  },
  {
    key: 'pre-k',
    title: 'Pre-K classroom',
    heading: 'Pre-K Classroom',
    classSlugs: ['pre-k-am', 'pre-k-pm'],
  },
];

/**
 * Every hub classroom, in the Board's class order.
 *
 * ONE read for the whole hub: the class documents, the hubPage documents that
 * name classes (without their sections — the classroom route fetches those for
 * the ONE page it renders), and the curriculum-guide keys. It rides the
 * board-content cache, which is L1-only by design — see the KV write budget in
 * CLAUDE.md — so every later caller on the same request is free.
 *
 * ONE read matters beyond the round-trip: the hub chrome renders the rail
 * twice and the topbar once, and a classroom page adds the teacher note and the
 * rep holders on top. Workers cap SIMULTANEOUS outbound connections, so every
 * read folded into this one is a connection a page render does not have to
 * queue for.
 */
export async function getHubClassData(): Promise<HubClassData> {
  let result: ClassroomsResult | null = null;
  try {
    result = await sanityFetch<ClassroomsResult | null>(
      HUB_CLASSROOMS_QUERY,
      {},
      { cache: BOARD_CONTENT_CACHE },
    );
  } catch {
    result = null;
  }

  const guides = (result?.guides ?? []).filter((g): g is string => Boolean(g));
  const rows = (result?.classes ?? []).map(toHubClass).filter((c): c is HubClass => c !== null);
  // No classes at all means the read failed or the dataset is empty. Either way
  // the hub still has to work, so fall back to everything the code knows.
  if (rows.length === 0) {
    return { classrooms: buildClassrooms(fallbackClasses(), FALLBACK_CLASSROOM_PAGES), guides };
  }

  const pages: ClassroomPage[] = (result?.pages ?? []).map((p) => ({
    key: (p.hubKey || p.slug || '').trim(),
    title: p.title,
    heading: p.heading,
    navIcon: p.navIcon,
    classSlugs: (p.classSlugs ?? []).filter((s): s is string => Boolean(s)),
  }));

  return { classrooms: buildClassrooms(rows, pages), guides };
}

/** Just the classrooms — what the rail, the topbar and the home tiles need. */
export async function getHubClassrooms(): Promise<Classroom[]> {
  return (await getHubClassData()).classrooms;
}

/** Every class, flattened out of the classrooms (the tuition table's rows). */
export async function getHubClasses(): Promise<HubClass[]> {
  const rooms = await getHubClassrooms();
  return rooms.flatMap((r) => r.classes);
}
