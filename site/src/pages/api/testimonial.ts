// =============================================================================
// POST /api/testimonial — receive a parent-submitted review
// =============================================================================
// SSR (prerender=false). Drops honeypot spam, validates, and stores a
// `testimonialSubmission` doc for the board to review and approve. Never
// publishes anything itself — approval happens in the Studio. Progressive
// enhancement: JS gets JSON, a no-JS POST redirects to /thank-you.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createClient } from '@sanity/client';
import { projectId, dataset, apiVersion } from '@/sanity/env';
import { readForm } from '@/lib/read-form';

const clip = (s: string, max: number) => s.slice(0, max);
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export const POST: APIRoute = async (context) => {
  const wantsJson = (context.request.headers.get('accept') ?? '').includes('application/json');
  // A non-form body used to crash formData() with a 500; reject it cleanly.
  const form = await readForm(context.request);
  if (!form) {
    return wantsJson
      ? new Response(JSON.stringify({ ok: false, error: 'Bad request.' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
      : context.redirect('/', 303);
  }
  const referer = context.request.headers.get('referer') ?? '';

  const honeypot = String(form.get('company') ?? '').trim();
  const quote = clip(String(form.get('quote') ?? '').trim(), 2000);
  const authorName = clip(String(form.get('authorName') ?? '').trim(), 200);
  const connection = clip(String(form.get('connection') ?? '').trim(), 200);
  const email = clip(String(form.get('email') ?? '').trim(), 200);
  const permission = form.get('permission') != null;

  const ok = () =>
    wantsJson
      ? new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      : context.redirect('/thank-you', 303);
  const bad = (msg: string) =>
    wantsJson
      ? new Response(JSON.stringify({ ok: false, error: msg }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
      : context.redirect(referer || '/', 303);

  if (honeypot) return ok(); // bot
  if (!quote) return bad('Please write your review before sending.');
  if (email && !isEmail(email)) return bad('That email doesn’t look right.');
  if (!permission) return bad('Please tick the box to give permission to share your words.');

  try {
    const client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: env.SANITY_TOKEN,
    });
    await client.create({
      _type: 'testimonialSubmission',
      quote,
      authorName: authorName || undefined,
      connection: connection || undefined,
      email: email || undefined,
      permission,
      submittedAt: new Date().toISOString(),
      handled: false,
    });
  } catch (err) {
    console.error('[testimonial] failed to store', err);
    return bad('Sorry, something went wrong. Please try again.');
  }

  return ok();
};
