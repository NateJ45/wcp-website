import type { APIRoute } from 'astro';
import { saveTeacherPhones } from '@/lib/hub-teacher-phones';
import { readForm } from '@/lib/read-form';

export const prerender = false;

/**
 * Save teachers' phone numbers.
 *
 * Under /api, so it does NOT inherit the admin gate in src/middleware.ts — the
 * explicit check below is what protects it. Without it a signed-in family could
 * POST here directly and the admin password would be decorative.
 */
export const POST: APIRoute = async (context) => {
  const { env } = await import('cloudflare:workers');
  const { ADMIN_SESSION_KEY, isHubAdmin } = await import('@/lib/hub-auth');
  const stored = await context.session?.get(ADMIN_SESSION_KEY);
  if (!(await isHubAdmin(stored, env.FAMILY_HUB_ADMIN_PASSWORD))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const form = await readForm(context.request);
  if (!form) return context.redirect('/family-hub/admin/teachers?error=1');

  // An empty box removes that number, so this map is built from what was
  // submitted rather than merged over what is already stored.
  const next: Record<string, string> = {};
  for (const [name, value] of form.entries()) {
    if (!name.startsWith('phone-')) continue;
    const key = name.slice('phone-'.length);
    const phone = String(value ?? '').trim();
    if (key && phone) next[key] = phone;
  }

  await saveTeacherPhones(next);
  return context.redirect('/family-hub/admin/teachers?saved=1');
};
