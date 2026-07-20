import type { APIRoute } from 'astro';
// Astro 6+ (this project is on Astro 7): Worker secrets/bindings come from the
// `cloudflare:workers` virtual module, NOT the removed `Astro.locals.runtime`.
// In `astro dev` this is populated from .dev.vars; in prod from the deployed
// secret (`wrangler secret put FAMILY_HUB_PASSWORD`).
import { env } from 'cloudflare:workers';
import { HUB_SESSION_KEY, passwordFingerprint, safeEqual } from '@/lib/hub-auth';

export const prerender = false;

// Only ever redirect to an in-hub path — never an attacker-supplied URL.
function safeReturnTo(to: string | null): string {
  return to && to.startsWith('/family-hub') ? to : '/family-hub';
}

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  // .trim() both sides: a shared password never has meaningful leading/trailing
  // whitespace, and secrets pasted into a dashboard/terminal often pick up a
  // stray trailing newline — trimming avoids a maddening "correct password fails".
  const password = String(form.get('password') ?? '').trim();
  const to = safeReturnTo(form.get('to') ? String(form.get('to')) : null);

  const expected = (env.FAMILY_HUB_PASSWORD ?? '').trim();

  if (expected && safeEqual(password, expected)) {
    // Store a fingerprint of the password, not a `true` flag: rotating the
    // secret then invalidates every existing session automatically. See
    // src/lib/hub-auth.ts for why.
    context.session?.set(HUB_SESSION_KEY, await passwordFingerprint(expected));
    return context.redirect(to);
  }

  // Wrong password — back to the form with an error, preserving the destination.
  return context.redirect(`/family-hub/login?error=1&to=${encodeURIComponent(to)}`);
};
