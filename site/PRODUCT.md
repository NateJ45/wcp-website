# Product

## Register

product

(The public marketing site is a brand surface; this file's default register covers the Family Hub app surface at `/family-hub/**`, which is where product-register work happens. Override per task for public pages.)

## Users

Parents and caregivers of enrolled families at West Chester Preschool, a volunteer-run cooperative. They are busy, non-technical, often on a phone one-handed between drop-off and work. Secondary users: volunteer Board members (also parents) who run the co-op and edit content through Sanity Studio. The sole code maintainer is Nathan Nixon (Publicity Chair/Secretary); everyone else touches only content.

Jobs to be done in the hub: check the calendar and what's new, find another family in the directory, log/track co-op hours, look up tuition and budget/fundraising status, read class pages (Twos / Threes / Pre-K AM / Pre-K PM), find documents and health/emergency info, sign up for jobs and events.

## Product Purpose

The Family Hub is the gated, families-only dashboard of the preschool site: one app surface (left rail + top bar + phone tab bar) that replaces scattered emails, Google Sheets links, and paper handouts. Success = a parent finds what they need in under a minute on a phone, and Board volunteers keep it current without touching code.

## Brand Personality

Warm, handmade, trustworthy. A cooperative run by real parents, not a SaaS product. Tactile touches (paper-note cards, graph-paper texture, hand-drawn spot illustrations, sun/cloud emblem) over corporate gloss. Each class owns a brand color (Twos amber, Threes green, Pre-K AM orange, Pre-K PM sky). Copy is short, warm, parent-centered; no em-dashes, no AI-tell words.

## Anti-references

- Generic AI-generated dashboard slop: gradient text, side-stripe accent cards, identical icon-card grids, hero-metric templates.
- Corporate childcare SaaS coldness (default Brightwheel/Procare chrome) — the hub should feel like the co-op's own bulletin board, not enterprise software.
- Squarespace-template sameness (what the site migrated away from).

## Design Principles

1. **One app surface.** Every hub page uses the same primitives (HubShell, HubPageHeader, HubCard, HubStat, HubPill, HubTable...). Consistency over novelty; extend the primitive, never improvise a parallel one.
2. **Phone-first, one-handed.** Parents check this at drop-off. Tab bar for phones, thumb-reachable actions, 320px reflow is a hard gate.
3. **Honest data, designed empties.** Live data (sheets, calendar) always degrades to a designed empty state, never a broken widget. Sparklines and stats only show honest series.
4. **Volunteers control content, never design.** Brand-lock: no color/font/layout knobs in the CMS. This is what keeps the surface coherent.
5. **Progressive enhancement.** Every page works with no JS; localStorage personalization (my classes, seen-state, theme) layers on top.

## Accessibility & Inclusion

WCAG 2.2 AA is a hard CI gate (Lighthouse a11y 100 + axe default rule set, light AND dark themes, per hub route). 320px reflow verified across widths. All motion behind prefers-reduced-motion. Known traps documented in CLAUDE.md (colored -ink text on tinted fills in dark mode, target-size coverage).
