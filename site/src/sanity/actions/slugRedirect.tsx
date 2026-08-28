import { useClient, type DocumentActionComponent, type DocumentActionProps } from 'sanity';
import { useToast } from '@sanity/ui';
import { pathForDocSlug } from '../../lib/redirects';

// =============================================================================
// Safe rename — file a redirect automatically when a slug changes
// =============================================================================
// THE PROBLEM this closes: a board member renames a page's web address and
// every bookmark, Google result and link from another site quietly starts
// 404ing. The Redirects manager has always been there to fix that by hand
// (Public website → Site setup → Redirects), and the Help guide says to use it,
// but it depends on someone remembering at exactly the wrong moment.
//
// THE FIX: wrap the stock Publish action on the types that HAVE a public web
// address (`page`, `post`). When the document being published already has a
// published version whose slug differs from the one about to go live, we create
// a `redirect` document (old path → new path, permanent) FIRST, then hand off to
// the real Publish. Everything else about Publish is untouched — same label,
// same shortcut, same disabled/ready states — so this is purely additive.
//
// WHEN IT FIRES: only on Publish, only when (a) a published version exists
// (a first publish has no old address to preserve), (b) both old and new slugs
// resolve to a public path, and (c) they differ. Renaming a draft that was
// never published, or publishing an unrelated edit, does nothing at all.
//
// IT NEVER BLOCKS PUBLISH. If the redirect write fails for any reason (offline,
// permissions, Sanity hiccup), we toast a warning and publish anyway — the
// board's edit is the important part, and the redirect can be added by hand.
//
// FEEDBACK is a toast (same house pattern as archive.tsx), not a dialog: no
// prompt, no extra click, just a note saying the old address was kept working.
//
// The redirect it writes is published immediately (a plain `create`, not a
// draft), because the build-time reader in astro.config.mjs only sees published
// docs — a draft redirect would look filed but never fire. The publish itself
// triggers the deploy webhook, so the redirect is live on the same rebuild as
// the rename. See src/lib/redirects.ts and docs/REDIRECTS.md.
// =============================================================================

const API = { apiVersion: '2025-01-01' } as const;

/** Types whose slug maps to a public URL worth preserving on rename. */
export const SLUG_REDIRECT_TYPES = new Set(['page', 'post']);

/** Read a slug off a document, tolerating both shapes we use:
 *  `page.slug` is a plain string (it has to hold slashes); `post.slug` is
 *  Sanity's slug object. */
function readSlug(doc: unknown): string | null {
  const slug = (doc as { slug?: unknown } | null)?.slug;
  if (typeof slug === 'string') return slug;
  const current = (slug as { current?: unknown } | null)?.current;
  return typeof current === 'string' ? current : null;
}

interface Client {
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>;
  create: (doc: Record<string, unknown>) => Promise<unknown>;
  patch: (id: string) => {
    set: (v: Record<string, unknown>) => { commit: () => Promise<unknown> };
  };
}

/**
 * Create the old-path → new-path redirect, unless one already covers that old
 * path. Also repoints any existing redirect that pointed AT the old path, so a
 * second rename leaves a clean one-hop map instead of a chain.
 *
 * Returns the old path when something was written, null when there was nothing
 * to do. Throws only on a genuine write failure (the caller catches).
 */
async function fileRedirect(
  client: Client,
  type: string,
  oldSlug: string | null,
  newSlug: string | null,
  title: string | undefined,
): Promise<string | null> {
  const from = pathForDocSlug(type, oldSlug);
  const to = pathForDocSlug(type, newSlug);
  if (!from || !to || from === to) return null;

  // Never file a second redirect for the same old address — the existing one
  // (possibly hand-corrected by the board) wins.
  const existing = await client.fetch<string | null>(
    '*[_type == "redirect" && from == $from][0]._id',
    { from },
  );

  if (!existing) {
    await client.create({
      _type: 'redirect',
      from,
      to,
      permanent: true,
      note: `Added automatically when “${title || 'a page'}” moved from ${from} to ${to}.`,
    });
  }

  // A → B, then B → C: repoint the older A → B entry straight at C so visitors
  // take one hop, not two. Only exact, published matches; failure here is not
  // worth failing the publish over.
  const stale = await client.fetch<string[]>(
    '*[_type == "redirect" && to == $from && from != $to]._id',
    { from, to },
  );
  await Promise.all((stale ?? []).map((id) => client.patch(id).set({ to }).commit()));

  return from;
}

// A wrapper component must keep a STABLE identity across renders, or React
// unmounts and remounts the action on every pass (losing the stock Publish
// action's own state — its "publishing…" spinner and disabled logic). The
// resolver in sanity.config.ts runs on every render, so memoize by the wrapped
// component itself.
const wrapped = new WeakMap<DocumentActionComponent, DocumentActionComponent>();

/**
 * Wrap the stock Publish action so a slug change files a redirect first.
 * Identical to the original in every other respect.
 */
export function withSlugRedirect(publishAction: DocumentActionComponent): DocumentActionComponent {
  const cached = wrapped.get(publishAction);
  if (cached) return cached;

  const Wrapped: DocumentActionComponent = (props: DocumentActionProps) => {
    // Hooks first and unconditionally — the early return below must not change
    // how many hooks this component calls.
    const client = useClient(API) as unknown as Client;
    const toast = useToast();
    const original = publishAction(props);
    if (!original) return original;

    const oldSlug = readSlug(props.published);
    const newSlug = readSlug(props.draft ?? props.published);
    const title = (props.draft ?? props.published) as { title?: string } | null;

    return {
      ...original,
      onHandle: async () => {
        // Only a real rename of an already-published document is interesting.
        if (props.published && oldSlug && newSlug && oldSlug !== newSlug) {
          try {
            const from = await fileRedirect(client, props.type, oldSlug, newSlug, title?.title);
            if (from) {
              toast.push({
                status: 'success',
                title: 'Old link kept working',
                description: `Anyone using ${from} will now be sent to the new address. You can see it under Site setup → Redirects.`,
                duration: 8000,
              });
            }
          } catch (err) {
            console.error('[slug-redirect] could not file the redirect', err);
            toast.push({
              status: 'warning',
              title: 'Published, but the old link was not forwarded',
              description: `The page is live at its new address. Add a redirect by hand under Site setup → Redirects so the old link keeps working.`,
              duration: 12000,
            });
          }
        }
        // Publish exactly as it would have, whatever happened above.
        original.onHandle?.();
      },
    };
  };

  // Sanity keys actions by `action`; keeping it makes the wrapper a drop-in
  // (it stays the primary button, keeps the ⌘/Ctrl+Alt+P shortcut).
  Wrapped.action = publishAction.action;
  Wrapped.displayName = 'WithSlugRedirect(Publish)';

  wrapped.set(publishAction, Wrapped);
  return Wrapped;
}
