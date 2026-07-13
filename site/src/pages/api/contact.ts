// =============================================================================
// POST /api/contact — receive a website contact/inquiry form
// =============================================================================
// SSR (prerender=false) so it runs in the Worker. It: (1) drops obvious spam
// via the honeypot, (2) validates, (3) stores the message as a `submission`
// doc in Sanity so the board always has it in the Studio inbox, and (4) emails
// the office via Resend IF a RESEND_API_KEY secret is set (otherwise it just
// stores — the form still works). Progressive enhancement: JS submits with
// Accept: application/json and gets JSON back; a no-JS POST gets a redirect.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createClient } from '@sanity/client';
import { projectId, dataset, apiVersion } from '@/sanity/env';
import { site } from '@/data/site';

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const clip = (s: string, max: number) => s.slice(0, max);

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const wantsJson = (context.request.headers.get('accept') ?? '').includes('application/json');
  const referer = context.request.headers.get('referer') ?? '';

  const honeypot = String(form.get('company') ?? '').trim();
  const name = clip(String(form.get('name') ?? '').trim(), 200);
  const email = clip(String(form.get('email') ?? '').trim(), 200);
  const phone = clip(String(form.get('phone') ?? '').trim(), 60);
  let message = clip(String(form.get('message') ?? '').trim(), 5000);
  const topic = clip(String(form.get('topic') ?? 'Contact').trim(), 120);

  // Enrollment inquiries carry structured child details (see ContactForm's
  // showEnrollFields). Fold them into the stored/emailed message so the board
  // sees everything in one place without a schema change.
  const childName = clip(String(form.get('childName') ?? '').trim(), 200);
  const childBirthdate = clip(String(form.get('childBirthdate') ?? '').trim(), 40);
  const classInterest = clip(String(form.get('classInterest') ?? '').trim(), 40);
  const childDetails = [
    childName && `Child: ${childName}`,
    childBirthdate && `Birthdate: ${childBirthdate}`,
    classInterest && `Class: ${classInterest}`,
  ]
    .filter(Boolean)
    .join(' · ');
  if (childDetails) message = `${childDetails}\n\n${message}`;

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

  // Honeypot filled → a bot. Pretend success and drop it.
  if (honeypot) return ok();
  if (!name || !isEmail(email) || !message)
    return bad('Please fill in your name, a valid email, and a message.');

  const submittedAt = new Date().toISOString();

  // 1. Always store in Sanity so nothing is lost even if email isn't set up.
  try {
    const client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: env.SANITY_TOKEN,
    });
    await client.create({
      _type: 'submission',
      name,
      email,
      phone: phone || undefined,
      message,
      topic,
      pageUrl: referer,
      submittedAt,
      handled: false,
    });
  } catch (err) {
    console.error('[contact] failed to store submission', err);
    // Don't fail the visitor if storage hiccups; still try to email below.
  }

  // 2. Email the office via Resend, if configured.
  const resendKey = env.RESEND_API_KEY;
  if (resendKey) {
    const to = env.CONTACT_TO || site.email.general;
    const from = env.CONTACT_FROM || 'WCP Website <onboarding@resend.dev>';
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          reply_to: email,
          subject: `[WCP] ${topic} — ${name}`,
          text: `Topic: ${topic}\nName: ${name}\nEmail: ${email}\nPhone: ${phone || '-'}\nFrom page: ${referer || '-'}\n\n${message}`,
        }),
      });
      if (!res.ok) console.error('[contact] Resend responded', res.status, await res.text());
    } catch (err) {
      console.error('[contact] failed to send email', err);
    }
  }

  return ok();
};
