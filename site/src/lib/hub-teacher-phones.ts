// =============================================================================
// Teachers' phone numbers — KV, not the CMS and not the repo
// =============================================================================
// These sat in two public places at once (found 2026-09-06):
//
//   1. `teacherNote.phone` in Sanity, whose dataset is PUBLIC on the free plan,
//      so an anonymous query returned them; and
//   2. `teacherPhoneFallback` in src/data/hub/live-links.ts, committed to a
//      PUBLIC GitHub repository.
//
// The committed copy carried a reasoned comment: "the teacher's OWN published
// contact — already shown ... on the live hub — NOT a share-by-link secret". The
// reasoning is the part worth noting, because it is the same slip as the
// directory's: shown to signed-in families ON THE HUB is not the same as
// readable by anyone, and neither the public API nor a public repo is the hub.
// Two of the three numbers are not the school's published line, so they are
// personal mobiles.
//
// They now live in KV, which has no public read surface: only the Worker reads
// them, on a request that has already passed src/middleware.ts.
//
// NOTE the git history of live-links.ts still contains the numbers. Removing
// them from HEAD does not remove them from a public repository's history; that
// is a separate decision (see the vault's public-repo-history-scrub).
// =============================================================================
import { env } from 'cloudflare:workers';

/** One KV key holding `{ "<class key>": "<phone>" }`, e.g. `{ "twos": "..." }`. */
export const TEACHER_PHONES_KEY = 'teacher-phones:v1';

// The hub renders several teacher cards per page, and each used to reach for the
// same committed map. Read the key once per isolate rather than once per card.
let cached: Record<string, string> | null = null;

/**
 * Phone numbers keyed by teacherNote class key (`twos`, `threes`, `pre-k`).
 *
 * Returns {} when the binding or key is missing, so a card shows the name and
 * no "Call or text" pill — the same degradation as a teacher who has not given
 * a number. It deliberately has NO fallback to a committed constant: that
 * fallback is exactly what put these numbers in a public repo.
 */
export async function getTeacherPhones(): Promise<Record<string, string>> {
  if (cached) return cached;
  try {
    const raw = await env.DIRECTORY?.get(TEACHER_PHONES_KEY, 'text');
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    cached = parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
    return cached;
  } catch {
    return {};
  }
}

/** The first number matching any of a class's note keys, or undefined. */
export async function teacherPhoneFor(keys: string[]): Promise<string | undefined> {
  const phones = await getTeacherPhones();
  for (const k of keys) if (phones[k]) return phones[k];
  return undefined;
}
