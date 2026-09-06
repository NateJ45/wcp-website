// =============================================================================
// POST /family-hub/api/photo-submit — a family submits a photo (moderated)
// =============================================================================
// Lives INSIDE /family-hub so the middleware gate applies automatically (only
// signed-in families reach it). The browser NEVER writes to Sanity directly —
// it posts the file here, and this endpoint (holding the server token) uploads
// the asset and creates a photoSubmission with approved = false. Nothing is
// public until the board reviews and approves it in the Studio, and even then it
// only shows on the gated hub gallery. Guardrails, in order:
//   1. honeypot (silent drop)          3. content-type allowlist + magic bytes
//   2. Turnstile (when configured)     4. size cap
// A spoofed content-type is caught by sniffing the first bytes, and an oversized
// or wrong-typed file is rejected before any upload. Mirrors /api/contact.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createClient } from '@sanity/client';
import { projectId, dataset, apiVersion } from '@/sanity/env';
import { readForm } from '@/lib/read-form';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

const clip = (s: unknown, max: number) =>
  String(s ?? '')
    .trim()
    .slice(0, max);

// Sniff the real image type from the leading bytes so a spoofed `File.type`
// (client-controlled) can't smuggle a non-image through. Returns the true MIME
// or null if it isn't one of our three allowed formats.
function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return 'image/png';
  // WEBP: "RIFF"...."WEBP"
  const ascii = (i: number) => String.fromCharCode(bytes[i]);
  if (
    ascii(0) + ascii(1) + ascii(2) + ascii(3) === 'RIFF' &&
    ascii(8) + ascii(9) + ascii(10) + ascii(11) === 'WEBP'
  )
    return 'image/webp';
  return null;
}

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
      : context.redirect('/family-hub', 303);
  }

  const submittedBy = clip(form.get('submittedBy'), 120);
  const caption = clip(form.get('caption'), 200);
  const honeypot = clip(form.get('company'), 100);
  const file = form.get('photo');

  const back = '/family-hub/photos';
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

  // 1. Honeypot — silent success.
  if (honeypot) return ok();

  // 2. Turnstile (dormant until TURNSTILE_SECRET_KEY is set).
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
      console.error('[photo-submit] turnstile verify failed', err);
      // Unreachable verifier: fall through (the gate + honeypot + moderation
      // still apply) rather than lose a real family's upload.
    }
  }

  if (!(file instanceof File) || file.size === 0) return bad('Please choose a photo to upload.');

  // 4. Size cap (checked before reading the whole body into memory to upload).
  if (file.size > MAX_BYTES) return bad('That photo is over 8 MB — please pick a smaller one.');

  const bytes = new Uint8Array(await file.arrayBuffer());

  // 3. Content-type: the declared type must be allowed AND the bytes must match.
  const sniffed = sniffImageType(bytes);
  if (!ALLOWED.has(file.type) || !sniffed) {
    return bad('Please upload a JPEG, PNG, or WebP image.');
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: env.SANITY_TOKEN,
  });

  const submittedAt = new Date().toISOString();

  try {
    const asset = await client.assets.upload('image', new Blob([bytes], { type: sniffed }), {
      filename: file.name || 'family-photo',
      contentType: sniffed,
    });
    await client.create({
      _type: 'photoSubmission',
      photo: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
      caption: caption || undefined,
      submittedBy: submittedBy || undefined,
      approved: false,
      submittedAt,
    });
  } catch (err) {
    console.error('[photo-submit] upload/create failed', err);
    return bad('Something went wrong uploading your photo. Please try again.', 500);
  }

  // Optional: nudge the board that a photo is waiting to be reviewed.
  const webhookUrl = env.FORMS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: env.FORMS_WEBHOOK_TOKEN ?? '',
          kind: 'photo',
          name: submittedBy,
          caption,
          submittedAt,
        }),
      });
      if (!res.ok) console.error('[photo-submit] forms webhook responded', res.status);
    } catch (err) {
      console.error('[photo-submit] forms webhook failed', err);
    }
  }

  return ok();
};
