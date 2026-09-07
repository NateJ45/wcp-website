import type { APIRoute } from 'astro';
// Worker secrets come from the `cloudflare:workers` virtual module, not the
// removed `Astro.locals.runtime` — same as /api/hub-login.
import { env } from 'cloudflare:workers';
import { ADMIN_SESSION_KEY, adminFingerprint, safeEqual } from '@/lib/hub-auth';
import { readForm } from '@/lib/read-form';

export const prerender = false;

// Only ever return to an admin path — never an attacker-supplied URL.
function safeReturnTo(to: string | null): string {
  return to && to.startsWith('/family-hub/admin') ? to : '/family-hub/admin';
}

/**
 * Sign in to DIRECTORY EDITING.
 *
 * A second password, held by the board, on top of the family one. The family
 * password is shared with every enrolled family; gating edits on it would let
 * any parent rewrite another family's address and phone number.
 *
 * The middleware has already required a valid family session to reach this
 * route at all, so this is strictly an additional check, never a way round the
 * first one.
 */
export const POST: APIRoute = async (context) => {
  const form = await readForm(context.request);
  if (!form) return context.redirect('/family-hub/admin/login?error=1');

  // .trim() both sides: a secret pasted from a dashboard often carries a
  // trailing newline, and a shared password never has meaningful whitespace.
  const password = String(form.get('password') ?? '').trim();
  const to = safeReturnTo(form.get('to') ? String(form.get('to')) : null);

  const expected = (env.FAMILY_HUB_ADMIN_PASSWORD ?? '').trim();

  if (expected && safeEqual(password, expected)) {
    // A fingerprint, not a `true` flag: rotating the secret invalidates every
    // existing admin session on the next request, with nothing to purge.
    context.session?.set(ADMIN_SESSION_KEY, await adminFingerprint(expected));
    return context.redirect(to);
  }

  return context.redirect(`/family-hub/admin/login?error=1&to=${encodeURIComponent(to)}`);
};
