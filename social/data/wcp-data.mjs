#!/usr/bin/env node
// =============================================================================
// wcp-data — READ-ONLY Sanity data helper for social-media content agents
// =============================================================================
// This gives a social-content agent real facts about WCP's classes, events,
// enrollment, and school info, so it can write captions from the truth
// instead of retyping numbers by hand. It only READS. It never writes,
// publishes, or mutates anything in Sanity.
//
// PRIVACY. The public site's content lives in the SAME Sanity dataset as the
// gated Family Hub (directory, health details, children's photos). This file
// queries ONLY the document types and fields listed below — never a full
// document spread (`{...}`) — so a future schema change cannot leak a new
// private field through here by accident. Every query also excludes drafts.
//
// Allowlisted document types and fields (see ALLOWLIST comment blocks below
// each query for the exact projection):
//   - class          (public class facts: name, slug, age, days, time, color,
//                      teacher name/role, tuition-adjacent fields are NOT read)
//   - staff           (name, honorific, role — via the class -> teacher ref,
//                      never email/bio/photo)
//   - curriculumGuide (intro paragraph only, matched to a class by slug — the
//                      guide itself is a public PDF at /curriculum/<slug>.pdf)
//   - event           (public Events-page facts: title/dates/location/etc.)
//   - venue           (name/address/note — a reusable public place)
//   - siteSettings    (school identity + enrollment + Google rating fields
//                      only — never phone/email/full street address)
//   - feeSchedule     (headline fee amounts + notes — never a PayPal link)
//
// NEVER queried here: directoryEntry, hoursLog, photoSubmission, roleHolder,
// coopRole, submission, subscriber, hubPage, hubSettings, hubStore,
// hubSpotlight, hubDelights, hubHints, hubTour, hubNavMenu, or any field on
// the types above that isn't in the allowlist (email, bio, photo, PayPal
// payment ids/links, full street address, phone).
//
// TOKEN. `SANITY_TOKEN` is read from site/.env at runtime, if present, and
// used only as a request header — it is never logged, written, or returned
// by any function here. The dataset is effectively public read access at the
// Content Lake API layer (see site/src/sanity/env.ts), so every query below
// also works with no token at all; the token is only for parity with the
// rest of the repo's read clients.
//
// USAGE (library):
//   import { classes, upcomingEvents, enrollment, school } from './wcp-data.mjs';
//   const items = await classes();
//
// USAGE (CLI):
//   node social/data/wcp-data.mjs classes
//   node social/data/wcp-data.mjs events
//   node social/data/wcp-data.mjs enrollment
//   node social/data/wcp-data.mjs school
//   node social/data/wcp-data.mjs all
//   node social/data/wcp-data.mjs all --out facts.json
// =============================================================================

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// site/.env lives two levels up from social/data/.
const SITE_ENV_PATH = path.resolve(__dirname, '../../site/.env');

const PROJECT_ID = 'niemhgev';
const DATASET = 'production';
const API_VERSION = '2025-01-01';

// Never a draft, no matter which document type is being queried.
const NOT_DRAFT = `!(_id in path("drafts.**"))`;

// -----------------------------------------------------------------------------
// Token loading — read-only, in-memory, never echoed.
// -----------------------------------------------------------------------------

let cachedToken; // undefined until loaded once; null means "checked, none found"

function loadSanityToken() {
  if (cachedToken !== undefined) return cachedToken;
  try {
    const text = readFileSync(SITE_ENV_PATH, 'utf8');
    const match = text
      .split('\n')
      .map((line) => line.match(/^\s*SANITY_TOKEN\s*=\s*(.*)\s*$/))
      .find(Boolean);
    const raw = match?.[1]?.trim().replace(/^["']|["']$/g, '');
    cachedToken = raw || null;
  } catch {
    // No site/.env, or no read permission. Fall back to a tokenless read —
    // the dataset is world-readable at this API layer anyway (see the header
    // comment), so the public queries below still work.
    cachedToken = null;
  }
  return cachedToken;
}

// -----------------------------------------------------------------------------
// GROQ over the Sanity HTTP query API (no @sanity/client dependency needed).
// -----------------------------------------------------------------------------

async function sanityQuery(groq, params = {}) {
  const token = loadSanityToken();
  const qs = new URLSearchParams({ query: groq });
  for (const [key, value] of Object.entries(params)) {
    qs.set(`$${key}`, JSON.stringify(value));
  }
  // The authenticated CDN host — same choice the rest of the repo's build-time
  // reads make (site/src/lib/cms.ts): fast, and fine with the ~60s staleness
  // for social captions.
  const url = `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}?${qs.toString()}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Sanity query failed (HTTP ${res.status}): ${body.slice(0, 500)}`);
  }
  const json = await res.json();
  return json.result;
}

// -----------------------------------------------------------------------------
// classes() — public class/classroom facts
// -----------------------------------------------------------------------------
// ALLOWLIST: class{ name, slug, age, days, time, color, teacher->{ name,
// honorific, role } }, curriculumGuide{ class, intro } (intro paragraph only,
// joined onto the matching class by slug).
//
// Open spots / enrollment status is NOT modeled in Sanity per class. Live
// availability comes from a Google Sheet (siteSettings.availabilitySheetId,
// read via site/src/lib/gsheets.ts at request time) — it is not reachable
// from a plain Sanity query, so this function omits it. See the README gap
// list.
// -----------------------------------------------------------------------------

const CLASSES_QUERY = `*[_type == "class" && ${NOT_DRAFT}] | order(orderRank) {
  name,
  "slug": slug.current,
  age,
  days,
  time,
  color,
  "teacher": teacher->{ name, honorific, role }
}`;

// Matched onto a class by exact slug equality only. A guide that covers a
// GROUP of classes (e.g. one guide for both Pre-K AM and Pre-K PM, keyed
// "pre-k") matches through the -am/-pm fallback in classes() below.
const CURRICULUM_INTROS_QUERY = `*[_type == "curriculumGuide" && ${NOT_DRAFT} && defined(class)] {
  "classKey": class,
  intro
}`;

export async function classes() {
  const [classDocs, guides] = await Promise.all([
    sanityQuery(CLASSES_QUERY),
    sanityQuery(CURRICULUM_INTROS_QUERY),
  ]);
  const introByKey = new Map((guides ?? []).map((g) => [g.classKey, g.intro]));
  return (classDocs ?? []).map((c) => ({
    name: c.name ?? null,
    slug: c.slug ?? null,
    ageGroup: c.age ?? null,
    days: c.days ?? null,
    time: c.time ?? null,
    colorKey: c.color ?? null, // one of: amber, green, orange, sky, navy
    teacher: c.teacher
      ? {
          name: c.teacher.name ?? null,
          honorific: c.teacher.honorific ?? null,
          role: c.teacher.role ?? null,
        }
      : null,
    // A guide can cover a class GROUP ("pre-k" covers Pre-K AM and PM), so
    // fall back from the exact slug to the slug without its -am/-pm suffix.
    shortDescription:
      (c.slug && (introByKey.get(c.slug) || introByKey.get(c.slug.replace(/-(am|pm)$/, '')))) || null,
    // Not modeled in Sanity — see README "Gaps". Left explicit (not omitted)
    // so a caller never mistakes "we didn't ask" for "no spots".
    enrollmentStatus: null,
  }));
}

// -----------------------------------------------------------------------------
// upcomingEvents({ days = 45 }) — public calendar events / key dates
// -----------------------------------------------------------------------------
// ALLOWLIST: event{ title, startDate, endDate, allDay, location, category,
// description, ctaLabel, ctaUrl, recurrence, recurrenceEnd,
// venue->{ name, address, note } }.
//
// Recurring events (weekly/monthly) are expanded into their next occurrences
// with the same rules as site/src/lib/events.ts (kept in sync by hand — that
// file is TypeScript and not importable from this plain-Node script).
// -----------------------------------------------------------------------------

const EVENT_FIELDS = `_id, title, startDate, endDate, allDay, location, category, description, ctaLabel, ctaUrl, recurrence, recurrenceEnd, venue->{ name, address, note }`;

// Mirrors RECURRING_STILL_ACTIVE in site/src/lib/queries.ts.
const RECURRING_STILL_ACTIVE = `recurrence in ["weekly","monthly"] && (coalesce(recurrenceEnd, "9999-12-31") + "T23:59:59Z") >= now()`;

const UPCOMING_OR_RECURRING_EVENTS_QUERY = `*[_type == "event" && ${NOT_DRAFT} && (coalesce(endDate, startDate) >= now() || (${RECURRING_STILL_ACTIVE}))] | order(startDate asc) { ${EVENT_FIELDS} }`;

const RECUR_MAX_OCCURRENCES = 8;
const RECUR_WALK_CAP = 520; // ~10 years of weeks, same cap as events.ts

function occurrenceStart(startMs, recurrence, i) {
  if (recurrence === 'weekly') return startMs + i * 7 * 86_400_000;
  const d = new Date(startMs);
  d.setUTCMonth(d.getUTCMonth() + i);
  return d.getTime();
}

/** Port of site/src/lib/events.ts expandRecurring — kept in sync by hand. */
function expandRecurring(events, now = new Date()) {
  const nowMs = now.getTime();
  const out = [];
  for (const e of events) {
    const rec = e.recurrence;
    if (!rec || rec === 'none' || (rec !== 'weekly' && rec !== 'monthly') || !e.startDate) {
      out.push(e);
      continue;
    }
    const startMs = new Date(e.startDate).getTime();
    if (Number.isNaN(startMs)) {
      out.push(e);
      continue;
    }
    const durationMs = e.endDate ? new Date(e.endDate).getTime() - startMs : 0;
    const untilMs = e.recurrenceEnd
      ? new Date(`${e.recurrenceEnd}T23:59:59Z`).getTime()
      : Infinity;

    let emitted = 0;
    for (let i = 0; i < RECUR_WALK_CAP && emitted < RECUR_MAX_OCCURRENCES; i++) {
      const occStart = occurrenceStart(startMs, rec, i);
      if (occStart > untilMs) break;
      const occEnd = occStart + durationMs;
      const stillUpcoming = (durationMs ? occEnd : occStart) >= nowMs;
      if (!stillUpcoming) continue;
      out.push({
        ...e,
        _id: `${e._id ?? 'evt'}__${i}`,
        startDate: new Date(occStart).toISOString(),
        endDate: e.endDate ? new Date(occEnd).toISOString() : e.endDate,
        recurrence: 'none',
        recurrenceEnd: undefined,
      });
      emitted++;
    }
  }
  return out.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

function shapeEvent(e) {
  return {
    title: e.title ?? null,
    startDate: e.startDate ?? null,
    endDate: e.endDate ?? null,
    allDay: Boolean(e.allDay),
    category: e.category ?? null,
    description: e.description ?? null,
    ctaLabel: e.ctaLabel ?? null,
    ctaUrl: e.ctaUrl ?? null,
    location: e.venue?.name
      ? [e.venue.name, e.venue.address?.split('\n')[0]].filter(Boolean).join(' · ')
      : e.location ?? null,
  };
}

export async function upcomingEvents({ days = 45 } = {}) {
  const raw = await sanityQuery(UPCOMING_OR_RECURRING_EVENTS_QUERY);
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 86_400_000);
  const expanded = expandRecurring(raw ?? [], now);
  return expanded
    .filter((e) => e.startDate && new Date(e.startDate) <= cutoff)
    .map(shapeEvent);
}

// -----------------------------------------------------------------------------
// enrollment() — current enrollment / open-house / tuition headline facts
// -----------------------------------------------------------------------------
// ALLOWLIST: siteSettings{ schoolYearLabel, enrollmentMode, enrollmentDeadline,
// googleRating, googleReviews, googleUrl }, feeSchedule{ registrationFee,
// registrationNote, registrationTitle, registrationWhen, participationFee,
// participationNote, participationTitle, participationWhen,
// annualAdjustmentNote, ageCutoffLabel, schoolYearMonths, depositNote,
// paymentTerms[]{ question, answer } }. PayPal payment-link fields
// (registrationPayId, participationPayId, studentFeePayId, payId) are NEVER
// read — they aren't facts a caption needs, and they double as "where the
// money goes" plumbing.
//
// "Open house" facts are the upcoming events whose category is "openHouse"
// (from the same event allowlist as upcomingEvents()).
// -----------------------------------------------------------------------------

const ENROLLMENT_SETTINGS_QUERY = `*[_type == "siteSettings" && ${NOT_DRAFT}][0]{
  schoolYearLabel, enrollmentMode, enrollmentDeadline, googleRating, googleReviews, googleUrl
}`;

const FEE_SCHEDULE_QUERY = `*[_type == "feeSchedule" && ${NOT_DRAFT}][0]{
  registrationFee, registrationNote, registrationTitle, registrationWhen,
  participationFee, participationNote, participationTitle, participationWhen,
  annualAdjustmentNote, ageCutoffLabel, schoolYearMonths, depositNote,
  paymentTerms[]{ question, answer }
}`;

export async function enrollment() {
  const [settings, fees, events] = await Promise.all([
    sanityQuery(ENROLLMENT_SETTINGS_QUERY),
    sanityQuery(FEE_SCHEDULE_QUERY),
    upcomingEvents({ days: 90 }),
  ]);
  return {
    schoolYearLabel: settings?.schoolYearLabel ?? null,
    enrollmentMode: settings?.enrollmentMode ?? null, // open | waitlist | closed
    enrollmentDeadline: settings?.enrollmentDeadline ?? null,
    googleRating: settings?.googleRating ?? null,
    googleReviews: settings?.googleReviews ?? null,
    googleUrl: settings?.googleUrl ?? null,
    fees: {
      registrationFee: fees?.registrationFee ?? null,
      registrationNote: fees?.registrationNote ?? null,
      registrationTitle: fees?.registrationTitle ?? null,
      registrationWhen: fees?.registrationWhen ?? null,
      participationFee: fees?.participationFee ?? null,
      participationNote: fees?.participationNote ?? null,
      participationTitle: fees?.participationTitle ?? null,
      participationWhen: fees?.participationWhen ?? null,
      annualAdjustmentNote: fees?.annualAdjustmentNote ?? null,
      ageCutoffLabel: fees?.ageCutoffLabel ?? null,
      schoolYearMonths: fees?.schoolYearMonths ?? null,
      depositNote: fees?.depositNote ?? null,
      paymentTerms: fees?.paymentTerms ?? [],
    },
    upcomingOpenHouses: events.filter((e) => e.category === 'openHouse'),
  };
}

// -----------------------------------------------------------------------------
// school() — name, tagline, address city/state, founding year, URL, socials
// -----------------------------------------------------------------------------
// ALLOWLIST: siteSettings{ name, tagline, founded, url, city, state, facebook,
// instagram, googleUrl }. Never street/zip/phone/email.
// -----------------------------------------------------------------------------

const SCHOOL_QUERY = `*[_type == "siteSettings" && ${NOT_DRAFT}][0]{
  name, tagline, founded, url, city, state, facebook, instagram, googleUrl
}`;

export async function school() {
  const doc = await sanityQuery(SCHOOL_QUERY);
  return {
    name: doc?.name ?? null,
    tagline: doc?.tagline ?? null,
    foundedYear: doc?.founded ?? null,
    city: doc?.city ?? null,
    state: doc?.state ?? null,
    siteUrl: doc?.url ?? null,
    social: {
      facebook: doc?.facebook ?? null,
      instagram: doc?.instagram ?? null,
      googleListing: doc?.googleUrl ?? null,
    },
  };
}

// -----------------------------------------------------------------------------
// CLI
// -----------------------------------------------------------------------------

async function runCli() {
  const [, , subcommand, ...rest] = process.argv;
  const outIdx = rest.indexOf('--out');
  const outFile = outIdx >= 0 ? rest[outIdx + 1] : null;

  const daysIdx = rest.indexOf('--days');
  const days = daysIdx >= 0 ? Number(rest[daysIdx + 1]) : 45;

  let data;
  switch (subcommand) {
    case 'classes':
      data = await classes();
      break;
    case 'events':
      data = await upcomingEvents({ days });
      break;
    case 'enrollment':
      data = await enrollment();
      break;
    case 'school':
      data = await school();
      break;
    case 'all': {
      const [c, e, en, s] = await Promise.all([
        classes(),
        upcomingEvents({ days }),
        enrollment(),
        school(),
      ]);
      data = { classes: c, events: e, enrollment: en, school: s };
      break;
    }
    default:
      console.error(
        'Usage: node social/data/wcp-data.mjs <classes|events|enrollment|school|all> [--out file.json] [--days 45]',
      );
      process.exit(1);
  }

  const json = JSON.stringify(data, null, 2);
  if (outFile) {
    writeFileSync(outFile, json + '\n', 'utf8');
    console.error(`Wrote ${outFile}`);
  } else {
    console.log(json);
  }
}

// Only run the CLI when this file is executed directly (not when imported).
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  runCli().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
