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
    'transition-[transform,background-color,color,box-shadow] duration-200 ease-out ' +
    'active:translate-y-0 active:scale-[0.97] active:duration-75 ' +
    'disabled:pointer-events-none disabled:opacity-50 ' +
    'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100',
  {
    variants: {
      variant: {
        // Navy fill, white text (9.75:1) — the safe default action.
        // The dark: border is load-bearing, not decoration. `--primary` is
        // deliberately NOT re-declared in .dark (solid brand fills are
        // theme-stable islands), so this button keeps its navy fill on the
        // #0d1219 page — where navy-on-page measures 1.93:1 and the button's
        // own EDGE effectively disappears. The white text is fine at 9.75:1,
        // but a control has to be locatable as a control: SC 1.4.11 wants 3:1
        // for the boundary. A hairline light border restores it without
        // touching the brand fill.
        primary:
          'bg-navy text-white hover:-translate-y-0.5 hover:shadow-lg dark:border dark:border-white/30',
        // True brand-navy fill, white text (9.75:1) — the "Enroll" CTA. Gets a
        // light sheen sweep on hover (wcp-sheen, reduced-motion-safe) since it's
        // the key conversion button; other variants stay calm.
        accent: 'wcp-sheen bg-accent text-accent-foreground hover:-translate-y-0.5 hover:shadow-lg',
        // Sky-ink fill, white text (5.4:1) — secondary emphasis.
        // Same boundary reasoning as `primary` above.
        secondary:
          'bg-secondary text-secondary-foreground hover:-translate-y-0.5 dark:border dark:border-white/30',
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
        // SOLID button on a navy band: amber fill, navy text (matches the hub
        // store's "Shop" button). The navy `accent`/`primary` fills vanish on a
        // navy CTA, so ActionButtons remaps them to this on navy banners. Theme-
        // stable like the band it sits on.
        'on-navy':
          'bg-amber text-navy shadow-md hover:-translate-y-0.5 hover:bg-[#ffb658] hover:shadow-lg',
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
