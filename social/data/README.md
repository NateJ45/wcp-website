# WCP data helper (`wcp-data.mjs`)

A read-only helper that pulls real facts about WCP's classes, events,
enrollment, and school info straight from Sanity, so a social-content agent
can write captions from the truth instead of retyping numbers by hand.

It only reads. It never writes, publishes, or changes anything in Sanity.

## Run it

Node 22 or newer, no install step (no new dependencies):

```bash
node social/data/wcp-data.mjs classes
node social/data/wcp-data.mjs events            # --days 45 by default
node social/data/wcp-data.mjs events --days 90
node social/data/wcp-data.mjs enrollment
node social/data/wcp-data.mjs school
node social/data/wcp-data.mjs all --out facts.json
```

Or import it as a library:

```js
import { classes, upcomingEvents, enrollment, school } from './wcp-data.mjs';
const items = await classes();
```

## What it returns

- **`classes()`**, one entry per class: name, slug, age group, days/times,
  teacher name + honorific + role, class color key (`amber`/`green`/`orange`/
  `sky`/`navy`), a short description when one is modeled, and an
  `enrollmentStatus` field that is always `null` (see Gaps below).
- **`upcomingEvents({ days = 45 })`**, public Events-page items (open
  houses, tours, community events, closures) starting within the window,
  weekly/monthly recurrence expanded into real dates.
- **`enrollment()`**, school year label, enrollment mode (open / waitlist /
  closed) and deadline, the Google rating/review count/listing link, the
  headline fee amounts and payment FAQ from the Tuition & Fees singleton, and
  the upcoming open-house events.
- **`school()`**, school name, tagline, founding year, city/state, site URL,
  and social links (Facebook, Instagram, Google listing).

## The allowlist (what it queries, and nothing else)

Every query names its exact fields, never `{...}`, and every query excludes
drafts (`!(_id in path("drafts.**"))`). The document types and fields it
reads:

| Type              | Fields read                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `class`            | `name`, `slug`, `age`, `days`, `time`, `color`, `teacher->{name, honorific, role}`                                                              |
| `staff`            | `name`, `honorific`, `role` (only via the `class.teacher` reference above)                                                                       |
| `curriculumGuide`  | `class`, `intro` (the opening paragraph of the public Curriculum Guide PDF)                                                                      |
| `event`            | `title`, `startDate`, `endDate`, `allDay`, `location`, `category`, `description`, `ctaLabel`, `ctaUrl`, `recurrence`, `recurrenceEnd`, `venue->` |
| `venue`            | `name`, `address`, `note`                                                                                                                        |
| `siteSettings`     | `name`, `tagline`, `founded`, `url`, `city`, `state`, `facebook`, `instagram`, `googleUrl`, `schoolYearLabel`, `enrollmentMode`, `enrollmentDeadline`, `googleRating`, `googleReviews` |
| `feeSchedule`      | `registrationFee`, `registrationNote`, `registrationTitle`, `registrationWhen`, `participationFee`, `participationNote`, `participationTitle`, `participationWhen`, `annualAdjustmentNote`, `ageCutoffLabel`, `schoolYearMonths`, `depositNote`, `paymentTerms[]{question, answer}` |

**Never read:** `directoryEntry`, `hoursLog`, `photoSubmission`, `roleHolder`,
`coopRole`, `submission`, `subscriber`, any `hub*` document, or any field on
the types above outside the list, in particular `staff.email`, `staff.bio`,
`staff.photo`, `siteSettings.phone`, `siteSettings.emailGeneral/Admin/Treasurer`,
`siteSettings.street`/`zip`, and every PayPal payment-link field
(`payId`, `studentFeePayId`, `registrationPayId`, `participationPayId`).

## Secrets

`SANITY_TOKEN` is read from `site/.env` at runtime, used only as a request
header, and never logged, printed, written to a file, or returned by any
function here. In practice every query above also works with no token: the
Sanity Content Lake API for this project answers anonymous reads (see the
header comment in `site/src/sanity/env.ts`), so the token is read only for
parity with the rest of the repo's build-time clients, not because it is
required.

## Gaps a social agent will run into

- **Open spots / enrollment status per class is not in Sanity.** It lives in
  a Google Sheet (`siteSettings.availabilitySheetId`), read server-side via
  `site/src/lib/gsheets.ts` at request time, not through a plain Sanity
  query. `classes()` always returns `enrollmentStatus: null`, treat that as
  "not asked," not "no spots."
- **`shortDescription` is per guide, not per class.** It comes from
  `curriculumGuide.intro`, keyed by a class slug (`twos`, `threes`) or a
  group key (`pre-k`). The helper tries the exact slug, then the slug without
  its `-am`/`-pm` suffix, so Pre-K AM and Pre-K PM share the Pre-K intro.
  A new group key with another naming pattern would need that fallback extended.
- **No per-class tuition in `classes()`.** `monthly`/`annual`/`studentFee`
  live on the `class` document but aren't in this projection, they weren't
  asked for here on purpose (enrollment-adjacent tuition facts belong in
  `enrollment()`, and that function currently surfaces only the school-wide
  registration/participation fees, not per-class tuition). Add
  `monthly`/`annual`/`studentFee` to `CLASSES_QUERY` in `wcp-data.mjs` if a
  caption needs a specific class's price.
- **`schoolYearEvent` (the co-op "school year at a glance" timeline) isn't
  exposed.** Its entries have a `month` label, not a real date, so they don't
  fit `upcomingEvents()`'s date window and aren't queried here.
