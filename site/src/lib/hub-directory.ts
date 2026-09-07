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
  /** Sanity image ref, kept in Sanity: an asset URL is an opaque hash, not a
   *  queryable record. Documented as a known residual in docs/FAMILY_HUB.md. */
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

/** Every family KV holds, opted in or not. Use `getDirectoryEntries` to render. */
async function readAll(): Promise<DirEntry[]> {
  try {
    const raw = await env.DIRECTORY?.get(DIRECTORY_KEY, 'text');
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DirEntry[]) : [];
  } catch {
    return [];
  }
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
  T extends { contactFamilyId?: string | null; contact?: unknown },
>(rows: T[] | null | undefined): Promise<T[]> {
  const list = rows ?? [];
  if (!list.some((r) => r?.contactFamilyId)) return list;

  const byId = new Map((await readAll()).map((e) => [e._id, e]));
  return list.map((row) => {
    const entry = row?.contactFamilyId ? byId.get(row.contactFamilyId) : undefined;
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
