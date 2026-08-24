# Field audit — the working registry

The 2026-08-23 field-by-field audit of every Sanity schema field (~700 across
documents, singletons, sections, and shared objects). Two passes:

1. **Consumption** (done): does any query/component/script actually read the
   field? Verdicts below.
2. **Editorial value** (in progress): even when consumed, would a volunteer
   parent ever deliberately edit it, or does it crowd out the fields they
   actually need? Verdicts get appended as they land.

Work items are checkboxes. When one is done, check it AND note the commit.
When everything in a section is done, collapse the section to a one-line
"resolved" note. Keep this file honest the same way PENDING.md is kept honest.

## Bugs found by the audit

- [x] Hero internal-page buttons resolved to "/" — the hero projection never
      dereferenced `actions[].page` (sections had it). Live on /safety.
      FIXED `ffd04d9`.
- [x] (FIXED 2026-08-23) `videoSection.thumbnail` never renders: `VideoSection.astro:65` tests
      `cover?.asset` but the figureImage's asset lives at `cover.image.asset`
      (compare AlbumSection.astro:31-37). An upload field that silently does
      nothing.
- [x] (FIXED 2026-08-23 — wired into both mappers) `siteSettings.parkingNote` edits do nothing: queried and typed, but
      `getSiteSettings()` (cms.ts) never copies it into the returned object,
      so `ContactDetailsSection.astro:69` always sees undefined. Either wire
      it or delete the field.
- [x] (RESOLVED 2026-08-23 — control hidden; existing values render) `sectionHeader.align` works on only 14 of 40 section bridges — the other
      20 destructure `{eyebrow,title,lead}` and drop it. Add the prop to the
      20 bridges (makes the existing control honest), or remove the field.
- [x] (FIXED 2026-08-23 — projection removed) `scripts/generate-curriculum.mjs:582` projects `standardsNote` from
      curriculumGuide — no such schema field exists; always null. Delete the
      projection or add the field.

- [x] (FIXED 2026-08-24, data-side) Post-audit follow-ups: the orphaned DATA
      the removed/migrated fields left behind triggered "Unknown fields found"
      warnings — `patch-unset-migrated-fields.mjs` cleaned all 25 occurrences
      (siteSettings x7, priorYear, featured x2, ctaSection seam x20 docs)
      after verifying the migrated values in hubStore/hubSettings. And one
      REAL bug surfaced by the warnings: the Enroll page's "tuition page"
      prose link had been written in the nav-link shape (linkType/pageSlug,
      href null) by a content patch — the only such mark in the dataset; its
      href is now /tuition and the stray keys are gone.

## DEAD — no consumer anywhere (29 fields). Hide or delete.

- [x] (DONE 2026-08-23 — deprecated, out of nav + create menu; the 3 orphan docs remain, findable via search, for Nathan to empty) **`legalPage` — the entire type (6 fields).** Policy pages are
      page-builder `page` docs now; nothing renders legalPage, but it still
      sits in the Pages folder and 3 orphan docs exist in the dataset. Retire:
      drop from structure + Pages folder, archive the 3 docs, mark the schema
      deprecated (keep registered so the orphans stay openable until emptied).
- [x] (DONE 2026-08-23 — all 7 hidden; getClassFacts deleted) `class`: `icon`, `tagline`, `daysCount`, `classSizeCap`,
      `dailySchedule`, `heroImage`, `whatTheyLearn` (7 of 23 fields).
      `daysCount`/`classSizeCap` die via the caller-less `getClassFacts()`
      (cms.ts:133) — delete that function too.
- [x] (DONE 2026-08-23 — hidden; getStaff deleted) `staff.years`, `staff.pullQuote` — die via caller-less `getStaff()`
      (cms.ts:116); delete the function too.
- [x] (DONE 2026-08-23 — all 3 hidden + out of the query) `siteSettings.shortName`, `siteSettings.enrolling` (superseded by
      `enrollmentMode`), `siteSettings.licenseAuthority`.
- [x] (DONE 2026-08-23 — featured/priorYear/ctaSection.seam removed, isPrimary hidden; KEPT: newsletterIssue.emailedAt as workflow metadata, redirect.note + roleHolder.note as deliberate note-to-self memo fields) `post.featured` (nothing reads it; 0 docs set it),
      `newsletterIssue.emailedAt` (Studio preview only — could stay as
      metadata if wanted), `venue.isPrimary`, `redirect.note`,
      `roleHolder.note`, `operatingBudget.priorYear`, `ctaSection.seam`
      (SectionRenderer overwrites it unconditionally).
- [x] (DONE 2026-08-23) Dead query exports riding along: `LEGAL_PAGE_LAST_UPDATED_QUERY`,
      `SITE_SETTINGS_PARKING_NOTE_QUERY` (no importers).

## QUESTIONABLE from pass 1 (~50 fields, five themes)

- [x] (superseded — see the pass-2 plan below; tab retitled, version reworded 2026-08-23) **hubTour's 16 wording-override boxes** — each overrides committed copy
      via `t(key, fallback)`; the enable switch carries the value. Collapse
      the form to switch + version (or a collapsed "Advanced wording" group).
- [x] (DONE 2026-08-23 — 'usually leave blank' labels added; already tabbed) **SEO/OG override trios** on `post` + `newsletterIssue` duplicate
      title/excerpt/coverImage. Keep, but collapse into the SEO group with
      "usually leave blank" labels. Same for `page.ogImage` (the generated OG
      card is usually better).
- [x] (DONE 2026-08-23 — all three reworded to "Show ... again to everyone" plain language) **Three "version stamp" fields** (hubTour.version, presidentNote.version,
      announcement.version) make volunteers type a cache-buster. Consider one
      "Show again to everyone" affordance; at minimum, keep the guide steps
      explicit.
- [x] (RESOLVED 2026-08-23 — schoolYearEvent.accent + operatingBudget icons + iconCard.chip hidden; KEPT: class.color (Nathan's standing call — removing it makes the palette permanently code-owned) and hubNavMenu accent/icon pickers (constrained, AA-checked, genuinely used by the menu editor)) **Design knobs past the brand-lock:** `class.color` (can disagree with
      the hardcoded palette in class-colors.ts — the code is the declared
      source of truth), `schoolYearEvent.accent`, `hubNavMenu.groups[].accent`,
      `hubNavMenu` externalLink icon dropdown (raw slugs),
      `operatingBudget.groups[].icon`.
- [x] (DONE 2026-08-23 — iconCard fields labeled Cards-layout-only, hero.height hidden on video heroes, hero buttons + button style carry tour-first descriptions, wish-list heading/note merge without items, contact block passes the seam) **Silently-ignored-in-context:** `iconCard.statValue/href/linkLabel`
      (dropped in the compactIcon layout — add `hidden` on layout),
      `heroObject.height` (inert for video heroes),
      `heroObject.actions` second button + `actionButton.style` (tour-first
      doctrine overrides them on all but 3 pages — a `description` warning
      would set expectations), `supplyList.wishList.heading/note` (ignored
      when the item list is empty), `contactDetailsSection` seam.
- [x] (RESOLVED 2026-08-23 — hubStore product photos converted to real uploaded assets by patch-hub-store-photos.mjs (all 8; legacy URL kept hidden as fallback); the rest recorded as keep-with-reason: version fields reworded, inbox fields already readOnly, openingHours/redirect.permanent/notFoundChip/hints/priority stay tucked in tabs) Smaller: `teacherNote.version` + `directoryEntry.location` (machine-
      derived geopoint — consider readOnly), `hoursLog.source` (always
      'self'), `testimonialSubmission.permission` (always true),
      `trashedItem.originalId` (write-only), `siteSettings.openingHours`
      (expert-only schema.org plumbing), `redirect.permanent` (301/302
      detail), `siteMicrocopy.notFoundChip`, `hubHints.hints[].text`,
      `hubStore.storeProducts[].image` (hotlinked URLs rot — consider a real
      image field), `announcement.priority` (raw sort number),
      `event.venue` (requires a venue doc for 3 read fields).

## Pass 2 — editorial value ("would anyone actually edit this?")

Completed 2026-08-23, cross-checked against the LIVE dataset (usage counts
below are production facts, not guesses). Buckets: CORE (edited routinely),
OCCASIONAL (rare but real), SET-ONCE (legit plumbing, touched at setup),
NEVER (realistically untouched; crowds the form).

**Slice totals**

| Slice       | Fields | Core | Occasional | Set-once | Never |
| ----------- | ------ | ---- | ---------- | -------- | ----- |
| Public docs | 137    | 51   | 57         | 13       | 16    |
| Hub docs    | 117    | 46   | 22         | 15       | 34\*  |
| Singletons  | 162    | 42   | 61         | 29       | 30    |
| Sections    | 262    | 98   | 47         | 68       | 49    |

\* 31 of the hub's 34 are inbox fields ALREADY readOnly — correct as is.

**Dataset cross-check (2026-08-23)** — flagged fields vs live usage:
`compact` 1 of 173 sections · `header.align` non-center 3 · announcement
placement/pages 0 · event recurrence 0 · event.venue 0 · post SEO overrides 0 ·
page.ogImage 0 · hero accentColor 3 · hero videoWebm 1 (the home hero) ·
testimonialSection.layout 8 · confetti 1 · cardGrid compactIcon 1 ·
closureAlert link SET ("Contact us" → /virtual-tour — the auditor's NEVER call
is wrong; keep).

### The agreed slimming plan (awaiting go-ahead)

- [x] (DONE 2026-08-23) **`bandFields.compact` → hidden.** One edit in objects/_shared.ts hides
      it on ~37 section forms (the single biggest win: most "Appearance" tabs
      drop to one background radio). Keep rendering it — 1 live use survives.
- [x] (DONE 2026-08-23 — the 16 were already behind a Step-wording tab; tab retitled optional, version reworded) **hubTour's 16 wording overrides → one collapsed "Advanced wording"
      fieldset** (keep switch + version at top level).
- [x] (DONE 2026-08-23) **`sectionHeader.align` → hidden** (works on only 14/40 bridges anyway;
      3 live non-center uses keep rendering).
- [x] (DONE 2026-08-23 — already isolated in their "Where it shows" tab; no further change needed) **announcement `placement` + `pages` → collapsed "Advanced" fieldset**
      (0 uses; the capability was a design ask, keep it reachable).
- [x] (DONE 2026-08-23) **Hide the four decorative pickers:** schoolYearEvent.accent,
      operatingBudget.groups[].icon, iconCard.chip, heroObject.videoWebm
      (expert encoding; the one live use keeps rendering).
- [x] (PARTIAL 2026-08-23 — the three version fields reworded to plain language; directoryEntry.location KEPT editable: PENDING.md documents the hand-nudge workflow for imprecise OSM pins) **Make readOnly:** directoryEntry.location (script-derived geopoint),
      teacherNote.version → keep but reword title/description to plain
      language ("Letter version — change it when you rewrite the letter so
      families see it again"), same rewording for presidentNote.version,
      hubTour.version, announcement.version.
- [x] (DONE 2026-08-23 — optional + renderer fallback) **statBandSection.ariaLabel → optional with renderer fallback** to the
      first stat label (required screen-reader string is not parent work).
- [x] (DONE 2026-08-23) **tuitionTableSection.caption → hidden** (sr-only duplicate of heading).
- [x] (RECORDED 2026-08-23) KEEP despite flags (data or judgment): closureAlert.linkLabel/linkUrl
      (live value), event.recurrence (built July 2026 for board meetings; 0
      current but cheap + seasonal), post/newsletter SEO trios (0 uses but
      already tucked in the SEO tab — no crowding), siteMicrocopy + hubHints
      overrides (the whole point of those singletons; small forms),
      cardGridSection.columns/layout, testimonialSection.layout + confetti
      (live uses), directoryEntry.notes (judgment: keep, PII-reviewed field).
- [x] (DONE 2026-08-23 — hidden; venue left the Community menu + create menu, type registered) **event.venue**: 0 uses and duplicates the plain location field —
      collapse into an "Advanced" fieldset or hide until a real second-campus
      need exists (the venue type stays).

### Where the studio ends up if the whole plan runs

Every form a parent opens leads with core fields; set-once plumbing sits in
collapsed groups; nothing dead or inert renders a control. Net: ~29 dead
fields hidden/removed, ~37 forms lose the compact toggle, hubTour drops from
18 boxes to 2 + a collapsed group, and the remaining flags are recorded above
as keep-with-reason.
