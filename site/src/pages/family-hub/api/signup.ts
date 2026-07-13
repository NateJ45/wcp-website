// =============================================================================
// POST /family-hub/api/signup — take a slot / RSVP on a sign-up sheet
// =============================================================================
// Lives INSIDE /family-hub so the middleware gate applies automatically (when
// the gate is on, only signed-in families reach it). It validates against the
// sheet doc itself — open? slot exists? capacity left? — counting existing
// entries server-side, then (1) stores a signupEntry in Sanity (the source of
// truth for counts and the board's inbox) and (2) forwards a row to the
// Google forms inbox when configured (kind "signup" — see docs/FORMS.md).
// Progressive enhancement: JS gets JSON; a no-JS POST redirects back to the
// sign-ups page.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createClient } from '@sanity/client';
import { projectId, dataset, apiVersion } from '@/sanity/env';

interface Slot {
  _key: string;
  label?: string;
  capacity?: number;
}
interface Sheet {
  _id: string;
  title?: string;
  kind?: 'signup' | 'rsvp';
  open?: boolean;
  slots?: Slot[];
}

const clip = (s: unknown, max: number) =>
  String(s ?? '')
    .trim()
    .slice(0, max);

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const wantsJson = (context.request.headers.get('accept') ?? '').includes('application/json');

  const sheetId = clip(form.get('sheetId'), 100);
  const slotKey = clip(form.get('slotKey'), 100);
  const familyName = clip(form.get('familyName'), 120);
  const note = clip(form.get('note'), 300);
  const honeypot = clip(form.get('company'), 100);

  const back = '/family-hub/sign-ups';
  const ok = () =>
    wantsJson
      ? new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      : context.redirect(`${back}?thanks=1`, 303);
  const bad = (msg: string, status = 400) =>
    wantsJson
      ? new Response(JSON.stringify({ ok: false, error: msg }), {
          status,
          headers: { 'content-type': 'application/json' },
        })
      : context.redirect(back, 303);

  if (honeypot) return ok();
  if (!sheetId || !familyName) return bad('Please tell us your family name.');

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: env.SANITY_TOKEN,
  });

  // Validate against the sheet itself, server-side.
  let sheet: Sheet | null = null;
  try {
    sheet = await client.fetch<Sheet | null>(
      `*[_type == "signupSheet" && _id == $id][0]{ _id, title, kind, open, slots }`,
      { id: sheetId },
    );
  } catch (err) {
    console.error('[signup] sheet lookup failed', err);
    return bad('Something went wrong. Please try again.', 500);
  }
  if (!sheet || sheet.open === false) return bad('This sheet is closed.');

  let slotLabel = 'We’ll be there';
  if (sheet.kind !== 'rsvp') {
    const slot = (sheet.slots ?? []).find((s) => s._key === slotKey);
    if (!slot) return bad('That slot no longer exists — refresh and try again.');
    slotLabel = slot.label ?? 'Slot';
    // Capacity check: count existing entries for this slot. Not transactional
    // (two families in the same second could both land), but the board reads
    // the responses inbox either way — good enough for a preschool sheet.
    if (slot.capacity && slot.capacity > 0) {
      const taken = await client.fetch<number>(
        `count(*[_type == "signupEntry" && sheet._ref == $id && slotKey == $key])`,
        { id: sheetId, key: slotKey },
      );
      if (taken >= slot.capacity) return bad('That slot just filled up — pick another?', 409);
    }
  }

  const submittedAt = new Date().toISOString();

  // 1. Store in Sanity — the count source + the board's inbox.
  try {
    await client.create({
      _type: 'signupEntry',
      sheet: { _type: 'reference', _ref: sheetId },
      slotKey: sheet.kind === 'rsvp' ? 'rsvp' : slotKey,
      slotLabel,
      familyName,
      note: note || undefined,
      submittedAt,
    });
  } catch (err) {
    console.error('[signup] failed to store entry', err);
    return bad('Something went wrong. Please try again.', 500);
  }

  // 2. Forward to the Google forms inbox (Sheet row + Gmail note), if set up.
  const webhookUrl = env.FORMS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: env.FORMS_WEBHOOK_TOKEN ?? '',
          kind: 'signup',
          sheetTitle: sheet.title ?? '',
          slot: slotLabel,
          name: familyName,
          note,
          submittedAt,
        }),
      });
      if (!res.ok) console.error('[signup] forms webhook responded', res.status);
    } catch (err) {
      console.error('[signup] forms webhook failed', err);
    }
  }

  return ok();
};
