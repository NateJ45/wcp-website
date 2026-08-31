import { useCallback, useEffect, useState } from 'react';
import { Badge, Box, Button, Card, Flex, Grid, Heading, Spinner, Stack, Text } from '@sanity/ui';
import { barFractions, type SiteStats } from '../../lib/site-stats';
import { ToolHeading } from './ToolHeading';

// =============================================================================
// StatsTool — "Site stats", the traffic panel Squarespace refugees look for
// =============================================================================
// Public workspace only (sanity.config.ts). Read-only. It calls the site's own
// /api/stats endpoint, which reads Cloudflare's Workers analytics for this
// Worker and returns 28 days of daily counts.
//
// HONESTY IS THE FEATURE. The number is REQUESTS SERVED, not page views and
// not people: the site has no zone, so the only dataset available carries no
// URLs, and one visitor reading one page makes many requests (the page, the
// pictures, the fonts). Every label here says so, and the note tells the
// reader what the number is good for (comparing weeks) and where the deeper
// report lives (the Cloudflare dashboard). Do not "simplify" the wording into
// "visitors" — it would be wrong, and a board member would quote it.
//
// Three empty states, all plain language:
//   no-session   — no Studio preview cookie yet. Open the preview once.
//   unconfigured — the token is not set. Names what is missing, no values.
//   upstream     — Cloudflare said no. Shows its own message.
//
// The chart is hand-drawn SVG. No chart library, on purpose: 28 rectangles do
// not justify a dependency in the Studio bundle.
// =============================================================================

const ENDPOINT = '/api/stats';
const DASHBOARD = 'https://dash.cloudflare.com';

type Problem = {
  reason: 'no-session' | 'unconfigured' | 'upstream' | 'unreachable';
  message: string;
  missing?: string[];
};

type Loaded = { kind: 'ok'; stats: SiteStats } | { kind: 'problem'; problem: Problem };

const nf = new Intl.NumberFormat('en-US');

/** "Aug 4" from "2026-08-04", without letting the browser shift the day into
 *  the local timezone (a bare `new Date('2026-08-04')` is UTC midnight, which
 *  reads as Aug 3 in Pennsylvania). */
function shortDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function BigNumber(props: { label: string; value: number; hint: string }) {
  return (
    <Card padding={4} radius={3} shadow={1} tone="primary">
      <Stack space={3}>
        <Text size={1} weight="medium">
          {props.label}
        </Text>
        <Heading size={4}>{nf.format(props.value)}</Heading>
        <Text size={1} muted>
          {props.hint}
        </Text>
      </Stack>
    </Card>
  );
}

function Chart(props: { stats: SiteStats }) {
  const { days } = props.stats;
  const fractions = barFractions(days);
  const step = 4;
  const width = days.length * step;
  const peak = days.reduce((m, d) => (d.requests > m ? d.requests : m), 0);

  return (
    <Stack space={3}>
      <Flex align="baseline" justify="space-between">
        <Text size={1} weight="medium">
          Each bar is one day
        </Text>
        <Text size={1} muted>
          Busiest day: {nf.format(peak)}
        </Text>
      </Flex>
      <Box
        style={{
          // Sanity UI exposes its palette as CSS variables on the card; the
          // fallbacks keep the chart visible if a future theme drops them.
          color: 'var(--card-link-fg-color, #2276fc)',
          height: 140,
        }}
      >
        <svg
          viewBox={`0 0 ${width} 100`}
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          // No role="img": the lint rule prefers a real <img> for that role,
          // and an SVG root with an aria-label already announces as one
          // labelled graphic. Each bar also carries a <title> for hover.
          aria-label={`Requests served each day from ${shortDay(props.stats.since)} to ${shortDay(
            props.stats.until,
          )}. Busiest day ${nf.format(peak)}.`}
        >
          {days.map((day, i) => {
            const h = fractions[i] > 0 ? Math.max(fractions[i] * 100, 1.5) : 0;
            return (
              <g key={day.date}>
                {/* Faint full-height column so a zero day still reads as a day. */}
                <rect
                  x={i * step}
                  y={0}
                  width={step - 1}
                  height={100}
                  fill="currentColor"
                  opacity={0.08}
                />
                <rect
                  x={i * step}
                  y={100 - h}
                  width={step - 1}
                  height={h}
                  fill="currentColor"
                  opacity={0.9}
                >
                  <title>{`${shortDay(day.date)}: ${nf.format(day.requests)} requests`}</title>
                </rect>
              </g>
            );
          })}
        </svg>
      </Box>
      <Flex justify="space-between">
        <Text size={1} muted>
          {shortDay(props.stats.since)}
        </Text>
        <Text size={1} muted>
          {shortDay(props.stats.until)} (today)
        </Text>
      </Flex>
    </Stack>
  );
}

function ProblemCard(props: { problem: Problem; onRetry: () => void }) {
  const { problem } = props;

  const body =
    problem.reason === 'no-session' ? (
      <Stack space={4}>
        <Text size={1}>
          The stats panel needs to know that you are a board member. It gets that from the site
          preview.
        </Text>
        <Stack space={2} as="ol">
          <Text size={1}>1. Open any page from the left menu.</Text>
          <Text size={1}>2. Click the Presentation tab, so the website shows beside it.</Text>
          <Text size={1}>3. Come back here and click Try again.</Text>
        </Stack>
        <Text size={1} muted>
          You only do this once on each computer.
        </Text>
      </Stack>
    ) : problem.reason === 'unconfigured' ? (
      <Stack space={4}>
        <Text size={1}>{problem.message}</Text>
        <Text size={1} muted>
          This is a one-time setup step for the website, not something you can fix from here.
        </Text>
      </Stack>
    ) : (
      <Stack space={4}>
        <Text size={1}>{problem.message}</Text>
        <Text size={1} muted>
          If this keeps happening, tell Nathan.
        </Text>
      </Stack>
    );

  return (
    <Card padding={4} radius={3} shadow={1} tone="caution">
      <Stack space={4}>
        <Heading size={1}>
          {problem.reason === 'no-session'
            ? 'Open the site preview once, then come back'
            : problem.reason === 'unconfigured'
              ? 'Site stats is not set up yet'
              : 'The numbers did not load'}
        </Heading>
        {body}
        <Box>
          <Button text="Try again" mode="ghost" onClick={props.onRetry} />
        </Box>
      </Stack>
    </Card>
  );
}

export function StatsTool() {
  const [state, setState] = useState<Loaded | null>(null);

  const load = useCallback(async () => {
    setState(null);
    try {
      const res = await fetch(ENDPOINT, { credentials: 'same-origin' });
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      const record = (body ?? {}) as Record<string, unknown>;

      if (res.ok && record.ok === true) {
        setState({ kind: 'ok', stats: body as SiteStats });
        return;
      }
      const reason =
        record.reason === 'no-session' ||
        record.reason === 'unconfigured' ||
        record.reason === 'upstream'
          ? record.reason
          : 'unreachable';
      setState({
        kind: 'problem',
        problem: {
          reason,
          message:
            typeof record.message === 'string'
              ? record.message
              : 'The website did not answer. Try again in a minute.',
          missing: Array.isArray(record.missing) ? (record.missing as string[]) : undefined,
        },
      });
    } catch {
      setState({
        kind: 'problem',
        problem: {
          reason: 'unreachable',
          message: 'The website did not answer. Try again in a minute.',
        },
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Box padding={4} overflow="auto" height="fill">
      <Box style={{ maxWidth: 760, margin: '0 auto' }}>
        <Stack space={5}>
          <Stack space={3}>
            <ToolHeading>📈 Site stats</ToolHeading>
            <Text size={1} muted>
              How busy the website has been. Read only, and always a few minutes behind.
            </Text>
          </Stack>

          {state === null ? (
            <Card padding={5} radius={3} shadow={1}>
              <Flex align="center" gap={3} justify="center">
                <Spinner muted />
                <Text size={1} muted>
                  Reading the numbers.
                </Text>
              </Flex>
            </Card>
          ) : state.kind === 'problem' ? (
            <ProblemCard problem={state.problem} onRetry={() => void load()} />
          ) : (
            <Stack space={5}>
              <Grid columns={[1, 1, 2]} gap={3}>
                <BigNumber
                  label="Last 7 days"
                  value={state.stats.last7.requests}
                  hint="visits to the site (requests served)"
                />
                <BigNumber
                  label="Last 28 days"
                  value={state.stats.last28.requests}
                  hint="visits to the site (requests served)"
                />
              </Grid>

              <Card padding={4} radius={3} shadow={1}>
                <Chart stats={state.stats} />
              </Card>

              {state.stats.last28.errors > 0 ? (
                <Card padding={4} radius={3} shadow={1} tone="caution">
                  <Stack space={3}>
                    <Flex align="center" gap={2}>
                      <Badge tone="caution">Errors</Badge>
                      <Text size={1} weight="medium">
                        {nf.format(state.stats.last28.errors)} in the last 28 days
                      </Text>
                    </Flex>
                    <Text size={1} muted>
                      An error is a request the website could not answer. A few are normal. If the
                      number is large, or it jumps, tell Nathan.
                    </Text>
                  </Stack>
                </Card>
              ) : null}

              <Card padding={4} radius={3} shadow={1} tone="transparent">
                <Stack space={4}>
                  <Heading size={1}>What this number means</Heading>
                  <Text size={1}>
                    This counts every REQUEST the website answers. One person reading one page makes
                    many requests: the page, each photo, the fonts. So the number is much larger
                    than the number of people.
                  </Text>
                  <Text size={1}>
                    Use it to compare one week with another. A rise means more interest. Do not read
                    it as a count of families.
                  </Text>
                  <Text size={1} muted>
                    Days run in UTC, so a day here starts in the late evening our time. Numbers read{' '}
                    {new Date(state.stats.fetchedAt).toLocaleString('en-US')}.
                  </Text>
                  <Flex gap={2} wrap="wrap">
                    <Button
                      as="a"
                      href={DASHBOARD}
                      target="_blank"
                      rel="noreferrer"
                      text="Open the Cloudflare dashboard"
                      mode="ghost"
                    />
                    <Button text="Refresh" mode="bleed" onClick={() => void load()} />
                  </Flex>
                  <Text size={1} muted>
                    Cloudflare keeps the full report, including which countries people come from.
                    Ask Nathan for a login.
                  </Text>
                </Stack>
              </Card>
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export default StatsTool;
