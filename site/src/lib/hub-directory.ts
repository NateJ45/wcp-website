// =============================================================================
// Family directory — read from KV, never from Sanity
// =============================================================================
// WHY THIS FILE EXISTS
//
// The directory used to live in Sanity as `directoryEntry` documents. Sanity's
// free plan is "2 datasets (public only)", so on 2026-09-06 an anonymous query
// with no token returned all 37 entries: 40 children's names, 71 parents and 33
// home addresses, readable by anyone holding the project id — which appears 51
// times in the homepage source.
//
// The Family Hub gate was never the problem and has not changed. It protects the
// PAGE correctly. The Content Lake API is a second door, and no amount of
// page-level auth closes it. The only real fix is for the data not to be there.
//
// So the directory now lives in the DIRECTORY KV namespace, which has no public
// read surface at all: it is reachable only from inside the Worker, on a request
// that has already passed the hub gate in src/middleware.ts.
//
// KEEP IT THAT WAY. If a future feature needs family data, it reads it here, on
// the server, behind the gate. The moment any of this is modelled in Sanity
// again it becomes world readable, and `scripts/public-data-audit.mjs` will fail
// the build saying so.
// =============================================================================
import { env } from 'cloudflare:workers';

export interface DirChild {
  name?: string;
  class?: string;
}

export interface DirParent {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
}

export interface DirEntry {
  /** Stable id carried over from the Sanity document, so photos still resolve. */
  _id: string;
  familyName: string;
  /** Whether the family agreed to appear in the directory. KV holds EVERY
   *  family, opted in or not, because it is now the only copy — the loader
   *  filters for display. Storing only the opted-in ones would have quietly
   *  destroyed the rest when Sanity was purged. */
  optedIn?: boolean;
  /** Postal address. The page never rendered it (the map uses `location`), but
   *  it is what `location` was geocoded FROM, so losing it would mean nobody
   *  could ever re-geocode. Carried for that reason alone. */
  address?: string;
  parents?: DirParent[];
  children?: DirChild[];
  /** R2 object key for the family photo, served ONLY through
   *  /family-hub/photo/<key> behind the hub gate. This is the current home. */
  photoKey?: string;
  /** LEGACY: the old Sanity image reference. Sanity's CDN serves an asset to
   *  anyone holding the URL, with no gate and no expiry, which is obscurity
   *  rather than access control - and these are photographs of children. Kept
   *  only so a family whose photo has not been migrated yet still shows one.
   *  Remove once scripts/migrate-photos-to-r2.mjs reports nothing left. */
  photo?: { asset?: unknown; alt?: string } | null;
  location?: { lat?: number; lng?: number } | null;
  notes?: string;
  neighborhood?: string;
  carpoolInterest?: boolean;
  playdateInterest?: boolean;
}

/** The single KV key holding the whole directory. 37 families is one small
 *  JSON blob; splitting it per family would buy nothing but round trips. */
export const DIRECTORY_KEY = 'directory:v1';

/**
 * The stored shape. Older writes were a bare array; a `version` was added when
 * editing arrived, so reads accept both and writes always produce the envelope.
 */
export interface DirectoryDoc {
  /** Bumped on every save. The editor posts back the version it loaded, and a
   *  mismatch is refused — an admin tab left open for a week would otherwise
   *  save stale data over someone else's edit without anyone noticing. */
  version: number;
  updatedAt: string;
  entries: DirEntry[];
}

/** Every family KV holds, opted in or not, with the version that produced it. */
export async function readDirectoryDoc(): Promise<DirectoryDoc> {
  const empty: DirectoryDoc = { version: 0, updatedAt: '', entries: [] };
  try {
    const raw = await env.DIRECTORY?.get(DIRECTORY_KEY, 'text');
    if (!raw) return empty;
    const parsed: unknown = JSON.parse(raw);
    // The pre-editor format: a bare array, version 0.
    if (Array.isArray(parsed)) return { ...empty, entries: parsed as DirEntry[] };
    const doc = parsed as Partial<DirectoryDoc>;
    return {
      version: typeof doc.version === 'number' ? doc.version : 0,
      updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : '',
      entries: Array.isArray(doc.entries) ? doc.entries : [],
    };
  } catch {
    return empty;
  }
}

/** Every family KV holds, opted in or not. Use `getDirectoryEntries` to render. */
async function readAll(): Promise<DirEntry[]> {
  return (await readDirectoryDoc()).entries;
}

/** Outcome of a save. `conflict` means the editor was working from stale data. */
export type SaveResult =
  | { ok: true; version: number }
  | { ok: false; reason: 'conflict' | 'no-binding' | 'refused-empty'; current?: DirectoryDoc };

/**
 * Replace the directory.
 *
 * Three guards, each earned:
 *   - VERSION. The caller passes the version it loaded; a mismatch is refused
 *     rather than merged. Two people editing at once is unlikely here, but a
 *     tab left open for a week is not, and both look identical to the data.
 *   - NEVER EMPTY. A save that would wipe every family is refused outright.
 *     KV is the only copy now; "the form posted nothing" must not be able to
 *     destroy 37 families.
 *   - BACKUP FIRST. The previous value is copied to a timestamped key before
 *     the write, so a bad edit is one `wrangler kv key get` from recovery.
 */
export async function saveDirectory(
  entries: DirEntry[],
  expectedVersion: number,
): Promise<SaveResult> {
  if (!env.DIRECTORY) return { ok: false, reason: 'no-binding' };

  const current = await readDirectoryDoc();
  if (current.version !== expectedVersion) return { ok: false, reason: 'conflict', current };
  if (!entries.length && current.entries.length) return { ok: false, reason: 'refused-empty' };

  if (current.entries.length) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await env.DIRECTORY.put(`${DIRECTORY_KEY}:backup:${stamp}`, JSON.stringify(current));
  }

  const next: DirectoryDoc = {
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
    entries,
  };
  await env.DIRECTORY.put(DIRECTORY_KEY, JSON.stringify(next));
  return { ok: true, version: next.version };
}

/**
 * Every OPTED-IN family, ordered by family name — what the hub displays.
 *
 * The opt-in filter lives here rather than in the stored data, because KV is now
 * the only copy: storing just the opted-in families would have silently deleted
 * the others the moment Sanity was purged. A family that opts back in is a flag
 * change, not a re-entry.
 *
 * Returns [] when the binding or key is missing — a fresh environment before the
 * migration — so the page shows its empty state rather than failing. It does NOT
 * fall back to Sanity: that fallback would republish everything this file exists
 * to keep out of a public dataset.
 */
export async function getDirectoryEntries(): Promise<DirEntry[]> {
  const all = await readAll();
  return all
    .filter((e) => e.optedIn === true)
    .sort((a, b) => (a.familyName || '').localeCompare(b.familyName || ''));
}

/**
 * Which family each role holder takes their contact details from.
 *
 * `{ "<roleHolder _id>": "<directoryEntry _id>" }`.
 *
 * This used to be a Sanity reference (`roleHolder.contactFrom`), which meant
 * changing a class rep needed the Studio while changing her phone number needed
 * this admin — the board would have had to know which tool a given edit lived
 * in. Everything about a PERSON belongs in one place, so the link moved here
 * too. What stays in Sanity is what the public site publishes: the seat, the
 * role name, the photo.
 */
export const REP_LINKS_KEY = 'rep-links:v1';

export async function readRepLinks(): Promise<Record<string, string>> {
  try {
    const raw = await env.DIRECTORY?.get(REP_LINKS_KEY, 'text');
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export async function saveRepLinks(next: Record<string, string>): Promise<boolean> {
  if (!env.DIRECTORY) return false;
  const before = await env.DIRECTORY.get(REP_LINKS_KEY, 'text');
  if (before) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await env.DIRECTORY.put(`${REP_LINKS_KEY}:backup:${stamp}`, before);
  }
  await env.DIRECTORY.put(REP_LINKS_KEY, JSON.stringify(next));
  return true;
}

/**
 * Fill in each role holder's contact details from the KV directory.
 *
 * A class rep's email and phone are typed once, in the Directory, and reused on
 * her card — that has not changed. What changed is where the join happens: it
 * used to be `contactFrom->{ parents[]{...} }` inside the GROQ query, which
 * meant a parent's email and phone were served out of a PUBLIC dataset. Now the
 * document stores only the family's id, and the personal half is looked up here,
 * server-side, from KV.
 *
 * The row shape it produces is deliberately identical to what the old join
 * returned, so `contactFor` and everything downstream is untouched.
 *
 * Rows come back unchanged when KV is unavailable: the cards then show a name
 * and no contact links, which is the same degradation as an unlinked rep.
 */
export async function attachDirectoryContacts<
  T extends { _id?: string | null; contactFamilyId?: string | null; contact?: unknown },
>(rows: T[] | null | undefined): Promise<T[]> {
  const list = rows ?? [];
  const links = await readRepLinks();
  // The KV link wins; `contactFamilyId` (still returned by the query from the
  // old Sanity reference) is the fallback, so nothing breaks in the window
  // before the board has set a link here. Delete the fallback once every rep
  // is linked in the admin.
  const familyIdFor = (row: T) =>
    (row?._id ? links[row._id] : undefined) || row?.contactFamilyId || undefined;

  if (!list.some((r) => familyIdFor(r))) return list;

  const byId = new Map((await readAll()).map((e) => [e._id, e]));
  return list.map((row) => {
    const familyId = familyIdFor(row);
    const entry = familyId ? byId.get(familyId) : undefined;
    if (!entry) return row;
    return {
      ...row,
      contact: {
        optedIn: entry.optedIn ?? null,
        parents: (entry.parents ?? []).map((p) => ({
          name: p.name ?? null,
          email: p.email ?? null,
          phone: p.phone ?? null,
        })),
      },
    };
  });
}
