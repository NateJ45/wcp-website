// =============================================================================
// Create its hub page — one-click scaffolding for a class's HANDBOOK
// =============================================================================
// The sibling of "Create its page" (createClassPage.tsx), for the gated side.
// A class already HAS a Family Hub page the moment it is published: the site
// builds /family-hub/<slug> from the class entry itself — facts, teacher, reps,
// pay button, helper sheet, photo album (src/lib/hub-classrooms.ts). What it
// does not have is the HANDBOOK below that: the daily routine, drop-off and
// pick-up, snack duty, the helper playbook. That handbook is a `hubPage`
// document, and building one by hand meant knowing to leave "Which hub page"
// empty, to type the class's exact address, and to tick the class under
// "Classes on this page" — three chances to make a page that never shows.
//
// Every mechanical step of that lives on this button. The words stay the
// volunteer's job, which is why the copy lands as a DRAFT and is opened for
// editing, never published.
//
// Like its public twin, the scaffold copies an EXISTING classroom page when
// there is one, so a new handbook starts with the real shape of one here
// instead of an empty shell. Every `_key` is regenerated
// (src/lib/sanity-keys.ts) or the Studio refuses to edit the arrays.
// =============================================================================
import { useState } from 'react';
import { useClient, type DocumentActionComponent, type DocumentActionProps } from 'sanity';
import { useToast } from '@sanity/ui';
import { useRouter } from 'sanity/router';
import { regenerateKeys } from '../../lib/sanity-keys';

interface ClassDoc {
  _id?: string;
  name?: string;
  icon?: string;
  slug?: { current?: string };
}

interface HubPageDoc {
  _id: string;
  title?: string;
  [key: string]: unknown;
}

export const CreateClassHubPageAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const client = useClient({ apiVersion: '2025-01-01' });
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (props.type !== 'class') return null;
  const doc = (props.draft ?? props.published) as ClassDoc | null;
  const slug = doc?.slug?.current;
  const id = props.id;

  return {
    label: busy ? 'Creating the handbook…' : 'Create its hub page',
    icon: () => '🔒',
    disabled: busy || !slug,
    title: slug
      ? `Starts the Family Hub handbook for this class, as a draft for you to edit. The class page itself already works at /family-hub/${slug}.`
      : 'Give the class a web address (slug) first.',
    onHandle: async () => {
      if (!slug) return;
      setBusy(true);
      try {
        // Already on a classroom page — its own, or one it shares with another
        // class (Twos and Threes share Ms. Erin's). Say so and stop.
        const existing = await client.fetch<{ _id: string; title?: string } | null>(
          `*[_type == "hubPage" && count(classes[@._ref == $id]) > 0][0]{ _id, title }`,
          { id },
        );
        if (existing) {
          toast.push({
            status: 'info',
            title: 'This class already has a hub page',
            description: `Its handbook is “${existing.title ?? 'a Family Hub page'}” — opening it.`,
          });
          router.navigateIntent('edit', {
            id: existing._id.replace(/^drafts\./, ''),
            type: 'hubPage',
          });
          return;
        }

        // The template: any other classroom page, so the new handbook opens
        // with the shape of a real one. None yet is fine — the page renders its
        // built-in half either way.
        const template = await client.fetch<HubPageDoc | null>(
          `*[_type == "hubPage" && count(classes) > 0 && count(sections) > 0][0]`,
        );

        const body = template
          ? (regenerateKeys(stripSystemFields(template)) as Record<string, unknown>)
          : {};

        const created = await client.create({
          ...body,
          _id: `drafts.${crypto.randomUUID()}`,
          _type: 'hubPage',
          title: `${doc?.name ?? slug} classroom`,
          heading: `${doc?.name ?? slug} Classroom`,
          // A classroom page is a NEW page, not one that came with the site, so
          // it is addressed by its slug. That slug must be the class's own, or
          // the class page at /family-hub/<slug> would not find it.
          slug,
          hubKey: undefined,
          navIcon: doc?.icon || 'graduation-cap',
          classes: [{ _type: 'reference', _key: crypto.randomUUID().slice(0, 12), _ref: id }],
          handbookFile: undefined,
          // Never let the scaffold publish itself on a schedule the template had.
          publishAt: undefined,
          archived: false,
        });

        toast.push({
          status: 'success',
          title: 'Draft handbook created',
          description: `It shows under the class facts at /family-hub/${slug} once you publish it. Opening it now.`,
        });
        router.navigateIntent('edit', {
          id: created._id.replace(/^drafts\./, ''),
          type: 'hubPage',
        });
      } catch (err) {
        console.error('[create-class-hub-page] failed', err);
        toast.push({
          status: 'error',
          title: 'Could not create the handbook',
          description:
            'Nothing was changed. Try again, or make a Family Hub page by hand and pick this class under “Classes on this page”.',
        });
      } finally {
        setBusy(false);
        props.onComplete();
      }
    },
  };
};

/** Drop the fields Sanity owns, so the copy is a new document, not an edit. */
function stripSystemFields(doc: HubPageDoc): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (['_id', '_rev', '_type', '_createdAt', '_updatedAt'].includes(key)) continue;
    out[key] = value;
  }
  return out;
}
