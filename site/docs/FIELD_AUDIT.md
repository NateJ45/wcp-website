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
- [ ] `videoSection.thumbnail` never renders: `VideoSection.astro:65` tests
      `cover?.asset` but the figureImage's asset lives at `cover.image.asset`
      (compare AlbumSection.astro:31-37). An upload field that silently does
      nothing.
- [ ] `siteSettings.parkingNote` edits do nothing: queried and typed, but
      `getSiteSettings()` (cms.ts) never copies it into the returned object,
      so `ContactDetailsSection.astro:69` always sees undefined. Either wire
      it or delete the field.
- [ ] `sectionHeader.align` works on only 14 of 40 section bridges — the other
      20 destructure `{eyebrow,title,lead}` and drop it. Add the prop to the
      20 bridges (makes the existing control honest), or remove the field.
- [ ] `scripts/generate-curriculum.mjs:582` projects `standardsNote` from
      curriculumGuide — no such schema field exists; always null. Delete the
      projection or add the field.

## DEAD — no consumer anywhere (29 fields). Hide or delete.

- [ ] **`legalPage` — the entire type (6 fields).** Policy pages are
      page-builder `page` docs now; nothing renders legalPage, but it still
      sits in the Pages folder and 3 orphan docs exist in the dataset. Retire:
      drop from structure + Pages folder, archive the 3 docs, mark the schema
      deprecated (keep registered so the orphans stay openable until emptied).
- [ ] `class`: `icon`, `tagline`, `daysCount`, `classSizeCap`,
      `dailySchedule`, `heroImage`, `whatTheyLearn` (7 of 23 fields).
      `daysCount`/`classSizeCap` die via the caller-less `getClassFacts()`
      (cms.ts:133) — delete that function too.
- [ ] `staff.years`, `staff.pullQuote` — die via caller-less `getStaff()`
      (cms.ts:116); delete the function too.
- [ ] `siteSettings.shortName`, `siteSettings.enrolling` (superseded by
      `enrollmentMode`), `siteSettings.licenseAuthority`.
- [ ] `post.featured` (nothing reads it; 0 docs set it),
      `newsletterIssue.emailedAt` (Studio preview only — could stay as
      metadata if wanted), `venue.isPrimary`, `redirect.note`,
      `roleHolder.note`, `operatingBudget.priorYear`, `ctaSection.seam`
      (SectionRenderer overwrites it unconditionally).
- [ ] Dead query exports riding along: `LEGAL_PAGE_LAST_UPDATED_QUERY`,
      `SITE_SETTINGS_PARKING_NOTE_QUERY` (no importers).

## QUESTIONABLE from pass 1 (~50 fields, five themes)

- [ ] **hubTour's 16 wording-override boxes** — each overrides committed copy
      via `t(key, fallback)`; the enable switch carries the value. Collapse
      the form to switch + version (or a collapsed "Advanced wording" group).
- [ ] **SEO/OG override trios** on `post` + `newsletterIssue` duplicate
      title/excerpt/coverImage. Keep, but collapse into the SEO group with
      "usually leave blank" labels. Same for `page.ogImage` (the generated OG
      card is usually better).
- [ ] **Three "version stamp" fields** (hubTour.version, presidentNote.version,
      announcement.version) make volunteers type a cache-buster. Consider one
      "Show again to everyone" affordance; at minimum, keep the guide steps
      explicit.
- [ ] **Design knobs past the brand-lock:** `class.color` (can disagree with
      the hardcoded palette in class-colors.ts — the code is the declared
      source of truth), `schoolYearEvent.accent`, `hubNavMenu.groups[].accent`,
      `hubNavMenu` externalLink icon dropdown (raw slugs),
      `operatingBudget.groups[].icon`.
- [ ] **Silently-ignored-in-context:** `iconCard.statValue/href/linkLabel`
      (dropped in the compactIcon layout — add `hidden` on layout),
      `heroObject.height` (inert for video heroes),
      `heroObject.actions` second button + `actionButton.style` (tour-first
      doctrine overrides them on all but 3 pages — a `description` warning
      would set expectations), `supplyList.wishList.heading/note` (ignored
      when the item list is empty), `contactDetailsSection` seam.
- [ ] Smaller: `teacherNote.version` + `directoryEntry.location` (machine-
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

- [ ] **`bandFields.compact` → hidden.** One edit in objects/_shared.ts hides
      it on ~37 section forms (the single biggest win: most "Appearance" tabs
      drop to one background radio). Keep rendering it — 1 live use survives.
- [ ] **hubTour's 16 wording overrides → one collapsed "Advanced wording"
      fieldset** (keep switch + version at top level).
- [ ] **`sectionHeader.align` → hidden** (works on only 14/40 bridges anyway;
      3 live non-center uses keep rendering).
- [ ] **announcement `placement` + `pages` → collapsed "Advanced" fieldset**
      (0 uses; the capability was a design ask, keep it reachable).
- [ ] **Hide the four decorative pickers:** schoolYearEvent.accent,
      operatingBudget.groups[].icon, iconCard.chip, heroObject.videoWebm
      (expert encoding; the one live use keeps rendering).
- [ ] **Make readOnly:** directoryEntry.location (script-derived geopoint),
      teacherNote.version → keep but reword title/description to plain
      language ("Letter version — change it when you rewrite the letter so
      families see it again"), same rewording for presidentNote.version,
      hubTour.version, announcement.version.
- [ ] **statBandSection.ariaLabel → optional with renderer fallback** to the
      first stat label (required screen-reader string is not parent work).
- [ ] **tuitionTableSection.caption → hidden** (sr-only duplicate of heading).
- [ ] KEEP despite flags (data or judgment): closureAlert.linkLabel/linkUrl
      (live value), event.recurrence (built July 2026 for board meetings; 0
      current but cheap + seasonal), post/newsletter SEO trios (0 uses but
      already tucked in the SEO tab — no crowding), siteMicrocopy + hubHints
      overrides (the whole point of those singletons; small forms),
      cardGridSection.columns/layout, testimonialSection.layout + confetti
      (live uses), directoryEntry.notes (judgment: keep, PII-reviewed field).
- [ ] **event.venue**: 0 uses and duplicates the plain location field —
      collapse into an "Advanced" fieldset or hide until a real second-campus
      need exists (the venue type stays).

### Where the studio ends up if the whole plan runs

Every form a parent opens leads with core fields; set-once plumbing sits in
collapsed groups; nothing dead or inert renders a control. Net: ~29 dead
fields hidden/removed, ~37 forms lose the compact toggle, hubTour drops from
18 boxes to 2 + a collapsed group, and the remaining flags are recorded above
as keep-with-reason.
