// =============================================================================
// Form field classes — one definition, used by every form on the site
// =============================================================================
// This string was duplicated verbatim across eight files (contact form,
// newsletter signup, review form, and four hub pages), which is exactly why a
// single bad focus rule broke all of them at once:
//
//   focus:border-navy focus:ring-2 focus:ring-navy/30 focus:outline-none
//
// `--color-navy` is deliberately never overridden in `.dark` — it drives the
// theme-stable navy bands — so in dark mode that ring measured 1.13:1 and the
// border 1.59:1 against the field's own surface. Both are far below the 3:1
// that WCAG 2.2 SC 1.4.11 requires of a focus indicator, and `outline-none`
// had suppressed the global `:focus-visible` ring that would otherwise have
// covered it. Keyboard focus was effectively invisible in dark mode on every
// form, including the hub sign-up and hours forms.
//
// Nothing here styles focus now. The global `:focus-visible` rule in
// globals.css draws a 3px `--color-sky-ink` outline, which IS theme-reactive
// (6.04:1 on the dark surface, 5.3:1 on white), so the correct behaviour is to
// stay out of its way. Do not reintroduce a per-field focus style.
//
// axe cannot catch this class of bug — it has no rule for focus-indicator
// contrast, and the dark-mode suite only ever audits the resting DOM — so it
// shipped green. `tests/a11y-dark.spec.ts` now includes a focus pass.
// =============================================================================

/** Text inputs, selects, and textareas. */
export const FIELD_CLASS =
  'mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-ink shadow-sm dark:bg-surface';

/** The tighter variant the hub forms use (py-2 rather than py-2.5). */
export const FIELD_CLASS_COMPACT =
  'mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink shadow-sm dark:bg-surface';

/** The label above a field. */
export const FIELD_LABEL_CLASS = 'block text-sm font-semibold text-heading';
