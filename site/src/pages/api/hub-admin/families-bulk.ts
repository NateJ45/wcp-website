import type { APIRoute } from 'astro';
import { readDirectoryDoc, saveDirectory } from '@/lib/hub-directory';
import { readForm } from '@/lib/read-form';

export const prerender = false;

/**
 * Remove several families at once — the end-of-year clear-out.
 *
 * Doing this one family at a time meant opening each record, scrolling to the
 * bottom and confirming, thirty-odd times in a row. That is not just slow: it
 * is the kind of repetitive confirm-clicking where the board stops reading the
 * dialogue, which is worse for safety than one deliberate bulk action.
 *
 * Under /api, so the admin gate in src/middleware.ts does NOT cover it. The
 * explicit check below is what protects it.
 *
 * `saveDirectory` supplies the real safety net: it refuses a save that would
 * empty a populated directory, writes a timestamped backup of the previous
 * value first, and rejects a stale version. So the worst case here is one
 * `wrangler kv key get` away from being undone.
 */
export const POST: APIRoute = async (context) => {
  const { env } = await import('cloudflare:workers');
  const { ADMIN_SESSION_KEY, isHubAdmin } = await import('@/lib/hub-auth');
  const stored = await context.session?.get(ADMIN_SESSION_KEY);
  if (!(await isHubAdmin(stored, env.FAMILY_HUB_ADMIN_PASSWORD))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const form = await readForm(context.request);
  if (!form) return context.redirect('/family-hub/admin?error=1');

  const version = Number(String(form.get('version') ?? '').trim());
  const ids = new Set(
    form
      .getAll('remove')
      .map((v) => String(v).trim())
      .filter(Boolean),
  );
  if (!ids.size) return context.redirect('/family-hub/admin?error=none-selected');

  const doc = await readDirectoryDoc();
  const kept = doc.entries.filter((e) => !ids.has(e._id));
  const removed = doc.entries.length - kept.length;

  const result = await saveDirectory(kept, version);
  if (!result.ok) {
    // `refused-empty` means the selection was every family. That is almost
    // certainly a select-all misfire rather than an intention, and it is the
    // one case where doing nothing is clearly right.
    const why = result.reason === 'refused-empty' ? 'refused-empty' : 'conflict';
    return context.redirect(`/family-hub/admin?${why}=1`);
  }
  return context.redirect(`/family-hub/admin?removed=${removed}`);
};
