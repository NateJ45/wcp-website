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
  // First/last from the split fields (every form variant); a single `name`
  // field is still accepted for compatibility.
  const fname = String(form.get('fname') ?? '').trim();
  const lname = String(form.get('lname') ?? '').trim();
  const name = clip(
    [fname, lname].filter(Boolean).join(' ') || String(form.get('name') ?? '').trim(),
    200,
  );
  const email = clip(String(form.get('email') ?? '').trim(), 200);
  const phone = clip(String(form.get('phone') ?? '').trim(), 60);
  let message = clip(String(form.get('message') ?? '').trim(), 5000);
  const topic = clip(String(form.get('topic') ?? 'Contact').trim(), 120);

  // Variant extras (see ContactForm's VARIANTS): fold every structured field
  // into the stored/emailed message so the board sees one complete note and
  // no submission-schema change is needed per form. Checkbox groups post the
  // same name multiple times, hence getAll().
  const EXTRAS: Record<string, string> = {
    subject: 'Subject',
    childName: 'Child',
    childBirthdate: 'Birthdate',
    childInfo: 'Child (name & birthdate)',
    classInterest: 'Class interest',
    preferredStart: 'Preferred start',
    datesTimes: 'Preferred dates/times',
    experienceYears: 'Experience with children',
    ageGroups: 'Age groups',
    certification: 'ECE certification/degree',
    hearAbout: 'How they heard of us',
  };
  const detailLines: string[] = [];
  for (const [key, label] of Object.entries(EXTRAS)) {
    const values = form
      .getAll(key)
      .map((v) => clip(String(v).trim(), 300))
      .filter(Boolean);
    if (values.length) detailLines.push(`${label}: ${values.join(', ')}`);
  }
  if (detailLines.length) message = `${detailLines.join('\n')}${message ? `\n\n${message}` : ''}`;

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

  // Turnstile (dormant until TURNSTILE_SECRET_KEY is set — see docs/FORMS.md):
  // verify the widget token server-side; a missing/failed token is a bot.
  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    try {
      const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: String(form.get('cf-turnstile-response') ?? ''),
        }),
      });
      const outcome = (await verify.json()) as { success?: boolean };
      if (!outcome.success) return bad('Please complete the security check and try again.');
    } catch (err) {
      // Verification unreachable: let the submission through rather than lose
      // a real family's message (the honeypot + Sanity inbox still apply).
      console.error('[contact] turnstile verify failed', err);
    }
  }
  // Structured variants (enroll/tour/teach) may leave the free-text box empty —
  // their detail lines are the message. Only a fully empty note is rejected.
  if (!name || !isEmail(email) || !message)
    return bad('Please fill in your name, a valid email, and the details of your note.');

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

  // 2. Forward to the school's Google Apps Script inbox, if configured: one
  //    free webhook that emails the board's Gmail (reply-to = the family) AND
  //    appends a row to the submissions Google Sheet. See docs/FORMS.md and
  //    scripts/apps-script/forms-inbox.gs. Fire-and-forget: a webhook hiccup
  //    never fails the visitor (the submission is already safe in Sanity).
  const webhookUrl = env.FORMS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: env.FORMS_WEBHOOK_TOKEN ?? '',
          kind: 'contact',
          topic,
          name,
          email,
          phone,
          message,
          pageUrl: referer,
          submittedAt,
        }),
      });
      if (!res.ok) console.error('[contact] forms webhook responded', res.status);
    } catch (err) {
      console.error('[contact] forms webhook failed', err);
    }
  }

  // 3. Email the office via Resend, if configured.
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
