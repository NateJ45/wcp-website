// =============================================================================
// Family Hub auth — the one place that decides "is this visitor a family?"
// =============================================================================
// The hub is protected by a single shared password the board hands to enrolled
// families. Two requirements shape what we put in the session:
//
//   1. A family signs in ONCE and stays signed in. The session cookie carries a
//      real maxAge (see `session.cookie` in astro.config.mjs) so it survives a
//      browser restart, and nothing expires it on a timer.
//   2. Changing the password signs EVERYONE out. That rules out the obvious
//      `session.set('familyAuthed', true)`, because a static flag survives
//      rotation forever — the board would rotate the password after a family
//      leaves and that family would still be inside the hub.
//
// So the session stores a FINGERPRINT derived from the password rather than a
// boolean, and every request re-derives it and compares. Rotate the secret and
// every stored fingerprint stops matching on the very next request, with no
// session store to hunt down and purge.
//
// The fingerprint never reaches the browser. The cookie is an opaque session id
// and the payload lives server-side in the SESSION KV namespace, so this is a
// server-to-server comparison.
// =============================================================================

/** Session key holding the password fingerprint. */
export const HUB_SESSION_KEY = 'familyAuthed';

// Domain separation: the stored digest is specific to this site and this scheme,
// so it is not a bare password hash that means anything anywhere else. Bump the
// version segment to force every existing session to re-authenticate.
const FINGERPRINT_SCOPE = 'wcp-family-hub:v1:';

/**
 * SHA-256 fingerprint of the shared password, hex encoded.
 *
 * WebCrypto is available both in the Workers runtime and in Node 22 (`astro
 * dev`, Vitest), so this is the same code path everywhere.
 */
export async function passwordFingerprint(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${FINGERPRINT_SCOPE}${password.trim()}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time string compare — avoids leaking length/prefix via timing.
 * (Low-stakes shared gate, but cheap to do right.)
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/**
 * Does this session hold a fingerprint matching the CURRENT password?
 *
 * Fails CLOSED on a missing/blank secret: a misconfigured deploy locks the hub
 * rather than silently opening the directory, photos and health pages to the
 * open internet. That failure mode is loud and recoverable; the other one is
 * silent and is not.
 */
export async function isFamilyAuthed(
  stored: unknown,
  secret: string | undefined,
): Promise<boolean> {
  const password = (secret ?? '').trim();
  if (!password) return false;
  if (typeof stored !== 'string' || stored.length === 0) return false;
  return safeEqual(stored, await passwordFingerprint(password));
}
