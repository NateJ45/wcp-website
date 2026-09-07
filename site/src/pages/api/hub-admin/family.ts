import type { APIRoute } from 'astro';
import { readDirectoryDoc, saveDirectory, type DirEntry } from '@/lib/hub-directory';
import { readForm } from '@/lib/read-form';

export const prerender = false;

/**
 * Save (or remove) one family.
 *
 * Reached only through the admin gate in src/middleware.ts — this route lives
 * under /api, not /family-hub, so it does NOT inherit that gate automatically.
 * The explicit check below is what protects it; without it the whole admin
 * password would be decorative, since anyone signed in as a family could POST
 * here directly.
 */
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

export const POST: APIRoute = async (context) => {
  const { env } = await import('cloudflare:workers');
  const { ADMIN_SESSION_KEY, isHubAdmin } = await import('@/lib/hub-auth');
  const stored = await context.session?.get(ADMIN_SESSION_KEY);
  if (!(await isHubAdmin(stored, env.FAMILY_HUB_ADMIN_PASSWORD))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const form = await readForm(context.request);
  if (!form) return context.redirect('/family-hub/admin?error=1');

  const str = (k: string) => String(form.get(k) ?? '').trim();
  const version = Number(str('version'));
  const removing = str('remove') === 'yes';
  const doc = await readDirectoryDoc();

  let id = str('_id');
  const familyName = str('familyName');
  if (!id) {
    // A new family. Keep the id shape the Sanity documents used, so a photo
    // reference or an old export still lines up if anyone ever cross-checks.
    const base = `directoryEntry-${slug(familyName) || 'family'}`;
    let candidate = base;
    let n = 2;
    while (doc.entries.some((e) => e._id === candidate)) candidate = `${base}-${n++}`;
    id = candidate;
  }

  const rest = doc.entries.filter((e) => e._id !== id);

  if (removing) {
    const result = await saveDirectory(rest, version);
    return context.redirect(
      result.ok ? '/family-hub/admin?saved=1' : '/family-hub/admin?conflict=1',
    );
  }

  // Blank rows are simply dropped, which is what makes "add a person" work with
  // no JavaScript: the form always renders a spare row.
  const parents = [];
  for (let i = 0; i < 12; i++) {
    const name = str(`parent${i}Name`);
    const email = str(`parent${i}Email`);
    const phone = str(`parent${i}Phone`);
    const role = str(`parent${i}Role`);
    if (name || email || phone) parents.push({ name, role, email, phone });
  }
  const children = [];
  for (let i = 0; i < 12; i++) {
    const name = str(`child${i}Name`);
    const cls = str(`child${i}Class`);
    if (name) children.push({ name, class: cls });
  }

  const previous = doc.entries.find((e) => e._id === id);
  const entry: DirEntry = {
    // Carry forward anything this form does not edit — the photo reference and
    // the geocoded location. Rebuilding the object from form fields alone would
    // silently drop both.
    ...previous,
    _id: id,
    familyName,
    optedIn: str('optedIn') === 'yes',
    address: str('address') || undefined,
    notes: str('notes') || undefined,
    parents,
    children,
  };

  const result = await saveDirectory([...rest, entry], version);
  return context.redirect(result.ok ? '/family-hub/admin?saved=1' : '/family-hub/admin?conflict=1');
};
