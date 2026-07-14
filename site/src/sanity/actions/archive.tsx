import { useState } from 'react';
import { useClient, type DocumentActionComponent, type DocumentActionProps } from 'sanity';
import { useToast } from '@sanity/ui';
import { trashTitle, serializeForTrash, deserializeFromTrash } from '../../lib/trash';

// =============================================================================
// Archive / Restore / Delete forever — the soft-delete ("Recently deleted")
// =============================================================================
// ArchiveAction replaces the destructive Delete on content types: it snapshots
// the whole document into a `trashedItem` and removes the original, so nothing is
// truly gone — the board can bring it back from "Recently deleted". RestoreAction
// rebuilds the original from that snapshot; DeleteForeverAction empties it for
// good (with a confirm). All feedback is a toast, so there's no crashy dialog
// dependency. See src/lib/trash.ts (pure, unit-tested) and sanity.config.ts.
// =============================================================================

const API = { apiVersion: '2025-01-01' } as const;

// Remove both the published doc and any draft of it, in one transaction.
function deleteBoth(
  client: ReturnType<typeof useClient>,
  publishedId: string,
  hasPublished: boolean,
  hasDraft: boolean,
) {
  const tx = client.transaction();
  if (hasPublished) tx.delete(publishedId);
  if (hasDraft) tx.delete(`drafts.${publishedId}`);
  return tx.commit();
}

// ---------------------------------------------------------------------------
// Archive: move a content document to Recently deleted.
// ---------------------------------------------------------------------------
export const ArchiveAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const client = useClient(API);
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const snapshot = (props.draft ?? props.published) as Record<string, unknown> | null;
  const publishedId = props.id.replace(/^drafts\./, '');

  return {
    label: busy ? 'Moving to trash…' : 'Delete (move to trash)',
    tone: 'critical',
    icon: () => '🗑️',
    disabled: busy || !snapshot,
    onHandle: async () => {
      if (!snapshot) return props.onComplete();
      setBusy(true);
      let trashId: string | undefined;
      try {
        // Block if other documents still point at this one — deleting it would
        // leave broken links. Same guard the normal Delete uses.
        const refs = await client.fetch<number>('count(*[references($id)])', { id: publishedId });
        if (refs > 0) {
          toast.push({
            status: 'warning',
            title: 'Still in use',
            description:
              'Other pages or items link to this, so it can’t be deleted yet. Remove those links first (open it and check the “Used on” tab), then try again.',
          });
          return;
        }

        const created = await client.create({
          _type: 'trashedItem',
          title: trashTitle(snapshot),
          originalType: props.type,
          originalId: publishedId,
          deletedAt: new Date().toISOString(),
          payload: serializeForTrash(snapshot),
        });
        trashId = created._id;

        await deleteBoth(client, publishedId, !!props.published, !!props.draft);

        toast.push({
          status: 'success',
          title: 'Moved to Recently deleted',
          description: 'You can restore it from “Recently deleted” if you change your mind.',
        });
      } catch (err) {
        // Roll back the receipt so we never leave a trash entry for a doc that
        // is still live.
        if (trashId) await client.delete(trashId).catch(() => {});
        console.error('[archive] failed', err);
        toast.push({
          status: 'error',
          title: 'Could not delete',
          description: 'Something went wrong. Nothing was changed. Please try again.',
        });
      } finally {
        setBusy(false);
        props.onComplete();
      }
    },
  };
};

// ---------------------------------------------------------------------------
// Restore: rebuild the original document from a trashedItem.
// ---------------------------------------------------------------------------
export const RestoreAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const client = useClient(API);
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const receipt = (props.published ?? props.draft) as {
    payload?: string;
    title?: string;
  } | null;

  return {
    label: busy ? 'Restoring…' : 'Restore',
    tone: 'positive',
    icon: () => '↩️',
    disabled: busy || !receipt?.payload,
    onHandle: async () => {
      const restored = receipt?.payload ? deserializeFromTrash(receipt.payload) : null;
      if (!restored) {
        toast.push({ status: 'error', title: 'Sorry, this can’t be restored.' });
        return props.onComplete();
      }
      setBusy(true);
      try {
        await client.createOrReplace(restored);
        await deleteBoth(
          client,
          props.id.replace(/^drafts\./, ''),
          !!props.published,
          !!props.draft,
        );
        toast.push({
          status: 'success',
          title: `Restored “${receipt?.title ?? 'item'}”`,
          description: 'It’s back where it was.',
        });
      } catch (err) {
        console.error('[restore] failed', err);
        toast.push({ status: 'error', title: 'Could not restore. Please try again.' });
      } finally {
        setBusy(false);
        props.onComplete();
      }
    },
  };
};

// ---------------------------------------------------------------------------
// Delete forever: permanently remove a trashedItem (with a confirm).
// ---------------------------------------------------------------------------
export const DeleteForeverAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const client = useClient(API);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const title =
    (props.published as { title?: string } | null)?.title ??
    (props.draft as { title?: string } | null)?.title ??
    'this item';

  return {
    label: 'Delete forever',
    tone: 'critical',
    icon: () => '⛔',
    disabled: busy,
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'confirm',
      tone: 'critical',
      message: `Permanently delete “${title}”? This can’t be undone.`,
      confirmButtonText: 'Delete forever',
      cancelButtonText: 'Keep it',
      onCancel: () => {
        setOpen(false);
        props.onComplete();
      },
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteBoth(
            client,
            props.id.replace(/^drafts\./, ''),
            !!props.published,
            !!props.draft,
          );
          toast.push({ status: 'success', title: 'Deleted for good.' });
        } catch (err) {
          console.error('[delete-forever] failed', err);
          toast.push({ status: 'error', title: 'Could not delete. Please try again.' });
        } finally {
          setBusy(false);
          setOpen(false);
          props.onComplete();
        }
      },
    },
  };
};
