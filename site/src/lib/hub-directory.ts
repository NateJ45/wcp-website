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
