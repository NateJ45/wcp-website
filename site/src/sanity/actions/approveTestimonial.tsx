import { useState } from 'react';
import { useClient, type DocumentActionComponent, type DocumentActionProps } from 'sanity';

// =============================================================================
// ApproveTestimonialAction — turn a review submission into a public Testimonial
// =============================================================================
// A one-click document action on `testimonialSubmission`: it creates a real
// `testimonial` from the submitted quote/name/connection and marks the
// submission Handled. The board reviews first, then approves — the submission
// itself never appears on the site.
// =============================================================================
interface SubmissionDoc {
  quote?: string;
  authorName?: string;
  connection?: string;
}

export const ApproveTestimonialAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const client = useClient({ apiVersion: '2025-01-01' });
  const [busy, setBusy] = useState(false);
  const doc = (props.published ?? props.draft) as SubmissionDoc | null;
  const publishedId = props.id.replace(/^drafts\./, '');

  return {
    label: busy ? 'Approving…' : 'Approve into Testimonials',
    tone: 'positive',
    icon: () => '✅',
    disabled: busy || !doc?.quote,
    onHandle: async () => {
      setBusy(true);
      try {
        await client.create({
          _type: 'testimonial',
          quote: doc?.quote,
          author: doc?.authorName,
          role: doc?.connection,
          featured: false,
        });
        await client.patch(publishedId).set({ handled: true }).commit();
      } catch {
        /* leave it unhandled so the board can retry */
      } finally {
        setBusy(false);
        props.onComplete();
      }
    },
  };
};
