# Hub editability audit — what still needs the derive-everything treatment

_**STATUS 2026-08-31: all four waves SHIPPED** (commits 16738d1, 8c30ed7, 1732d78 +
the Wave-4 label consolidation). Remaining deliberate non-adoptions are noted per item
below; everything else in this file is done. Kept as the record of what was found._

_2026-08-31. A three-way sweep of every `/family-hub` route, every hub component, and
every `src/data/hub` fallback file, looking for content a future board would need a
developer to change. Verdict first: the architecture is holding — nearly every FACT
(fees, people, links, totals, programs) already reads Sanity-first with a committed
fallback. What remains clusters into the themes below, ordered by how soon each will
bite. This file is the registry; strike items as they ship._

## Wave 1 — facts that will simply become false (highest value)

1. **The Super Helper PROCEDURE is all code** (`super-helper.astro`): the $65
   fingerprint fee, OCCRRA course `AT144793` / section `ST10163195`, program number
   `204552`, BCI/FBI codes `5104.013`/`CCDBGA`, Butler/Warren County Sheriff
   locations, `redcross.org` link, the `admin@` email constant used five times, and
   the two committed PDFs. State agencies rename courses and change fees routinely.
   **Fix**: seed the step-by-step content as REAL `hubPage` sections (the page already
   renders section objects it builds in code — make them a seeded document instead,
   like every other page got in 2026-08). Also: the rich "What it takes" card bodies
   are keyed by EXACT requirement title — renaming a requirement in the Studio
   silently drops the rich body.
2. **Store facts in code** (`StoreCard.astro`, `fundraising.astro`): "Free shipping
   on orders $100+" (a Fourthwall dashboard setting), the `/featured/i` collection
   match (silent if the collection is renamed), `'since May 1, 2026'`, and the
   `/(shirt|store) sales/i` treasurer-sheet row matcher (renaming the row
   double-counts revenue). **Fix**: four small `hubStore`/`hubSettings` fields.
3. **Tuition fee cards are half-editable** (`tuition.astro:69-84`): amount/body/payId
   override from Sanity, but `title`, `when` ("due at May Gathering") and the button
   label do not. A board that moves the deadline can change the number but not the
   sentence beside it. **Fix**: extend the feeSchedule overrides to all five fields.
4. **Closure + illness policy stated in code, twice** (`calendar.astro:300`,
   `health.astro:65-91,169`): "WCP follows Lakota Local Schools" (two files), the
   48-hour exclusion rules (live copy until a health hubPage exists). Health policy
   is insurance/legal language. **Fix**: single source — seed the health hubPage
   sections + a `closurePolicy` line in Site settings (the Alert banner's sibling).
5. **Documents taxonomy** (`documents.astro:40-51`): four hardcoded categories +
   order, "Ohio state licensing requires these FOUR", and — worst — a `hubDocument`
   filed under an unknown category is dropped from the page silently. **Fix**: derive
   category presence/order from the documents themselves (registry pattern), render
   unknown categories instead of dropping, make the count derived.
6. **PayPal URL shape** (`data/classes.ts payUrl()`, used by class cards + topbar):
   only the button id is editable; the `paypal.com/...` template is code, and PayPal
   has been sunsetting the legacy endpoint. **Fix**: store full pay URLs on the class
   doc (id stays as fallback input), so a processor switch is a paste.
7. **Yearly commits nobody will remember**: the handbook COVER image (PDF is
   Sanity, art is committed), the tour version literal `'2026-27-v1'`, solstice
   dates pinned to fixed days in `fun-days.ts`.

## Wave 2 — names, roles, and pronouns (small edits, real embarrassment)

- `coop-jobs.astro:236-243`: "Email the Secretary" sends to the GENERIC contact
  address, and the copy says "she'll route it" — a gendered pronoun for a rotating
  elected role. (Also worth fixing as plain copy immediately.)
- `hours.astro:126`: placeholder "e.g. Nixon" — a real family surname in the template.
- `OrgChart.astro:126-176`: the bylaw-level sentences ("Elected each spring, one-year
  terms", "the school's only paid employees") are code while every LABEL around them
  is Sanity; the `Cabinet` heading skipped the `label()` call its siblings use.
- `SocialWallWidget.astro:168,229`: the handle `@westchesterpreschool` typed as
  literal TEXT twice beside a Sanity-backed href — rename the account and the link
  works but the visible handle lies. **Fix**: derive the handle from the URL.
- `PresidentNoteModal`/`TeacherNoteModal`: "With warmth," sign-off is code while the
  whole letter is Sanity. `HubTopBar:239` falls back to "the Board President".

## Wave 3 — structure a board cannot reorganize

- **The phone tab bar** (`HubTabBar.astro`): four fixed destinations + `grid-cols-5`,
  while the desktop rail is fully Board-editable — the mobile-first surface is the
  rigid one. Its own header comment already drifted ("Sign-ups" vs the code's
  "Documents"). **Fix**: derive from a flagged subset of the hub menu doc.
- **Category sets**: updates (`announcement`/`minutes` only), celebrations (4 kinds),
  the widget skeleton titles that will not follow a `widgetText` rename.
- **The first-visit tour** (`HubTourModal`): wording is Sanity per-step, but the
  8-step set/order is code and the CSS spotlight selectors break silently when a rail
  link is renamed (falls back to a centered card, so nobody notices).
- **Classroom fact card rows** (Days/Time/Monthly/Student fee): values are Sanity,
  the four-row SHAPE is not — no way to add a sibling discount row. Same family:
  `/supplies/supply-list.pdf` assumes one shared supply list forever.

## Wave 4 — the label sweep (mostly DON'T) — DECIDED AS WRITTEN

Dozens of button labels, empty states, and micro-headings are code-only ("Say hi",
"Call or text", "Your teacher" ×3, "View album", search hints, "Giggle of the day").
Recommendation: leave nearly all as code — each one made editable is one more box a
volunteer can break, and none states a fact. The exceptions worth folding into
existing mechanisms: the "Your teacher"/"Call or text" cluster is duplicated across
four files (extract ONE shared microcopy constant so a wording change is one edit,
still code); empty states that name vendors/roles ("the treasurer's tracking sheet",
"on Google Photos", `HubEmptyState`'s privacy sentences) should follow their sources.

## Confirmed healthy (no action)

Budget table numbers, coop roles/stipends, org holders, giggles, fun days, nav menu,
handbook link, calendar/budget connections, past totals, teacher phones, store
catalog, tour + hint wording, spotlights: all Sanity-first with documented fallbacks.

## Shipped resolutions (2026-08-31)

- W1.1 Super Helper procedure → `hubPage-super-helper` (seeded; code fallback).
- W1.2 store facts → Merch store card fields; shared row matcher `store-sales.ts`.
- W1.3 fee cards fully overridable. W1.4 closure via Site settings (both pages).
- W1.5 `hub-doc-categories.ts` registry; unknown categories render; counts derive.
- W1.6 `payUrl()` already accepts full links — schema note stands; no code change.
- W1.7 handbook cover uploadable. Tour version + solstice dates: accepted as-is.
- W2 all shipped (org-chart blurbs ride co-op guidance; sign-off fields; handle
  derives; pronoun + surname fixed).
- W3.1 tab bar picks (menu doc), W3.2 tour steps skippable, W3.3 class extra
  fact rows, W3.4 skeletons follow renames. Deliberately NOT done: editable
  tour selectors (silent-break risk documented in HubTourModal), per-class
  supply-list paths, new update/celebration categories (schema-driven enough).
- W4: `data/hub/microcopy.ts` holds the shared contact labels (still code, one
  edit); photos blurb vendor-neutral; `HubEmptyState` provenance sentences and
  the remaining button labels stay code BY DECISION.
