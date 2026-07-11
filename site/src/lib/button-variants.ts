import { cva, type VariantProps } from 'class-variance-authority';

// =============================================================================
// Button variants
// =============================================================================
// FOUNDATION. One source of truth for every button/CTA style, so an <a> in an
// .astro file and a <button> in a React island look identical. Import
// `buttonVariants` and pass the class, or use the <Button> component.
//
// ACCESSIBILITY: every variant below meets WCAG AA. There is deliberately no
// bright-orange or bright-sky filled variant with white text — both fail
// (2.33:1 / 2.56:1) and can't be brightened past ~AA-boundary without losing
// "vibrant". `accent` is TRUE brand navy (9.75:1, zero adjustment needed,
// see globals.css) — a deliberate choice to keep the real brand color and
// max contrast over having `accent` look visually distinct from `primary`.
// Focus rings come from the global :focus-visible rule in globals.css.
// =============================================================================
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-pill font-bold whitespace-nowrap no-underline ' +
    'transition-[transform,background-color,color,box-shadow] duration-150 ease-out ' +
    'disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  {
    variants: {
      variant: {
        // Navy fill, white text (9.75:1) — the safe default action.
        primary: 'bg-navy text-white hover:-translate-y-0.5 hover:shadow-lg',
        // True brand-navy fill, white text (9.75:1) — the "Enroll" CTA.
        accent: 'bg-accent text-accent-foreground hover:-translate-y-0.5 hover:shadow-lg',
        // Sky-ink fill, white text (5.4:1) — secondary emphasis.
        secondary: 'bg-secondary text-secondary-foreground hover:-translate-y-0.5',
        // Navy outline on light backgrounds. In dark mode the surrounding
        // page surface goes dark, so border/text swap to the light
        // heading-tint (8.8:1 border, 10.3:1 text) and the hover-fill flips
        // to that same tint with near-black text (11.9:1) instead of white.
        outline:
          'border-2 border-navy bg-white text-navy hover:bg-navy hover:text-white ' +
          'dark:border-heading dark:bg-surface dark:text-heading dark:hover:bg-heading dark:hover:text-black',
        // White outline on dark (navy) backgrounds — this variant is only
        // ever used ON a navy band, which doesn't change in dark mode, so it
        // stays constant regardless of the page-level toggle.
        'outline-white': 'border-2 border-white/60 text-white hover:bg-white/10',
        // Minimal text button. Navy text needs to lighten in dark mode since
        // its surrounding surface goes dark; the hover wash is decorative
        // (not text), so no AA requirement, but a light-tinted wash reads
        // better against a dark page than a near-invisible navy one.
        ghost: 'text-navy hover:bg-navy/8 dark:text-heading dark:hover:bg-heading/12',
      },
      size: {
        sm: 'px-5 py-2 text-sm',
        md: 'px-7 py-3 text-base',
        lg: 'px-8 py-3.5 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
