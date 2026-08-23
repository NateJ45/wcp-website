import { useCallback, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { useClient, useWorkspace } from 'sanity';
import { IntentLink, useRouter } from 'sanity/router';
import { Badge, Box, Card, Flex, Heading, Spinner, Stack, Text } from '@sanity/ui';

// =============================================================================
// SetupWizard — the "new school year, roll the site over" checklist (Everything)
// =============================================================================
// Read-only, like the Checkup tool: it reads Site Settings + a few counts and
// lays out the start-of-year tasks in order, each with a live status (done /
// to-do / reminder) and a one-click jump to the exact place to fix it. It never
// changes anything — the board edits and publishes in the normal editor. Links
// go through IntentLink / router.navigateUrl so they work in the deployed hash-
// routed Studio (a raw <a> to a workspace path 404s — see WelcomePane).
// =============================================================================

type Status = 'done' | 'todo' | 'info';

interface Step {
  key: string;
  icon: string;
  title: string;
  detail: string;
  status: Status;
  intent?: ComponentProps<typeof IntentLink>['intent'];
  params?: Record<string, string>;
  /** Router path incl. workspace basePath, e.g. `${basePath}/checkup`. */
  path?: string;
  linkText: string;
}

interface Section {
  heading: string;
  steps: Step[];
}

interface SetupData {
  settings: {
    schoolYearLabel?: string;
    yearStart?: string;
    yearEnd?: string;
    firstDay?: string;
    enrollmentMode?: string;
  } | null;
  // The hub-side yearly fields moved to the `hubSettings` singleton
  // (Family Hub workspace) on 2026-08-23.
  hub: {
    coopHoursGoal?: number;
    pastYears?: number;
    calendarFeedUrl?: string;
    googleCalendarId?: string;
  } | null;
  hasFees: boolean;
  classesMissing: number;
  events: number;
  expiredAnnouncements: number;
}

const SETUP_QUERY = `{
  "settings": *[_type == "siteSettings"][0]{
    schoolYearLabel, yearStart, yearEnd, firstDay, enrollmentMode
  },
  "hub": *[_type == "hubSettings"][0]{
    coopHoursGoal, "pastYears": count(pastFundraisingTotals), calendarFeedUrl, googleCalendarId
  },
  "hasFees": count(*[_type == "feeSchedule"]) > 0,
  "classesMissing": count(*[_type == "class" && !(_id in path("drafts.**")) && !defined(monthly)]),
  "events": count(*[_type == "schoolYearEvent"]),
  "expiredAnnouncements": count(*[_type == "announcement" && enabled == true && defined(showUntil) && showUntil < now()])
}`;

const ENROLL_LABEL: Record<string, string> = {
  open: 'Open (accepting families)',
  waitlist: 'Waitlist',
  closed: 'Closed',
};

function buildSections(data: SetupData, basePath: string): Section[] {
  const s = data.settings ?? {};
  const h = data.hub ?? {};
  const editSettings = {
    intent: 'edit' as const,
    params: { id: 'siteSettings', type: 'siteSettings' },
  };
  // The hub's own yearly fields (hours goal, past totals, Google links) live
  // in the hubSettings singleton (Family Hub workspace).
  const editHubSettings = {
    intent: 'edit' as const,
    params: { id: 'hubSettings', type: 'hubSettings' },
  };
  const datesSet = !!(s.yearStart && s.yearEnd && s.firstDay);

  return [
    {
      heading: 'Set the year',
      steps: [
        {
          key: 'year-label',
          icon: '🗓️',
          title: 'Current school year',
          detail: s.schoolYearLabel
            ? `Set to "${s.schoolYearLabel}". Bump it if a new year has started.`
            : 'Set this year’s label, e.g. "2026-27". It appears site-wide.',
          status: s.schoolYearLabel ? 'done' : 'todo',
          ...editSettings,
          linkText: 'Open Site Settings',
        },
        {
          key: 'dates',
          icon: '📆',
          title: 'Key dates',
          detail: datesSet
            ? 'Year start, year end, and first day are set. Update them for the new year.'
            : 'Set the year start, year end, and first day (they drive the hub countdown and progress bar).',
          status: datesSet ? 'done' : 'todo',
          ...editSettings,
          linkText: 'Open Site Settings',
        },
        {
          key: 'enrollment',
          icon: '📝',
          title: 'Enrollment status',
          detail: `Now set to: ${ENROLL_LABEL[s.enrollmentMode ?? ''] ?? 'not set'}. Change it as the season turns.`,
          status: 'info',
          ...editSettings,
          linkText: 'Open Site Settings',
        },
      ],
    },
    {
      heading: 'Money',
      steps: [
        {
          key: 'tuition',
          icon: '💳',
          title: 'Tuition & fees',
          detail:
            data.classesMissing > 0
              ? `${data.classesMissing} class${data.classesMissing === 1 ? '' : 'es'} still missing a monthly price. Set this year’s prices.`
              : 'Review the fee schedule and each class’s monthly price for the new year.',
          status: data.hasFees && data.classesMissing === 0 ? 'done' : 'todo',
          intent: 'edit',
          params: { id: 'feeSchedule', type: 'feeSchedule' },
          linkText: 'Open Tuition & Fees',
        },
        {
          key: 'coop-hours',
          icon: '⏱️',
          title: 'Co-op hours goal',
          detail:
            h.coopHoursGoal && h.coopHoursGoal > 0
              ? `Set to ${h.coopHoursGoal} hours per family. Adjust if the ask changed.`
              : 'Set how many volunteer hours each family gives this year (or leave blank to hide the tracker).',
          status: h.coopHoursGoal && h.coopHoursGoal > 0 ? 'done' : 'info',
          ...editHubSettings,
          linkText: 'Open Hub settings',
        },
      ],
    },
    {
      heading: 'Calendar',
      steps: [
        {
          key: 'events',
          icon: '🎉',
          title: 'School-year events',
          detail:
            data.events > 0
              ? `${data.events} event${data.events === 1 ? '' : 's'} on file. Add this year’s open houses, breaks, and picture days.`
              : 'Add this year’s dated events (open houses, breaks, picture day) so they show on the public Events page.',
          status: data.events > 0 ? 'done' : 'todo',
          intent: 'create',
          params: { type: 'schoolYearEvent' },
          linkText: 'Add an event',
        },
      ],
    },
    {
      heading: 'Refresh for families',
      steps: [
        {
          key: 'president-note',
          icon: '💌',
          title: 'President’s welcome note',
          detail: 'Refresh the note that greets families at the top of the Family Hub.',
          status: 'info',
          intent: 'edit',
          params: { id: 'presidentNote', type: 'presidentNote' },
          linkText: 'Open the note',
        },
        {
          key: 'teacher-notes',
          icon: '🍎',
          title: 'Teacher welcome notes',
          detail: 'Add or update each class’s teacher welcome note for the new families.',
          status: 'info',
          intent: 'create',
          params: { type: 'teacherNote' },
          linkText: 'Add a note',
        },
        {
          key: 'directory',
          icon: '👪',
          title: 'Family directory',
          detail: 'Add this year’s new families and turn off any who have moved on.',
          status: 'info',
          intent: 'create',
          params: { type: 'directoryEntry' },
          linkText: 'Add a family',
        },
      ],
    },
    {
      heading: 'Wrap up last year',
      steps: [
        {
          key: 'old-announcements',
          icon: '🧹',
          title: 'Clear out old notices',
          detail:
            data.expiredAnnouncements > 0
              ? `${data.expiredAnnouncements} announcement${data.expiredAnnouncements === 1 ? '' : 's'} past their end date are still on. Turn them off.`
              : 'Retire last year’s announcements and popups. The Checkup tool lists anything left on.',
          status: data.expiredAnnouncements > 0 ? 'todo' : 'done',
          path: `${basePath}/checkup`,
          linkText: 'Open Checkup',
        },
        {
          key: 'fundraising-total',
          icon: '💰',
          title: 'Record last year’s fundraising total',
          detail:
            (h.pastYears ?? 0) > 0
              ? 'Add the final total from the year that just ended to the "What we’ve raised" history.'
              : 'Add the grand total from the year that just ended so it shows in the fundraising history.',
          status: 'info',
          ...editHubSettings,
          linkText: 'Open Hub settings',
        },
      ],
    },
  ];
}

const STATUS_BADGE: Record<Status, { tone: 'positive' | 'caution' | 'primary'; text: string }> = {
  done: { tone: 'positive', text: 'Set' },
  todo: { tone: 'caution', text: 'To do' },
  info: { tone: 'primary', text: 'Check' },
};

// A card that jumps to a doc (IntentLink) or a tool path (router). The path
// variant must use the router, not a raw <a>, or it 404s in the hash-routed
// deployed Studio (see WelcomePane's note).
function StepCard({ step }: { step: Step }) {
  const router = useRouter();
  const badge = STATUS_BADGE[step.status];
  const inner: ReactNode = (
    <Card className="wcp-setup-card" padding={3} radius={3} border style={{ height: '100%' }}>
      <Flex align="flex-start" gap={3}>
        <span aria-hidden style={{ fontSize: 20, lineHeight: '24px', flexShrink: 0 }}>
          {step.icon}
        </span>
        <Stack space={2} flex={1}>
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold">
              {step.title}
            </Text>
            <Badge tone={badge.tone} fontSize={0} padding={1}>
              {badge.text}
            </Badge>
          </Flex>
          <Text size={1} muted style={{ lineHeight: 1.5 }}>
            {step.detail}
          </Text>
          <Text size={1} style={{ color: '#166FA8' }}>
            {step.linkText} →
          </Text>
        </Stack>
      </Flex>
    </Card>
  );
  const linkStyle = { textDecoration: 'none', color: 'inherit', display: 'block' } as const;

  if (step.intent) {
    return (
      <IntentLink intent={step.intent} params={step.params} style={linkStyle}>
        {inner}
      </IntentLink>
    );
  }
  const path = step.path;
  const isHashRouted = typeof window !== 'undefined' && window.location.hash.startsWith('#/');
  const href = path ? (isHashRouted ? `${window.location.pathname}#${path}` : path) : undefined;
  return (
    <a
      href={href}
      style={linkStyle}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        if (path) router.navigateUrl({ path });
      }}
    >
      {inner}
    </a>
  );
}

export function SetupWizard() {
  const client = useClient({ apiVersion: '2025-01-01' });
  const { basePath } = useWorkspace();
  const [data, setData] = useState<SetupData | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const d = await client.fetch<SetupData>(SETUP_QUERY);
      setData(d);
    } catch {
      setData({
        settings: null,
        hub: null,
        hasFees: false,
        classesMissing: 0,
        events: 0,
        expiredAnnouncements: 0,
      });
    } finally {
      setBusy(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const sections = data ? buildSections(data, basePath) : [];
  const tracked = sections.flatMap((sec) => sec.steps).filter((st) => st.status !== 'info');
  const doneCount = tracked.filter((st) => st.status === 'done').length;

  return (
    <Box padding={4}>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .wcp-setup-card { transition: transform 150ms ease, box-shadow 150ms ease; }
          a:hover .wcp-setup-card { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(1, 69, 126, 0.12); }
        }
      `}</style>
      <Stack space={5} style={{ maxWidth: 680, margin: '0 auto' }}>
        <Stack space={3}>
          <Heading size={3} className="wcp-display">
            🍂 Start-of-year setup
          </Heading>
          <Text size={2} muted style={{ lineHeight: 1.5 }}>
            The once-a-year rollover, in order. Each card jumps you to the right place to update it.
            Nothing changes here — you edit and publish as usual. Work top to bottom.
          </Text>
          {data && tracked.length > 0 && (
            <Text size={1} weight="semibold" muted>
              {doneCount} of {tracked.length} key items look set.
            </Text>
          )}
        </Stack>

        <Flex>
          <button
            type="button"
            onClick={() => void load()}
            disabled={busy}
            style={{
              cursor: busy ? 'default' : 'pointer',
              border: '1px solid var(--card-border-color, #ccc)',
              background: 'transparent',
              borderRadius: 6,
              padding: '6px 12px',
              font: 'inherit',
              color: 'inherit',
            }}
          >
            {busy ? 'Checking…' : 'Refresh'}
          </button>
        </Flex>

        {data === null ? (
          <Flex align="center" gap={2}>
            <Spinner muted />
            <Text size={1} muted>
              Loading…
            </Text>
          </Flex>
        ) : (
          <Stack space={5}>
            {sections.map((section) => (
              <Stack space={3} key={section.heading}>
                <Text
                  size={1}
                  weight="semibold"
                  muted
                  style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  {section.heading}
                </Text>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 12,
                  }}
                >
                  {section.steps.map((step) => (
                    <StepCard key={step.key} step={step} />
                  ))}
                </div>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
