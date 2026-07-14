# Hub Premium Screens, the Research and the Plan

**Date:** 2026-07-14
**Status:** Approved 2026-07-14 (Nathan); phase 1 (primitives + Documents) in progress
**Owner:** Nathan Nixon
**Builds on:** [the app-elevation plan](2026-07-14-family-hub-app-elevation-plan.md) (shipped). That program gave the hub its chrome, data kit, and command strip. Nathan's follow-up: the individual pages still read as "a web page you scroll down," not premium app screens. This spec is the researched answer to what an app would actually do.

## 1. What the research says apps do differently

Sources: IxDF and mobile-UX literature on progressive disclosure, 2026 SaaS dashboard pattern surveys (925studios, artofstyleframe, Setproduct), and the earlier tailwind-admin/muz.li audit. Five mechanics separate an app screen from a scrolling page:

1. **Answer first, framing later.** An app screen opens with the STATE (numbers, status, the thing you came for) in the first viewport; explanation and policy text come after, or behind disclosure. A web page opens with an intro paragraph. Rule of thumb from the pattern surveys: 5 to 9 elements on the default view, the most important number physically largest, a full-width summary strip before any grid.
2. **Progressive disclosure as the core pattern.** "Show the minimum a user needs to make their next decision, then reveal more when they ask" (the Linear/Notion philosophy). Long prose lives in collapsible groups, not in the scroll. Reveal-on-demand beats reveal-on-scroll.
3. **Views, not scroll positions.** 3 to 7 parallel views of one context sit behind tabs or a segmented control, one tap apart, instead of stacked vertically. Drill-down (summary card, then expand or navigate) replaces walls of detail.
4. **Persistent in-page context.** Sticky section indexes and filter bars keep "where am I / what am I looking at" on screen while content scrolls. Filters are page-global, applied once, never per-widget.
5. **Act, don't inspect.** Every card ends in its action. A screen that only displays is a report; a screen that proposes the next step is an app.

The hub already does 1 well on Home/Fundraising, 3 on Directory (List/Map), and 5 in places. The gaps are pages that open with framing prose, stack everything vertically, and put policy text in the scroll.

## 2. The plan

### New shared primitives (one session)

- **`HubSegmented`** — a link-based segmented control (the Directory List/Map toggle generalized): renders `?view=` links styled as the existing pill tablist, SSR-driven, no JS state. For 2 to 5 parallel views of one page.
- **`HubDisclosure`** — a styled `<details>` group (icon chip + title + summary line, chevron, borderless-in-card): the ONE accordion primitive, replacing ad-hoc details styling. Native element, keyboard and no-JS free.
- **Sticky section index** — a pattern (not a component): on long editorial pages, a slim sticky bar under the topbar with anchor links to each section (the Directory alpha rail generalized).
- **The answer-first rule**, written into FAMILY_HUB.md's design contract: a hub page's first viewport carries state and actions; framing prose moves below the fold or into a disclosure.

### Page-by-page application (each independently shippable)

| Page                               | Today                                           | Premium screen                                                                                                                                   |
| ---------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Directory                          | 3 privacy cards push families below the fold    | Privacy points collapse to one compact line + HubDisclosure; the filter chips (shipped today), alpha rail, and family grid open the page         |
| Documents                          | 4 groups stacked in one long scroll             | `HubSegmented` (Required / Handbooks / Orientation / Minutes); the new-families notice stays only on Required                                    |
| Health                             | Policy cards stacked full-length                | Summary strip (current closure status, quick contacts) first; each policy becomes a HubDisclosure with a one-line summary                        |
| Getting Started                    | Long onboarding scroll                          | Sticky section index + numbered step cards with disclosures; "your next step" surfaced at top                                                    |
| Pre-K class page                   | The whole parent handbook as stacked sections   | Sticky section index over the existing sections; each handbook section gets a jump anchor (content untouched, Board editing unchanged)           |
| Calendar                           | Agenda + embed (month separators shipped today) | Event-type filter chips (Event / Meeting / Milestone) using the existing `eventType` classifier, same SSR-link mechanics as the Directory filter |
| Tuition                            | Rate cards + long payment prose                 | Rate cards stay; "How payments work" prose becomes HubDisclosure groups                                                                          |
| Co-op Jobs / Celebrations / Photos | Card lists (already decent)                     | Anatomy pass only: answer-first ordering + actions on cards                                                                                      |

### Constraints (unchanged from the elevation program)

SSR only, no client state for filters/views (links and native details), AA both themes, 320px reflow, reduced-motion parity, Board editing surfaces untouched, no new Sanity reads outside hub-cache. `HUB_SECTION_TYPE_NAMES` pages keep rendering Board-added sections last.

### Sequencing

1. Primitives (`HubSegmented`, `HubDisclosure`) + Documents (the proving ground) — 1 session
2. Directory framing, Health, Tuition disclosures — 1 session
3. Getting Started + Pre-K sticky indexes, Calendar type filter — 1 session
4. Guardrail extensions (axe on open disclosures, segmented-view smoke) + docs — folded in

## 3. Sources

- IxDF, "What is Progressive Disclosure" (2026 update)
- 925studios, "35 SaaS Dashboard Design Examples, Trends and Patterns (2026)"
- artofstyleframe, "Dashboard Design Patterns for Modern Web Apps 2026"
- Setproduct, "Dashboard UI design: From KPIs to layouts that convert"
- digia.tech, "Progressive Disclosure in Mobile UX"
- The 2026-07-14 tailwind-admin + muz.li pattern audit (see the app-elevation plan)
