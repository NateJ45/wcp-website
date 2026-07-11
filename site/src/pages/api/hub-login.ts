import type { APIRoute } from 'astro';
// Astro 6+ (this project is on Astro 7): Worker secrets/bindings come from the
// `cloudflare:workers` virtual module, NOT the removed `Astro.locals.runtime`.
// In `astro dev` this is populated from .dev.vars; in prod from the deployed
// secret (`wrangler secret put FAMILY_HUB_PASSWORD`).
import { env } from 'cloudflare:workers';

export const prerender = false;

// Constant-time string compare — avoids leaking the password length/prefix via
// timing. (Low-stakes shared gate, but cheap to do right.)
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

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
    context.session?.set('familyAuthed', true);
    return context.redirect(to);
  }

  // Wrong password — back to the form with an error, preserving the destination.
  return context.redirect(`/family-hub/login?error=1&to=${encodeURIComponent(to)}`);
};
