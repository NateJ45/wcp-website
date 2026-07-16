---
target: Family Hub (all /family-hub pages)
total_score: 30
p0_count: 0
p1_count: 4
timestamp: 2026-07-16T22-54-54Z
slug: site-src-pages-family-hub
---
# Family Hub design critique — 2026-07-16

Audited: all `/family-hub/*` pages, desktop 1280 + mobile 375, light + dark, via Playwright against `npm run dev`. Detector: impeccable detect.mjs over `site/src/pages/family-hub` + `site/src/components/hub` (all 6 hits false positives: em-dashes and `<img>` strings inside code comments / dynamic `src={...}`). Competitive research: Brightwheel, Famly, ClassDojo, Transparent Classroom, Procare, Playground, Konstella, Membership Toolkit, SignUpGenius, Jovial, Track It Forward.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Scrollspy dead (hub-doc.ts crash); otherwise strong (active states, Live/Soon pills) |
| 2 | Match System / Real World | 3 | Superb parent voice, but empty states leak board jargon ("content system", "Site Settings") |
| 3 | User Control and Freedom | 3 | Letter modals auto-open on first visit; dismissible but interruptive |
| 4 | Consistency and Standards | 3 | Strong primitive system; top-bar quick-action overflow breaks the chrome |
| 5 | Error Prevention | 3 | Low-stakes surface, moderated photos, simple forms |
| 6 | Recognition Rather Than Recall | 3 | Labeled icons, TOCs, alphabet jump; MONEY nav clipped at 800px viewports; no directory name search |
| 7 | Flexibility and Efficiency | 3 | ⌘K palette, quick actions, add-to-calendar; class picker only sorts, doesn't filter |
| 8 | Aesthetic and Minimalist Design | 2 | Six zero-value money displays on home in summer; 13k-px mega-pages; identical icon-card grids |
| 9 | Error Recovery | 3 | Designed empty states on data failure; copy unhelpful to parents |
| 10 | Help and Documentation | 4 | The hub IS excellent contextual help (who-to-ask cards, FAQs, guides) |
| **Total** | | **30/40** | **Good — solid foundation, address weak areas** |

## Anti-patterns verdict

Does NOT read as AI-generated. The hand-lettered display type, navy + class-color system, graph-paper note cards, polaroid photo wall, and spot illustrations are a genuine, coherent identity. Deterministic scan: clean (6 false positives). The two slop-adjacent tells: identical icon+title+text card grids repeated across Health / Getting Started / Co-op Jobs / Calendar traditions, and the same stock "Meeting Minutes" banner image on six Updates cards in a row.

## Priority issues

1. **[P1] hub-doc.ts crashes on every handbook page** — `onPageLoad` (hub-doc.ts:36) runs `enhance()` before `const SVG_NS` (hub-doc.ts:85) initializes → TDZ ReferenceError. Kills heading anchors, injected TOC subentries, AND scrollspy (never reached) on class pages, tuition, health, getting-started, co-op jobs. Fix: move the `SVG_NS` declaration above the `onPageLoad` call.
2. **[P1] Summer zero-state: the dashboard leads with dead zeros** — hero shows 0% fundraising ring + "School year progress 0%"; Fundraising card repeats $0/0%; Budget Snapshot shows Revenue $0, Expenses $0, +$0 surplus. Six zero-money readouts before any real number, while the impressive numbers ($63,559 balance, $4,450 raised last year, full budget) sit below. Research: a 0% thermometer actively suppresses engagement (Double the Donation, CauseVox). Fix: season-aware home — before the year starts, lead with countdown + first-day/orientation info + enrollment checklist; replace the 0% ring with "Kicks off in September · 5 fundraisers coming" + last year's total; hide school-year-progress until >0.
3. **[P1] Top-bar quick action overflows the bar** — the "Next: Jul 20" chip renders a 74px-tall two-line box in the 56px bar, its label crossing the bar edge (all pages, ~1280px width). The "Apr. 13, 2026 …" minutes chip also truncates. Fix: single-line labels with truncation, and fewer, prioritized quick actions.
4. **[P1] Auto-opening letter modals on first visit** — Board President letter (home) and teacher welcome letters (class pages) open as full-screen modals on arrival. Modal-as-first-thought; parents dismiss reflexively and the content is lost. Fix: inline paper-note card at the top with the first lines + "Read the letter"; only badge it as new.
5. **[P2] Mega-pages** — Twos & Threes is 13,218px; Co-op Jobs 10,703px (desktop; longer on phones). TOC exists but its scrollspy is broken (issue 1) and there's no mobile jump-nav. Fix: fix scrollspy; add a mobile sticky section picker; consider tabs (like Documents' Required/Handbooks/Orientation) for class pages: Day rhythm / Helper guide / Policies / FAQ.
6. **[P2] Updates cards: 6 identical banner images + entity bug** — every minutes card carries the same generic banner (it conveys nothing and dominates the card); type is signalled four redundant ways (banner text, chip, title, tint). Excerpts render literal `&nbsp;` ("trip to&nbsp;Niedermann Family Farm"). Fix: text-first minutes cards with a date badge; reserve imagery for posts with real photos; unescape entities in excerpt generation.
7. **[P2] Empty-state copy speaks board language** — Hours: "Once the board sets this year's co-op hours goal in Site Settings…"; Sign-ups and Celebrations share "This will publish from our content system…". Parents can't act on any of that. Fix: parent-voice empty states that show the shape of what's coming ("Your family's hours bar lives here once the year starts — most families log 2-3 hours a month") + HubSpot illustrations consistently (Celebrations has one; Hours/Sign-ups use a generic clipboard).
8. **[P2] Personalization stops at sorting** — the my-classes picker badges and sorts class cards but Calendar, Photos albums, Celebrations, and the events list still show everything to everyone. Research (Brightwheel per-child scoping, ClassDojo's rebuild): default-filter to my classes with an "All school" toggle.
9. **[P2] "2 min read" mislabel** — class pages and Getting Started show "2 min read" on 5k-13k-px pages. Fix the calculation or drop the label on sectioned docs.
10. **[P2] Emergency numbers buried** — on Health & Safety, the 911/Poison Control/hospital card sits ~80% down a 5,372px page. Fix: sticky quick-reference strip or top placement; consider tel: links.

## Persona red flags

- **Casey (one-handed phone, interrupted)**: 13 events (~4 screens) before any personal content on mobile home; emergency numbers deep in Health; mega-pages with no jump-nav on mobile.
- **Jordan (new co-op family)**: "content system"/"Site Settings" jargon in empty states; dismissed welcome letters have no obvious re-entry point; Getting Started checklist isn't checkable.
- **Sam (screen reader/keyboard)**: strong baseline (axe light+dark gates, labeled icons); broken scrollspy also removes `aria-current` reading position; letter modals steal focus on page entry.

## Minor observations

- Directory: no name search box (class chips + alphabet only); privacy accordion is excellent.
- Photos: share form sits above the wall; will push content down once photos exist; family name could prefill from the remembered hours-lookup name.
- Announcements on home show "Nov 1 / Oct 23" without year in July 2026 — reads stale/ambiguous.
- Calendar event rows: the right-side "Event" chip duplicates what the row tint + filter already say.
- Rail at 800px viewport clips the MONEY section behind an internal scroll with a subtle affordance.
- "37 FAMILIES" hero stat is board-vanity, not parent-useful; candidates for that slot: next thing YOU need to do.
- Tuition page is the strongest money surface (class-tinted cards, "Money tight this month?" empathy card, real numbered timeline); fundraising's "What we've raised together" band with prior-year totals is exactly the right historical-context pattern.
- Mobile month-grid → month accordions is a great responsive choice; desktop grid event chips truncate hard ("WCP Summer Play…").

## Questions to consider

- What does a parent need in the first 10 seconds during the school year vs July? Is there a "needs your attention" strip (unsigned form, unlogged hours, unfilled helper slot) that beats a wall of events?
- Could hours/jobs/tuition read as one connected co-op-commitment system (Jovial pattern) instead of three pages?
- When photos exist, is the wall the hero and the share action a button?
