import { useCallback, useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { Badge, Box, Button, Card, Flex, Heading, Spinner, Stack, Text } from '@sanity/ui';
import { computeReminders, type UpcomingItem } from '../../lib/reminders';

// =============================================================================
// HealthTool — a plain-language "what needs attention?" check (Everything ws)
// =============================================================================
// Read-only. Runs a handful of high-signal queries and reports what a volunteer
// would want to fix: a banner left on, announcements past their date still
// enabled, unanswered messages, pages gone stale, classes missing key info,
// drafts left unpublished. No mutations — it just points; you fix in the Studio.
// =============================================================================

type Severity = 'alert' | 'warn' | 'info' | 'ok';

interface CheckResult {
  id: string;
  severity: Severity;
  label: string;
  detail: string;
}

interface Check {
  id: string;
  // Returns null when all-good, or a {severity,label,detail} when something's up.
  run: (client: ReturnType<typeof useClient>) => Promise<Omit<CheckResult, 'id'> | null>;
}

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 182;
const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

const CHECKS: Check[] = [
  {
    id: 'alert-on',
    run: async (c) => {
      const on = await c.fetch<boolean>('count(*[_type == "closureAlert" && active == true]) > 0');
      return on
        ? {
            severity: 'alert',
            label: 'The Alert banner is ON',
            detail:
              'A snow-day / urgent banner is showing site-wide. Turn it off if the notice is over.',
          }
        : null;
    },
  },
  {
    id: 'ann-expired',
    run: async (c) => {
      const n = await c.fetch<number>(
        'count(*[_type == "announcement" && enabled == true && defined(showUntil) && showUntil < now()])',
      );
      return n > 0
        ? {
            severity: 'warn',
            label: `${n} announcement${n === 1 ? '' : 's'} past its end date but still on`,
            detail:
              'Turn it off, or clear its "Stop showing" date. (Bars/popups also stop showing on their own.)',
          }
        : null;
    },
  },
  {
    id: 'unanswered',
    run: async (c) => {
      const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
      const n = await c.fetch<number>(
        'count(*[_type == "submission" && handled != true && submittedAt < $cutoff])',
        { cutoff },
      );
      return n > 0
        ? {
            severity: 'warn',
            label: `${n} form message${n === 1 ? '' : 's'} over a month old and not marked Handled`,
            detail:
              'Reply and check them off in Form submissions, or clear them out with the Clean up tool.',
          }
        : null;
    },
  },
  {
    id: 'stale-pages',
    run: async (c) => {
      const cutoff = new Date(Date.now() - SIX_MONTHS_MS).toISOString();
      const pages = await c.fetch<{ title?: string }[]>(
        '*[_type == "page" && !(_id in path("drafts.**")) && _updatedAt < $cutoff]{ title }',
        { cutoff },
      );
      return pages.length
        ? {
            severity: 'warn',
            label: `${pages.length} page${pages.length === 1 ? '' : 's'} not touched in 6+ months`,
            detail: `Worth a fresh look: ${pages
              .map((p) => p.title || 'Untitled')
              .slice(0, 6)
              .join(', ')}${pages.length > 6 ? '…' : ''}.`,
          }
        : null;
    },
  },
  {
    id: 'class-missing',
    run: async (c) => {
      const classes = await c.fetch<{ name?: string }[]>(
        '*[_type == "class" && !(_id in path("drafts.**")) && (!defined(monthly) || !defined(teacher))]{ name }',
      );
      return classes.length
        ? {
            severity: 'warn',
            label: `${classes.length} class${classes.length === 1 ? '' : 'es'} missing tuition or a teacher`,
            detail: `Fill in the gaps: ${classes.map((x) => x.name || 'Untitled').join(', ')}.`,
          }
        : null;
    },
  },
  {
    id: 'drafts',
    run: async (c) => {
      const n = await c.fetch<number>(
        'count(*[_id in path("drafts.**") && _type in ["page","post","event","announcement","newsletterIssue"]])',
      );
      return n > 0
        ? {
            severity: 'warn',
            label: `${n} unpublished draft${n === 1 ? '' : 's'} sitting around`,
            detail:
              'You have edits that were never published. Open each and Publish, or discard the draft.',
          }
        : null;
    },
  },
  {
    // Forward-looking: deadlines, events, and sign-up sheets within two weeks.
    // Shares the exact logic the emailed /api/reminders feed uses.
    id: 'coming-up',
    run: async (c) => {
      const now = Date.now();
      const today = new Date(now).toISOString().slice(0, 10);
      const snap = await c.fetch<{
        enrollmentDeadline?: string | null;
        upcomingEvents?: UpcomingItem[];
        closingSheets?: UpcomingItem[];
      }>(
        `{
          "enrollmentDeadline": *[_type == "siteSettings"][0].enrollmentDeadline,
          "upcomingEvents": *[_type == "event" && coalesce(endDate, startDate) >= now()] | order(startDate asc)[0...20]{ title, "date": startDate },
          "closingSheets": *[_type == "signupSheet" && open == true && defined(eventDate) && eventDate >= $today] | order(eventDate asc){ title, "date": eventDate }
        }`,
        { today },
      );
      const upcoming = computeReminders({
        now,
        bannerOn: false,
        expiredAnnouncements: 0,
        oldUnanswered: 0,
        drafts: 0,
        enrollmentDeadline: snap.enrollmentDeadline ?? null,
        upcomingEvents: (snap.upcomingEvents ?? []).filter((e) => e.title && e.date),
        closingSheets: (snap.closingSheets ?? []).filter((s) => s.title && s.date),
      }).filter((r) => r.kind === 'upcoming');
      return upcoming.length
        ? {
            severity: 'info',
            label: `${upcoming.length} thing${upcoming.length === 1 ? '' : 's'} coming up in the next two weeks`,
            detail: upcoming.map((r) => r.title).join(' · '),
          }
        : null;
    },
  },
];

const SEV_BADGE: Record<
  Severity,
  { tone: 'critical' | 'caution' | 'primary' | 'positive'; text: string }
> = {
  alert: { tone: 'critical', text: 'Heads up' },
  warn: { tone: 'caution', text: 'Worth a look' },
  info: { tone: 'primary', text: 'Coming up' },
  ok: { tone: 'positive', text: 'All clear' },
};

const SEV_RANK: Record<Severity, number> = { alert: 0, warn: 1, info: 2, ok: 3 };

export function HealthTool() {
  const client = useClient({ apiVersion: '2025-01-01' });
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [busy, setBusy] = useState(false);

  const runAll = useCallback(async () => {
    setBusy(true);
    try {
      const found: CheckResult[] = [];
      for (const check of CHECKS) {
        try {
          const r = await check.run(client);
          if (r) found.push({ id: check.id, ...r });
        } catch {
          /* skip a failing check rather than break the whole report */
        }
      }
      found.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);
      setResults(found);
    } finally {
      setBusy(false);
    }
  }, [client]);

  useEffect(() => {
    void runAll();
  }, [runAll]);

  return (
    <Box padding={4}>
      <Stack space={5} style={{ maxWidth: 640, margin: '0 auto' }}>
        <Stack space={3}>
          <Heading size={3} className="wcp-display">
            🩺 Site checkup
          </Heading>
          <Text size={2} muted style={{ lineHeight: 1.5 }}>
            A quick look for things worth fixing: a banner left on, old messages, pages gone stale,
            and gaps in your classes — plus what's coming up in the next two weeks. Nothing is
            changed here; it just points you to what to check. (The same list can be emailed to the
            board each morning — see the Reminders setup.)
          </Text>
        </Stack>

        <Flex>
          <Button
            text={busy ? 'Checking…' : 'Check again'}
            mode="ghost"
            disabled={busy}
            onClick={() => void runAll()}
          />
        </Flex>

        {results === null ? (
          <Flex align="center" gap={2}>
            <Spinner muted />
            <Text size={1} muted>
              Checking…
            </Text>
          </Flex>
        ) : results.length === 0 ? (
          <Card padding={4} radius={3} tone="positive" border>
            <Flex align="center" gap={3}>
              <Badge tone="positive" padding={2} fontSize={1}>
                All clear
              </Badge>
              <Text size={2}>Nothing needs attention right now. Nice work.</Text>
            </Flex>
          </Card>
        ) : (
          <Stack space={3}>
            {results.map((r) => {
              const b = SEV_BADGE[r.severity];
              return (
                <Card key={r.id} padding={4} radius={3} border tone={b.tone}>
                  <Stack space={3}>
                    <Flex align="center" gap={3}>
                      <Badge tone={b.tone} padding={2} fontSize={1}>
                        {b.text}
                      </Badge>
                      <Text size={2} weight="semibold">
                        {r.label}
                      </Text>
                    </Flex>
                    <Text size={1} muted style={{ lineHeight: 1.5 }}>
                      {r.detail}
                    </Text>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
