import { cva, type VariantProps } from 'class-variance-authority';

// =============================================================================
// Button variants
// =============================================================================
// FOUNDATION. One source of truth for every button/CTA style, so an <a> in an
// .astro file and a <button> in a React island look identical. Import
// `buttonVariants` and pass the class, or use the <Button> component.
//
// ACCESSIBILITY: every variant below meets WCAG AA. Note there is deliberately
// NO bright-orange or bright-sky filled variant — white text on those fails
// contrast (2.33:1 / 2.56:1). The warm CTA uses `accent` (orange-INK, 5.4:1).
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
        // Orange-ink fill, white text (5.4:1) — the warm "Enroll" CTA.
        accent: 'bg-accent text-accent-foreground hover:-translate-y-0.5 hover:shadow-lg',
        // Sky-ink fill, white text (5.4:1) — secondary emphasis.
        secondary: 'bg-secondary text-secondary-foreground hover:-translate-y-0.5',
        // Navy outline on light backgrounds.
        outline: 'border-2 border-navy bg-white text-navy hover:bg-navy hover:text-white',
        // White outline on dark (navy) backgrounds.
        'outline-white': 'border-2 border-white/60 text-white hover:bg-white/10',
        // Minimal text button.
        ghost: 'text-navy hover:bg-navy/8',
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
