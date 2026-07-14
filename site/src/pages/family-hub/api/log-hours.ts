// =============================================================================
// POST /family-hub/api/log-hours — a family logs co-op volunteer hours
// =============================================================================
// Lives INSIDE /family-hub so the middleware gate applies automatically (only
// signed-in families reach it). Honor system: it stores a hoursLog doc with
// source "self" and verified = false, then forwards a note to the Google forms
// inbox (kind "hours") when configured — the board confirms hours later in the
// Studio. Progressive enhancement: JS gets JSON; a no-JS POST redirects back to
// the family's own hours view. Mirrors /family-hub/api/signup.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createClient } from '@sanity/client';
import { projectId, dataset, apiVersion } from '@/sanity/env';
import { normalizeHours, isHoursCategory, categoryLabel } from '@/lib/coop-hours';

const clip = (s: unknown, max: number) =>
  String(s ?? '')
    .trim()
    .slice(0, max);

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const wantsJson = (context.request.headers.get('accept') ?? '').includes('application/json');

  const familyName = clip(form.get('familyName'), 120);
  const hours = normalizeHours(form.get('hours'));
  const categoryRaw = clip(form.get('category'), 40);
  const category = isHoursCategory(categoryRaw) ? categoryRaw : 'other';
  const activity = clip(form.get('activity'), 200);
  const dateRaw = clip(form.get('date'), 10);
  const honeypot = clip(form.get('company'), 100);

  // No-JS path returns to the family's own view so they see the new row.
  const back = `/family-hub/hours?family=${encodeURIComponent(familyName)}`;
  const ok = () =>
    wantsJson
      ? new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      : context.redirect(`${back}&thanks=1`, 303);
  const bad = (msg: string, status = 400) =>
    wantsJson
      ? new Response(JSON.stringify({ ok: false, error: msg }), {
          status,
          headers: { 'content-type': 'application/json' },
        })
      : context.redirect(back, 303);

  if (honeypot) return ok();
  if (!familyName) return bad('Please add your family name.');
  if (hours <= 0) return bad('Enter how many hours you served.');

  // Accept a YYYY-MM-DD date; otherwise stamp today (server clock is UTC — the
  // hub only ever formats these anchored to noon UTC, so a bare date is fine).
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)
    ? dateRaw
    : new Date().toISOString().slice(0, 10);
  const submittedAt = new Date().toISOString();

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: env.SANITY_TOKEN,
  });

  // Store in Sanity — the ledger source + the board's review inbox.
  try {
    await client.create({
      _type: 'hoursLog',
      familyName,
      hours,
      category,
      activity: activity || undefined,
      date,
      verified: false,
      source: 'self',
      submittedAt,
    });
  } catch (err) {
    console.error('[log-hours] failed to store entry', err);
    return bad('Something went wrong. Please try again.', 500);
  }

  // Forward to the Google forms inbox (Sheet row + Gmail note), if set up.
  const webhookUrl = env.FORMS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: env.FORMS_WEBHOOK_TOKEN ?? '',
          kind: 'hours',
          name: familyName,
          hours,
          category: categoryLabel(category),
          activity,
          date,
          submittedAt,
        }),
      });
      if (!res.ok) console.error('[log-hours] forms webhook responded', res.status);
    } catch (err) {
      console.error('[log-hours] forms webhook failed', err);
    }
  }

  return ok();
};
