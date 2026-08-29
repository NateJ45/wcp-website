// =============================================================================
// inline-rich — this repo's read half, under the name the write half expects
// =============================================================================
// `src/lib/inline-rich-write.ts` is CANONICAL: it is byte-identical in every
// repo in the family and the starter owns it (PORTS.md cards 28 and 28b). It
// reaches its repo's READ half through one fixed specifier, `./inline-rich.ts`,
// and expects four names from it: `InlineRun`, `RUN_BREAK`, `InlineRichBlock`
// and `inlineRichRuns`.
//
// This site calls the same idea EMPHASIS. The schema type is `emphasisText`, the
// reader is `src/lib/emphasis.ts`, and fourteen components import `emphasisHtml`
// and `hasEmphasis` from it. Renaming that module to match the library would
// churn public rendering code to no benefit, and `emphasis.ts` also holds the
// heading-accent half, which is not shared. So this file is the seam: a rename,
// not a second implementation. There is one reader, and it is `emphasis.ts`.
//
// It is deliberately NOT marked PORTABLE. The starter's own `inline-rich.ts` is
// the canonical READ half for repos that have one; this is an adapter, and an
// adapter that claimed to be canonical would report drift forever.
// =============================================================================

export { RUN_BREAK, emphasisRuns as inlineRichRuns, type InlineRun } from '@/lib/emphasis';

/**
 * The shape the restricted portable-text array arrives in.
 *
 * Structural and all-optional, exactly like the starter's, so the canonical
 * write half can build a block literal and cast to it in one step. The stored
 * value is still `emphasisText`; `emphasis.ts` reads it as `PortableTextBlock`,
 * and the two descriptions agree about every field either one touches.
 */
export interface InlineRichSpan {
  _type?: string;
  text?: string;
  marks?: string[];
}
export interface InlineRichBlock {
  _type?: string;
  children?: InlineRichSpan[];
}
