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
    // A teacher swap that nobody finished. The hub's teacher card follows the
    // WELCOME NOTE, not the class's Teacher field, so after a swap the class
    // page keeps showing the old teacher's letter, photo and email until
    // somebody rewrites the note — and nothing said so. This check says so.
    //
    // The match is deliberately loose: the note is signed "Erin Schmerr" while
    // Staff holds "Mrs. Erin Schmerr", so a shared word is enough. Only a note
    // that names NOBODY from the teacher's name is reported, which is what
    // makes a real swap stand out and a formatting difference stay quiet.
    id: 'teacher-note-stale',
    run: async (c) => {
      // Two flat reads, matched in JS. A note is filed under a class page's
      // ADDRESS or a class SLUG (see teacherNoteKeys in hub-classrooms.ts), so
      // the pages that name each class come back too.
      const snap = await c.fetch<{
        classes: { id: string; name?: string; slug?: string; teacher?: string }[];
        pages: { key?: string; classIds?: string[] }[];
        notes: { key?: string; signName?: string }[];
      }>(`{
        "classes": *[_type == "class" && !(_id in path("drafts.**")) && defined(teacher)]{
          "id": _id, name, "slug": slug.current, "teacher": teacher->name
        },
        "pages": *[_type == "hubPage" && !(_id in path("drafts.**")) && count(classes) > 0]{
          "key": coalesce(hubKey, slug), "classIds": classes[]._ref
        },
        "notes": *[_type == "teacherNote" && !(_id in path("drafts.**")) && active == true]{
          "key": class, signName
        }
      }`);
      const rows = (snap?.classes ?? []).map((cls) => {
        const keys = [
          cls.slug,
          ...(snap.pages ?? []).filter((p) => p.classIds?.includes(cls.id)).map((p) => p.key),
        ].filter(Boolean);
        return {
          class: cls.name,
          teacher: cls.teacher,
          keys: (snap.notes ?? [])
            .filter((n) => n.key && keys.includes(n.key))
            .map((n) => n.signName)
            .filter(Boolean) as string[],
        };
      });
      // A word from the teacher's name, ignoring the titles a school writes.
      const words = (name: string) =>
        new Set(
          name
            .toLowerCase()
            .replace(/\b(mr|mrs|ms|miss|dr)\.?\b/g, '')
            .split(/[^a-z]+/)
            .filter((w) => w.length > 2),
        );
      const stale = rows.filter((r) => {
        if (!r.teacher || !r.keys?.length) return false;
        const mine = words(r.teacher);
        // Every active note for this class names somebody else entirely.
        return r.keys.every((signed) => {
          if (!signed) return false;
          const theirs = words(signed);
          return ![...mine].some((w) => theirs.has(w));
        });
      });
      return stale.length
        ? {
            severity: 'warn',
            label: `${stale.length} class${stale.length === 1 ? '' : 'es'} whose welcome note is signed by someone else`,
            detail: `The Family Hub shows the teacher from the WELCOME NOTE, so ${stale
              .map((r) => `${r.class} still shows ${r.keys?.[0]}`)
              .slice(0, 4)
              .join(
                ', ',
              )}. Open Teacher welcome notes, rewrite it for the new teacher, and give it a new version stamp.`,
          }
        : null;
    },
  },
  {
    // "Waiting to publish" — the WordPress drafts-pile answer. Every BOARD
    // document with unpublished edits, by name, oldest first. Machine/inbox
    // types are excluded (they are never published by hand), everything else
    // is in — the navigator's amber dots only cover pages, so this is where a
    // forgotten half-edit on a testimonial or event finally surfaces.
    id: 'drafts',
    run: async (c) => {
      const drafts = await c.fetch<{ _type: string; label?: string; _updatedAt: string }[]>(
        // `sanity.*` is excluded as a PATTERN, not by name: the Presentation
        // preview mints `sanity.previewUrlSecret` DRAFTS on every session, and
        // this check once told a volunteer "4 edits waiting to publish" about
        // internal secrets no Studio pane can open (found 2026-08-29). Any
        // future system type the platform adds stays excluded too.
        `*[_id in path("drafts.**") && !(_type match "sanity.*") && !(_type in [
          "trashedItem","submission","testimonialSubmission","subscriber",
          "signupEntry","photoSubmission","hoursLog","linkHealth"
        ])] | order(_updatedAt asc) {
          _type, _updatedAt,
          "label": coalesce(title, name, heading, question, message, _type)
        }`,
      );
      if (drafts.length === 0) return null;
      const days = Math.floor(
        (Date.now() - new Date(drafts[0]._updatedAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      const names = drafts
        .map((d) => d.label || d._type)
        .slice(0, 6)
        .join(', ');
      return {
        severity: 'warn',
        label: `${drafts.length} edit${drafts.length === 1 ? '' : 's'} waiting to publish`,
        detail: `These have changes nobody can see yet: ${names}${drafts.length > 6 ? '…' : ''}. ${
          days > 0 ? `The oldest has waited ${days} day${days === 1 ? '' : 's'}. ` : ''
        }Open each one and Publish, or discard the draft.`,
      };
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
