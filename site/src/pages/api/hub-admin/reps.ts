import type { APIRoute } from 'astro';
import { saveRepLinks } from '@/lib/hub-directory';
import { readForm } from '@/lib/read-form';

export const prerender = false;

/**
 * Save which family each role holder is reached through.
 *
 * Under /api, so the admin gate in src/middleware.ts does NOT cover it — the
 * explicit check below is what protects it.
 */
export const POST: APIRoute = async (context) => {
  const { env } = await import('cloudflare:workers');
  const { ADMIN_SESSION_KEY, isHubAdmin } = await import('@/lib/hub-auth');
  const stored = await context.session?.get(ADMIN_SESSION_KEY);
  if (!(await isHubAdmin(stored, env.FAMILY_HUB_ADMIN_PASSWORD))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const form = await readForm(context.request);
  if (!form) return context.redirect('/family-hub/admin/reps?error=1');

  // Built from what was submitted, not merged over what is stored: choosing
  // "No contact" has to be able to REMOVE a link, and a merge would silently
  // keep the old one.
  const next: Record<string, string> = {};
  for (const [name, value] of form.entries()) {
    if (!name.startsWith('rep-')) continue;
    const holderId = name.slice('rep-'.length);
    const familyId = String(value ?? '').trim();
    if (holderId && familyId) next[holderId] = familyId;
  }

  await saveRepLinks(next);
  return context.redirect('/family-hub/admin/reps?saved=1');
};
