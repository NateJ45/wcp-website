// =============================================================================
// Create its page — one-click scaffolding for a new class's detail page
// =============================================================================
// Found in the add-a-class walkthrough (2026-08-29): making a `class` doc puts
// it in the tuition table and calculator by itself, but its DETAIL page is a
// separate page-builder doc a volunteer had to build by hand - duplicate a
// page, retype the address, fix the title. Every mechanical step of that now
// lives on this button; the words and photos stay the volunteer's job, which
// is why the copy lands as a DRAFT and is opened for editing, never published.
//
// The scaffold is a copy of an EXISTING class page (the first class in drag
// order that has one), so the new page starts with the real shape of a class
// page here - hero, day flow, teacher section, handbook - not an empty shell.
// Every `_key` is regenerated (src/lib/sanity-keys.ts) or the Studio refuses
// to edit the arrays. If the class already has a page, the button just says
// so. Teacher references inside copied Teachers sections are repointed at
// THIS class's teacher - that is wiring, not content.
// =============================================================================
import { useState } from 'react';
import { useClient, type DocumentActionComponent, type DocumentActionProps } from 'sanity';
import { useToast } from '@sanity/ui';
import { useRouter } from 'sanity/router';
import { regenerateKeys } from '../../lib/sanity-keys';

interface ClassDoc {
  name?: string;
  slug?: { current?: string };
  teacher?: { _ref?: string };
}

interface PageDoc {
  _id: string;
  [key: string]: unknown;
}

/** Point every Teachers section in a copied page at the new class's teacher. */
function repointTeachers(sections: unknown, teacherRef: string | undefined): unknown {
  if (!Array.isArray(sections) || !teacherRef) return sections;
  return sections.map((section) => {
    const s = section as { _type?: string; staff?: unknown[] };
    if (s?._type !== 'teacherSection' || !Array.isArray(s.staff) || s.staff.length === 0) {
      return section;
    }
    const first = s.staff[0] as { _key?: string };
    return { ...s, staff: [{ _type: 'reference', _key: first?._key, _ref: teacherRef }] };
  });
}

export const CreateClassPageAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const client = useClient({ apiVersion: '2025-01-01' });
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (props.type !== 'class') return null;
  const doc = (props.draft ?? props.published) as ClassDoc | null;
  const slug = doc?.slug?.current;

  return {
    label: busy ? 'Creating the page…' : 'Create its page',
    icon: () => '📄',
    disabled: busy || !slug,
    title: slug
      ? `Copies an existing class page to classes/${slug}, as a draft for you to edit.`
      : 'Give the class a web address (slug) first.',
    onHandle: async () => {
      if (!slug) return;
      setBusy(true);
      try {
        const pageSlug = `classes/${slug}`;
        const existing = await client.fetch<string | null>(
          `*[_type == "page" && slug == $slug][0]._id`,
          { slug: pageSlug },
        );
        if (existing) {
          toast.push({
            status: 'info',
            title: 'This class already has a page',
            description: `The page at /${pageSlug} exists — open it under Pages to edit it.`,
          });
          return;
        }

        // The template: the first class (drag order) that already has a page.
        const template = await client.fetch<PageDoc | null>(
          `*[_type == "class" && defined(slug.current)] | order(orderRank) {
            "page": *[_type == "page" && slug == "classes/" + ^.slug.current][0]
          }[defined(page)][0].page`,
        );
        if (!template) {
          toast.push({
            status: 'warning',
            title: 'No class page to copy yet',
            description:
              'Build the first class page by hand under Pages (or duplicate any page), then this button can copy it for the next class.',
          });
          return;
        }

        const { _id, _rev, _createdAt, _updatedAt, ...body } = template as PageDoc & {
          _rev?: string;
          _createdAt?: string;
          _updatedAt?: string;
        };
        void _id;
        void _rev;
        void _createdAt;
        void _updatedAt;
        const copy = regenerateKeys(body) as Record<string, unknown>;
        const created = await client.create({
          ...copy,
          _id: `drafts.${crypto.randomUUID()}`,
          _type: 'page',
          title: `${doc?.name ?? slug} Class`,
          slug: pageSlug,
          sections: repointTeachers(copy.sections, doc?.teacher?._ref),
          // Never let the scaffold publish itself on a schedule the template had.
          publishAt: undefined,
        });

        toast.push({
          status: 'success',
          title: 'Draft page created',
          description: `Now at /${pageSlug} — opening it so you can put in this class's words and photos.`,
        });
        router.navigateIntent('edit', { id: created._id.replace(/^drafts\./, ''), type: 'page' });
      } catch (err) {
        console.error('[create-class-page] failed', err);
        toast.push({
          status: 'error',
          title: 'Could not create the page',
          description: 'Nothing was changed. Try again, or duplicate a class page under Pages.',
        });
      } finally {
        setBusy(false);
        props.onComplete();
      }
    },
  };
};
