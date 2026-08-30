// =============================================================================
// Document badges — status chips where volunteers already look (2026-08-31)
// =============================================================================
// The Checkup tool finds these problems in one place; badges surface the same
// facts on the document lists and headers themselves: a spotlight past its end
// date but still switched on, an event whose date has passed, a draft that
// will publish itself (the publishAt cron), a pinned update. Read-only visual
// hints — they change nothing.
// =============================================================================
import type { DocumentBadgeComponent, DocumentBadgesResolver } from 'sanity';

type Doc = Record<string, unknown> | null;

const day = (v: unknown): number | null => {
  const t = typeof v === 'string' ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? t : null;
};

const ExpiredSpotlightBadge: DocumentBadgeComponent = (props) => {
  const doc = (props.draft ?? props.published) as Doc;
  if (!doc || doc.active !== true) return null;
  const end = day(doc.showUntil);
  if (end === null || end >= Date.now() - 86_400_000) return null;
  return {
    label: 'Past its end date',
    title: 'Still switched on — switch it off or extend it.',
    color: 'warning',
  };
};

const PastEventBadge: DocumentBadgeComponent = (props) => {
  const doc = (props.draft ?? props.published) as Doc;
  const start = day(doc?.startDate);
  // Recurring events regenerate; only a one-off in the past is stale.
  if (!doc || doc.recurrence === 'weekly' || start === null || start >= Date.now() - 86_400_000)
    return null;
  return { label: 'Past event' };
};

const PublishesAtBadge: DocumentBadgeComponent = (props) => {
  const doc = props.draft as Doc; // only a DRAFT self-publishes
  const at = day(doc?.publishAt);
  if (!doc || at === null) return null;
  if (at < Date.now() - 3_600_000) {
    return {
      label: 'Publish time passed',
      title: 'The scheduled time is in the past — it should have published; check it.',
      color: 'warning',
    };
  }
  const label = new Date(at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return { label: `Publishes ${label}`, color: 'primary' };
};

const PinnedBadge: DocumentBadgeComponent = (props) => {
  const doc = (props.draft ?? props.published) as Doc;
  if (!doc || doc.pinned !== true) return null;
  return { label: 'Pinned', color: 'primary' };
};

/** Per-type wiring; every other type keeps only the default publish badge. */
export const resolveBadges: DocumentBadgesResolver = (prev, context) => {
  const extras: DocumentBadgeComponent[] = [];
  if (context.schemaType === 'hubSpotlight') extras.push(ExpiredSpotlightBadge);
  if (context.schemaType === 'event') extras.push(PastEventBadge);
  if (context.schemaType === 'update') extras.push(PinnedBadge);
  // publishAt exists on several types (hubPage, page, post, event,
  // announcement, newsletterIssue) — cheap to offer everywhere: the badge
  // renders null when the field is absent.
  extras.push(PublishesAtBadge);
  return [...prev, ...extras];
};
