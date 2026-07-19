# Direct-competitor benchmark, phones-first (2026-07-18)

Live audits at 390x844 + 1440x900: Goddard School West Chester/Hamilton (3 mi away),
Primrose School of West Chester, Guidepost Montessori (brand + a school page; chosen
for its funnel/transparency model). Rejected as benchmarks: KinderCare West Chester
(broken funnel page) and Country Hills Montessori (2010s template; confirms the local
independent field is weak — the chains are the bar). Snapshot doc, not kept in sync.
Compiled during Phase 0 of the redesign/public-2026 branch.

## Goddard West Chester/Hamilton

- Mobile fold: sticky header with navy "Learn More & Tour" pill; photo carousel of the
  REAL building/classrooms with an owner "A Quick Hello!" video chip; H1 + phone +
  hours. Primary CTA visible at 0px scroll. Marred by cookie wall + fixed tour widget
  - feedback tab (permanent chrome clutter).
- Tour funnel: 1 tap → 4-step wizard, ONE question per screen with progress bar (8
  fields total) → online tour-slot step with confirmation codes. Phone fallback
  throughout. Tracker-heavy (DoubleClick, TradeDesk).
- Nav: the location microsite holds 4 items.
- Trust: Cognia accreditation, named onsite owner + video, testimonials, health &
  safety, events block. NO tuition anywhere. Type: P22 Mackinac serif + Quicksand
  body, navy/teal.
- Beat them on: pricing transparency, tracker-light calm, real (not manufactured)
  local humanity. Match them on: 1-tap persistent tour CTA, real-facility proof in
  the first viewport.

## Primrose West Chester

- Mobile: locator-first header (directory energy), hero photo of the FRANCHISE OWNERS
  (not children), but the strongest single mobile pattern of the three: a persistent
  sticky "Schedule a Tour" bar.
- Funnel: sticky CTA → a page titled "Contact us": one static ~10-field wall (child
  DOB as three selects). No scheduler: "Schedule a Tour" means "request a callback."
- Nav: 20+ links, Franchising first-class on mobile (anti-pattern).
- Trust: best inline-answers pattern seen: an FAQ accordion on the conversion page
  covering background checks/CPR, curriculum, K-readiness (also AI-answer-engine
  bait). Besley + Poppins, zero motion.
- Beat them on: a tour CTA that actually schedules; parent-first IA. Match: the
  sticky mobile CTA + inline trust FAQ near the form.

## Guidepost Montessori

- The one that actually schedules: school page → "Tours and events" → direct Calendly;
  a parent self-serve books a real slot in ~3-4 taps + name/email. Also publishes
  tuition (per-campus PDF rate sheet).
- But: templated soulless school pages (no local photos/staff), a 20%-off retail
  banner undercutting the register, fragile JS school finder, brand instability.
- Graphik, lowercase editorial headings; most 2026-looking of the three.
- Beat them on: local proof and warmth. Match: self-serve booking + published prices
  said out loud.

## Patterns WCP must match or beat

1. [both] Tour CTA in persistent chrome on every page, ≤1 tap to the funnel.
2. [mobile] Sticky tour CTA that survives scroll (within the scroll-padding budget).
3. [both] Real scheduling beats lead capture: a date/time picker makes WCP the only
   LOCAL preschool where a phone parent at 10pm leaves with a confirmed tour.
4. [both] Say the tuition moat out loud next to the tour CTA ("Our tuition is
   public."). None of the chains publish a single price on a page.
5. [mobile] First-viewport proof of place: real classroom photos; a 30s teacher hello
   video out-authentics any franchise clip.
6. [mobile] Nav ≤5 parent-focused items (we already match; hold the line).
7. [both] Answer trust questions inline on conversion pages (background checks, CPR,
   ratios, K-readiness).
8. [both] Forms: ≤5 fields, or one question per screen with progress. Never demand a
   child's full details to see a calendar.
9. [both] Named humans near the CTA: real teachers, faces, years of tenure.
10. [both] Calm, fast, banner-free pages are a VISIBLE differentiator on a phone;
    treat consent-gated tracker-light as brand.

Typography footnote: the category has converged on warm-serif display + rounded sans
body. Captain Comic + handmade sits outside the convergence: an asset. The dated
tells to avoid are carousels, breadcrumbs, edge-tab widgets, locator-first headers.
