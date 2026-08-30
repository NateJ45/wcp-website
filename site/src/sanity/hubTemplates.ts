import type { Template } from 'sanity';

// =============================================================================
// Hub "＋ New" starting points (initial-value templates, 2026-08-31)
// =============================================================================
// Same idea as the announcement templates: clicking ＋ offers pre-filled
// starting points for the documents boards make on a rhythm, so the common
// cases begin half-done instead of blank. Every spotlight starts OFF.
// =============================================================================

/** ISO date `days` from now (date only — the Studio fields are dates). */
const inDays = (days: number): string =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

export const HUB_TEMPLATES: Template[] = [
  {
    id: 'spotlight-two-weeks',
    title: 'Spotlight — on for two weeks',
    schemaType: 'hubSpotlight',
    icon: () => '📣',
    value: () => ({
      title: 'New spotlight',
      heading: 'A note from the Board',
      summary: 'One or two sentences on what families should know.',
      tone: 'sky',
      active: false,
      showFrom: inDays(0),
      showUntil: inDays(14),
    }),
  },
  {
    id: 'update-minutes',
    title: 'Meeting minutes post',
    schemaType: 'update',
    icon: () => '📋',
    value: () => ({
      title: `Meeting Minutes — ${new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })}`,
      category: 'minutes',
      publishedAt: new Date().toISOString(),
    }),
  },
  {
    id: 'update-announcement',
    title: 'Announcement post',
    schemaType: 'update',
    icon: () => '📢',
    value: () => ({
      category: 'announcement',
      publishedAt: new Date().toISOString(),
    }),
  },
];
