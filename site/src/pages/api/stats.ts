// =============================================================================
// GET /api/stats — how many requests the site answered (Studio-only)
// =============================================================================
// Feeds the Studio's "Site stats" tool (src/sanity/components/StatsTool.tsx).
// Squarespace and Wix both put a traffic panel in the editor, so board members
// look for one here. This is that panel's data, scoped honestly.
//
// WHERE THE NUMBERS COME FROM
// Cloudflare's GraphQL Analytics API, account-level Workers dataset
// `workersInvocationsAdaptive`, filtered to this Worker by scriptName. The
// site has NO zone (it is served from workers.dev), so the zone-side
// `httpRequestsAdaptiveGroups` — the only dataset that knows about URLs and
// could separate a page view from an image — is not available to us. What we
// can read is REQUESTS SERVED, which includes assets and /api calls. Every
// label in the tool says exactly that. See src/lib/site-stats.ts.
//
// TWO QUERY SHAPES, ON PURPOSE
// The dataset's documented time dimension is `datetime`; adaptive datasets
// conventionally also expose `date` (28 rows for 28 days, which is what we
// want). We ask for `date` first and fall back ONCE to `datetimeHour`
// (672 rows, still under the limit) if Cloudflare rejects the field. Both are
// bucketed into UTC days by the same pure helper, so the tool never knows
// which one answered. If BOTH are rejected, the GraphQL message is passed
// through so the failure is legible instead of silent. (This is the one thing
// that could not be exercised locally — see docs/PENDING.md.)
//
// GATE
// The Studio preview cookie, the same unforgeable fingerprint the gated hub
// preview trusts (src/lib/preview-auth.ts). An editor gets it the first time
// they open Presentation; the tool's empty state says so. This is not
// dangerous data, but it is the school's data, and the cookie is free.
//
// CACHE
// A module-scope Map, ten minutes, keyed by today's UTC day. NO KV: the
// account is close to the free tier's ~1k writes/day cap and this panel is
// read by a handful of volunteers a month. A cold isolate costs one Cloudflare
// round trip, which is fine.
//
// NEVER log or echo CF_ANALYTICS_TOKEN. Errors report the NAME of a missing
// secret, never a value.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { perspectiveCookieName } from '@sanity/preview-url-secret/constants';
import { isStudioPreview } from '@/lib/preview-auth';
import {
  shapeStats,
  dayWindow,
  STATS_DAYS,
  STATS_TTL_MS,
  type SiteStats,
  type StatsRow,
} from '@/lib/site-stats';

/** Must match `name` in wrangler.jsonc. */
const SCRIPT_NAME = 'wcp-website';
const GRAPHQL_URL = 'https://api.cloudflare.com/client/v4/graphql';

const QUERY_BY_DATE = `query WcpSiteStatsByDate($accountTag: string!, $scriptName: string!, $since: Date!, $until: Date!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      workersInvocationsAdaptive(
        limit: 1000
        filter: { scriptName: $scriptName, date_geq: $since, date_leq: $until }
      ) {
        dimensions { date }
        sum { requests errors }
      }
    }
  }
}`;

const QUERY_BY_HOUR = `query WcpSiteStatsByHour($accountTag: string!, $scriptName: string!, $since: Time!, $until: Time!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      workersInvocationsAdaptive(
        limit: 10000
        filter: { scriptName: $scriptName, datetime_geq: $since, datetime_leq: $until }
      ) {
        dimensions { datetimeHour }
        sum { requests errors }
      }
    }
  }
}`;

interface GraphQlAnswer {
  data?: {
    viewer?: { accounts?: { workersInvocationsAdaptive?: StatsRow[] | null }[] | null } | null;
  } | null;
  errors?: { message?: string }[] | null;
}

const cache = new Map<string, { at: number; value: SiteStats }>();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      // Private data behind a cookie gate: no shared cache, ever.
      'cache-control': 'private, no-store',
    },
  });
}

async function runQuery(
  token: string,
  query: string,
  variables: Record<string, string>,
): Promise<{ rows: StatsRow[] } | { error: string }> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    // 403 here almost always means the token lacks Account Analytics:Read.
    return { error: `Cloudflare replied ${res.status}.` };
  }

  const body = (await res.json()) as GraphQlAnswer;
  const problem = body.errors?.map((e) => e?.message).filter(Boolean)[0];
  if (problem) return { error: String(problem) };

  const rows = body.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive;
  return { rows: Array.isArray(rows) ? rows : [] };
}

export const GET: APIRoute = async (context) => {
  // ---- gate -----------------------------------------------------------
  const cookie = context.cookies.get(perspectiveCookieName)?.value;
  if (!(await isStudioPreview(cookie))) {
    return json(
      {
        ok: false,
        reason: 'no-session',
        message: 'Open the site preview once, then come back.',
      },
      401,
    );
  }

  // ---- configuration --------------------------------------------------
  const token = env.CF_ANALYTICS_TOKEN;
  const accountTag = env.CF_ACCOUNT_ID;
  const missing = [token ? null : 'CF_ANALYTICS_TOKEN', accountTag ? null : 'CF_ACCOUNT_ID'].filter(
    (n): n is string => n !== null,
  );

  if (missing.length > 0) {
    return json(
      {
        ok: false,
        reason: 'unconfigured',
        missing,
        message: `Site stats is not set up yet. The website is missing ${missing.join(' and ')}. Ask Nathan to add it.`,
      },
      503,
    );
  }

  // ---- cache ----------------------------------------------------------
  const now = new Date();
  const window = dayWindow(now, STATS_DAYS);
  const key = `${SCRIPT_NAME}:${window[window.length - 1]}`;
  const hit = cache.get(key);
  if (hit && now.getTime() - hit.at < STATS_TTL_MS) {
    return json(hit.value);
  }

  // ---- Cloudflare -----------------------------------------------------
  const since = window[0];
  const until = window[window.length - 1];

  try {
    let answer = await runQuery(token as string, QUERY_BY_DATE, {
      accountTag: accountTag as string,
      scriptName: SCRIPT_NAME,
      since,
      until,
    });

    if ('error' in answer) {
      const byDateError = answer.error;
      answer = await runQuery(token as string, QUERY_BY_HOUR, {
        accountTag: accountTag as string,
        scriptName: SCRIPT_NAME,
        since: `${since}T00:00:00Z`,
        until: `${until}T23:59:59Z`,
      });
      if ('error' in answer) {
        console.error('[stats] cloudflare rejected both queries', byDateError, answer.error);
        return json(
          {
            ok: false,
            reason: 'upstream',
            message: `Cloudflare could not answer: ${answer.error}`,
          },
          502,
        );
      }
    }

    const value = shapeStats(answer.rows, { now, scriptName: SCRIPT_NAME, days: STATS_DAYS });
    cache.set(key, { at: now.getTime(), value });
    // One key per day; drop yesterday's so the Map cannot grow.
    for (const k of cache.keys()) if (k !== key) cache.delete(k);
    return json(value);
  } catch (err) {
    // Never let the raw error out: it can carry request details.
    console.error('[stats] fetch failed', err);
    return json(
      {
        ok: false,
        reason: 'upstream',
        message: 'The website could not reach Cloudflare just now. Try again in a minute.',
      },
      502,
    );
  }
};
