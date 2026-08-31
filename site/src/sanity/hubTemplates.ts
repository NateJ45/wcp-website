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
  {
    id: 'celebration-birthday',
    title: 'Birthday celebration',
    schemaType: 'celebration',
    icon: () => '🎂',
    value: () => ({
      kind: 'birthday',
      date: inDays(0),
    }),
  },
  {
    id: 'celebration-welcome',
    title: 'Welcome a new family',
    schemaType: 'celebration',
    icon: () => '👋',
    value: () => ({
      kind: 'welcome',
      headline: 'Welcome to the co-op!',
      date: inDays(0),
    }),
  },
  {
    id: 'signup-helpers',
    title: 'Sign-up sheet — helper jobs',
    schemaType: 'signupSheet',
    icon: () => '📝',
    value: () => ({
      kind: 'signup',
      open: false, // starts CLOSED, like the spotlights: nothing half-made goes live
      eventDate: inDays(14),
      slots: [
        { _key: 'setup', _type: 'slot', label: 'Set-up crew', capacity: 2 },
        { _key: 'snacks', _type: 'slot', label: 'Bring snacks', capacity: 3 },
        { _key: 'cleanup', _type: 'slot', label: 'Clean-up crew', capacity: 2 },
      ],
    }),
  },
  {
    id: 'signup-rsvp',
    title: 'Event RSVP (a "we’ll be there" count)',
    schemaType: 'signupSheet',
    icon: () => '🙋',
    value: () => ({
      kind: 'rsvp',
      open: false,
      eventDate: inDays(14),
    }),
  },
];
