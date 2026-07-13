// =============================================================================
// POST /api/subscribe — newsletter sign-up
// =============================================================================
// Honeypot + validate, then ALWAYS store the subscriber in Sanity (so the list
// is never lost), and — if a provider is configured — also push to the email
// service (Buttondown or Mailchimp). Works store-only until you pick a provider.
// Progressive enhancement: JS gets JSON; a no-JS POST gets a redirect.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createClient } from '@sanity/client';
import { projectId, dataset, apiVersion } from '@/sanity/env';

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const safeId = (email: string) => `subscriber.${email.toLowerCase().replace(/[^a-z0-9._-]/g, '_')}`;

async function pushToProvider(email: string, name: string): Promise<void> {
  const provider = env.NEWSLETTER_PROVIDER;
  if (provider === 'buttondown' && env.BUTTONDOWN_API_KEY) {
    await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email_address: email, metadata: name ? { name } : undefined }),
    });
  } else if (
    provider === 'mailchimp' &&
    env.MAILCHIMP_API_KEY &&
    env.MAILCHIMP_LIST_ID &&
    env.MAILCHIMP_SERVER_PREFIX
  ) {
    const dc = env.MAILCHIMP_SERVER_PREFIX;
    await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${env.MAILCHIMP_LIST_ID}/members`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.MAILCHIMP_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        merge_fields: name ? { FNAME: name } : undefined,
      }),
    });
  }
}

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const wantsJson = (context.request.headers.get('accept') ?? '').includes('application/json');
  const referer = context.request.headers.get('referer') ?? '';

  const honeypot = String(form.get('company') ?? '').trim();
  const email = String(form.get('email') ?? '')
    .trim()
    .slice(0, 200);
  // First/last come from the newsletter form's split fields (matching the old
  // Squarespace block); a single `name` field is still accepted from any
  // older/simpler embed.
  const fname = String(form.get('fname') ?? '').trim();
  const lname = String(form.get('lname') ?? '').trim();
  const name = (
    [fname, lname].filter(Boolean).join(' ') || String(form.get('name') ?? '').trim()
  ).slice(0, 200);
  const source = String(form.get('source') ?? 'newsletter')
    .trim()
    .slice(0, 120);

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

  if (honeypot) return ok();
  if (!isEmail(email)) return bad('Please enter a valid email address.');

  // 1. Store in Sanity (dedupe by a deterministic, email-derived id).
  try {
    const client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: env.SANITY_TOKEN,
    });
    await client.createIfNotExists({
      _id: safeId(email),
      _type: 'subscriber',
      email,
      name: name || undefined,
      source,
      subscribedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[subscribe] failed to store subscriber', err);
  }

  // 2. Push to the email provider, if one is configured.
  try {
    await pushToProvider(email, name);
  } catch (err) {
    console.error('[subscribe] provider push failed', err);
  }

  // 3. Log to the school's Google Apps Script inbox, if configured — the
  //    newsletter tab of the submissions Sheet (see docs/FORMS.md).
  const webhookUrl = env.FORMS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: env.FORMS_WEBHOOK_TOKEN ?? '',
          kind: 'newsletter',
          name,
          email,
          pageUrl: referer,
          submittedAt: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('[subscribe] forms webhook failed', err);
    }
  }

  return ok();
};
