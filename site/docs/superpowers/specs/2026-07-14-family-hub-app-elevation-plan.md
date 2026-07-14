# Family Hub App Elevation, a Design Plan

**Date:** 2026-07-14
**Status:** Approved 2026-07-14 (Nathan): start Tracks C + A; decisions below resolved
**Owner:** Nathan Nixon
**Builds on:** [2026-07-12 dashboard redesign spec](2026-07-12-family-hub-dashboard-design.md) (shipped). This plan is the next altitude: from "a dashboard" to "an app a parent trusts on sight."

## 1. Why this plan exists

The hub already has the dashboard skeleton: persistent rail, Home widgets, HubCard/HubPageHeader/HubProgress primitives, dark mode, tab bar, command palette. What it does not yet have is the _density of craft_ that makes SaaS products read as professional software: data expressed visually instead of as sentences, a working top chrome, consistent card anatomy, status vocabulary, and micro-feedback on every interaction.

Two sources were audited on 2026-07-14 at Nathan's request:

- **tailwind-admin.com, "11+ Best SaaS Dashboard Templates for 2026"** (Tailwindadmin, MaterialM, Matdash, Spike, Modernize, DashNext, Vora, Open SaaS, Argon, Chakra). These show the professional _admin shell archetype_: what structure users unconsciously expect from real software.
- **muz.li, "50 Best Dashboard Design Examples for 2026"** (50 showcases; most relevant to WCP's register: Intelly HealthCare, Teaching LMS classroom dashboard, ICarePro medical admin, Modern Admin UI, Warehouse Inventory, Rinesk call centre, Oripio Sales Overview, Analytics PRO light fintech, Kinship project management, Health Records light mode). These show the 2026 expressive layer: how the best teams make data feel warm and effortless.

## 2. The audit: eight patterns that make a dashboard read as "real app"

Every strong example in both sources, whatever its palette, shares these. Named examples in parentheses.

1. **A working top chrome, not just a side rail.** Global search, a notification bell with a panel, the user/context chip, and one primary quick action live in a slim topbar. The rail handles _where am I_, the topbar handles _what can I do right now_ (Spike, Vora, ICarePro, every template in the tailwind-admin list).
2. **A personalized command strip where a hero would be.** "Good morning Jonathan, you have 38% more sales" beats a static banner. The greeting carries live numbers and one suggested action (Spike's congratulations card, iHealth's "Good Morning, Ayoub!").
3. **KPI stat cards with delta context.** Big tabular number, small label, a colored delta chip ("+12% vs last month"), often a 40px sparkline. Numbers are the interface (ICarePro's 4-stat row, Vora, Oripio, Analytics PRO).
4. **Progress expressed as geometry, not prose.** Rings for attainment (Teaching LMS's 28/32 attendance ring), slim bars for budgets, gauges only where a scale genuinely exists. One glance, no reading.
5. **A status-pill vocabulary.** Every list row carries a small tinted pill (Completed, Pending, On Going, Live) from a fixed, color-coded set. Tables get avatar chips, hover states, and a filter row (GlobalLink's ledger, CarePulse's patient list, Noteflow's task board).
6. **Strict card anatomy.** Every card: icon chip + title left, one action right ("See all", a date-range pill), consistent padding, radius, and shadow tier. The grid breathes because rhythm is uniform (Oripio is the textbook; Kinship for calm density).
7. **Two elevation tiers.** One hero-tier surface (the command strip or the primary metric) and one standard card tier. Everything-is-a-white-card reads flat; a single emphasized surface creates hierarchy (Fintech Wallet's lime hero stat, QuartRevenue's featured quarter card).
8. **Micro-feedback everywhere.** Pressed states, count-up numerals, ring fill animations, skeletons during streaming, hover lifts. Individually invisible, together they are the "app feel" (all of the Juice Lab and Orbix showcases).

**Patterns deliberately NOT adopted** (they read as AI-tell or fight WCP's identity): glassmorphism panels, neon-on-charcoal fintech palettes, gradient text, 3D renders, cinematic photo-backed dark modes, AI-assistant blurb boxes. The muz.li set is full of these; they are wrong for a co-op preschool and most are on the project's banned list anyway.

## 3. Where the hub stands against that bar

**Already at or above the bar** (keep, do not churn): the rail with grouped nav and AA-safe active state; HubCard as the single card primitive; designed empty states; dark mode parity; the canvas texture giving the surface personality no template has; class color coding (a genuinely distinctive asset the references lack); ⌘K palette; skeleton-backed server islands; localStorage my-classes and new-since-last-visit.

**Gaps, mapped to the eight patterns:**

| #   | Pattern         | Hub today                                                                                                                                                                                       |
| --- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Top chrome      | Desktop has no topbar at all; search hides in the rail; "new since last visit" badges exist but have no bell/panel home; no global quick action                                                 |
| 2   | Command strip   | The Home greeting card is close (greeting, chips, progress bar) but static below the fold of usefulness: no "next thing you owe", numbers are chips rather than stats                           |
| 3   | KPI stats       | Numbers render as sentences or plain figures (Budget Snapshot is the closest); no delta context, no tabular numerals, no sparklines                                                             |
| 4   | Geometry        | One HubProgress bar style; no rings; co-op hours and fundraising attainment are natural ring candidates                                                                                         |
| 5   | Status pills    | No shared vocabulary; sign-ups, documents, celebrations, jobs each improvise; no table treatment (filters, hover, sticky header) for Directory/Documents                                        |
| 6   | Card anatomy    | HubCard standardizes the container but header anatomy varies (icon placement, action placement, "See all" wording)                                                                              |
| 7   | Elevation tiers | Everything is the same white card on grey; the Home hero band is navy but reads as marketing, not as the primary data surface                                                                   |
| 8   | Micro-feedback  | Reveal + lift exist; no pressed states, count-up is only on the public site, no ring/bar fill animation, view transitions between hub pages re-render the whole shell with a generic cross-fade |

## 4. Design principles for the elevation

1. **WCP warmth, SaaS bones.** Steal the structure (anatomy, hierarchy, geometry), never the aesthetic (no dark fintech, no glass). The palette, Quicksand, the doodle canvas, and class colors stay exactly as they are. A parent should feel "this is our school's app", a designer should think "this is built like Linear".
2. **Data is honest.** Every number, delta, ring, and sparkline must derive from data the hub actually has (Sanity, the gviz sheets, the calendar feed). No invented trends. Where only a snapshot exists, show a snapshot beautifully; do not fake a time series.
3. **School-wide chrome, device-local warmth.** No accounts exist. Personalization stays localStorage-only (my-classes ordering, seen-state) per the established pattern, and everything must render sensibly with localStorage empty.
4. **Progressive enhancement holds.** Every new surface is server-rendered and fully readable with no JS. Scripts only add feedback (count-up, ring animation, panel toggles). The no-JS page is the baseline, not a fallback.
5. **The gates are non-negotiable.** AA in light and dark (mind the tint-text trap), Lighthouse a11y 100, 320px reflow, reduced-motion stillness, hub-cache SWR for any new external read, PII never cached.

## 5. The plan, in six tracks

Tracks are independently shippable and roughly ordered by leverage. Components named `Hub*` extend the existing primitive family in `src/components/hub/`.

### Track A: App chrome (the biggest single "app-like" jump)

- **`HubTopBar` (desktop):** slim sticky bar above the content column: current page context on the left; global search field (opens the existing ⌘K palette, so the palette finally has a visible affordance); a bell; the theme toggle (relocated from the rail); "Sign out" stays in the rail.
- **`HubBell` + panel:** elevate the existing localStorage new-since-last-visit system into a bell with a count badge and a small panel listing what is new (new updates, documents, photos, celebrations since last visit), each row deep-linking. Server renders the full list; the script only diffs against the seen-state. No-JS: the bell is a link to /family-hub/updates.
- **Quick action:** one persistent "+ Add" style action in the topbar routing to the 2 or 3 things families actually initiate (sign up for hours, RSVP/sign-up forms, contact the board). Content, not chrome, so board-editable via the existing hubPage mechanism where possible.
- **Persistent-shell view transitions:** give the rail, topbar, and tab bar `view-transition-name`s so cross-document navigation visually holds the shell still while only the content column transitions. CSS-only, Chrome/Safari progressive, reduced-motion exempt. This recovers the "SPA feel" the 2026-07 ClientRouter removal gave up, for free.
- Mobile: the tab bar stays; the mobile top strip gains the bell.

### Track B: Home as command center

- **Command strip** replaces the current navy greeting band with a navy _data_ surface (the one hero-tier element per pattern 7): greeting + date line; then a 3-4 stat row inside the band: days until the next school event (live), co-op hours family progress (ring, using the remembered family name, school-wide average when unset), fundraising year progress (ring), families count. Each stat deep-links.
- **"Today / This week" rail:** the Upcoming Events widget becomes an agenda strip pinned first, with day chips and class-color dots for class-specific items.
- **My-classes-first ordering:** when `wcp-my-classes` is set, the class tiles, class photos, and helper links for those classes float to the top of their groups (server renders neutral order; a small script reorders, matching the established app-layer pattern).
- **Widget parity pass:** every Home widget adopts the stat/pill/anatomy system from Track C (Budget Snapshot becomes two HubStats + bar, Fundraising becomes ring + "N coming up" pill row, Meeting Minutes rows get date pills).

### Track C: The data expression kit (the reusable core)

All server-rendered, zero client dependencies, one new file each:

- **`HubStat`:** big tabular-numeral value, small uppercase label, optional delta chip and optional footnote. Variants: on-card and on-navy (the command strip). Uses `font-variant-numeric: tabular-nums`.
- **`HubRing`:** SVG progress ring (the Teaching LMS attendance pattern), sized S/M, class-color or semantic color by prop, value label centered, `<progress>`-equivalent semantics for AT, animated fill gated behind reduced-motion.
- **`HubSpark`:** tiny inline SVG bar/line for the few honest series we have (updates per month from `_createdAt`, events per month from the calendar feed, per-campaign totals). Decorative-only with the real numbers adjacent, `aria-hidden`.
- **`HubPill`:** the fixed status vocabulary: `new` (sky), `open`/`spots` (green), `waitlist`/`due` (amber), `closed`/`past` (neutral), `action-needed` (orange). AA-checked in both themes once, reused everywhere. Neutral text on soft tint per the dark-mode tint rule.
- **`HubTable`:** the list-as-table treatment for Documents, Directory, and Sign-ups: sticky header row, row hover, leading icon or avatar chip, trailing pill, and a no-JS-fine filter row (links/details, not JS state). Collapses to stacked cards below `md` (the tuition-table pattern shipped 2026-07-14).
- **Card anatomy contract:** codify in `HubCard` docs + a11y test: icon chip + title left, exactly one action right, action label is always "See all" or a date-range pill, consistent `p-6`, one shadow tier for standard cards.

### Track D: Section-by-section application

Using only Track C parts (each page is a small, independent PR):

- **Tuition:** two HubStats (monthly, annual) per class card, pay buttons unchanged, fee schedule as HubTable.
- **Fundraising:** campaign rows get ring + raised/goal HubStats + status pill; the year total is the page-level hero stat.
- **My Hours:** the family lookup result becomes ring + "hours left" stat + a small honest bar of hours by month if the sheet provides dated rows.
- **Sign-ups:** each drive row gets a spots-left pill and a slim capacity bar; "your response" state pill after submission.
- **Documents + Minutes:** HubTable with type icons, date pills, and a year filter.
- **Directory:** HubTable-style alpha rail + the existing cards; class-color avatar rings for no-photo families (replacing flat initials tiles with something ownable).
- **Calendar:** agenda list gains month header chips and class-color dots; the "Add to calendar" block becomes a compact action row.
- **Updates:** feed rows get category pills and the bell's seen-state dot.
- **Class pages:** the class color drives a subtle top accent band on the page header (mirrors the public ClassCard accent), teacher note gets the hero-tier surface.

### Track E: Motion and micro-feedback

- Pressed states (`active:scale-[0.98]` + `motion-reduce:` exemption) on all interactive cards, tiles, and pills.
- Extend the public `data-countup` to hub stats; add ring fill animation (SVG dash transition, reduced-motion exempt).
- Skeleton coverage audit: every server island and slow row gets a skeleton matching final geometry (no CLS).
- Palette polish: recent pages + section jumps in ⌘K, and the topbar search affordance from Track A.

### Track F: Guardrails so quality holds

- Extend `test:hub` with: card-anatomy assertions (one h-level per card, aria wiring), HubPill contrast in both themes, ring/table axe checks, 320 and 768/1024/1440 reflow for the new topbar and tables, keyboard pass for bell panel and filters.
- Extend the volunteer guide + FAMILY_HUB.md as each track ships (keep-docs-in-sync rule).
- A one-page "hub design contract" section in FAMILY_HUB.md documenting the anatomy, pill vocabulary, and elevation tiers so future additions stay coherent.

## 6. Key states and edge cases (apply to every new surface)

- **Empty:** every stat/ring/table keeps the designed-empty-state rule (friendly copy + icon, never a bare zero unless zero is meaningful, e.g. "$0 raised so far" early in the year is honest and fine).
- **No JS:** bell = link, filters = links, rings/bars render at final value, reorder simply does not happen.
- **localStorage empty:** command strip shows school-wide numbers; my-classes ordering is neutral.
- **Data source down:** the hub-cache SWR + 8s timeout pattern already degrades each widget to its empty card; new widgets must route reads through `hub-cache.ts` identically.
- **Dark mode:** every new tint/pill/ring color verified in both themes (the `-ink`-on-tint trap).
- **Reduced motion:** rings and bars render filled, count-ups render final numbers, transitions are instant.
- **320px:** command strip stats stack 2-up then 1-up; tables become stacked cards; topbar collapses into the existing mobile strip.

## 7. Sequencing and rough effort

| Phase | Tracks                            | Rough size                                                            |
| ----- | --------------------------------- | --------------------------------------------------------------------- |
| 1     | C (kit) + A (chrome)              | 2-3 working sessions; highest leverage, everything else consumes them |
| 2     | B (Home)                          | 1-2 sessions                                                          |
| 3     | D (sections, in the order listed) | 4-6 sessions, each page independently shippable                       |
| 4     | E + F (polish + guardrails)       | 1-2 sessions, partially interleaved with 3                            |

Risks: (a) the command strip must not slow first paint (all data already fetched by the page today; no new blocking reads); (b) view-transition-names need the 320px + axe sweep since named elements change stacking; (c) HubTable on Directory touches PII rendering, so no caching changes there, presentation only.

## 8. Decisions (resolved 2026-07-14, Nathan)

1. **Bell scope: device + Board highlights.** The bell is localStorage "new since your last visit" PLUS a Board-side `highlight` checkbox on updates, so the Board can mark something important for everyone. Adds one schema field and a volunteer-guide note.
2. **Quick actions: Sign up / Pay tuition / Contact the board.** The three things families actually initiate.
3. **Directory: full table treatment + class-color avatar rings** (ships in Track D; presentation only, no caching changes).
